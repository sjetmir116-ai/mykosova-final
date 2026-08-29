import { useState, useContext } from 'react';
import { AppContext } from '../AppContext';
import { useBizneset } from '../useBizneset';
import { gjejFotoAutomatikisht } from '../biznesFoto';
import { db } from '../firebase';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { regjistroAudit } from '../audit';
import { distancaKm } from '../distanca';

// ===== RISK SCORE — detektim i rreziqeve te bizneset pendshe (spec Y17, Y19) =====
// Kërkon: dublet emri+qytet, GPS afër (≤0.5km) me kategori të njëjtë, telefon dublet
function llogaritRisk(biznesi, teGjithe) {
  let pike = 0;
  const arsye = [];
  const normalizo = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const emri = normalizo(biznesi.emri);
  const qyteti = normalizo(biznesi.qyteti);

  for (const t of teGjithe) {
    if (t.id === biznesi.id) continue;
    const tEmri = normalizo(t.emri);
    const tQyteti = normalizo(t.qyteti);
    if (tEmri === emri && tQyteti === qyteti) {
      pike += 60;
      arsye.push(`Dublet i plotë: "${t.emri}" (${t.qyteti})`);
    } else if (tEmri === emri) {
      pike += 30;
      arsye.push(`Emër i njëjtë me "${t.emri}" (${t.qyteti})`);
    }
    if (
      t.lat && t.lng && biznesi.lat && biznesi.lng &&
      normalizo(t.kategoria) === normalizo(biznesi.kategoria)
    ) {
      const d = distancaKm(Number(t.lat), Number(t.lng), Number(biznesi.lat), Number(biznesi.lng));
      if (d <= 0.5) {
        pike += 40;
        arsye.push(`${Math.round(d * 1000)} m nga "${t.emri}" (e njëjta kategori)`);
      }
    }
    if (t.telefoni && biznesi.telefoni && String(t.telefoni).replace(/\D/g, '') === String(biznesi.telefoni).replace(/\D/g, '')) {
      pike += 30;
      arsye.push(`Telefon i njëjtë me "${t.emri}"`);
    }
  }
  if (!biznesi.lat || !biznesi.lng) {
    pike += 10;
    arsye.push('Pa GPS — vështirësohet verifikimi i lokacionit');
  }
  return { skori: Math.min(100, pike), arsye };
}

