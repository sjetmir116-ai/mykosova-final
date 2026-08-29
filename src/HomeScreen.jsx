import { useContext, useState } from 'react';
import { AppContext } from './AppContext';
import theme from './theme';
import { useMoti, esMotIMire } from './moti';
import { useBizneset } from './useBizneset';
import { meDistanca, formatoDistancm } from './distanca';
import { gjejFotoAutomatikisht } from './biznesFoto';

function HomeScreen({ setEkrani }) {
  const { darkMode, gjuha, setGjuha, userLocation, gpsError, riprovoGPS, t, vleraKerkimi, setVleraKerkimi, setBiznesiIzgjedhur, afërMeje, setAfërMeje, esLokacioniReal } = useContext(AppContext);
  const [tekstiKerkimit, setTekstiKerkimit] = useState(vleraKerkimi);
  const { moti, loading: motiLoading, gabim: motiGabim } = useMoti(userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : {});
  const { bizneset } = useBizneset();

  // AFËR MEJE (Faza 3): 4 bizneset më të afërta nga GPS-i i përdoruesit (Haversine)
  const teAferT = userLocation
    ? bizneset
        .map((b) => meDistanca(b, userLocation))
        .filter((b) => b.distanca != null)
        .sort((a, b) => a.distanca - b.distanca)
        .slice(0, 4)
    : [];

  const hapAfërMeje = () => {
    setAfërMeje(true);
    setEkrani('lista');
  };

  // Kategoritë smart — kliko çdo kartelë për ta kërkuar atë kategori
  const kategoriteSmart = [
    { emri: 'Hotel', ikona: '🏨' },
    { emri: 'Restaurant', ikona: '🍔' },
    { emri: 'Hospital', ikona: '🏥' },
    { emri: 'Pharmacy', ikona: '💊' },
    { emri: 'Coffee', ikona: '☕' },
    { emri: 'Gas station', ikona: '⛽' },
    { emri: 'Electric charger', ikona: '⚡' },
    { emri: 'Shopping mall', ikona: '🛍️' },
    { emri: 'Castle', ikona: '🏰' },
    { emri: 'Museum', ikona: '🏛️' },
  ];

  // Produktet e seksionit unik "Made in Kosovo" 🇽🇰
  const produkteVendore = [
    { id: 1, emri: 'Verë nga Rahoveci', lloji: 'Artizanat & Përpunim', foto: '🍷' },
    { id: 2, emri: 'Plisa Tradicionalë', lloji: 'Kulturë', foto: '👑' },
    { id: 3, emri: 'Ajvar i Krushës', lloji: 'Ushqim Vendor', foto: '🌶️' },
    { id: 4, emri: 'Filigran nga Prizreni', lloji: 'Argjendtari', foto: '💍' },
  ];

  // Dërgon kërkimin në ekranin "Kërkimi Inteligjent" përmes gjendjes globale
  const kërko = (teksti) => {
    const vlera = (teksti ?? tekstiKerkimit).trim();
    if (!vlera) return;
    setVleraKerkimi(vlera);
    setEkrani('kerko');
  };

  // Stilet sipas temës
  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#f2f2f7';
  const stiliTekstit = darkMode ? '#ffffff' : '#000000';

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', paddingBottom: '100px', color: stiliTekstit }}>

      {/* 1. SEKSIONI I ZGJEDHJES SË 5 GJUHËVE */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['sq', 'en', 'fr', 'de', 'it'].map((lang) => (
          <button
            key={lang}
            onClick={() => setGjuha(lang)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: gjuha === lang ? theme.colors.blue : darkMode ? '#262626' : '#e5e5ea',
              color: gjuha === lang ? '#fff' : darkMode ? '#a1a1aa' : '#1c1c1e',
              fontWeight: '700',
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontSize: '12px',
            }}
          >
            {lang}
          </button>
        ))}
      </div>

      {/* 2. KREU DHE LOKACIONI GPS */}
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 8px 0' }}>{t('mireseven')} 👋</h2>

        {/* Paneli i GPS-it Realtime me fallback + riprovim */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: theme.borderRadius.pill,
            backgroundColor: darkMode ? '#1c1c1e' : '#e3f2fd',
            fontSize: '13px',
            fontWeight: '600',
            color: darkMode ? theme.colors.primary : '#007bff',
            border: darkMode ? `1px solid ${korniza}` : 'none',
          }}
        >
          📍 {userLocation
            ? (userLocation.fallback
              ? 'GPS i REFUZUAR — bazë demo: PRISHTINA (jo pozicioni juaj)'
              : `${t('rrethMeje')}: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`)
            : t('loadingGps')}
          {gpsError && (
            <button
              onClick={() => riprovoGPS()}
              style={{ padding: '3px 10px', borderRadius: '12px', border: '1px solid currentColor', backgroundColor: 'transparent', color: 'inherit', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
            >
              🔄 Sërish
            </button>
          )}
        </div>
        {gpsError && (
          <p style={{ margin: '10px auto 0 auto', maxWidth: '400px', fontSize: '12px', color: '#8e8e93', lineHeight: 1.5 }}>
            ℹ️ {gpsError}
          </p>
        )}

        {/* Widget i motit (Open-Meteo, pa key) */}
        {moti && (
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: stiliTekstit }}>
              {moti.emoji} {moti.temp}°C — {moti.emri}
            </span>
            {moti.ditet && moti.ditet.length > 0 && (
              <span style={{ fontSize: '12px', color: '#8e8e93' }}>
                {moti.ditet.map((d) => `${d.emoji}${d.maks}°`).join('  ·  ')}
              </span>
            )}
            <span style={{ fontSize: '12px', fontWeight: '700', color: esMotIMire(moti.kod, moti.temp).mire ? '#16a34a' : '#f59e0b' }}>
              {esMotIMire(moti.kod, moti.temp).teksti}
            </span>
          </div>
        )}
        {motiLoading && <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#8e8e93' }}>🌡️ Duke marrë motin...</p>}
        {motiGabim && <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#8e8e93' }}>Moti s\u2019u arrit (internet) — {motiGabim}</p>}
      </div>

      {/* 3. SHIRITI I KËRKIMIT SMART — i lidhur me Kërkimin Inteligjent */}
      <div style={{ marginBottom: '30px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            kërko();
          }}
        >
          <input
            placeholder={t('kerko')}
            value={tekstiKerkimit}
            onChange={(e) => setTekstiKerkimit(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 20px',
              borderRadius: theme.borderRadius.pill,
              border: 'none',
              fontSize: '16px',
              backgroundColor: stiliKartelës,
              color: stiliTekstit,
              boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.05)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </form>
      </div>

      {/* 4. AFËR MEJE (Faza 3) — butoni + 4 bizneset më të afërta */}
      <div style={{ marginBottom: '35px' }}>
        <button
          onClick={hapAfërMeje}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '15px',
            borderRadius: theme.borderRadius.pill,
            border: afërMeje ? 'none' : `1px solid ${korniza}`,
            backgroundColor: afërMeje ? theme.colors.blue : stiliKartelës,
            color: afërMeje ? '#fff' : stiliTekstit,
            fontWeight: '800',
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          📍 {t('rrethMeje')} — {userLocation?.fallback ? 'DEMO nga PRISHTINA' : esLokacioniReal ? 'sipas lokacionit tuaj real' : 'po kërkoj lokacionin...'}
        </button>

        {/* ALERT I QARTË kur GPS-i është refuzuar — fallback-u NUK paraqitet si lokacioni real */}
        {userLocation?.fallback && (
          <div style={{ marginTop: '10px', padding: '12px 14px', borderRadius: '12px', backgroundColor: '#fff7ed', border: '1px solid #f59e0b60', color: '#92400e', fontSize: '13px', fontWeight: '600', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span>
              ⚠️ GPS-i u refuzua nga browser-i. Distanca poshtë janë <b>DEMO nga qendra e Prishtinës</b> — <b>NUK</b> janë pozicioni juaj real.
            </span>
            <button
              onClick={() => riprovoGPS()}
              style={{ padding: '6px 14px', borderRadius: '10px', border: 'none', backgroundColor: '#f59e0b', color: '#fff', fontSize: '12px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              🔄 Lejo lokacionin
            </button>
          </div>
        )}

        {teAferT.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: userLocation.fallback ? '#f59e0b' : '#8e8e93', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {userLocation.fallback ? 'Të afërt nga PRISHTINA (demo — jo pozicioni juaj)' : 'Të afërt me ju tani'}
            </div>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
              {teAferT.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setBiznesiIzgjedhur(b)}
                  style={{
                    minWidth: '130px',
                    maxWidth: '130px',
                    backgroundColor: stiliKartelës,
                    borderRadius: theme.borderRadius.pill,
                    overflow: 'hidden',
                    border: `1px solid ${korniza}`,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <img
                    src={b.foto && String(b.foto).startsWith('http') ? b.foto : gjejFotoAutomatikisht(b.emri, b.kategoria)}
                    alt={b.emri}
                    style={{ width: '100%', height: '64px', objectFit: 'cover', display: 'block' }}
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: stiliTekstit, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.emri}</div>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: theme.colors.blue }}>📍 {formatoDistancm(b.distanca)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. SEKSIONI UNIK: MADE IN KOSOVO 🇽🇰 */}
      <div style={{ marginBottom: '35px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '15px', color: '#ef4444' }}>{t('madeInKosovo')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {produkteVendore.map((prod) => (
            <div
              key={prod.id}
              style={{
                backgroundColor: stiliKartelës,
                padding: '16px',
                borderRadius: theme.borderRadius.pill,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: `1px solid ${korniza}`,
              }}
            >
              <div style={{ fontSize: '32px' }}>{prod.foto}</div>
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '700' }}>{prod.emri}</h4>
                <p style={{ margin: 0, fontSize: '11px', color: '#8e8e93', fontWeight: '500' }}>{prod.lloji}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. KATEGORITË SMART — kliko për të kërkuar */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '15px' }}>{t('kategorite')}</h3>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
          {kategoriteSmart.map((kat, index) => (
            <div
              key={index}
              onClick={() => kërko(kat.emri)}
              style={{
                minWidth: '90px',
                backgroundColor: stiliKartelës,
                padding: '14px',
                borderRadius: theme.borderRadius.pill,
                textAlign: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                border: `1px solid ${korniza}`,
                transition: 'transform 0.1s',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <div style={{ fontSize: '26px', marginBottom: '6px' }}>{kat.ikona}</div>
              <div style={{ fontSize: '12px', fontWeight: '700' }}>{kat.emri}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default HomeScreen;
