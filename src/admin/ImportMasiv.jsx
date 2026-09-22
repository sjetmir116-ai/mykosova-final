import { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../AppContext';
import { db, fcn } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, onSnapshot } from 'firebase/firestore';

// ===== IMPORT MASIV — Google Places → Firestore =====
// Paneli thërret VETËM callable-in; asnjë API key nuk kalon nga browser-i.
// Çelësi jeton te Firebase Secrets (GOOGLE_PLACES_API_KEY) dhe përdoret
// server-side nga Admin SDK-ja, e cila mund të shkruajë direkt 'aprovar'
// (rules-i s'e lejon këtë nga klienti — shih firestore.rules §3).
//
// Puna ndahet në copa: callable-i kthen perfunduar=false dhe ne e rithërrasim
// me { jobId, vazhdo: true } derisa të mbarojë. Progresi vjen live nga
// onSnapshot te importJobs/{jobId}.

// Fallback nëse katalogu s'merret dot nga serveri (p.sh. functions pa deploy).
const QYTETET_FALLBACK = [
  'Prishtinë', 'Prizren', 'Pejë', 'Gjakovë', 'Ferizaj', 'Gjilan', 'Mitrovicë',
  'Podujevë', 'Vushtrri', 'Suharekë', 'Rahovec', 'Drenas', 'Lipjan', 'Malishevë',
  'Kamenicë', 'Viti', 'Deçan', 'Istog', 'Klinë', 'Skenderaj', 'Fushë Kosovë',
  'Obiliq', 'Kaçanik', 'Shtime', 'Dragash', 'Graçanicë',
];
const KATEGORITE_FALLBACK = [
  'Restorante', 'Kafene', 'Hotele', 'Pika Karburanti', 'Health', 'Automotive',
  'Shopping', 'Services', 'Business', 'Turizëm', 'Hospitality', 'Food', 'Emergjenca',
];

const QYTETET_KRYESORE = ['Prishtinë', 'Prizren', 'Pejë', 'Gjakovë', 'Ferizaj', 'Gjilan', 'Mitrovicë'];

const STRATEGJITE = [
  { id: 'shpejt', emri: '⚡ Shpejt', pershkrimi: 'Text Search me pyetje sinonime — i shpejtë, ~100–300 vende për qytet.' },
  { id: 'rrjete', emri: '🕸️ Rrjetë', pershkrimi: 'Nearby mbi rrjetë qelizash — shterrues, kap edhe bizneset e vogla.' },
  { id: 'plote', emri: '🎯 E plotë', pershkrimi: 'Të dyja bashkë — mbulimi maksimal (rekomandohet për qytetet kryesore).' },
];

const STATUSET = [
  { id: 'auto', emri: '🤖 Auto (skor cilësie)', pershkrimi: 'Bizneset cilësore → aprovar; të tjerat → pendshe për moderim.' },
  { id: 'aprovar', emri: '✅ Të gjitha aprovar', pershkrimi: 'Publikohen të gjitha menjëherë — përdore vetëm kur i beson burimit.' },
  { id: 'pendshe', emri: '⏳ Të gjitha pendshe', pershkrimi: 'Asgjë s\u2019publikohet pa e parë ti te Menaxho Bizneset.' },
];

const MESAZHET_GABIMIT = {
  'functions/unauthenticated': 'Duhet të jeni i loguar si admin.',
  'functions/permission-denied': 'Vetëm admini mund të bëjë importim masiv.',
  'functions/failed-precondition': 'Mungon konfigurimi — vendos GOOGLE_PLACES_API_KEY te Firebase Secrets.',
  'functions/resource-exhausted': 'Kuota e Google Places u mbush. Provoni më vonë.',
  'functions/not-found': 'Funksioni s\u2019është deploy-uar ende (firebase deploy --only functions).',
  'functions/internal': 'Gabim i brendshëm te serveri — shih logjet e Functions.',
};

