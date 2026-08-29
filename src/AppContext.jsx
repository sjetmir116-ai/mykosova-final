import { createContext, useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { merrProfilin } from './auth';

// Kjo linjë e saktë duhet detyrimisht të jetë këtu!
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [gjuha, setGjuha] = useState('sq'); // sq, en, fr, de, it
  const [vleraKerkimi, setVleraKerkimi] = useState(''); // Kërkim global: e lidh Ballinën me Kërkimin Inteligjent
  const [userLocation, setUserLocation] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [përdoruesi, setPërdoruesi] = useState(null); // Profili i përdoruesit të loguar (ose null)
  const [biznesiIzgjedhur, setBiznesiIzgjedhur] = useState(null); // Biznesi i hapur te Profili (U18) — cdo ekran mund ta hapë
  const [afërMeje, setAfërMeje] = useState(false); // "Afër meje" (Faza 3) — renditja sipas distancës GPS

  // Sync i përdoruesit me Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const profil = (await merrProfilin(u.uid)) || {
          uid: u.uid, email: u.email, emri: u.email.split('@')[0], roli: 'user',
        };
        setPërdoruesi(profil);
      } else {
        setPërdoruesi(null);
      }
    });
    return () => unsub();
  }, []);

  const perkthimet = {
    sq: {
      kerko: "Kërko biznes, qytet, spitale, hotele...",
      mireseven: "Mirë se vini në My Kosova",
      madeInKosovo: "Made in Kosovo 🇽🇰",
      rrethMeje: "Afër meje",
      kategorite: "Kategoritë",
      lista: "Lista",
      urgjenca: "Urgjenca 🚨",
      asistenti: "AI Asistenti",
      loadingGps: "Duke kërkuar lokacionin tuaj...",
      ballina: "Ballina",
      sosMesazhi: "Shtyp në rast rreziku për thirrje direkte me dërgim GPS!",
      numratUrgjence: "Numrat e Urgjencës 🇽🇰",
      ndihmaMjekesore: "Ndihma Mjekësore Më e Afërt 🏥",
      spitali: "Spitali Rajonal / QKMF",
      farmacia24: "Farmacia Kujdestare 24/7",
      navigo: "Navigo 🗺️",
    },
    en: {
      kerko: "Search businesses, cities, hospitals, hotels...",
      mireseven: "Welcome to My Kosova",
      madeInKosovo: "Made in Kosovo 🇽🇰",
      rrethMeje: "Nearby places",
      kategorite: "Categories",
      lista: "List",
      urgjenca: "Emergency 🚨",
      asistenti: "AI Assistant",
      loadingGps: "Fetching your location...",
      ballina: "Home",
      sosMesazhi: "Press in case of danger for a direct call with GPS sharing!",
      numratUrgjence: "Emergency Numbers 🇽🇰",
      ndihmaMjekesore: "Nearest Medical Help 🏥",
      spitali: "Regional Hospital / QKMF",
      farmacia24: "24/7 Duty Pharmacy",
      navigo: "Navigate 🗺️",
    },
    fr: {
      kerko: "Rechercher des entreprises, des villes...",
      mireseven: "Bienvenue à My Kosova",
      madeInKosovo: "Made in Kosovo 🇽🇰",
      rrethMeje: "À proximité",
      kategorite: "Catégories",
      lista: "Liste",
      urgjenca: "Urgence 🚨",
      asistenti: "Assistant IA",
      loadingGps: "Obtention de votre emplacement...",
      ballina: "Accueil",
      sosMesazhi: "Appuyez en cas de danger pour un appel direct avec partage GPS !",
      numratUrgjence: "Numéros d'urgence 🇽🇰",
      ndihmaMjekesore: "Aide médicale la plus proche 🏥",
      spitali: "Hôpital régional / QKMF",
      farmacia24: "Pharmacie de garde 24/7",
      navigo: "Naviguer 🗺️",
    },
    de: {
      kerko: "Suchen Sie nach Unternehmen, Städten...",
      mireseven: "Willkommen bei My Kosova",
      madeInKosovo: "Made in Kosovo 🇽🇰",
      rrethMeje: "In der Nähe",
      kategorite: "Kategorien",
      lista: "Liste",
      urgjenca: "Notfall 🚨",
      asistenti: "KI Assistent",
      loadingGps: "Standort abrufen...",
      ballina: "Startseite",
      sosMesazhi: "Im Gefahrenfall drücken für einen Direktanruf mit GPS-Teilen!",
      numratUrgjence: "Notfallnummern 🇽🇰",
      ndihmaMjekesore: "Nächste medizinische Hilfe 🏥",
      spitali: "Regionalkrankenhaus / QKMF",
      farmacia24: "Apotheke im Bereitschaftsdienst 24/7",
      navigo: "Navigieren 🗺️",
    },
    it: {
      kerko: "Cerca attività, città, hotel...",
      mireseven: "Benvenuto in My Kosova",
      madeInKosovo: "Made in Kosovo 🇽🇰",
      rrethMeje: "Nelle vicinanze",
      kategorite: "Categorie",
      lista: "Elenco",
      urgjenca: "Emergenza 🚨",
      asistenti: "Assistente IA",
      loadingGps: "Recupero della tua posizione...",
      ballina: "Inizio",
      sosMesazhi: "Premi in caso di pericolo per una chiamata diretta con condivisione GPS!",
      numratUrgjence: "Numeri di emergenza 🇽🇰",
      ndihmaMjekesore: "Aiuto medico più vicino 🏥",
      spitali: "Ospedale regionale / QKMF",
      farmacia24: "Farmacia di guardia 24/7",
      navigo: "Naviga 🗺️",
    }
  };

  // ===== GPS me FALLBACK (Prishtina qendër) + riprovim =====
  // Nëse browser-i/iframe-i refuzon lokacionin, app-i nuk shkatërrohet:
  // përdor qendrën e Prishtinës si bazë (distanctat/afërsia vazhdojnë të punojnë)
  const BAZA_DEFAULT = { lat: 42.6627, lng: 21.1655 };

  const gabimiGPS = (error) => {
    switch (error?.code) {
      case 1: return 'GPS u refuzua nga browser-i — duke përdorur Prishtinën si bazë. Lejo lokacionin dhe shtyp "Sërish".';
      case 2: return 'Pozicioni nuk u gjeta — duke përdorur Prishtinën si bazë.';
      case 3: return 'GPS s\u2019u përgjigj në kohë — duke përdorur Prishtinën si bazë.';
      default: return 'GPS gabim — duke përdorur Prishtinën si bazë.';
    }
  };

  const kërkoGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation nuk mbështetet te ky browser — bazë: Prishtina.');
      setUserLocation({ ...BAZA_DEFAULT, fallback: true });
      return;
    }
    setGpsError(null);
    // Derisa po kërkoj: s'ka pozicion → UI tregon "po kërkoj" (JO fallback)
    setUserLocation(null);
    navigator.geolocation.getCurrentPosition(
      (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => {
        // Fallback vetëm si rezervë — gjithmonë i shënuar qartë si "demo"
        setUserLocation({ ...BAZA_DEFAULT, fallback: true });
        setGpsError(gabimiGPS(error));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    kërkoGPS();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = (fusha) => {
    return perkthimet[gjuha][fusha] || fusha;
  };

  // true vetëm kur GPS-i i dhënoi browser-i pozicionin REAL të përdoruesit
  const esLokacioniReal = !!(userLocation && !userLocation.fallback);

  return (
    <AppContext.Provider value={{ darkMode, setDarkMode, gjuha, setGjuha, vleraKerkimi, setVleraKerkimi, userLocation, gpsError, riprovoGPS: kërkoGPS, përdoruesi, setPërdoruesi, biznesiIzgjedhur, setBiznesiIzgjedhur, afërMeje, setAfërMeje, esLokacioniReal, t }}>
      {children}
    </AppContext.Provider>
  );
};
