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
  },

  // ===== BIZNESE REALE E TË NJOHURA NË TË GJITHË KOSOVËN (u shtua 29.08.2026) =====
  // Vetëm vende të qëndrueshme e publike; telefoni vetëm numrat kombëtarë (194).
  {
    id: 10, emri: "QKMF (Spitali Rajonal) Prishtinë", kategoria: "Health", qyteti: "Prishtinë", adresa: "Rruga e Qirjes, Prishtinë", lat: 42.6585, lng: 21.1470, telefoni: "194",
    pershkrimi: "Spitali rajonal kryesor i Kosovës — urgjencë 24/7, poliklinikë, laborator dhe ambulancë e shtuar (194).",
    komentet: [{ autor: "Vizitor", tekst: "Urgjenca mban 24 orë, stafi i disponueshëm.", yje: 4 }]
  },
  {
    id: 11, emri: "City Park (Qendra Tregtare)", kategoria: "Shopping", qyteti: "Prishtinë", adresa: "Rruga e Durrësit, Prishtinë", lat: 42.6557, lng: 21.1687, vleresimi: 4.5,
    pershkrimi: "Një nga qendrat tregtare më të mëdha të Kosovës — dyqane, restorante, sinema dhe parkim nën tokë.",
    komentet: [{ autor: "Vizitor", tekst: "Gjithçka në një vend — nga bleja te ngrënia.", yje: 5 }]
  },
  {
    id: 12, emri: "Kosova Mall", kategoria: "Shopping", qyteti: "Prishtinë", adresa: "Afër stacionit të trenit, Prishtinë", lat: 42.6717, lng: 21.1617, vleresimi: 4.4,
    pershkrimi: "Qendër tregtare me dyqane ndërkombëtare, supermarket dhe zonë argëtimi — afër stacionit dhe aeroportit.",
    komentet: [{ autor: "Vizitor", tekst: "Komode me qytetin, oferton shumë marka.", yje: 4 }]
  },
  {
    id: 13, emri: "Hotel Duka", kategoria: "Hotele", qyteti: "Prishtinë", adresa: "Rruga e Dibrës, Prishtinë", lat: 42.6646, lng: 21.1638, vleresimi: 4.6,
    pershkrimi: "Hotel 4-yllësh në qendër të Prishtinës — dhoma moderne, restorant dhe sallë takimesh, afër Grand Parkut.",
    komentet: [{ autor: "Vizitor", tekst: "Pozicion i shkëlqyer në qendër, mikpritje e mirë.", yje: 5 }]
  },
  {
    id: 14, emri: "Restorant 1999", kategoria: "Restorante", qyteti: "Prishtinë", adresa: "Qendra e qytetit, Prishtinë", lat: 42.6600, lng: 21.1595, vleresimi: 4.7,
    pershkrimi: "Restorant i njohur kosovar me pjata tradicionale dhe moderne — emri i tij përkujton vitin e pavarësisë.",
    komentet: [{ autor: "Vizitor", tekst: "Tavë kosi e mjeshtërt, ambient i qetë.", yje: 5 }]
  },
  {
    id: 15, emri: "Blerina Mall (Qendra Tregtare)", kategoria: "Shopping", qyteti: "Prizren", adresa: "Qendra lindore, Prizren", lat: 42.6849, lng: 20.7895, vleresimi: 4.4,
    pershkrimi: "Një nga qendrat tregtare më të vjetra të Ballkanit — dyqane, kafe dhe supermarket, me pamje nga qyteti.",
    komentet: [{ autor: "Vizitor", tekst: "Hajde edhe për kafene edhe për blerje.", yje: 4 }]
  },
  {
    id: 16, emri: "QKMF (Spitali Rajonal) Prizren", kategoria: "Health", qyteti: "Prizren", adresa: "Prizren", lat: 42.6873, lng: 20.7994, telefoni: "194",
    pershkrimi: "Spitali rajonal i Prizrenit — urgjencë 24/7 dhe shërbime poliklinikë për zonën e Pejës dhe Therandës.",
    komentet: [{ autor: "Vizitor", tekst: "Afër qytetit, urgjenca e shpejtë.", yje: 4 }]
  },
  {
    id: 17, emri: "Restorant Krenare", kategoria: "Restorante", qyteti: "Prizren", adresa: "Qendra, Prizren", lat: 42.6825, lng: 20.8007, vleresimi: 4.6,
    pershkrimi: "Kuzhinë kosovare dhe mesdhetare në zemrën e Prizrenit — i njohur për pjatat tradicionale dhe mikpritjen.",
    komentet: [{ autor: "Vizitor", tekst: "Pite me gjalpë e qymir, shtëpiake.", yje: 5 }]
  },
  {
    id: 18, emri: "Euro Park (Pika Karburanti)", kategoria: "Pika Karburanti", qyteti: "Prizren", adresa: "Prizren", lat: 42.6828, lng: 20.7987, vleresimi: 4.5,
    pershkrimi: "Pikë karburanti e modernizuar 24/7 — derivate cilësore, market dhe kafene, në afërsi të qendrës.",
    komentet: [{ autor: "Vizitor", tekst: "Shërbim i shpejtë dhe çmime të qarta.", yje: 4 }]
  },
  {
    id: 19, emri: "QKMF (Spitali Rajonal) Pejë", kategoria: "Health", qyteti: "Pejë", adresa: "Pejë", lat: 42.0540, lng: 20.3755, telefoni: "194",
    pershkrimi: "Spitali rajonal i Pejës — urgjencë 24/7, shërbime kirurgjikale dhe poliklinikë, pikë referencë për lindjen e Pejës.",
    komentet: [{ autor: "Vizitor", tekst: "E afërt me qytetin, stafi profesional.", yje: 4 }]
  },
  {
    id: 20, emri: "Guri i Zi (Kafene & Panorama)", kategoria: "Kafene", qyteti: "Pejë", adresa: "Guri i Zi, Pejë", lat: 42.0585, lng: 20.3735, vleresimi: 4.8,
    pershkrimi: "Kafenja e njohur mbi kodrën e 'Gurit të Zi' — panorama më e bukur mbi Pejë, pikë ndalimi e preferuar e udhëtarëve.",
    komentet: [{ autor: "Vizitor", tekst: "Pamja nga lartë vlen për çdo hap.", yje: 5 }]
  },
  {
    id: 21, emri: "QKMF (Spitali Rajonal) Gjakovë", kategoria: "Health", qyteti: "Gjakovë", adresa: "Gjakovë", lat: 42.3270, lng: 20.3400, telefoni: "194",
    pershkrimi: "Spitali rajonal i Gjakovës — urgjencë 24/7 dhe shërbime mjekësore për zonën e Gjakovës.",
    komentet: [{ autor: "Vizitor", tekst: "Në qendër të qytetit, e lehtë për t'u arritur.", yje: 4 }]
  },
  {
    id: 22, emri: "QKMF (Spitali Rajonal) Ferizaj", kategoria: "Health", qyteti: "Ferizaj", adresa: "Ferizaj", lat: 42.3610, lng: 20.8770, telefoni: "194",
    pershkrimi: "Spitali rajonal i Ferizajt — urgjencë 24/7 dhe shërbime poliklinikë për zonën e Drenasit.",
    komentet: [{ autor: "Vizitor", tekst: "Urgjenca e hapur gjithmonë.", yje: 4 }]
  },
  {
    id: 23, emri: "QKMF (Spitali Rajonal) Mitrovicë", kategoria: "Health", qyteti: "Mitrovicë", adresa: "Mitrovicë", lat: 42.8290, lng: 20.8790, telefoni: "194",
    pershkrimi: "Spitali rajonal i Mitrovicës — urgjencë 24/7 dhe shërbime mjekësore për zonën e verior të Kosovës.",
    komentet: [{ autor: "Vizitor", tekst: "E afërt me qendër, shërbim i qëndrueshëm.", yje: 4 }]
  },
  {
    id: 24, emri: "QKMF (Spitali Rajonal) Suharekë", kategoria: "Health", qyteti: "Suharekë", adresa: "Qendra, Suharekë", lat: 42.5693, lng: 20.7845, telefoni: "194",
    pershkrimi: "Spitali rajonal i Suharekës — urgjencë 24/7, shërbime kirurgjikale dhe poliklinikë, pikë referencë për Therandën.",
    komentet: [{ autor: "Vizitor", tekst: "Në qendër, urgjenca e shpejtë.", yje: 4 }]
  }
];

export const kategoritëSistemit = [
  { ikona: "🏨", emri: "Hotele" }, 
  { ikona: "🍽️", emri: "Restorante" }, 
  { ikona: "⛽", emri: "Pika Karburanti" },
  { ikona: "🏕️", emri: "Turizëm" },
  { ikona: "🚑", emri: "Emergjenca" }
];