function MenaxhoBizneset() {
  const { darkMode } = useContext(AppContext);
  const { bizneset, loading } = useBizneset({ vetemAprovuar: false });
  const [kerkimi, setKerkimi] = useState('');
  const [filtrStatusi, setFiltrStatusi] = useState('teGjitha');
  const [editimi, setEditimi] = useState(null); // biznesi në editim
  const [dukeVepruar, setDukeVepruar] = useState(false);
  const [mesazhi, setMesazhi] = useState({ tekst: '', gabim: false });

  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#111827';

  const normalizo = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtra = bizneset.filter((b) => {
    const pasqyron = !kerkimi || normalizo(b.emri).includes(normalizo(kerkimi)) || normalizo(b.qyteti).includes(normalizo(kerkimi)) || normalizo(b.kategoria).includes(normalizo(kerkimi));
    const statusiOK = filtrStatusi === 'teGjitha' || (filtrStatusi === 'pendshe' ? b.status === 'pendshe' : b.status !== 'pendshe');
    return pasqyron && statusiOK;
  });

  const veprim = async (f, biznesi) => {
    if (f === 'fshi' && !window.confirm(`Të jeni i sigurt që doni ta fshini "${biznesi.emri}"? Kjo vepër nuk kthehet.`)) return;
    setDukeVepruar(true);
    setMesazhi({ tekst: '', gabim: false });
    try {
      if (f === 'mirato') {
        await updateDoc(doc(db, 'bizneset', biznesi.id), { status: 'aprovar' });
        regjistroAudit('miratim_biznesi', { emri: biznesi.emri });
        setMesazhi({ tekst: `✅ "${biznesi.emri}" u miratua — tani e shohin të gjithë.`, gabim: false });
      } else if (f === 'rifuzo') {
        if (!window.confirm(`Rifuzoni dhe fshini "${biznesi.emri}"?`)) { setDukeVepruar(false); return; }
        await deleteDoc(doc(db, 'bizneset', biznesi.id));
        regjistroAudit('rifuzim_biznesi', { emri: biznesi.emri });
        setMesazhi({ tekst: `🗑️ "${biznesi.emri}" u rifuzua dhe u fshi.`, gabim: false });
      } else if (f === 'fshi') {
        await deleteDoc(doc(db, 'bizneset', biznesi.id));
        regjistroAudit('fshirje_biznesi', { emri: biznesi.emri });
        setMesazhi({ tekst: `🗑️ "${biznesi.emri}" u fshi.`, gabim: false });
      } else if (f === 'ungjit') {
        const { id, burimi, ...teDhenat } = biznesi;
        await addDoc(collection(db, 'bizneset'), { ...teDhenat, status: teDhenat.status || 'aprovar', krijuarM: teDhenat.krijuarM || new Date().toISOString() });
        regjistroAudit('sinkronizim_biznesi', { emri: biznesi.emri });
        setMesazhi({ tekst: `☁️ "${biznesi.emri}" u ngarkua në cloud — tani mund t\u2019e editoni.`, gabim: false });
      }
    } catch (err) {
      console.error('Gabim në veprim:', err);
      setMesazhi({ tekst: '❌ Gabim: ' + err.message, gabim: true });
    } finally {
      setDukeVepruar(false);
    }
  };

  const ruajEditimin = async () => {
    setDukeVepruar(true);
    setMesazhi({ tekst: '', gabim: false });
    try {
      const { emri, kategoria, qyteti, adresa, foto, telefoni, whatsapp, website, lat, lng, pershkrimi, oferta, status, vleresimi } = editimi;
      await updateDoc(doc(db, 'bizneset', editimi.id), {
        emri, kategoria, qyteti,
        adresa: adresa || '', foto: foto || '', telefoni: telefoni || '',
        whatsapp: whatsapp || '', website: website || '',
        pershkrimi: pershkrimi || '', oferta: oferta || '',
        lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null,
        status, vleresimi: vleresimi ? Number(vleresimi) : 0,
        verifikuar: editimi.verifikuar === true,
        sponsoruar: editimi.sponsoruar === true,
      });
      regjistroAudit('ndryshim_biznesi', { emri });
      setMesazhi({ tekst: `💾 "${emri}" u ruajt.`, gabim: false });
      setEditimi(null);
    } catch (err) {
      console.error('Gabim në ruajtje:', err);
      setMesazhi({ tekst: '❌ Gabim: ' + err.message, gabim: true });
    } finally {
      setDukeVepruar(false);
    }
  };

  const butoni = (ngjyra) => ({
    border: 'none', borderRadius: '10px', padding: '7px 12px', fontSize: '12px', fontWeight: '700',
    cursor: 'pointer', color: '#fff', backgroundColor: ngjyra, opacity: dukeVepruar ? 0.6 : 1,
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: stiliTekstit }}>Menaxho Bizneset 🗂️</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8e8e93' }}>{loading ? 'Duke ngarkuar…' : `${filtra.length} biznese`}</p>
      </div>

      {mesazhi.tekst && (
        <div style={{ padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', backgroundColor: mesazhi.gabim ? '#ff3b3015' : '#16a34a15', color: mesazhi.gabim ? '#ef4444' : '#16a34a', border: `1px solid ${mesazhi.gabim ? '#ff3b3040' : '#16a34a40'}` }}>
          {mesazhi.tekst}
        </div>
      )}

      {/* Filtrat */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input value={kerkimi} onChange={(e) => setKerkimi(e.target.value)} placeholder="🔍 Kërko emër, qytet, kategori..."
          style={{ flex: 1, minWidth: '200px', padding: '11px 16px', borderRadius: '12px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '14px', outline: 'none' }} />
        {['teGjitha', 'pendshe', 'aprovar'].map((s) => (
          <button key={s} onClick={() => setFiltrStatusi(s)}
            style={{ padding: '10px 16px', borderRadius: '12px', border: `1px solid ${filtrStatusi === s ? '#3b82f6' : korniza}`, backgroundColor: filtrStatusi === s ? '#3b82f6' : 'transparent', color: filtrStatusi === s ? '#fff' : stiliTekstit, fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
            {s === 'teGjitha' ? 'Të gjitha' : s === 'pendshe' ? '⏳ Pendshe' : '✅ Aprovar'}
          </button>
        ))}
      </div>

      {/* Tabela */}
      {loading ? (
        <p style={{ color: '#8e8e93' }}>Duke ngarkuar…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtra.map((b) => (
            <div key={b.id} style={{ backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '16px', padding: '14px', display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <img src={b.foto && String(b.foto).startsWith('http') ? b.foto : gjejFotoAutomatikisht(b.emri, b.kategoria)} alt=""
                style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />

              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>{b.emri}</h4>
                  <span style={{ fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase',
                    backgroundColor: b.status === 'pendshe' ? '#f59e0b20' : '#16a34a20', color: b.status === 'pendshe' ? '#f59e0b' : '#16a34a' }}>
                    {b.status === 'pendshe' ? '⏳ Pendshe' : '✅ Aprovar'}
                  </span>
                  {b.burimi === 'lokal' && (
                    <span style={{ fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#8e8e9320', color: '#8e8e93' }}>LOKAL</span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8e8e93' }}>
                  {b.kategoria || 'Pa kategori'} · 📍 {b.qyteti || '—'}
                  {b.vleresimi || b.yllatNumer ? ` · ⭐ ${Number(b.vleresimi || b.yllatNumer).toFixed(1)}` : ''}
                  {b.telefoni ? ` · 📞 ${b.telefoni}` : ''}
                </p>
                {b.shtuarMNga && <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#8e8e93' }}>Shtuar nga: {b.shtuarMNga}</p>}

                {/* RISK SCORE — vetëm te pendshe */}
                {b.status === 'pendshe' && (() => {
                  const r = llogaritRisk(b, bizneset);
                  const ngjyra = r.skori < 30 ? '#16a34a' : r.skori < 60 ? '#f59e0b' : '#ef4444';
                  const teksti = r.skori < 30 ? 'Rrezik i ULËT — sugjerohet miratim' : r.skori < 60 ? 'Rrezik MESATAR — shqyrto me kujdes' : 'Rrezik I LARTË — sugjerohet rifuzim';
                  return (
                    <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '10px', backgroundColor: ngjyra + '12', border: `1px solid ${ngjyra}40` }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: ngjyra }}>
                        ⚠️ RISK SCORE: {r.skori}/100 — {teksti}
                      </span>
                      {r.arsye.length > 0 && (
                        <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '11px', color: '#8e8e93' }}>
                          {r.arsye.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Veprimet */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {b.burimi === 'lokal' ? (
                  <button disabled={dukeVepruar} onClick={() => veprim('ungjit', b)} style={butoni('#8e8e93')}>☁️ Ungjit në cloud</button>
                ) : (
                  <>
                    {b.status === 'pendshe' && (
                      <>
                        <button disabled={dukeVepruar} onClick={() => veprim('mirato', b)} style={butoni('#16a34a')}>✓ Mirato</button>
                        <button disabled={dukeVepruar} onClick={() => veprim('rifuzo', b)} style={butoni('#ef4444')}>✗ Rifuzo</button>
                      </>
                    )}
                    <button disabled={dukeVepruar} onClick={() => setEditimi({ ...b, lat: b.lat ?? '', lng: b.lng ?? '', vleresimi: b.vleresimi ?? b.yllatNumer ?? '', whatsapp: b.whatsapp ?? '', website: b.website ?? '', verifikuar: b.verifikuar === true, sponsoruar: b.sponsoruar === true })} style={butoni('#3b82f6')}>✏️ Edho</button>
                    <button disabled={dukeVepruar} onClick={() => veprim('fshi', b)} style={butoni('#6b7280')}>🗑️ Fshi</button>
                  </>
                )}
              </div>

              {/* Forma e editimit — e zgjeruar */}
              {editimi && editimi.id === b.id && (
                <div style={{ width: '100%', borderTop: `1px solid ${korniza}`, paddingTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  {[
                    ['emri', 'Emri', 'text'],
                    ['kategoria', 'Kategoria', 'text'],
                    ['qyteti', 'Qyteti', 'text'],
                    ['adresa', 'Adresa', 'text'],
                    ['telefoni', 'Telefoni', 'text'],
                    ['whatsapp', 'WhatsApp', 'text'],
                    ['website', 'Website', 'text'],
                    ['foto', 'Foto (URL)', 'text'],
                    ['lat', 'Gjerësia (lat)', 'number'],
                    ['lng', 'Gjatësia (lng)', 'number'],
                    ['vleresimi', 'Vlerësimi (0-5)', 'number'],
                  ].map(([fusha, etiketa, tipi]) => (
                    <div key={fusha}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8e8e93', marginBottom: '4px' }}>{etiketa}</label>
                      <input type={tipi} step="any" value={editimi[fusha] ?? ''}
                        onChange={(e) => setEditimi({ ...editimi, [fusha]: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8e8e93', marginBottom: '4px' }}>Pershkrimi</label>
                    <textarea rows={2} value={editimi.pershkrimi ?? ''}
                      onChange={(e) => setEditimi({ ...editimi, pershkrimi: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8e8e93', marginBottom: '4px' }}>Oferta</label>
                    <input type="text" value={editimi.oferta ?? ''}
                      onChange={(e) => setEditimi({ ...editimi, oferta: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8e8e93', marginBottom: '4px' }}>Statusi</label>
                    <select value={editimi.status ?? 'aprovar'}
                      onChange={(e) => setEditimi({ ...editimi, status: e.target.value })}
                      style={{ padding: '9px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: darkMode ? '#111827' : '#ffffff', color: stiliTekstit, fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                      <option value="aprovar">✅ Aprovar (i publikuar)</option>
                      <option value="pendshe">⏳ Pendshe (i fshehur nga publiku)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8e8e93', marginBottom: '4px' }}>Verifikimi (✓ badge te profili)</label>
                    <select value={editimi.verifikuar ? 'po' : 'jo'}
                      onChange={(e) => setEditimi({ ...editimi, verifikuar: e.target.value === 'po' })}
                      style={{ padding: '9px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: darkMode ? '#111827' : '#ffffff', color: stiliTekstit, fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                      <option value="jo">Jo e verifikuar</option>
                      <option value="po">✓ E verifikuar</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8e8e93', marginBottom: '4px' }}>Sponsored (🏷️ vendi i parë te kërkimi)</label>
                    <select value={editimi.sponsoruar ? 'po' : 'jo'}
                      onChange={(e) => setEditimi({ ...editimi, sponsoruar: e.target.value === 'po' })}
                      style={{ padding: '9px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: darkMode ? '#111827' : '#ffffff', color: stiliTekstit, fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                      <option value="jo">Jo</option>
                      <option value="po">🏷️ Po (sponsoruar)</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px' }}>
                    <button disabled={dukeVepruar} onClick={ruajEditimin} style={butoni('#16a34a')}>💾 Ruaj ndryshimet</button>
                    <button disabled={dukeVepruar} onClick={() => setEditimi(null)} style={butoni('#6b7280')}>Anulo</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtra.length === 0 && (
            <p style={{ color: '#8e8e93', fontSize: '14px', textAlign: 'center', padding: '30px 0' }}>S'u gjet asnjë biznes me këto filtra.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default MenaxhoBizneset;
