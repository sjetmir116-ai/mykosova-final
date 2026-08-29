import { useEffect, useState } from 'react';

// ===== MOTI (spec T7, U31) =====
// Open-Meteo: API falas, pa key, pa kufizime për përdorim personal
// Fetch-ohet nga BROWSER-I I PËRDORUESIT (jo nga sandbox-i)

// Koordinatat e qyteteve kryesore
export const QYTETE_KOORDINATA = {
  'Prishtinë': { lat: 42.6627, lng: 21.1655 },
  'Prizren': { lat: 42.2574, lng: 20.7821 },
  'Pejë': { lat: 42.5806, lng: 20.5464 },
  'Gjakovë': { lat: 42.3309, lng: 20.8581 },
  'Ferizaj': { lat: 42.5208, lng: 20.9278 },
  'Gjilan': { lat: 42.4294, lng: 21.4157 },
  'Mitrovicë': { lat: 42.6803, lng: 20.9441 },
  'Suharekë': { lat: 42.3590, lng: 20.8304 },
  'Vushtrri': { lat: 42.7167, lng: 20.9333 },
  'Lipjan': { lat: 42.5069, lng: 21.1583 },
  'Rugova': { lat: 42.5833, lng: 20.5544 },
  'Theth': { lat: 42.5500, lng: 20.1500 },
};

// Funksioni i thjeshtë (jo hook) — përdoret edhe nga AI-ja
export async function merrMoti({ lat, lng, qyteti } = {}) {
  const koord = qyteti ? QYTETE_KOORDINATA[qyteti] : null;
  const latF = lat ?? koord?.lat;
  const lngF = lng ?? koord?.lng;
  if (latF == null || lngF == null) return null;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latF}&longitude=${lngF}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max&forecast_days=3&timezone=auto`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('API ' + r.status);
  const d = await r.json();
  const current = d.current || {};
  const daily = d.daily || {};
  const kod = current.weather_code;
  return {
    temp: Math.round(current.temperature_2m),
    kod,
    emri: kodeMotit(kod).teksti,
    emoji: kodeMotit(kod).emoji,
    ditet: (daily.time || []).map((g, i) => ({
      data: g,
      emoji: kodeMotit(daily.weather_code?.[i]).emoji,
      maks: Math.round(daily.temperature_2m_max?.[i]),
    })),
  };
}

// Kodat WMO → emoji + tekst shqipe
export function kodeMotit(kode) {
  if (kode === 0) return { emoji: '☀️', teksti: 'Qartë' };
  if (kode === 1 || kode === 2) return { emoji: '🌤️', teksti: 'Përgjysmë me diell' };
  if (kode === 3) return { emoji: '☁️', teksti: 'Mbuluar' };
  if (kode === 45 || kode === 48) return { emoji: '🌫️', teksti: 'Mjegull' };
  if (kode >= 51 && kode <= 57) return { emoji: '🌦️', teksti: 'Sprucë' };
  if (kode >= 61 && kode <= 67) return { emoji: '🌧️', teksti: 'Shi' };
  if (kode >= 71 && kode <= 77) return { emoji: '🌨️', teksti: 'Borë' };
  if (kode >= 80 && kode <= 82) return { emoji: '🌧️', teksti: 'Shirë' };
  if (kode >= 85 && kode <= 86) return { emoji: '🌨️', teksti: 'Borë' };
  if (kode >= 95) return { emoji: '⛈️', teksti: 'Tufiane' };
  return { emoji: '🌡️', teksti: '—' };
}

// Vlerësim i thjeshtë "a është moti i mirë për udhëtim?"
export function esMotIMire(kode, temp) {
  if (kode >= 95) return { mire: false, teksti: 'Tufiane — s\u2019rekomandohet udhëtim malor' };
  if (kode >= 51 && kode <= 82) return { mire: false, teksti: 'Reshje — merrni çrrambë' };
  if (temp != null && temp < 0) return { mire: false, teksti: 'Poshtë zero — bora mund të ndërprerë rrugët' };
  return { mire: true, teksti: 'Mot i mirë për udhëtim ✅' };
}

// Hook: moti për një pozicion (lat/lng) ose qytet
export function useMoti({ lat, lng, qyteti } = {}) {
  const [moti, setMoti] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gabim, setGabim] = useState(null);

  useEffect(() => {
    let anulo = false;
    const koord = qyteti ? QYTETE_KOORDINATA[qyteti] : null;
    const latF = lat ?? koord?.lat;
    const lngF = lng ?? koord?.lng;
    if (latF == null || lngF == null) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latF}&longitude=${lngF}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=auto`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('API ' + r.status);
        return r.json();
      })
      .then((d) => {
        if (anulo) return;
        const current = d.current || {};
        const daily = d.daily || {};
        setMoti({
          temp: Math.round(current.temperature_2m),
          kod: current.weather_code,
          emri: kodeMotit(current.weather_code).teksti,
          emoji: kodeMotit(current.weather_code).emoji,
          errehumiditeti: current.relative_humidity_2m,
          erri: current.wind_speed_10m,
          ditet: (daily.time || []).map((g, i) => ({
            data: g,
            kod: daily.weather_code?.[i],
            emoji: kodeMotit(daily.weather_code?.[i]).emoji,
            maks: Math.round(daily.temperature_2m_max?.[i]),
            min: Math.round(daily.temperature_2m_min?.[i]),
          })),
        });
        setLoading(false);
      })
      .catch((e) => {
        if (anulo) return;
        setGabim(e.message);
        setLoading(false);
      });

    return () => { anulo = true; };
  }, [lat, lng, qyteti]);

  return { moti, loading, gabim };
}