function ImportMasiv() {
  const { darkMode } = useContext(AppContext);

  const [katalogu, setKatalogu] = useState({ qytetet: QYTETET_FALLBACK, kategorite: KATEGORITE_FALLBACK });
  const [qytetet, setQytetet] = useState(['Prishtinë']);
  const [kategorite, setKategorite] = useState(['Restorante']);
  const [strategjia, setStrategjia] = useState('shpejt');
  const [statusi, setStatusi] = useState('auto');
  const [merrFotot, setMerrFotot] = useState(true);
  const [perditeso, setPerditeso] = useState(false);
  const [maksBiznese, setMaksBiznese] = useState(1000);
  const [maksKerkesa, setMaksKerkesa] = useState(400);

  const [vleresimi, setVleresimi] = useState(null);
  const [duke, setDuke] = useState('');          // '' | 'vleresim' | 'prove' | 'import'
  const [jobId, setJobId] = useState('');
  const [puna, setPuna] = useState(null);        // gjendja live nga Firestore
  const [rezultati, setRezultati] = useState(null);
  const [mesazhi, setMesazhi] = useState({ tekst: '', gabim: false });

  // Anulimi kërkohet nga përdoruesi ndërsa një copë është në fluturim; e lexojmë
  // përmes ref-it, sepse cikli i vazhdimit nuk e sheh state-in e ri.
  const anulimiKerkuar = useRef(false);

  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#111827';
  const punon = duke !== '';

  // Katalogu nga serveri (burimi i vërtetë). Dështimi s'është fatal — mbeten fallback-et.
  useEffect(() => {
    let gjallë = true;
    httpsCallable(fcn, 'katalogImportimi')({})
      .then((res) => {
        if (!gjallë || !res?.data) return;
        const d = res.data;
        if (Array.isArray(d.qytetet) && d.qytetet.length) {
          setKatalogu({ qytetet: d.qytetet, kategorite: d.kategorite || KATEGORITE_FALLBACK });
        }
      })
      .catch(() => { /* fallback-et lokale mjaftojnë */ });
    return () => { gjallë = false; };
  }, []);

  // Progres live nga dokumenti i punës.
  useEffect(() => {
    if (!jobId) return undefined;
    const unsub = onSnapshot(
      doc(db, 'importJobs', jobId),
      (snap) => { if (snap.exists()) setPuna({ id: snap.id, ...snap.data() }); },
      () => { /* rules ende jo të publikuara — numëruesit vijnë nga përgjigjja e callable-it */ }
    );
    return () => unsub();
  }, [jobId]);

  const kthejGabimin = (err) => {
    const kodi = err?.code || '';
    return MESAZHET_GABIMIT[kodi] || err?.message || 'Gabim i papritur.';
  };

  const ndertoKerkesen = (shtese = {}) => ({
    qytetet,
    kategorite,
    strategjia,
    statusi,
    merrFotot,
    perditeso,
    maksBiznese: Number(maksBiznese) || 1000,
    maksKerkesaApi: Number(maksKerkesa) || 400,
    ...shtese,
  });

  const perzgjidh = (lista, vlera, setter) => {
    setter(lista.includes(vlera) ? lista.filter((x) => x !== vlera) : [...lista, vlera]);
    setVleresimi(null);
  };

  const vlereso = async () => {
    if (!qytetet.length || !kategorite.length) {
      setMesazhi({ tekst: 'Zgjidh të paktën një qytet dhe një kategori.', gabim: true });
      return;
    }
    setDuke('vleresim');
    setMesazhi({ tekst: '', gabim: false });
    try {
      const res = await httpsCallable(fcn, 'vleresoImportin')(ndertoKerkesen());
      setVleresimi(res.data.vleresimi);
    } catch (err) {
      setMesazhi({ tekst: '❌ ' + kthejGabimin(err), gabim: true });
    } finally {
      setDuke('');
    }
  };

  // Cikli i copave: thirr → nëse perfunduar=false, thirr sërish me jobId.
  const nis = async (prove) => {
    if (!qytetet.length || !kategorite.length) {
      setMesazhi({ tekst: 'Zgjidh të paktën një qytet dhe një kategori.', gabim: true });
      return;
    }
    anulimiKerkuar.current = false;
    setDuke(prove ? 'prove' : 'import');
    setMesazhi({ tekst: '', gabim: false });
    setRezultati(null);
    setPuna(null);
    setJobId('');

    try {
      let res = await httpsCallable(fcn, 'importoMasiv')(ndertoKerkesen({ prove }));
      let data = res.data;
      setJobId(data.jobId);

      // Tavan i fortë: mbron nga një lak i pafund nëse serveri s'përparon dot.
      let copa = 0;
      while (!data.perfunduar && copa < 60 && !anulimiKerkuar.current) {
        copa++;
        res = await httpsCallable(fcn, 'importoMasiv')({ jobId: data.jobId, vazhdo: true });
        data = res.data;
      }

      setRezultati(data);
      if (anulimiKerkuar.current) {
        setMesazhi({ tekst: '⏹️ Importi u ndal nga ju. Rinise kur të duash — dublikatat kapërcehen automatikisht.', gabim: false });
      } else if (!data.perfunduar) {
        setMesazhi({ tekst: `⏸️ Importi u ndal (${data.ndalesa || 'kufi'}). Shtyp "Nis importin" për të vazhduar.`, gabim: false });
      } else if (prove) {
        setMesazhi({ tekst: `🧪 Prova përfundoi — ${data.numeratori.vendeUnike} vende u gjetën. Asgjë NUK u shkrua.`, gabim: false });
      } else {
        setMesazhi({ tekst: `✅ Importi përfundoi — ${data.numeratori.teShtuara} biznese u shtuan.`, gabim: false });
      }
    } catch (err) {
      setMesazhi({ tekst: '❌ ' + kthejGabimin(err), gabim: true });
    } finally {
      setDuke('');
    }
  };

  const anulo = async () => {
    anulimiKerkuar.current = true;
    setMesazhi({ tekst: '⏹️ Duke ndaluar pas copës aktuale…', gabim: false });
    if (jobId) {
      try { await httpsCallable(fcn, 'anuloImportin')({ jobId }); } catch { /* ndalimi lokal mjafton */ }
    }
  };

  // ---------- pjesët e UI-së ----------
  const kartela = { backgroundColor: stiliKartelës, border: `1px solid ${korniza}`, borderRadius: '18px', padding: '18px' };

  const shenja = (teksti, aktive, onClick, celesi) => (
    <button key={celesi || teksti} type="button" onClick={onClick} disabled={punon}
      style={{
        padding: '7px 13px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '700',
        cursor: punon ? 'not-allowed' : 'pointer', opacity: punon ? 0.6 : 1,
        border: `1px solid ${aktive ? '#3b82f6' : korniza}`,
        backgroundColor: aktive ? '#3b82f6' : 'transparent',
        color: aktive ? '#fff' : stiliTekstit,
      }}>
      {teksti}
    </button>
  );

  const numri = (etiketa, vlera, setter, min, maks) => (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8e8e93', marginBottom: '4px' }}>{etiketa}</label>
      <input type="number" min={min} max={maks} value={vlera} disabled={punon}
        onChange={(e) => { setter(e.target.value); setVleresimi(null); }}
        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );

  const n = puna?.numeratori || rezultati?.numeratori || null;
  const perqindja = puna?.taskatGjithsej && puna?.kursori
    ? Math.min(100, Math.round((Number(puna.kursori.task || 0) / puna.taskatGjithsej) * 100))
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: stiliTekstit }}>Import Masiv 🚀</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8e8e93' }}>
          Tërheq qindra biznese nga Google Places njëherësh — me mapim kategorish/qytetesh,
          deduplikim atomik dhe status automatik.
        </p>
      </div>

      {mesazhi.tekst && (
        <div style={{ padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700',
          backgroundColor: mesazhi.gabim ? '#ff3b3015' : '#16a34a15',
          color: mesazhi.gabim ? '#ef4444' : '#16a34a',
          border: `1px solid ${mesazhi.gabim ? '#ff3b3040' : '#16a34a40'}` }}>
          {mesazhi.tekst}
        </div>
      )}

      {/* QYTETET */}
      <div style={kartela}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>
            🏙️ Qytetet <span style={{ color: '#8e8e93', fontWeight: '600' }}>({qytetet.length})</span>
          </h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            {shenja('7 kryesoret', false, () => { setQytetet(QYTETET_KRYESORE); setVleresimi(null); }, 'k7')}
            {shenja('Të gjitha', false, () => { setQytetet(katalogu.qytetet); setVleresimi(null); }, 'kg')}
            {shenja('Pastro', false, () => { setQytetet([]); setVleresimi(null); }, 'kp')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
          {katalogu.qytetet.map((q) => shenja(q, qytetet.includes(q), () => perzgjidh(qytetet, q, setQytetet)))}
        </div>
      </div>

      {/* KATEGORITË */}
      <div style={kartela}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>
            🗂️ Kategoritë <span style={{ color: '#8e8e93', fontWeight: '600' }}>({kategorite.length})</span>
          </h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            {shenja('Të gjitha', false, () => { setKategorite(katalogu.kategorite); setVleresimi(null); }, 'ag')}
            {shenja('Pastro', false, () => { setKategorite([]); setVleresimi(null); }, 'ap')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
          {katalogu.kategorite.map((k) => shenja(k, kategorite.includes(k), () => perzgjidh(kategorite, k, setKategorite)))}
        </div>
      </div>

      {/* STRATEGJIA + STATUSI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div style={kartela}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>🔍 Strategjia</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {STRATEGJITE.map((s) => (
              <button key={s.id} type="button" disabled={punon} onClick={() => { setStrategjia(s.id); setVleresimi(null); }}
                style={{ textAlign: 'left', padding: '10px 12px', borderRadius: '12px', cursor: punon ? 'not-allowed' : 'pointer',
                  border: `1px solid ${strategjia === s.id ? '#3b82f6' : korniza}`,
                  backgroundColor: strategjia === s.id ? '#3b82f612' : 'transparent', opacity: punon ? 0.6 : 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: strategjia === s.id ? '#3b82f6' : stiliTekstit }}>{s.emri}</div>
                <div style={{ fontSize: '11.5px', color: '#8e8e93', marginTop: '2px', lineHeight: 1.4 }}>{s.pershkrimi}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={kartela}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>🏷️ Statusi i ruajtjes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {STATUSET.map((s) => (
              <button key={s.id} type="button" disabled={punon} onClick={() => setStatusi(s.id)}
                style={{ textAlign: 'left', padding: '10px 12px', borderRadius: '12px', cursor: punon ? 'not-allowed' : 'pointer',
                  border: `1px solid ${statusi === s.id ? '#3b82f6' : korniza}`,
                  backgroundColor: statusi === s.id ? '#3b82f612' : 'transparent', opacity: punon ? 0.6 : 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: statusi === s.id ? '#3b82f6' : stiliTekstit }}>{s.emri}</div>
                <div style={{ fontSize: '11.5px', color: '#8e8e93', marginTop: '2px', lineHeight: 1.4 }}>{s.pershkrimi}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* OPSIONET */}
      <div style={kartela}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>⚙️ Opsionet</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          {numri('Maks. biznese', maksBiznese, setMaksBiznese, 1, 20000)}
          {numri('Maks. thirrje Google', maksKerkesa, setMaksKerkesa, 1, 20000)}
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: '700', color: stiliTekstit, cursor: 'pointer' }}>
            <input type="checkbox" checked={merrFotot} disabled={punon} onChange={(e) => setMerrFotot(e.target.checked)} />
            📷 Merr fotot <span style={{ color: '#8e8e93', fontWeight: '600' }}>(+1 thirrje/biznes)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: '700', color: stiliTekstit, cursor: 'pointer' }}>
            <input type="checkbox" checked={perditeso} disabled={punon} onChange={(e) => setPerditeso(e.target.checked)} />
            🔄 Përditëso ekzistueset <span style={{ color: '#8e8e93', fontWeight: '600' }}>(s\u2019prek statusin)</span>
          </label>
        </div>
      </div>

      {/* VLERËSIMI */}
      {vleresimi && (
        <div style={{ ...kartela, borderColor: vleresimi.brendaKufirit ? '#16a34a40' : '#f59e0b40', backgroundColor: vleresimi.brendaKufirit ? '#16a34a08' : '#f59e0b08' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '800', color: stiliTekstit }}>💸 Vlerësimi i kostos</h3>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: stiliTekstit }}>
            <span><b>{vleresimi.taskat}</b> taskа</span>
            <span><b>~{vleresimi.kerkesaKerkimi}</b> thirrje kërkimi</span>
            <span style={{ color: '#8e8e93' }}>text: {vleresimi.kerkesaText} · nearby: {vleresimi.kerkesaNearby}</span>
          </div>
          {!vleresimi.brendaKufirit && (
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#f59e0b', fontWeight: '700' }}>
              ⚠️ Plani e kalon tavanin prej {maksKerkesa} thirrjesh — importi do të ndalet aty dhe mund të vazhdohet më pas.
            </p>
          )}
        </div>
      )}

      {/* BUTONAT */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button type="button" onClick={vlereso} disabled={punon}
          style={{ padding: '12px 18px', borderRadius: '12px', border: `1px solid ${korniza}`, backgroundColor: 'transparent', color: stiliTekstit, fontWeight: '700', fontSize: '13.5px', cursor: punon ? 'not-allowed' : 'pointer', opacity: punon ? 0.6 : 1 }}>
          {duke === 'vleresim' ? '⏳ Duke llogaritur…' : '💸 Llogarit koston'}
        </button>
        <button type="button" onClick={() => nis(true)} disabled={punon}
          style={{ padding: '12px 18px', borderRadius: '12px', border: 'none', backgroundColor: '#8e8e93', color: '#fff', fontWeight: '700', fontSize: '13.5px', cursor: punon ? 'not-allowed' : 'pointer', opacity: punon ? 0.6 : 1 }}>
          {duke === 'prove' ? '⏳ Duke provuar…' : '🧪 Provë (s\u2019shkruan asgjë)'}
        </button>
        <button type="button" onClick={() => nis(false)} disabled={punon}
          style={{ padding: '12px 22px', borderRadius: '12px', border: 'none', backgroundColor: '#16a34a', color: '#fff', fontWeight: '800', fontSize: '14px', cursor: punon ? 'not-allowed' : 'pointer', opacity: punon ? 0.6 : 1 }}>
          {duke === 'import' ? '⏳ Duke importuar…' : '🚀 Nis importin'}
        </button>
        {punon && duke === 'import' && (
          <button type="button" onClick={anulo}
            style={{ padding: '12px 18px', borderRadius: '12px', border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer' }}>
            ⏹️ Ndal
          </button>
        )}
      </div>

      {/* PROGRESI + REZULTATI */}
      {n && (
        <div style={kartela}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: stiliTekstit }}>
              {punon ? '⏳ Duke punuar…' : rezultati?.prove ? '🧪 Rezultati i provës' : '📊 Rezultati'}
            </h3>
            {jobId && <span style={{ fontSize: '11px', color: '#8e8e93', fontFamily: 'monospace' }}>job: {jobId.slice(0, 10)}…</span>}
          </div>

          {perqindja !== null && punon && (
            <div style={{ height: '6px', borderRadius: '3px', backgroundColor: korniza, marginBottom: '14px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${perqindja}%`, backgroundColor: '#3b82f6', transition: 'width .4s' }} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '10px' }}>
            {[
              ['✅ Të shtuara', n.teShtuara, '#16a34a'],
              ['🟢 Aprovar', n.teAprovuara, '#16a34a'],
              ['⏳ Pendshe', n.tePendshe, '#f59e0b'],
              ['🔄 Përditësuar', n.tePerditesuara, '#3b82f6'],
              ['⏭️ Dublikatë', (n.dublikateGoogle || 0) + (n.dublikateEmri || 0), '#8e8e93'],
              ['🔍 Gjetur', n.vendeTeGjetura, '#8e8e93'],
              ['📷 Foto', n.fotoTeMarra, '#8e8e93'],
              ['💸 Thirrje API', n.kerkesaApi, '#7c3aed'],
              ['❌ Gabime', n.gabime, n.gabime > 0 ? '#ef4444' : '#8e8e93'],
            ].map(([etiketa, vlera, ngjyra]) => (
              <div key={etiketa} style={{ padding: '10px 12px', borderRadius: '12px', border: `1px solid ${korniza}` }}>
                <div style={{ fontSize: '21px', fontWeight: '800', color: ngjyra }}>{vlera ?? 0}</div>
                <div style={{ fontSize: '11px', color: '#8e8e93', fontWeight: '700', marginTop: '2px' }}>{etiketa}</div>
              </div>
            ))}
          </div>

          {rezultati?.mostra?.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: `1px solid ${korniza}`, paddingTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#8e8e93', marginBottom: '8px' }}>MOSTRA</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '260px', overflowY: 'auto' }}>
                {rezultati.mostra.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: '9px', alignItems: 'center', fontSize: '12.5px', color: stiliTekstit }}>
                    <span>{m.status === 'aprovar' ? '✅' : '⏳'}</span>
                    <span style={{ fontWeight: '700' }}>{m.emri}</span>
                    <span style={{ color: '#8e8e93' }}>{m.kategoria} · {m.qyteti} · skor {m.skori}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rezultati?.arsyet && Object.keys(rezultati.arsyet).length > 0 && (
            <div style={{ marginTop: '14px', borderTop: `1px solid ${korniza}`, paddingTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#8e8e93', marginBottom: '6px' }}>ARSYET E ANASHKALIMIT</div>
              {Object.entries(rezultati.arsyet).sort((a, b) => b[1] - a[1]).map(([a, v]) => (
                <div key={a} style={{ fontSize: '12px', color: '#8e8e93' }}>· {a}: <b>{v}</b></div>
              ))}
            </div>
          )}

          {rezultati?.gabimet?.length > 0 && (
            <div style={{ marginTop: '14px', borderTop: `1px solid ${korniza}`, paddingTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#ef4444', marginBottom: '6px' }}>GABIME</div>
              {rezultati.gabimet.map((g, i) => (
                <div key={i} style={{ fontSize: '11.5px', color: '#ef4444' }}>· {g}</div>
              ))}
            </div>
          )}

          {!punon && !rezultati?.prove && n.tePendshe > 0 && (
            <p style={{ margin: '14px 0 0 0', fontSize: '12.5px', color: '#f59e0b', fontWeight: '700' }}>
              👉 {n.tePendshe} biznese presin miratim te <b>Menaxho Bizneset</b> (filtri ⏳ Pendshe).
            </p>
          )}
        </div>
      )}

      <p style={{ margin: 0, fontSize: '11.5px', color: '#8e8e93', lineHeight: 1.6 }}>
        ℹ️ Çelësi i Google Places qëndron te Firebase Secrets — kurrë te browser-i.
        Deduplikimi është atomik (Google Place ID + emër&nbsp;+&nbsp;qytet), prandaj rinisja e
        importit s\u2019krijon kurrë dublikatë. Për importe shumë të mëdha përdor
        CLI-në: <code>node functions/scripts/importo-masiv.js --ndihme</code>
      </p>
    </div>
  );
}

export default ImportMasiv;
