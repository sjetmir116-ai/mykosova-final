import React, { useState, useRef, useEffect, useContext } from 'react';
import { AppContext } from './AppContext';
import { useBizneset, merrMapsUrl } from './useBizneset';
import { gjeneroItinerarin } from './useTrips';
import { useAttraksioneve } from './attraksionet';
import { distancaKm } from './distanca';
import { merrMoti, esMotIMire, QYTETE_KOORDINATA } from './moti';

// ===== MOTORI I DITURIVE: AI funksional që përgjigjet mbi të dhënat reale =====

// Normalizim: ulëtshkrim + largim akcentesh (benzinë → benzine, Suharekë → suhareke)
const normalizo = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const FJALE_TRIP = ['trip', 'udhem', 'udhëtim', 'planifiko', 'itinerar', 'vizito', 'pushim', 'ekskursion', 'zbul'];
const FJALE_AFER = ['afer', 'afër', 'te afert', 'me afert', 'mё afert', 'closest', 'near'];

// Fjalëkyçe → kategori. Fjalët e një kategorie janë sinonime të njëra-tjetrës:
// nëse përdoruesi thotë "benzinë", përkthenet edhe "karburant" dhe anasjella.
const KATEGORI_KYCE = [
  { emri: 'kafene', fjale: ['kafe', 'kafene', 'kahve', 'coffee', 'bar'] },
  { emri: 'restorant', fjale: ['restorant', 'restorante', 'ushqim', 'usqim', 'pjate', 'mish', 'restaurant', 'hane', 'ciftelig'] },
  { emri: 'hotel', fjale: ['hotel', 'hotele', 'akomodim', 'dhoma', 'lodur', 'nendjem', 'lodje', 'qind'] },
  { emri: 'karburant', fjale: ['karburant', 'benzine', 'nafte', 'stacion', 'gas', 'petrol'] },
  { emri: 'turizëm', fjale: ['turizem', 'rugova', 'rugove', 'mal', 'male', 'park', 'natyre', 'destinacion', 'shoshene', 'shteg', 'alpet'] },
];

const FJALE_URGJENCE = ['urgjen', 'ambulanc', 'spital', 'polici', 'zjarr', 'ndihme', 'sos', 'siguri', '112', '192', '193', '194', 'ndihm'];
const FJALE_OFERTASH = ['ofert', 'zbritje', 'falas', 'reduktim', 'discount', 'promocion', 'special'];
const FJALE_TOP = ['top', 'mir', 'vleresim', 'vleresm', 'rating', 'rekomand', 'shqiper', 'shqipe'];
const FJALE_PERSHENDetje = ['pershendetje', 'pershende', 'hello', 'mire dita', 'si je', 'sallam', 'mirevini', 'mir se vini'];

// Gjen kategoritë e përshtatshme nga teksti i përdoruesit
function gjenKategorite(tekstiNorm) {
  return KATEGORI_KYCE.filter((kat) => kat.fjale.some((f) => tekstiNorm.includes(f)));
}

// Ndërton fjalët e kërkimit: cdo fjale mbi 5 shkronja merr edhe prefiksin 4-shkronjës
// kështu "rugova" përputhet me "Rugovës" (rugove) dhe anasjella
function ndërtonFjaleTeksti(t) {
  const baze = t.replace(/[^a-z0-9\u00c0-\u024f\s]/gi, ' ').split(/\s+/).filter((f) => f.length > 2);
  const zgjeruara = [];
  for (const f of baze) {
    zgjeruara.push(f);
    if (f.length > 5) zgjeruara.push(f.slice(0, 4));
  }
  return zgjeruara;
}

// Pikëzimin inteligjent: emri > kategoria/qyteti > adresa > pershkrimi
function pikëzo(biznesi, fjaleTePyetjes, qytetetNeTekst, kategoriteTePergjigjes) {
  const emri = normalizo(biznesi.emri);
  const kategoria = normalizo(biznesi.kategoria);
  const qyteti = normalizo(biznesi.qyteti);
  const pershkrimi = normalizo(biznesi.pershkrimi);
  const adresa = normalizo(biznesi.adresa);

  let pike = 0;
  for (const fjala of fjaleTePyetjes) {
    if (emri.includes(fjala)) pike += 4;
    if (kategoria.includes(fjala)) pike += 3;
    if (qyteti.includes(fjala)) pike += 3;
    if (adresa.includes(fjala)) pike += 1;
    if (pershkrimi.includes(fjala)) pike += 1;
  }
  // Sinonimet e kategorisë: "benzinë" → të gjitha "Pika Karburanti"
  for (const kat of kategoriteTePergjigjes) {
    if (kat.fjale.some((f) => kategoria.includes(f))) pike += 4;
  }
  if (qytetetNeTekst.length > 0 && qytetetNeTekst.includes(qyteti)) pike += 3;
  return pike;
}

