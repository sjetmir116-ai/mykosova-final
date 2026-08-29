import { useState, useContext, useEffect } from 'react';
import { AppContext } from './AppContext';
import { merrMapsUrl } from './useBizneset';
import { gjejFotoAutomatikisht } from './biznesFoto';
import { useReviews, shtoReview, raportoReview, votoNdermues } from './useReviews';
import { useFavorites } from './useFavorites';
import { distancaKm, formatoDistancm } from './distanca';
import { regjistroAudit } from './audit';
import { usePaketa } from './paketa';
import { useOfertat } from './useOfertat';
import BookingForm from './BookingForm';
import Foto from './Foto';
import { hapLinkun } from './hapLinkun';
import { db } from './firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

// ===== PROFILI I PLOTË I BIZNESIT (spec U18, U19) =====
// Hapet nga çdo ekran (kartelat, AI) kur biznesiIzgjedhur vendoset te AppContext
function BiznesiDetaji({ biznesi }) {
  const { darkMode, përdoruesi, setBiznesiIzgjedhur, userLocation, gjuha } = useContext(AppContext);
  const { reviews, loading: reviewsLoading, mesatarja } = useReviews(biznesi.emri);
  const { esRuajtur, alterno, duhshHyrje } = useFavorites();
  const { paketa } = usePaketa();
  const { aktive: ofertatAktive } = useOfertat(biznesi.emri);
  const [tekstiReview, setTekstiReview] = useState('');
  const [yjetReview, setYjetReview] = useState(5);
  const [fotoReview, setFotoReview] = useState('');
  const [dukeRuajtur, setDukeRuajtur] = useState(false);
  const [mesazhi, setMesazhi] = useState('');
  const [dukeRezervuar, setDukeRezervuar] = useState(false);
  const [menujaESharingut, setMenujaESharingut] = useState(false);

  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#111827';

  // KRAHASIMI: numëron vizitat + klikimet (analytics — spec B3)
  const esCloud = typeof biznesi.id === 'string' && biznesi.id.length > 8;
  const numero = (fusha) => {
    if (esCloud) {
      updateDoc(doc(db, 'bizneset', biznesi.id), { [fusha]: increment(1) }).catch(() => {});
    }
  };
  useEffect(() => {
    numero('shikime');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biznesi.id]);

  // Lloji i rezervimit sipas kategorisë
  const kategoriaNorm = String(biznesi.kategoria || '').toLowerCase();
  const llojiBooking = kategoriaNorm.includes('hotel') ? 'hotel'
    : kategoriaNorm.includes('restorant') || kategoriaNorm.includes('food') ? 'restorant'
    : kategoriaNorm.includes('turiz') || kategoriaNorm.includes('aktivitet') ? 'aktivitet'
    : 'hotel';
  const kaBooking = esCloud && (biznesi.bookingAktiv !== false) &&
    (kategoriaNorm.includes('hotel') || kategoriaNorm.includes('restorant') || kategoriaNorm.includes('turiz') || kategoriaNorm.includes('food') || biznesi.bookingAktiv === true);

  const paketaInfo = paketa[biznesi.paketa];

  const foto = (biznesi.foto && String(biznesi.foto).startsWith('http'))
    ? biznesi.foto
    : gjejFotoAutomatikisht(biznesi.emri, biznesi.kategoria);

  const distanca = userLocation && biznesi.lat && biznesi.lng
    ? distancaKm(userLocation.lat, userLocation.lng, Number(biznesi.lat), Number(biznesi.lng))
    : null;

  const yjet = mesatarja ?? biznesi.vleresimi ?? biznesi.yllatNumer ?? 0;
  const esIruajtur = esRuajtur(biznesi.emri);

  const dërgoReview = async (e) => {
    e.preventDefault();
    if (përdoruesi?.roli === 'iPezulluar') { setMesazhi('⛔ Llogaria juaj është e pezulluar.'); return; }
    if (!tekstiReview.trim()) return;
    setDukeRuajtur(true);
    setMesazhi('');
    try {
      await shtoReview({
        biznesiEmri: biznesi.emri,
        emri: përdoruesi ? përdoruesi.emri : 'Përdorues',
        tekst: tekstiReview,
        yje: yjetReview,
        foto: fotoReview,
        uid: përdoruesi?.uid,
        email: përdoruesi?.email,
      });
      setTekstiReview('');
      setYjetReview(5);
      setFotoReview('');
      setMesazhi('✅ Faleminderit! Vlerësimi u ruajt.');
    } catch (err) {
      console.error('Gabim review:', err);
      setMesazhi('❌ ' + err.message);
    } finally {
      setDukeRuajtur(false);
    }
  };

  // ===== NDAJE (Faza 2 — kërkesa: "WhatsApp + kopjo linkun") =====
  const linku = () => {
    // Një link që hap saktë këtë biznes, edhe nëse përdoruesi e hap në seancë tjetër
    const emriIu = encodeURIComponent(biznesi.emri);
    return `${window.location.origin}${window.location.pathname}#biznesi=${emriIu}`;
  };

  const ndajeMeBrowser = async () => {
    const teksti = `${biznesi.emri} — ${biznesi.qyteti}, Kosovë (MyKosova)`;
    try {
      await navigator.share({ title: biznesi.emri, text: teksti, url: linku() });
    } catch { /* anulohet nga përdoruesi */ }
  };

  const ndajeTeWhatsApp = () => {
    const teksti = encodeURIComponent(`Po të ndaj një biznes të gjetur te MyKosova: ${biznesi.emri} — ${biznesi.qyteti}, Kosovë 🇽\n${linku()}`);
    window.open(`https://wa.me/?text=${teksti}`, '_blank', 'noopener,noreferrer');
  };

  const kopjoLinkun = async () => {
    try {
      await navigator.clipboard.writeText(linku());
      setMesazhi('📋 Linku u kopjua — ngjite ku do. ✓');
    } catch {
      // fallback për browser-a pa clipboard API
      try {
        const f = document.createElement('textarea');
        f.value = linku();
        document.body.appendChild(f);
        f.select();
        document.execCommand('copy');
        document.body.removeChild(f);
        setMesazhi('📋 Linku u kopjua — ngjite ku do. ✓');
      } catch {
        setMesazhi('⚠️ Linku: ' + linku());
      }
    }
  };

  const ruajFavoritin = async () => {
    const rez = await alterno(biznesi.emri);
    if (!rez.sukses) setMesazhi(rez.mesazhi);
  };

  const butoniVeprimi = (ngjyra) => ({
    flex: 1, padding: '11px 8px', borderRadius: '12px', border: 'none', backgroundColor: ngjyra,
    color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textAlign: 'center',
    textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  });

  return (
    <div style={{ maxWidth: '700px', margin: '24px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Butoni kthim */}
      <button onClick={() => setBiznesiIzgjedhur(null)}
        style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '14px', fontWeight: '700', cursor: 'pointer', padding: '8px 0', marginBottom: '8px' }}>
        ← Kthehu
      </button>

      {/* Heroja */}
      <div style={{ backgroundColor: stiliKartelës, borderRadius: '20px', overflow: 'hidden', border: `1px solid ${korniza}`, boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
        <div style={{ position: 'relative' }}>
          <Foto src={foto} alt={biznesi.emri} ikona="🏢" lartesia="220px" />
          <button onClick={ruajFavoritin} title={esIruajtur ? 'Hiq nga favorites' : 'Ruaj te favorites'}
            style={{ position: 'absolute', top: '12px', right: '12px', width: '44px', height: '44px', borderRadius: '50%', border: 'none',
              backgroundColor: 'rgba(255,255,255,0.92)', cursor: 'pointer', fontSize: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            {esIruajtur ? '❤️' : '🤍'}
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#3b82f6', backgroundColor: '#3b82f615', padding: '4px 10px', borderRadius: '6px' }}>
              {biznesi.kategoria || 'Biznes'}
            </span>
            {paketaInfo && biznesi.paketa !== 'basic' && (
              <span style={{ fontSize: '11px', fontWeight: '800', color: paketaInfo.ngjyra, backgroundColor: paketaInfo.ngjyra + '15', padding: '4px 10px', borderRadius: '6px' }}>
                {paketaInfo.ikona} {paketaInfo.emri}
              </span>
            )}
            {biznesi.verifikuar && (
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#16a34a', backgroundColor: '#16a34a15', padding: '4px 10px', borderRadius: '6px' }}>
                ✓ E VERIFIKUAR
              </span>
            )}
            {distanca != null && (
              <span style={{ fontSize: '11px', fontWeight: '800', color: userLocation?.burimi === 'gps' ? '#8e8e93' : '#b45309' }}>
                📍 {formatoDistancm(distanca)} {userLocation?.burimi === 'gps' ? 'nga ju' : `nga ${userLocation?.qyteti} (MANUAL — jo GPS)`}
              </span>
            )}
          </div>

          <h1 style={{ margin: '0 0 6px 0', fontSize: '26px', fontWeight: '800', color: stiliTekstit }}>{biznesi.emri}</h1>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#8e8e93' }}>
            📍 {biznesi.qyteti}{biznesi.adresa ? ` — ${biznesi.adresa}` : ''}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
            <span style={{ fontSize: '18px' }}>{'⭐'.repeat(Math.round(yjet))}<span style={{ opacity: 0.3 }}>{'⭐'.repeat(5 - Math.round(yjet))}</span></span>
            <b style={{ color: '#f59e0b', fontSize: '15px' }}>{yjet ? Number(yjet).toFixed(1) : '—'}</b>
            <span style={{ fontSize: '12px', color: '#8e8e93' }}>({reviews.length} vlerësime)</span>
          </div>

          {biznesi.pershkrimi && (
            <p style={{ margin: '0 0 14px 0', fontSize: '14px', lineHeight: 1.6, color: stiliTekstit }}>{biznesi.pershkrimi}</p>
          )}

          {/* OFERTAT AKTIVE (nga koleksioni — me skadencë, spec B8) */}
          {ofertatAktive.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {ofertatAktive.map((o) => (
                <div key={o.id} style={{ backgroundColor: '#16a34a12', border: '1px solid #16a34a40', borderRadius: '14px', padding: '12px 16px', fontSize: '14px', color: '#15803d', fontWeight: '600' }}>
                  🎁 {o.teksti}
                  {(o.cmimiVjete || o.cmimiIri) && (
                    <span style={{ marginLeft: '10px' }}>
                      {o.cmimiVjete && <s style={{ color: '#8e8e93', fontWeight: '400' }}>{o.cmimiVjete}€</s>}
                      {o.cmimiIri && <b style={{ marginLeft: o.cmimiVjete ? '6px' : 0 }}>{o.cmimiIri}€</b>}
                    </span>
                  )}
                  {o.vlenDeri && <span style={{ fontSize: '12px', fontWeight: '400', color: '#8e8e93', marginLeft: '10px' }}>vlen deri më {o.vlenDeri}</span>}
                </div>
              ))}
            </div>
          ) : biznesi.oferta ? (
            <div style={{ backgroundColor: '#16a34a12', border: '1px solid #16a34a40', borderRadius: '14px', padding: '12px 16px', marginBottom: '14px', fontSize: '14px', color: '#15803d', fontWeight: '600' }}>
              🎁 {biznesi.oferta}
            </div>
          ) : null}

          {/* Butonat kryesorë */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {biznesi.telefoni && (
              <a href={`tel:${biznesi.telefoni}`} onClick={() => numero('klikTelefoni')} style={butoniVeprimi('#3b82f6')}>📞 Telefono</a>
            )}
            {(biznesi.whatsapp || biznesi.telefoni) && (
              <a href={`https://wa.me/${String(biznesi.whatsapp || biznesi.telefoni).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={() => numero('klikWhatsApp')} style={butoniVeprimi('#25d366')}>
                💬 WhatsApp
              </a>
            )}
            <button onClick={() => { numero('klikNavigo'); hapLinkun(merrMapsUrl(biznesi)); }} style={butoniVeprimi('#8e8e93')}>🧭 Navigo</button>
            {biznesi.website && (
              <a href={biznesi.website.startsWith('http') ? biznesi.website : `https://${biznesi.website}`} target="_blank" rel="noopener noreferrer" style={butoniVeprimi('#0ea5e9')}>
                🌐 Website
              </a>
            )}
            <button onClick={() => setMenujaESharingut((x) => !x)} style={butoniVeprimi(menujaESharingut ? '#4f46e5' : '#6366f1')}>📤 Ndaje</button>
          </div>

          {/* MENUJA E NDAJES — WhatsApp / Kopjo linkun / Browser-i */}
          {menujaESharingut && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
              <button onClick={ndajeTeWhatsApp} style={butoniVeprimi('#25d366')}>💬 Ndaje te WhatsApp</button>
              <button onClick={kopjoLinkun} style={butoniVeprimi('#0ea5e9')}>📋 Kopjo linkun</button>
              {typeof navigator.share === 'function' && (
                <button onClick={ndajeMeBrowser} style={butoniVeprimi('#8e8e93')}>📤 Ndaje me browser-in</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BOOKING */}
      {kaBooking && (
        <div style={{ backgroundColor: stiliKartelës, borderRadius: '20px', border: `1px solid ${korniza}`, padding: '22px', marginTop: '16px' }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '800', color: stiliTekstit }}>
            📅 Rezervo {llojiBooking === 'hotel' ? 'Dhomën' : llojiBooking === 'restorant' ? 'Tavolinën' : 'Aktivitetin'}
          </h2>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#8e8e93' }}>
            Rezervimi dërgohet te biznesi për konfirmim — statusin e ndiqni te Llogaria → Rezervimet.
          </p>
          {dukeRezervuar ? (
            <BookingForm biznesi={biznesi} lloji={llojiBooking} onMbarim={() => setDukeRezervuar(false)} />
          ) : (
            <button onClick={() => setDukeRezervuar(true)}
              style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '13px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>
              Rezervo tani 📅
            </button>
          )}
        </div>
      )}

      {/* REVIEWS */}
      <div style={{ backgroundColor: stiliKartelës, borderRadius: '20px', border: `1px solid ${korniza}`, padding: '22px', marginTop: '16px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800', color: stiliTekstit }}>
          Vlerësimet ⭐ {reviews.length > 0 && <span style={{ color: '#8e8e93', fontSize: '13px', fontWeight: '600' }}>({reviews.length})</span>}
        </h2>

        {/* Forma e review-it */}
        <form onSubmit={dërgoReview} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${korniza}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#8e8e93' }}>Vlerëso:</span>
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} onClick={() => setYjetReview(i)} style={{ fontSize: '24px', cursor: 'pointer', filter: i <= yjetReview ? 'none' : 'grayscale(1) opacity(0.4)' }}>⭐</span>
            ))}
          </div>
          <input type="url" value={fotoReview} onChange={(e) => setFotoReview(e.target.value)}
            placeholder="📷 Foto nga përdoruesi (URL, opsional) — p.sh. https://..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          <textarea
            value={tekstiReview}
            onChange={(e) => setTekstiReview(e.target.value)}
            rows={3}
            placeholder={përdoruesi ? `Ndaj përvojën tënde te ${biznesi.emri}...` : 'Ndaj përvojën tënde (për emër do t\u2019duhet "Përdorues" — hyhu për emrin tënd)...'}
            style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: mesazhi.startsWith('✅') ? '#16a34a' : '#ef4444', fontWeight: '600' }}>{mesazhi}</span>
            <button type="submit" disabled={dukeRuajtur || !tekstiReview.trim()}
              style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '11px 20px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: dukeRuajtur ? 0.6 : 1 }}>
              {dukeRuajtur ? 'Duke ruajtur...' : 'Dërgo vlerësimin'}
            </button>
          </div>
        </form>

        {/* Lista e review-eve */}
        {reviewsLoading ? (
          <p style={{ color: '#8e8e93', fontSize: '14px' }}>Duke ngarkuar vlerësimet...</p>
        ) : reviews.length === 0 ? (
          <p style={{ color: '#8e8e93', fontSize: '14px' }}>Ende asnjë vlerësim — bëhu i pari! ⭐</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {reviews.map((r) => (
              <div key={r.id} style={{ padding: '14px', borderRadius: '14px', border: `1px solid ${korniza}`, backgroundColor: darkMode ? '#111827' : '#f9fafb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <b style={{ fontSize: '14px', color: stiliTekstit }}>
                    {r.emri} {r.uid && r.uid !== 'anonim' && <span style={{ fontSize: '10px', color: '#8e8e93', fontWeight: '600' }}>· llogari e verifikuar</span>}
                  </b>
                  <span style={{ fontSize: '13px' }}>{'⭐'.repeat(Math.round(Number(r.yje)))}</span>
                </div>
                <p style={{ margin: '0 0 6px 0', fontSize: '14px', lineHeight: 1.5, color: stiliTekstit }}>{r.tekst}</p>
                {r.foto && r.foto.startsWith('http') && (
                  <Foto src={r.foto} alt="Foto nga përdoruesi" mode="hiq" lartesia="auto"
                    style={{ maxHeight: '180px', borderRadius: '10px', margin: '6px 0' }} />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#8e8e93' }}>
                    {r.koha?.toDate ? r.koha.toDate().toLocaleDateString('sq-AL') : ''}
                    {r.raportuar > 0 && <span style={{ color: '#ef4444', marginLeft: '8px' }}>⚑ {r.raportuar} raporte</span>}
                  </span>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        if (!përdoruesi) { setMesazhi('Hyhuni për të votuar "Ndihmoi?"'); return; }
                        votoNdermues(r.id, përdoruesi.uid).catch(() => {});
                      }}
                      style={{ background: 'none', border: 'none', color: (r.ndermuesit || []).includes(përdoruesi?.uid) ? '#16a34a' : '#8e8e93', fontSize: '11px', cursor: 'pointer', fontWeight: (r.ndermuesit || []).includes(përdoruesi?.uid) ? '800' : '400' }}>
                      👍 Ndihmoi? ({(r.ndermuesit || []).length})
                    </button>
                    <button onClick={() => raportoReview(r.id).then(() => setMesazhi('⚑ Review-i u raportua — admini do ta shqyrtojë.')).catch(() => setMesazhi('S\u2019u raportuar.'))}
                      style={{ background: 'none', border: 'none', color: '#8e8e93', fontSize: '11px', cursor: 'pointer' }}>
                      ⚑ Raporto
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BiznesiDetaji;
