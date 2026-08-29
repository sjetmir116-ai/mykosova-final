import { useContext } from 'react';
import { AppContext } from './AppContext';

// FAQET JURIDIKORE — Privacy Policy + Terms & Conditions (SQ + EN)
function Legal({ faqe }) {
  const { darkMode } = useContext(AppContext);
  const stiliKartelës = darkMode ? '#1c1c1e' : '#ffffff';
  const korniza = darkMode ? '#2d2d2d' : '#e5e7eb';
  const stiliTekstit = darkMode ? '#ffffff' : '#111827';

  const titujt = {
    privacy: { sq: 'Politika e Privatësisë', en: 'Privacy Policy' },
    terms: { sq: 'Kushtet e Përdorimit', en: 'Terms & Conditions' },
  };

  const permbajtja = {
    privacy: `
MyKosova respekton privatësinë tuaj. Kjo politikë shpjegon çfarë të dhënash mbledhim dhe pse.

1. TË DHËNAT E MBLEDHURA
- Llogaria: emri, email-i, fjalëkalimi (i ruajtur i enkriptuar te Firebase Authentication — ne e shohim VETËM email-in).
- Lokacioni (GPS): vetëm kur e kërkon funksioni "Nearby/Navigo" — përdoret në kohë reale dhe nuk ruhet pa lejen tuaj.
- Veprimet: vlerësime, favorites, kërkime (për të përmirësuar përvojën).

2. SI I PËRDORIM TË DHËNAT
- Për t'ju shfaqur biznese afër jush.
- Për ta bërë kërkimin më inteligjent.
- Për të ruajtur favorites dhe vlerësimet tuaja.

3. SHTEFSIA ME TË TËRJ
- Të dhënat e llogarisë S'E SHTEFIM kurrë me palë të treta për qëllime marketingu.
- Bizneset e regjistruara shihen publike (emri, kategori, adresë, telefon — të dhëna biznesi, jo personale).

4. SIGURIA
- Lidhje të enkriptuara (HTTPS) në çdo kërkesë.
- Fjalëkalimet kurrë nuk ruhen në formën e pastër — vetëm te Firebase me enkriptim.
- Atesimi i përdoruesve vetëm me role minimale.

5. TË DHËNAT TUAJA
- Fshirja e llogarisë: kërkoni te emaili i kontaktit — të dhënat fshihen brenda 30 ditëve.
- Eksportimi: mund të kërkoni kopje të të dhënave tuaja.

6. KOOKIES
- Përdorim vetëm storage lokal (sesioni, preferencat si gjuha/dark mode).

7. NDRYSHIMET
- Kjo politikë përditësohet kur platforma evoluon. Data e versionit: 25.08.2026.
`,
    terms: `
Mirë se vini te MyKosova 🇽 — këto janë rregullat e përdorimit.

1. SHËRBIMI
- MyKosova është një platformë që lidh biznese, turizëm, rezervime dhe informacione për Kosovën.
- Përmbajtja (biznese, foto, përshkrime) sigurohet nga përdoruesit dhe bizneset — përpjekemi ta verifikojmë, por nuk garantojmë saktësinë 100%.

2. LLOGARIA
- Ju përgjigjeni për mbajtjen sekrete të fjalëkalimit.
- Fjalëkalimi duhet të ketë të paktën 6 shenja.
- Llogaria mund të pezullohet/fshihet nga admini në rast abuzimi.

3. RREGULLAT E PËRDORIMIT
- Nuk lejohet: spam, fake reviews, biznesë të falsifikuar, kopjim masiv i të dhënave (scraping), ofensivë ose të pavlefshme.
- Vlerësimet duhet të jenë reale (vizita e vërtetë).
- Admini ka të drejtë të moderojë çdo përmbajtje sipas këtyre rregullave.

4. VLERËSIMET
- Bizneset nuk i fshijnë vlerësimet negative — vetëm admini moderon sipas rregullave (transparente).
- Review-ët e raportuar shqyrtohen.

5. BOOKING (kur të aktivizohet)
- Rezervimet kthehen sipas politikës së secilit biznes.
- Anulimet: sipas kushteve të treguara te faqja e biznesit.

6. PAGESAT
- Pagesat përpunohen nga providerë të sigurt. MyKosova S'RUAH numra kartelash.

7. PËRGJEGJËSIA
- MyKosova nuk përgjigjet për dëme indirekte nga përdorimi i informacioneve (p.sh. çmime të pasaktuara te biznesi).

8. NDALIMET / NDRYSHIMET
- Mund të ndryshojmë këto kushte me njoftim te faqja kryesore.
`,
  };

  return (
    <div style={{ maxWidth: '700px', margin: '30px auto', padding: '0 20px' }}>
      <div style={{ backgroundColor: stiliKartelës, borderRadius: '20px', border: `1px solid ${korniza}`, padding: '28px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '800', color: stiliTekstit }}>
          {titujt[faqe].sq}
        </h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#8e8e93' }}>
          {titujt[faqe].en} · Versioni 1.0 · 25.08.2026
        </p>
        <div style={{ fontSize: '14px', lineHeight: 1.7, color: stiliTekstit, whiteSpace: 'pre-wrap' }}>
          {permbajtja[faqe]}
        </div>
      </div>
    </div>
  );
}

export default Legal;
