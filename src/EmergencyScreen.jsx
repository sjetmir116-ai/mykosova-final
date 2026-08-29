import { useContext } from 'react';
import { AppContext } from './AppContext';
import { useUrgjencave } from './useKontenti';
import theme from './theme';
import { hapLinkun } from './hapLinkun';
import { ekzekutoNgjarjen } from './analytics';

function EmergencyScreen() {
  const { darkMode, userLocation, t } = useContext(AppContext);

  // Numrat zyrtarë të urgjencës — nga Firestore (i menaxhueshëm nga admini) me fallback lokal
  const { lista: numratUrgjence } = useUrgjencave();

  const handleSOS = () => {
    ekzekutoNgjarjen('sos', { lat: userLocation?.lat, lng: userLocation?.lng });
    if (userLocation) {
      alert(
        `🚨 ALERTI SOS U AKTIVIZUA!\n\nLokacioni yt live u regjistrua:\nLatitude: ${userLocation.lat}\nLongitude: ${userLocation.lng}\n\nDuke thirrur qendrën e koordinimit...`
      );
    } else {
      alert('🚨 ALERTI SOS!\n\nDuke thirrur urgjencën 112 zyrtare...');
    }
    window.location.href = 'tel:112';
  };

  // Stilet sipas temës
  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#000000';

  const hapNgaGjuha = (pyetja) => hapLinkun(
    `https://www.google.com/maps/search/${encodeURIComponent(pyetja)}`,
    `https://www.google.com/maps?q=${encodeURIComponent(pyetja)}&output=embed`
  );

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', paddingBottom: '100px', fontFamily: 'sans-serif', color: stiliTekstit }}>

      {/* 1. BUTONI GJIGANT SOS INTERAKTIV */}
      <div style={{ textAlign: 'center', marginBottom: '35px', marginTop: '10px' }}>
        <button
          onClick={handleSOS}
          style={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            backgroundColor: theme.colors.red,
            color: '#fff',
            border: '8px solid #fca5a5',
            fontSize: '24px',
            fontWeight: '900',
            cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4)',
            transition: 'transform 0.1s ease',
            outline: 'none',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          SOS
        </button>
        <p style={{ color: '#ef4444', fontSize: '14px', fontWeight: '700', marginTop: '12px' }}>
          {t('sosMesazhi')}
        </p>
      </div>

      {/* 2. LISTA E NUMRAVE KOMBËTARË TË URGJENCËS */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '15px' }}>{t('numratUrgjence')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {numratUrgjence.map((item, index) => (
            <a
              key={index}
              href={`tel:${item.numri}`}
              style={{
                textDecoration: 'none',
                backgroundColor: stiliKartelës,
                padding: '16px',
                borderRadius: theme.borderRadius.pill,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: `1px solid ${korniza}`,
                boxShadow: '0 4px 10px rgba(0,0,0,0.01)',
                color: stiliTekstit,
              }}
            >
              <div style={{ fontSize: '28px', padding: '8px', borderRadius: theme.borderRadius.button, backgroundColor: `${item.ngjyra}15` }}>
                {item.ikona}
              </div>
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '700' }}>{item.emri}</h4>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: item.ngjyra }}>{item.numri}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* 3. LOKACIONET MË TË AFËRTA TË SHPËNDARJES MJEKËSORE */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '15px' }}>{t('ndihmaMjekesore')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              backgroundColor: stiliKartelës,
              padding: '16px',
              borderRadius: theme.borderRadius.pill,
              border: `1px solid ${korniza}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700' }}>{t('spitali')}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#8e8e93' }}>📍 Gjetja automatike me GPS sipas rrezes</p>
            </div>
            <button
              onClick={() => hapNgaGjuha('Spitali Rajonal Prishtinë QKMF')}
              style={{ backgroundColor: theme.colors.blue, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: theme.borderRadius.button, fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {t('navigo')}
            </button>
          </div>

          <div
            style={{
              backgroundColor: stiliKartelës,
              padding: '16px',
              borderRadius: theme.borderRadius.pill,
              border: `1px solid ${korniza}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700' }}>{t('farmacia24')}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#8e8e93' }}>💊 Gjeni farmacinë më të afërt me vakt</p>
            </div>
            <button
              onClick={() => hapNgaGjuha('farmacia kujdestare 24 orë')}
              style={{ backgroundColor: theme.colors.blue, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: theme.borderRadius.button, fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {t('navigo')}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default EmergencyScreen;