// Motori i përgjigjeve: kthen { tekst, bizneset }
async function motorIPergjigjje(teksti, bizneset, userLocation, attraksionet = []) {
  const t = normalizo(teksti);

  // MOTI — "Moti çfarë është në Prizren?" / "A është mot për Rugovë nesër?"
  if (t.includes('mot') || t.includes('weather') || t.includes('diell') || t.includes('shirose') || t.includes('shiu')) {
    const qyteti = Object.keys(QYTETE_KOORDINATA).find((q) => t.includes(normalizo(q)));
    try {
      const m = await merrMoti(qyteti ? { qyteti } : { lat: userLocation?.lat, lng: userLocation?.lng });
      if (!m) return { tekst: 'Tregoni qytetin (p.sh. "Moti në Prizren") ose aktivizoni GPS.', bizneset: [] };
      const emriQytetit = qyteti || 'pozicioni juaj';
      const vleresimi = esMotIMire(m.kod, m.temp);
      const ardhshme = m.ditet.map((d) => `${d.data.slice(5)} ${d.emoji}${d.maks}°`).join(' · ');
      return {
        tekst: `🌤️ MOTI NË ${emriQytetit.toUpperCase()}\n${m.emoji} Tani: ${m.temp}°C — ${m.emri}\n📅 3 ditët e ardhshme: ${ardhshme}\n\n${vleresimi.teksti}`,
        bizneset: [],
      };
    } catch (e) {
      return { tekst: 'Moti s\u2019u arrit — kontrollojeni internetin dhe provoni përsëri.', bizneset: [] };
    }
  }

  // 1. Përshëndetje
  if (FJALE_PERSHENDetje.some((f) => t.includes(f)) && t.length < 40) {
    return {
      tekst: `Mirë se vini! 🇽 Unë jam asistenti i MyKosova — funksional me të dhëna reale.\nMë thoni siç i kërkoni këtu ose në Google:\n• "Kafene në Suharekë"\n• "Hotele me ofertë"\n• "Rugova"\n• "Karburant"\n• "Urgjenca"`,
      bizneset: [],
    };
  }

  // 2. Urgjenca — përgjigje prioritare
  if (FJALE_URGJENCE.some((f) => t.includes(f))) {
    const biznesiUrgjence = bizneset.find((b) => normalizo(b.kategoria).includes('emergjenc'));
    return {
      tekst: `🚨 NUMRA TË URGJENCËS:\n• Policia: 192\n• Zjarrfikësit: 193\n• Ambulanca: 194\n• Mbrojtja Civile: 112\n\n${userLocation ? `📍 Lokacioni juaj: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Shtyp butonin SOS në ekranin "Urgjenca" për thirrje me dërgim GPS.'}`,
      bizneset: biznesiUrgjence ? [biznesiUrgjence] : [],
    };
  }

  // 3. TRIP PLANNING — "planifiko një trip 2-ditor" (spec AI4, T3)
  if (FJALE_TRIP.some((f) => t.includes(f))) {
    const numri = (t.match(/(\d+)\s*dite/) || t.match(/dite[^(0-9)]*?(\d+)/) || [null, 2])[1];
    const ditet = Math.min(7, Math.max(1, Number(numri) || 2));
    const qytetiTePergjigjes = [...new Set(bizneset.map((b) => normalizo(b.qyteti)))].find((q) => q && t.includes(q));
    const itinerari = gjeneroItinerarin({
      ditet,
      qytetetZgjedhura: qytetiTePergjigjes ? [qytetiTePergjigjes.charAt(0).toUpperCase() + qytetiTePergjigjes.slice(1)] : [],
      bizneset,
      attraksionet,
    });
    const tekstiItinerari = itinerari
      .map((d) => `📅 Dita ${d.dita} — ${d.qyteti}\n   📍 ${(d.pikat || []).join(', ')}\n   🛏️ ${d.hotel}\n   🍽️ ${d.restorant}`)
      .join('\n\n');
    return {
      tekst: `✨ Ja itinerari juaj ${ditet}-ditor në Kosovë (të dhëna reale nga MyKosova):\n\n${tekstiItinerari}\n\nHapni "Trip 🏔️" për ta ruajtur ose përshtatur.`,
      bizneset: [],
    };
  }

  // 4. "AFËR MEJE" — rendit sipas distancës (spec AI3, U8)
  if (FJALE_AFER.some((f) => t.includes(f))) {
    if (!userLocation) {
      return { tekst: '📍 S\u2019kam marrë pozicionin tuaj (GPS). Aktivojeni lokacionin në shfletues dhe provoni përsëri.', bizneset: [] };
    }
    const teAfertat = bizneset
      .map((b) => ({ b, d: b.lat && b.lng ? distancaKm(userLocation.lat, userLocation.lng, Number(b.lat), Number(b.lng)) : null }))
      .filter((x) => x.d != null)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
    if (teAfertat.length === 0) {
      return { tekst: 'S\u2019kam biznesë me GPS mjaftues për ta renditur afërsinë. Provo një kërkim me qytet.', bizneset: [] };
    }
    const teksti = teAfertat
      .map((x, i) => `${i + 1}. ${x.b.emri} — ${x.d < 1 ? Math.round(x.d * 1000) + ' m' : x.d.toFixed(1) + ' km'}`)
      .join('\n');
    return { tekst: `📍 Më afër te ju (nga ${userLocation.lat.toFixed(3)}, ${userLocation.lng.toFixed(3)}):\n${teksti}`, bizneset: teAfertat.map((x) => x.b) };
  }

  // Kërkim bazë: fjalë kyçe (me sinonime) + qytetet e përmendura
  const kategoriteTePergjigjes = gjenKategorite(t);
  const fjaleTePyetjes = ndërtonFjaleTeksti(t);
  const qytetetNeTekst = [...new Set(bizneset.map((b) => normalizo(b.qyteti)))]
    .filter((q) => q && t.includes(q));

  let rezultatet = bizneset
    .map((b) => ({ b, pike: pikëzo(b, fjaleTePyetjes, qytetetNeTekst, kategoriteTePergjigjes) }))
    .filter((x) => x.pike > 0)
    .sort((a, b) => b.pike - a.pike || Number(b.b.vleresimi || 0) - Number(a.b.vleresimi || 0));

  // 3. Ofertat
  if (FJALE_OFERTASH.some((f) => t.includes(f))) {
    const meOfert = bizneset.filter((b) => b.oferta);
    return {
      tekst: `🎁 Ja ofertat dhe zbritjet aktuale që kam të regjistruara (${meOfert.length}):`,
      bizneset: meOfert.length ? meOfert : [],
    };
  }

  // 4. Top vlerësimet — nëse u kërkuar një kategori, merr top-in e ASAJ kategorie
  if (FJALE_TOP.some((f) => t.includes(f))) {
    let teRritat = [...bizneset].sort((a, b) => Number(b.vleresimi || 0) - Number(a.vleresimi || 0)).slice(0, 3);
    let shenimi = '';
    if (kategoriteTePergjigjes.length > 0) {
      const teKategorise = bizneset.filter((b) =>
        kategoriteTePergjigjes.some((kat) => kat.fjale.some((f) => normalizo(b.kategoria).includes(f)))
      );
      if (teKategorise.length > 0) {
        teRritat = teKategorise.sort((a, b) => Number(b.vleresimi || 0) - Number(a.vleresimi || 0)).slice(0, 3);
        shenimi = ` në kategorinë "${kategoriteTePergjigjes[0].emri}"`;
      } else {
        shenimi = ` (s'kam "${kategoriteTePergjigjes[0].emri}" të regjistruar — ja top-in e përgjithshëm)`;
      }
    }
    return { tekst: `⭐ Top vlerësimet${shenimi}:`, bizneset: teRitat };
  }

  // 5. Rezultatet e kërkimit
  if (rezultatet.length > 0) {
    const teShkuara = rezultatet.slice(0, 3).map((x) => x.b);
    let teksti = `Gjeta ${teShkuara.length} ${rezultatet.length > teShkuara.length ? `nga ${rezultatet.length}` : ''} për ju:`;
    // Nëse u kërkuar një kategori ku s'ka biznesë, të jetë i sinqertë
    if (kategoriteTePergjigjes.length > 0) {
      const kaNeKategorine = teShkuara.some((b) =>
        kategoriteTePergjigjes.some((kat) => kat.fjale.some((f) => normalizo(b.kategoria).includes(f)))
      );
      if (!kaNeKategorine) {
        teksti = `S'kam asnjë "${kategoriteTePergjigjes[0].emri}" të regjistruar, por ja vendet më të afërta me kërkimin tuaj:`;
      }
    }
    return { tekst: teksti, bizneset: teShkuara };
  }

  // 6. Asnjë rezultat — orientim
  const qytetex = [...new Set(bizneset.map((b) => b.qyteti))].filter(Boolean).slice(0, 5).join(', ');
  const kategorix = [...new Set(bizneset.map((b) => b.kategoria))].filter(Boolean).slice(0, 5).join(', ');
  return {
    tekst: `🤔 S'u gjet asgjë për "${teksti}" në regjistrin tim.\n\n📌 Kam ${bizneset.length} vende në bazë të dhënash:\n• Kategoritë: ${kategorix || '—'}\n• Qytetet: ${qytetex || '—'}\n\nProvo p.sh.: "hotel", "karburant në Suharekë", "rugova", "ofertat"`,
    bizneset: [],
  };
}

