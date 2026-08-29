// BAZA LOKALE FILLESTARE — 7 vende reale
// lat/lng: koordinata afate (qendra e zoneve të dhëna te adresa) — e shtuar për "Afër meje" (Faza 3)
export const biznesetFillestare = [
  { 
    id: 1, emri: "Hotel Restorant Aulona", kategoria: "Hotele", qyteti: "Suharekë", adresa: "Magjistralja Prishtinë - Prizren, Suharekë", lat: 42.5719, lng: 20.7801, vleresimi: 4.8, 
    pershkrimi: "Një nga hotelet dhe sallat e dasmave më luksoze dhe më të njohura në rajonin e Therandës.",
    oferta: "🔥 Diaspora Special: 10% zbritje në akomodim për muajt Korrik dhe Gusht!",
    komentet: [{ autor: "Fidan (Zvicër)", tekst: "Mikpritje e shkëlqyer, dhoma super të pastra!", yje: 5 }]
  },
  { 
    id: 2, emri: "Hotel Solid", kategoria: "Hotele", qyteti: "Suharekë", adresa: "Rruga e Prizrenit, Suharekë", lat: 42.5689, lng: 20.7921, vleresimi: 4.7, 
    pershkrimi: "Hotel modern me shërbim premium, i njohur për komoditetin dhe pozicionin e përsosur strategjik.",
    oferta: "📉 Çmime speciale për rezervimet familjare gjatë sezonit veror.",
    komentet: [{ autor: "Valoni", tekst: "Shërbimi i hotelit është në nivel evropian.", yje: 5 }]
  },
  { 
    id: 3, emri: "Restorant Imperial", kategoria: "Restorante", qyteti: "Suharekë", adresa: "Zona Industriale, Suharekë", lat: 42.5589, lng: 20.7960, vleresimi: 4.9, 
    pershkrimi: "Eksperiencë unike kulinarie me ushqime tradicionale dhe moderne në një ambient madhështor.",
    oferta: "🍕 Porosit çdo pjatë kryesore dhe merre një ëmbëlsirë shtëpie FALAS!",
    komentet: [{ autor: "Iliri", tekst: "Ushqimi më i shijshëm në qytet, pa dyshim.", yje: 5 }]
  },
  { 
    id: 4, emri: "Alpet Petrol (Suharekë)", kategoria: "Pika Karburanti", qyteti: "Suharekë", adresa: "Autostrada Ibrahim Rugova, Dalja Suharekë", lat: 42.5794, lng: 20.7985, vleresimi: 4.8, 
    pershkrimi: "Pikë karburanti 24/7 me derivate të certifikuara europiane, market të pasur dhe kafene moderne.",
    oferta: "☕ Kafja e mëngjesit FALAS për çdo furnizim mbi 50 litra karburant!",
    komentet: [{ autor: "Mergimtari", tekst: "Gjithmonë furnizohem këtu kur vij nga Gjermania. Shumë korrektë.", yje: 5 }]
  },
  { 
    id: 5, emri: "Kastrati Petrol", kategoria: "Pika Karburanti", qyteti: "Suharekë", adresa: "Rruga Tranziti, Suharekë", lat: 42.5712, lng: 20.7889, vleresimi: 4.6, 
    pershkrimi: "Furnizim i shpejtë dhe cilësor me naftë dhe benzinë, i hapur pa ndërprerje në pikën kyçe të qytetit.",
    oferta: "🧼 Larje e jashtme e makinës FALAS për çdo furnizim të plotë (Full Tank).",
    komentet: [{ autor: "Dritoni", tekst: "Shërbim i shpejtë dhe stafi shumë punëtor.", yje: 4 }]
  },
  { 
    id: 6, emri: "Gryka e Rugovës & Alpet Shqiptare", kategoria: "Turizëm", qyteti: "Pejë", adresa: "Rugovë, Pejë", lat: 42.6558, lng: 20.4342, vleresimi: 5.0, 
    pershkrimi: "Destinacioni numër një në Kosovë për turizëm malor, shtigje për ecje, dhe aventura natyrore.",
    oferta: "🏕️ Guida Turistike falas për grupet e diasporës çdo të shtunë!",
    komentet: [{ autor: "Arbni", tekst: "Natyra më e bukur në mbarë Ballkanin!", yje: 5 }]
  },
  { 
    id: 7, emri: "Policia e Kosovës (Stacioni Suharekë)", kategoria: "Emergjenca", qyteti: "Suharekë", adresa: "Rruga Brigada 123, Suharekë", lat: 42.5695, lng: 20.7865, vleresimi: 5.0, 
    pershkrimi: "Numri i shpejtë emergjent për ndihmë, siguri dhe raportim të rasteve: 192.",
    oferta: "🚓 Hapur 24/7. Siguria juaj është prioriteti ynë kombëtar.",
    komentet: [{ autor: "Sistemi", tekst: "Linja e sigurisë e integruar zyrtarisht.", yje: 5 }]
  }
];

export const kategoritëSistemit = [
  { ikona: "🏨", emri: "Hotele" }, 
  { ikona: "🍽️", emri: "Restorante" }, 
  { ikona: "⛽", emri: "Pika Karburanti" },
  { ikona: "🏕️", emri: "Turizëm" },
  { ikona: "🚑", emri: "Emergjenca" }
];
