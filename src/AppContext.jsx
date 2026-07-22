import { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [gjuha, setGjuha] = useState('sq'); // sq, en, fr, de, it
  const [userLocation, setUserLocation] = useState(null);
  const [gpsError, setGpsError] = useState(null);

  // Tekstet zyrtare për 5 gjuhët e platformës My Kosova
  const perkthimet = {
    sq: {
      kerko: "Kërko biznes, qytet, spitale, hotele...",
      mireseven: "Mirë se vini në My Kosova",
      madeInKosovo: "Made in Kosovo 🇽🇰",
      rrethMeje: "Afër meje",
      kategorite: "Kategoritë",
      urgjenca: "Urgjenca 🚨",
      asistenti: "AI Asistenti",
      loadingGps: "Duke kërkuar lokacionin tuaj..."
    },
    en: {
      kerko: "Search businesses, cities, hospitals, hotels...",
      mireseven: "Welcome to My Kosova",
      madeInKosovo: "Made in Kosovo 🇽🇰",
      rrethMeje: "Nearby places",
      kategorite: "Categories",
      urgjenca: "Emergency 🚨",
      asistenti: "AI Assistant",
      loadingGps: "Fetching your location..."
    },
    fr: {
      kerko: "Rechercher des entreprises, des villes...",
      mireseven: "Bienvenue à My Kosova",
      madeInKosovo: "Made in Kosovo 🇽🇰",
      rrethMeje: "À proximité",
      kategorite: "Catégories",
      urgjenca: "Urgence 🚨",
      asistenti: "Assistant IA",
      loadingGps: "Obtention de votre emplacement..."
    },
    de: {
      kerko: "Suchen Sie nach Unternehmen, Städten...",
      mireseven: "Willkommen bei My Kosova",
      madeInKosovo: "Made in Kosovo 🇽🇰",
      rrethMeje: "In der Nähe",
      kategorite: "Kategorien",
      urgjenca: "Notfall 🚨",
      asistenti: "KI Assistent",
      loadingGps: "Standort abrufen..."
    },
    it: {
      kerko: "Cerca attività, città, hotel...",
      mireseven: "Benvenuto in My Kosova",
      madeInKosovo: "Made in Kosovo 🇽🇰",
      rrethMeje: "Nelle vicinanze",
      kategorite: "Categorie",
      urgjenca: "Emergenza 🚨",
      asistenti: "Assistente IA",
      loadingGps: "Recupero della tua posizione..."
    }
  };

  // Kërkesa zyrtare profesionale për GPS e përshpejtuar
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        setGpsError(error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  const t = (fusha) => {
    return perkthimet[gjuha][fusha] || fusha;
  };

  return (
    <AppContext.Provider value={{ darkMode, setDarkMode, gjuha, setGjuha, userLocation, gpsError, t }}>
      {children}
    </AppContext.Provider>
  );
};