function Asistenti() {
  const { darkMode, userLocation, setBiznesiIzgjedhur, gjuha } = useContext(AppContext);
  const { bizneset } = useBizneset();
  const { lista: attraksionet } = useAttraksioneve();
  const [dëgjimi, setDëgjimi] = useState(false);
  const [mesazhet, setMesazhet] = useState([
    {
      id: 1,
      tekst: 'Përshëndetje! 🇽 Unë jam asistenti funksional i MyKosova.\nTë përgjigjem mbi të dhënat reale: bizneset, ofertat, turizmin dhe urgjencat.\nMë shkruaj p.sh. "Kafene në Suharekë" ose shtyp një nga sugjerimet poshtë 👇',
      ngaAsistenti: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [dukeUFlisni, setDukeUFlisni] = useState(false);
  const mesazhetEndRef = useRef(null);
  const idCounter = useRef(2);

  // Autoscroll kur vjen një mesazh i ri
  useEffect(() => {
    mesazhetEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mesazhet, dukeUFlisni]);

  const dërgoMesazh = (tekstiDore) => {
    const tekst = (tekstiDore ?? input).trim();
    if (!tekst || dukeUFlisni) return;

    const idMesazhit = idCounter.current++;
    setMesazhet((prev) => [...prev, { id: idMesazhit, tekst, ngaAsistenti: false }]);
    setInput('');
    setDukeUFlisni(true);

    // Motori i diturive përgjigjet me të dhënat reale (pa API të jashtëm)
    setTimeout(async () => {
      try {
        const pergjigjja = await motorIPergjigjje(tekst, bizneset, userLocation, attraksionet);
        const idPergjigjjes = idCounter.current++;
        setMesazhet((prev) => [
          ...prev,
          { id: idPergjigjjes, tekst: pergjigjje.tekst, bizneset: pergjigjje.bizneset, ngaAsistenti: true },
        ]);
      } catch (e) {
        setMesazhet((prev) => [
          ...prev,
          { id: idCounter.current++, tekst: 'Ndodhi një gabim te motori. Provoni përsëri.', ngaAsistenti: true },
        ]);
      } finally {
        setDukeUFlisni(false);
      }
    }, 700);
  };

  // Sugjerime të shpejta — që përdoruesi ta shohë AI-në në veprim
  const sugjerimet = ['Kafene në Suharekë', 'Hotele', 'Ofertat', 'Rugova', 'Afër meje', 'Trip 3-ditor', 'Urgjenca'];

  // ===== AI ME ZË (spec AI10) — Web Speech API =====
  const dëgjo = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Speech recognition s\u2019mbështetet te ky browser. Provo Chrome.');
      return;
    }
    const sr = new SR();
    sr.lang = gjuha === 'sq' ? 'sq-AL' : gjuha === 'en' ? 'en-US' : gjuha === 'fr' ? 'fr-FR' : gjuha === 'de' ? 'de-DE' : 'it-IT';
    sr.interimResults = false;
    sr.maxAlternatives = 1;
    sr.onresult = (e) => {
      setInput(e.results[0][0].transcript);
      setDëgjimi(false);
    };
    sr.onerror = () => setDëgjimi(false);
    sr.onend = () => setDëgjimi(false);
    sr.start();
    setDëgjimi(true);
  };

  // Ngjyrat sipas temës Light/Dark
  const sfondiChat = darkMode ? '#111827' : '#f9fafb';
  const kutiaMesazhitAI = darkMode ? '#1f2937' : '#ffffff';
  const tekstiAI = darkMode ? '#f3f4f6' : '#1f2937';
  const kornizaChat = darkMode ? '#374151' : '#e5e7eb';

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '10px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ backgroundColor: sfondiChat, border: `1px solid ${kornizaChat}`, borderRadius: '24px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', height: '550px', overflow: 'hidden' }}>

        {/* Headeri i Asistentit */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${kornizaChat}`, backgroundColor: darkMode ? '#1f2937' : '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              🤖
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827' }}>AI Asistenti</h3>
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>● Online — {bizneset.length} vende në bazë</span>
            </div>
          </div>
          {/* Sugjerimet e shpejta */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
            {sugjerimet.map((s) => (
              <button
                key={s}
                onClick={() => dërgoMesazh(s)}
                style={{ padding: '5px 10px', borderRadius: '14px', border: `1px solid ${kornizaChat}`, backgroundColor: darkMode ? '#111827' : '#eff6ff', color: darkMode ? '#93c5fd' : '#1d4ed8', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Zona e Mesazheve */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mesazhet.map((m) => (
            <div key={m.id} style={{ display: 'flex', flexDirection: m.ngaAsistenti ? 'flex-start' : 'flex-end' }}>
              <div style={{ maxWidth: '85%' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: m.ngaAsistenti ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                    backgroundColor: m.ngaAsistenti ? kutiaMesazhitAI : '#3b82f6',
                    color: m.ngaAsistenti ? tekstiAI : '#ffffff',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-line',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    border: m.ngaAsistenti ? `1px solid ${kornizaChat}` : 'none',
                  }}
                >
                  {m.tekst}
                </div>

                {/* Kartelat e bizneseve brenda përgjigjes — me Navigo */}
                {m.bizneset && m.bizneset.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    {m.bizneset.map((b) => (
                      <div key={b.id} style={{ backgroundColor: kutiaMesazhitAI, border: `1px solid ${kornizaChat}`, borderRadius: '14px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <div>
                          <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#3b82f6' }}>{b.kategoria || 'Biznes'}</span>
                          <h4 style={{ margin: '2px 0', fontSize: '14px', fontWeight: '700', color: tekstiAI }}>{b.emri}</h4>
                          <p style={{ margin: 0, fontSize: '12px', color: '#8e8e93' }}>
                            📍 {b.qyteti}
                            {b.vleresimi ? ` · ⭐ ${Number(b.vleresimi).toFixed(1)}` : ''}
                          </p>
                          {b.oferta ? <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>{b.oferta}</p> : null}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button
                            onClick={() => window.open(merrMapsUrl(b), '_blank')}
                            style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            Navigo 🧭
                          </button>
                          <button
                            onClick={() => setBiznesiIzgjedhur(b)}
                            style={{ backgroundColor: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            Profili →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {dukeUFlisni && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '12px 16px', borderRadius: '18px', backgroundColor: kutiaMesazhitAI, color: '#9ca3af', fontSize: '14px', fontStyle: 'italic', border: `1px solid ${kornizaChat}` }}>
                Asistenti po analizon bazën e dhënash...
              </div>
            </div>
          )}
          <div ref={mesazhetEndRef} />
        </div>

        {/* Forma e Inputit për shkrim */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            dërgoMesazh();
          }}
          style={{ padding: '16px', borderTop: `1px solid ${kornizaChat}`, backgroundColor: darkMode ? '#1f2937' : '#ffffff' }}
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder={dëgjimi ? '🎧 Po dëgjoj...' : 'Pyet me tekst ose me zë (🎤) ...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '14px', border: `1px solid ${kornizaChat}`, fontSize: '15px', outline: 'none', backgroundColor: darkMode ? '#111827' : '#f9fafb', color: darkMode ? '#ffffff' : '#000000', boxSizing: 'border-box' }}
            />
            <button type="button" onClick={dëgjo} title="Pyet me zë"
              style={{ width: '48px', borderRadius: '14px', border: 'none', backgroundColor: dëgjimi ? '#dc2626' : darkMode ? '#374151' : '#e5e7eb', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>
              {dëgjimi ? '⏹️' : '🎤'}
            </button>
            <button type="submit" style={{ backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', padding: '0 20px', borderRadius: '14px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: '0.2s' }}>
              Dërgo
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default Asistenti;
