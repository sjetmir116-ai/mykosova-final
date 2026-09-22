// ===== TESTET: IMPORTUESI MASIV (pa rrjet, pa Firebase) =====
// Mbulon: katalogun e qyteteve/kategorive, rrjetën, planin, mapimin,
// skorin e cilësisë, statusin, sigurinë e fotos dhe deduplikimin transaksional
// (me një Firestore fals, që të testohet edhe gara mes dy shkrimeve).

const crypto = require('crypto');

const { gjejQytetin, gjejQytetinNeTekst, qytetiMeIAfert, kutiaEQytetit, emratEQyteteve } = require('../src/places/qytetet');
const { kategoriaNgaTipi, pyetjetPerKategori, tipatPerNearby, emratEKategorive, MAKS_TIPA_NEARBY } = require('../src/places/kategorite');
const { ndajNeQeliza, rrjetaEQytetit, rrezjaEQelizes } = require('../src/places/rrjeta');
const { normalizoKerkesen, ndertoPlanin, vleresoPlanin, GabimPlani } = require('../src/places/plani');
const {
  mapoPlace,
  googlePlaceDocumentId,
  eSigurtPerRuajtje,
  normalizoTelefonin,
  celesiEmriQyteti,
  llogaritSkorin,
  vendosStatusin,
  formatoOrarin,
  PRAGU_APROVIMIT,
} = require('../src/places/mapping');
const { ruajMeDeduplikim, ngarkoIndeksin, ekzekutoImportin, GabimDublikat, numeratorBosh } = require('../src/bulkImport');
const { PlacesClient } = require('../src/places/client');

const rezultate = [];
const kontrollo = (emri, kusht) => {
  rezultate.push({ emri, ok: Boolean(kusht) });
  console.log((kusht ? '✅' : '❌ GABIM') + ' ' + emri);
};

// ============ 1. QYTETET ============
console.log('\n--- 1. Katalogu i qyteteve ---');

kontrollo('1.1 Katalogu ka ≥ 30 qytete', emratEQyteteve().length >= 30);
kontrollo('1.2 Emri kanonik nga varianti shqip', gjejQytetin('prishtina')?.emri === 'Prishtinë');
kontrollo('1.3 Emri kanonik nga varianti serbisht', gjejQytetin('Uroševac')?.emri === 'Ferizaj');
kontrollo('1.4 Alias-i historik Therandë → Suharekë', gjejQytetin('Therandë')?.emri === 'Suharekë');
kontrollo('1.5 Pa akcente funksionon', gjejQytetin('Gjakove')?.emri === 'Gjakovë');
kontrollo('1.6 Qytet i panjohur → null', gjejQytetin('Tiranë') === null);
kontrollo('1.7 Qyteti nga adresa e plotë', gjejQytetinNeTekst('Rr. Nëna Terezë 12, 10000 Prishtinë, Kosovë')?.emri === 'Prishtinë');
kontrollo('1.8 Adresa serbisht njihet', gjejQytetinNeTekst('Ulica bb, Kosovska Mitrovica')?.emri === 'Mitrovicë');
// Përputhja më e gjatë fiton: "Fushë Kosovë" s'duhet të bjerë te asnjë alias më i shkurtër.
kontrollo('1.9 Përputhja më e gjatë fiton', gjejQytetinNeTekst('Rruga B, Fushë Kosovë')?.emri === 'Fushë Kosovë');
kontrollo('1.10 Qyteti nga koordinatat (Prishtinë)', qytetiMeIAfert(42.6629, 21.1655)?.emri === 'Prishtinë');
kontrollo('1.11 Qyteti nga koordinatat (Prizren)', qytetiMeIAfert(42.2139, 20.7397)?.emri === 'Prizren');
kontrollo('1.12 Jashtë Kosovës → null (Tirana)', qytetiMeIAfert(41.3275, 19.8187, 25) === null);
kontrollo('1.13 Koordinata të pavlefshme → null', qytetiMeIAfert(null, undefined) === null);

const kutia = kutiaEQytetit('Prishtinë');
kontrollo('1.14 Kutia përfshin qendrën e qytetit',
  kutia.low.latitude < 42.6629 && kutia.high.latitude > 42.6629 &&
  kutia.low.longitude < 21.1655 && kutia.high.longitude > 21.1655);
kontrollo('1.15 Kutia s\u2019përfshin Prizrenin (kufizim real)', kutia.low.latitude > 42.2139);
kontrollo('1.16 Kutia e një qyteti të panjohur → null', kutiaEQytetit('Berlin') === null);

// ============ 2. KATEGORITË ============
console.log('\n--- 2. Katalogu i kategorive ---');

kontrollo('2.1 primaryType → besueshmëri E LARTË', (() => {
  const r = kategoriaNgaTipi('restaurant', ['restaurant', 'food']);
  return r.emri === 'Restorante' && r.besueshmeria === 'e_larte';
})());
kontrollo('2.2 tip dytësor → besueshmëri E ULËT', (() => {
  const r = kategoriaNgaTipi('point_of_interest', ['establishment', 'cafe']);
  return r.emri === 'Kafene' && r.besueshmeria === 'e_ulet';
})());
kontrollo('2.3 Tip i panjohur → asnjë', kategoriaNgaTipi('xyz_i_panjohur', []).besueshmeria === 'asnje');
kontrollo('2.4 gas_station → Pika Karburanti', kategoriaNgaTipi('gas_station').emri === 'Pika Karburanti');
kontrollo('2.5 pharmacy → Health', kategoriaNgaTipi('pharmacy').emri === 'Health');
kontrollo('2.6 hotel → Hotele', kategoriaNgaTipi('hotel').emri === 'Hotele');
kontrollo('2.7 car_repair → Automotive', kategoriaNgaTipi('car_repair').emri === 'Automotive');
kontrollo('2.8 bakery → Kafene (prioriteti i rendit)', kategoriaNgaTipi('bakery').emri === 'Kafene');
kontrollo('2.9 Hyrje boshe s\u2019rrëzon', kategoriaNgaTipi(null, null).besueshmeria === 'asnje');

const pyetjet = pyetjetPerKategori('Restorante', 'Prishtinë');
kontrollo('2.10 Pyetjet përmbajnë qytetin', pyetjet.every((p) => p.includes('Prishtinë')));
kontrollo('2.11 Disa variante pyetjesh (> 60 rezultate)', pyetjet.length >= 5);
kontrollo('2.12 Pyetjet janë unike', new Set(pyetjet).size === pyetjet.length);
kontrollo('2.13 Tipat e nearby brenda kufirit të Google (50)', tipatPerNearby('Shopping').length <= MAKS_TIPA_NEARBY);
kontrollo('2.14 Kategoritë përputhen me useKontenti.js', (() => {
  // Emrat DUHET të jenë identikë me KATEGORITE_LOKALE të frontend-it,
  // përndryshe importi krijon kategori që s'i njeh asnjë filtër i app-it.
  const frontend = ['Hotele', 'Restorante', 'Kafene', 'Pika Karburanti', 'Turizëm', 'Emergjenca',
    'Hospitality', 'Food', 'Automotive', 'Health', 'Shopping', 'Services', 'Business'];
  const yne = emratEKategorive();
  return frontend.every((k) => yne.includes(k));
})());

// ============ 3. RRJETA ============
console.log('\n--- 3. Rrjeta gjeografike ---');

const qelizatPr = rrjetaEQytetit('Prishtinë', 2.5);
kontrollo('3.1 Prishtina prodhon shumë qeliza', qelizatPr.length > 20);
kontrollo('3.2 Qeliza e parë është qendra (renditje nga brenda-jashtë)',
  Math.abs(qelizatPr[0].lat - 42.6629) < 0.01 && Math.abs(qelizatPr[0].lng - 21.1655) < 0.01);
kontrollo('3.3 Qeliza më e madhe → më pak qeliza', rrjetaEQytetit('Prishtinë', 10).length < qelizatPr.length);
kontrollo('3.4 Qeliza më e vogël → më shumë qeliza', rrjetaEQytetit('Prishtinë', 1).length > qelizatPr.length);
kontrollo('3.5 Rrezja e qelizës mbulon diagonalen', Math.abs(rrezjaEQelizes(2) - Math.SQRT2) < 0.001);
kontrollo('3.6 Qytet i panjohur → rrjetë boshe', rrjetaEQytetit('Berlin').length === 0);
kontrollo('3.7 Rreth më i vogël se qeliza → 1 qelizë e vetme',
  ndajNeQeliza({ lat: 42.5, lng: 21, rrezjaKm: 1, qelizaKm: 5 }).length === 1);
kontrollo('3.8 Hyrje e pavlefshme → listë boshe',
  ndajNeQeliza({ lat: NaN, lng: 21, rrezjaKm: 5, qelizaKm: 2 }).length === 0);
kontrollo('3.9 Çdo qelizë ka rreze pozitive', qelizatPr.every((q) => q.rrezjaKm > 0));
kontrollo('3.10 Rrezja e qelizës nën kufirin e Google (50 km)', qelizatPr.every((q) => q.rrezjaKm * 1000 <= 50000));

// ============ 4. PLANI ============
console.log('\n--- 4. Planifikuesi ---');

kontrollo('4.1 Parazgjedhjet mbushen', (() => {
  const k = normalizoKerkesen({ qytetet: 'Prishtinë', kategorite: 'Restorante' });
  return k.strategjia === 'shpejt' && k.statusi === 'auto' && k.merrFotot === true && k.prove === false;
})());
kontrollo('4.2 String me presje → varg', normalizoKerkesen({ qytetet: 'Prishtinë,Prizren', kategorite: 'Kafene' }).qytetet.length === 2);
kontrollo('4.3 Emrat normalizohen në kanonikë',
  normalizoKerkesen({ qytetet: 'pristina', kategorite: 'restorante' }).qytetet[0] === 'Prishtinë');
kontrollo('4.4 Dublikatat në hyrje hiqen',
  normalizoKerkesen({ qytetet: 'Prishtinë,prishtina,PRISHTINË', kategorite: 'Kafene' }).qytetet.length === 1);
kontrollo('4.5 "te_gjitha" → gjithë katalogu',
  normalizoKerkesen({ qytetet: 'te_gjitha', kategorite: 'te_gjitha' }).qytetet.length === emratEQyteteve().length);
kontrollo('4.6 Qytet i panjohur → GabimPlani', (() => {
  try { normalizoKerkesen({ qytetet: 'Berlin', kategorite: 'Kafene' }); return false; }
  catch (e) { return e instanceof GabimPlani; }
})());
kontrollo('4.7 Strategji e panjohur → GabimPlani', (() => {
  try { normalizoKerkesen({ qytetet: 'Prishtinë', kategorite: 'Kafene', strategjia: 'turbo' }); return false; }
  catch (e) { return e instanceof GabimPlani; }
})());
kontrollo('4.8 Status i panjohur → GabimPlani', (() => {
  try { normalizoKerkesen({ qytetet: 'Prishtinë', kategorite: 'Kafene', statusi: 'approved' }); return false; }
  catch (e) { return e instanceof GabimPlani; }
})());
kontrollo('4.9 Numrat shtrëngohen brenda kufijve', (() => {
  const k = normalizoKerkesen({ qytetet: 'Prishtinë', kategorite: 'Kafene', maksFaqe: 99, qelizaKm: 0.01 });
  return k.maksFaqe === 3 && k.qelizaKm === 0.5;
})());

const planiShpejt = ndertoPlanin(normalizoKerkesen({ qytetet: 'Prishtinë', kategorite: 'Restorante', strategjia: 'shpejt' }));
const planiRrjete = ndertoPlanin(normalizoKerkesen({ qytetet: 'Prishtinë', kategorite: 'Restorante', strategjia: 'rrjete' }));
const planiPlote = ndertoPlanin(normalizoKerkesen({ qytetet: 'Prishtinë', kategorite: 'Restorante', strategjia: 'plote' }));

kontrollo('4.10 shpejt → vetëm task-e text', planiShpejt.every((t) => t.lloji === 'text'));
kontrollo('4.11 rrjete → vetëm task-e nearby', planiRrjete.every((t) => t.lloji === 'nearby'));
kontrollo('4.12 plote = shpejt + rrjete', planiPlote.length === planiShpejt.length + planiRrjete.length);
kontrollo('4.13 Plani është DETERMINIST (resume i sigurt)', (() => {
  const a = ndertoPlanin(normalizoKerkesen({ qytetet: 'Prishtinë,Prizren', kategorite: 'Kafene,Hotele', strategjia: 'plote' }));
  const b = ndertoPlanin(normalizoKerkesen({ qytetet: 'Prishtinë,Prizren', kategorite: 'Kafene,Hotele', strategjia: 'plote' }));
  return JSON.stringify(a) === JSON.stringify(b);
})());
kontrollo('4.14 Vlerësimi numëron thirrjet', (() => {
  const v = vleresoPlanin(normalizoKerkesen({ qytetet: 'Prishtinë', kategorite: 'Restorante', strategjia: 'shpejt' }));
  return v.kerkesaText === planiShpejt.length * 3 && v.kerkesaNearby === 0;
})());
kontrollo('4.15 Vlerësimi kap kalimin e tavanit',
  vleresoPlanin(normalizoKerkesen({ qytetet: 'te_gjitha', kategorite: 'te_gjitha', strategjia: 'plote', maksKerkesaApi: 10 })).brendaKufirit === false);

// ============ 5. MAPIMI ============
console.log('\n--- 5. Mapimi Place → biznes ---');

const VEND_I_PLOTE = {
  id: 'ChIJTestPlotë123',
  displayName: { text: 'Restorant Liburnia' },
  formattedAddress: 'Rr. UÇK 55, Prishtinë 10000, Kosovë',
  location: { latitude: 42.6612, lng: undefined, longitude: 21.1621 },
  rating: 4.6,
  userRatingCount: 340,
  primaryType: 'restaurant',
  types: ['restaurant', 'food', 'establishment'],
  businessStatus: 'OPERATIONAL',
  internationalPhoneNumber: '+383 44 123 456',
  websiteUri: 'https://liburnia-example.com',
  regularOpeningHours: { weekdayDescriptions: ['E hënë: 08:00–23:00', 'E martë: 08:00–23:00'] },
  editorialSummary: { text: 'Kuzhinë tradicionale shqiptare.' },
  photos: [{ name: 'places/ChIJTestPlotë123/photos/AbC', authorAttributions: [{ displayName: 'Arben K.' }] }],
};

const iPlote = mapoPlace(VEND_I_PLOTE, { kategoriaEKerkuar: 'Restorante', qytetiIKerkuar: 'Prishtinë' });

kontrollo('5.1 Vend i plotë mapohet me sukses', iPlote.ok === true);
kontrollo('5.2 Emri nxirret nga displayName.text', iPlote.dok.emri === 'Restorant Liburnia');
kontrollo('5.3 Kategoria nga primaryType', iPlote.dok.kategoria === 'Restorante');
kontrollo('5.4 Qyteti nga adresa', iPlote.dok.qyteti === 'Prishtinë');
kontrollo('5.5 Koordinatat janë numra', typeof iPlote.dok.lat === 'number' && typeof iPlote.dok.lng === 'number');
kontrollo('5.6 WhatsApp bie te telefoni', iPlote.dok.whatsapp === iPlote.dok.telefoni);
kontrollo('5.7 Orari formatohet si tekst', iPlote.dok.orari.includes('E hënë'));
kontrollo('5.8 googlePlaceId ruhet', iPlote.dok.googlePlaceId === 'ChIJTestPlotë123');
kontrollo('5.9 Referenca e fotos ruhet (e qëndrueshme)', iPlote.dok.googleFotoRef === 'places/ChIJTestPlotë123/photos/AbC');
kontrollo('5.10 Atribuimi i autorit ruhet (kërkesë e Google)', iPlote.dok.googleFotoAutori === 'Arben K.');
kontrollo('5.11 Fusha foto nis bosh (mbushet vetëm me URL të sigurt)', iPlote.dok.foto === '');
kontrollo('5.12 Biznes cilësor → APROVAR', iPlote.dok.status === 'aprovar');
kontrollo('5.13 Statusi përdor fjalën e repo-s ("aprovar", jo "approved")',
  ['aprovar', 'pendshe'].includes(iPlote.dok.status));
kontrollo('5.14 burimiImportit shënohet (rollback i mundshëm)', iPlote.dok.burimiImportit === 'google_places_bulk');

const iVarfer = mapoPlace(
  { id: 'ChIJVarfer', displayName: { text: 'Dyqan pa emër' }, types: ['establishment'] },
  { kategoriaEKerkuar: 'Shopping', qytetiIKerkuar: 'Prishtinë' }
);
kontrollo('5.15 Biznes i varfër → PENDSHE', iVarfer.dok.status === 'pendshe');
kontrollo('5.16 Pa koordinata → qyteti bie te kërkesa', iVarfer.dok.qyteti === 'Prishtinë');
kontrollo('5.17 Kategoria bie te kërkesa kur s\u2019njihet tipi', iVarfer.dok.kategoria === 'Shopping');

kontrollo('5.18 Pa place id → refuzohet', mapoPlace({ displayName: { text: 'X' } }).ok === false);
kontrollo('5.19 Pa emër → refuzohet', mapoPlace({ id: 'abc' }).arsyeja === 'pa_emer');
kontrollo('5.20 CLOSED_PERMANENTLY → refuzohet',
  mapoPlace({ id: 'a', displayName: { text: 'X' }, businessStatus: 'CLOSED_PERMANENTLY' }).arsyeja === 'i_mbyllur_perfundimisht');
kontrollo('5.21 CLOSED_TEMPORARILY → pranohet por PENDSHE', (() => {
  const r = mapoPlace({ ...VEND_I_PLOTE, businessStatus: 'CLOSED_TEMPORARILY' }, { kategoriaEKerkuar: 'Restorante', qytetiIKerkuar: 'Prishtinë' });
  return r.ok === true && r.dok.status === 'pendshe';
})());
kontrollo('5.22 Qyteti nga GPS kur adresa s\u2019ndihmon', (() => {
  const r = mapoPlace(
    { id: 'x', displayName: { text: 'Y' }, formattedAddress: 'Pa qytet', location: { latitude: 42.2139, longitude: 20.7397 } },
    { qytetiIKerkuar: 'Prishtinë' }
  );
  return r.dok.qyteti === 'Prizren'; // GPS-i mund kërkesën
})());
kontrollo('5.23 addressComponents kanë përparësi', (() => {
  const r = mapoPlace(
    {
      id: 'x', displayName: { text: 'Y' },
      addressComponents: [{ longText: 'Gjakovë', types: ['locality'] }],
      formattedAddress: 'Rruga pa emër',
    },
    { qytetiIKerkuar: 'Prishtinë' }
  );
  return r.dok.qyteti === 'Gjakovë';
})());
kontrollo('5.24 displayName si string i thjeshtë pranohet',
  mapoPlace({ id: 'x', displayName: 'Emri Direkt' }).dok.emri === 'Emri Direkt');
kontrollo('5.25 Statusi i detyruar mbizotëron skorin', (() => {
  const r = mapoPlace(VEND_I_PLOTE, { kategoriaEKerkuar: 'Restorante', qytetiIKerkuar: 'Prishtinë', statusi: 'pendshe' });
  return r.dok.status === 'pendshe';
})());
kontrollo('5.26 statusi=aprovar e detyron edhe një vend të varfër', (() => {
  const r = mapoPlace({ id: 'z', displayName: { text: 'Z' } }, { statusi: 'aprovar' });
  return r.dok.status === 'aprovar';
})());
kontrollo('5.27 Vlerësimi rrumbullakoset në 1 dhjetore',
  mapoPlace({ id: 'x', displayName: { text: 'Y' }, rating: 4.6666 }).dok.vleresimi === 4.7);
kontrollo('5.28 Rating që mungon → 0 (jo NaN)',
  mapoPlace({ id: 'x', displayName: { text: 'Y' } }).dok.vleresimi === 0);

// ============ 6. SKORI & STATUSI ============
console.log('\n--- 6. Skori i cilësisë ---');

kontrollo('6.1 Dok i plotë kalon pragun',
  llogaritSkorin(iPlote.dok, { besueshmeriaKategorise: 'e_larte', burimiQytetit: 'adresa', numriVleresimeve: 340 }).skori >= PRAGU_APROVIMIT);
kontrollo('6.2 Dok bosh nuk e kalon pragun', llogaritSkorin({}, {}).skori < PRAGU_APROVIMIT);
kontrollo('6.3 Telefon dublikat e ul skorin', (() => {
  const ctx = { besueshmeriaKategorise: 'e_larte', burimiQytetit: 'adresa', numriVleresimeve: 340 };
  return llogaritSkorin(iPlote.dok, { ...ctx, telefonDublikat: true }).skori < llogaritSkorin(iPlote.dok, ctx).skori;
})());
kontrollo('6.4 Status jo-OPERATIONAL e ul skorin fort', (() => {
  const ctx = { besueshmeriaKategorise: 'e_larte', burimiQytetit: 'adresa', numriVleresimeve: 340 };
  return llogaritSkorin(iPlote.dok, { ...ctx, businessStatus: 'CLOSED_TEMPORARILY' }).skori < PRAGU_APROVIMIT;
})());
kontrollo('6.5 Skori s\u2019bie kurrë nën 0', llogaritSkorin({}, { telefonDublikat: true, businessStatus: 'CLOSED_TEMPORARILY' }).skori === 0);
kontrollo('6.6 Arsyet shpjegojnë pikët që mungojnë', llogaritSkorin({}, {}).arsye.length > 0);
kontrollo('6.7 vendosStatusin: mbi prag → aprovar', vendosStatusin(PRAGU_APROVIMIT, 'auto') === 'aprovar');
kontrollo('6.8 vendosStatusin: nën prag → pendshe', vendosStatusin(PRAGU_APROVIMIT - 1, 'auto') === 'pendshe');
kontrollo('6.9 vendosStatusin: detyrimi mbizotëron', vendosStatusin(0, 'aprovar') === 'aprovar' && vendosStatusin(99, 'pendshe') === 'pendshe');
kontrollo('6.10 Orar që mungon → string bosh', formatoOrarin({}) === '');
kontrollo('6.11 Orari kufizohet në 500 karaktere',
  formatoOrarin({ regularOpeningHours: { weekdayDescriptions: Array(60).fill('E hënë: 08:00–23:00') } }).length <= 500);

// ============ 7. SIGURIA & ÇELËSAT ============
console.log('\n--- 7. Siguria dhe çelësat ---');

kontrollo('7.1 ID deterministe e barabartë me frontend-in', googlePlaceDocumentId('ChIJ38V7') === 'google_ChIJ38V7');
kontrollo('7.2 Prefiksi places/ hiqet', googlePlaceDocumentId('places/ChIJ38V7') === 'google_ChIJ38V7');
kontrollo('7.3 Karakteret e rrezikshme enkodohen', !googlePlaceDocumentId('a/b#c').slice(7).includes('/'));
kontrollo('7.4 ID boshe → string bosh', googlePlaceDocumentId('') === '');
kontrollo('7.5 URL me key= REFUZOHET', eSigurtPerRuajtje('https://x.com/a?key=SEKRET') === false);
kontrollo('7.6 URL me api_key= REFUZOHET', eSigurtPerRuajtje('https://x.com/a?api_key=SEKRET') === false);
kontrollo('7.7 URL me API_KEY= (uppercase) REFUZOHET', eSigurtPerRuajtje('https://x.com/a?b=1&API_KEY=S') === false);
kontrollo('7.8 HTTP (jo HTTPS) refuzohet', eSigurtPerRuajtje('http://lh3.googleusercontent.com/a') === false);
kontrollo('7.9 URL e pastër pranohet', eSigurtPerRuajtje('https://lh3.googleusercontent.com/abc') === true);
kontrollo('7.10 Telefoni normalizohet për dedup', (() => {
  const a = normalizoTelefonin('+383 44 123 456');
  return a === normalizoTelefonin('044 123 456') && a === normalizoTelefonin('44123456') && a === '44123456';
})());
kontrollo('7.11 Prefiksi 00383 hiqet', normalizoTelefonin('0038344123456') === '44123456');
kontrollo('7.12 Telefon bosh → string bosh', normalizoTelefonin('') === '' && normalizoTelefonin(null) === '');
kontrollo('7.13 Çelësi emër+qytet injoron akcentet/rastin',
  celesiEmriQyteti('Kafe  Qëndra', 'Prishtinë') === celesiEmriQyteti('KAFE QENDRA', 'prishtine'));
kontrollo('7.14 Emra të ndryshëm → çelësa të ndryshëm',
  celesiEmriQyteti('Kafe A', 'Prishtinë') !== celesiEmriQyteti('Kafe B', 'Prishtinë'));
kontrollo('7.15 I njëjti emër, qytete të ndryshme → çelësa të ndryshëm',
  celesiEmriQyteti('Kafe A', 'Prishtinë') !== celesiEmriQyteti('Kafe A', 'Prizren'));

// ============ 8. KLIENTI (me fetch fals) ============
console.log('\n--- 8. Klienti i Places (fetch i injektuar) ---');

function klientiFals(pergjigjet) {
  let i = 0;
  const thirrjet = [];
  const fetchFals = async (url, opsionet) => {
    thirrjet.push({ url, opsionet, trupi: opsionet?.body ? JSON.parse(opsionet.body) : null });
    const p = pergjigjet[Math.min(i++, pergjigjet.length - 1)];
    return {
      ok: p.ok !== false,
      status: p.status || 200,
      json: async () => p.data || {},
    };
  };
  const klienti = new PlacesClient({ apiKey: 'TEST_KEY', fetchImpl: fetchFals, maksRiprovime: 0 });
  return { klienti, thirrjet };
}

kontrollo('8.1 Pa API key → gabim', (() => {
  try { new PlacesClient({ apiKey: '' }); return false; } catch (e) { return e.kodi === 'MUNGON_KEY'; }
})());

async function testetKlientit() {
  const { klienti, thirrjet } = klientiFals([
    { data: { places: [{ id: 'a' }], nextPageToken: 'tok1' } },
    { data: { places: [{ id: 'b' }] } },
  ]);
  const r = await klienti.kerkoTekst({ pyetja: 'kafe Prishtinë', kutia: kutiaEQytetit('Prishtinë'), maksFaqe: 3 });

  kontrollo('8.2 Paginimi ndjek nextPageToken', r.vendet.length === 2);
  kontrollo('8.3 Faqja 2 dërgon pageToken-in', thirrjet[1].trupi.pageToken === 'tok1');
  kontrollo('8.4 Paginimi ndalon kur s\u2019ka token (2 thirrje, jo 3)', thirrjet.length === 2);
  kontrollo('8.5 locationRestriction dërgohet (s\u2019dalin rezultate nga Shkupi)', Boolean(thirrjet[0].trupi.locationRestriction?.rectangle));
  kontrollo('8.6 Çelësi shkon si HEADER, kurrë te URL-ja',
    thirrjet[0].opsionet.headers['X-Goog-Api-Key'] === 'TEST_KEY' && !thirrjet[0].url.includes('TEST_KEY'));
  kontrollo('8.7 FieldMask kërkon nextPageToken', thirrjet[0].opsionet.headers['X-Goog-FieldMask'].includes('nextPageToken'));
  kontrollo('8.8 Numëruesi i kostos rritet', klienti.kerkesa === 2);

  const { klienti: k2, thirrjet: t2 } = klientiFals([{ data: { places: [{ id: 'x' }] } }]);
  await k2.kerkoAfer({ lat: 42.66, lng: 21.16, rrezjaKm: 2, tipat: ['restaurant'] });
  kontrollo('8.9 Nearby dërgon rreth në METRA', t2[0].trupi.locationRestriction.circle.radius === 2000);
  kontrollo('8.10 Rrezja shtrëngohet te kufiri i Google (50 km)', await (async () => {
    const { klienti: k3, thirrjet: t3 } = klientiFals([{ data: { places: [] } }]);
    await k3.kerkoAfer({ lat: 42, lng: 21, rrezjaKm: 999 });
    return t3[0].trupi.locationRestriction.circle.radius === 50000;
  })());

  const { klienti: k4 } = klientiFals([{ ok: false, status: 403 }]);
  let kodi403 = '';
  try { await k4.kerkoTekst({ pyetja: 'x' }); } catch (e) { kodi403 = e.kodi; }
  kontrollo('8.11 HTTP 403 → API_I_PAKTIVIZUAR', kodi403 === 'API_I_PAKTIVIZUAR');

  const { klienti: k5 } = klientiFals([{ ok: false, status: 429 }]);
  let kodi429 = '';
  try { await k5.kerkoTekst({ pyetja: 'x' }); } catch (e) { kodi429 = e.kodi; }
  kontrollo('8.12 HTTP 429 → KUOTA_U_MBUSH', kodi429 === 'KUOTA_U_MBUSH');

  const { klienti: k6, thirrjet: t6 } = klientiFals([{ data: { photoUri: 'https://lh3.googleusercontent.com/foto' } }]);
  const urlFoto = await k6.merrUrlFotos('places/a/photos/b', 900);
  kontrollo('8.13 Fotoja kthen photoUri', urlFoto === 'https://lh3.googleusercontent.com/foto');
  kontrollo('8.14 URL-ja e fotos ka skipHttpRedirect dhe PA çelës',
    t6[0].url.includes('skipHttpRedirect=true') && !/[?&]key=/i.test(t6[0].url));
}

// ============ 9. DEDUPLIKIMI TRANSAKSIONAL (Firestore fals) ============
function firestoreFals(dokumenteFillestare = {}) {
  const ruajtja = new Map(Object.entries(dokumenteFillestare));
  const njehsore = { transaksione: 0, krijime: 0, perditesime: 0 };

  const bejRef = (rruga) => ({
    path: rruga,
    id: rruga.split('/').pop(),
  });

  const db = {
    ruajtja,
    njehsore,
    collection(emri) {
      return {
        doc(id) {
          const idReal = id || `auto_${ruajtja.size}_${Math.random().toString(36).slice(2, 8)}`;
          return bejRef(`${emri}/${idReal}`);
        },
        select(...fushat) {
          return {
            async get() {
              const docs = [];
              for (const [rruga, data] of ruajtja) {
                if (!rruga.startsWith(`${emri}/`)) continue;
                const pjesa = {};
                for (const f of fushat) if (data[f] !== undefined) pjesa[f] = data[f];
                docs.push({ id: rruga.split('/').pop(), data: () => pjesa });
              }
              return { forEach: (cb) => docs.forEach(cb), size: docs.length, docs };
            },
          };
        },
      };
    },
    async runTransaction(fn) {
      njehsore.transaksione++;
      const shkrimet = [];
      const tx = {
        async getAll(...refs) {
          return refs.map((r) => ({
            exists: ruajtja.has(r.path),
            id: r.id,
            data: () => ruajtja.get(r.path),
          }));
        },
        create(ref, data) {
          if (ruajtja.has(ref.path)) throw new Error('ALREADY_EXISTS');
          shkrimet.push(() => { ruajtja.set(ref.path, data); njehsore.krijime++; });
        },
        set(ref, data) { shkrimet.push(() => ruajtja.set(ref.path, data)); },
        update(ref, data) {
          shkrimet.push(() => { ruajtja.set(ref.path, { ...ruajtja.get(ref.path), ...data }); njehsore.perditesime++; });
        },
      };
      const rez = await fn(tx);
      shkrimet.forEach((w) => w());
      return rez;
    },
  };
  return db;
}

async function testetFirestore() {
  console.log('\n--- 9. Deduplikimi transaksional ---');

  const db = firestoreFals();
  const { dok, meta } = mapoPlace(VEND_I_PLOTE, { kategoriaEKerkuar: 'Restorante', qytetiIKerkuar: 'Prishtinë' });

  const r1 = await ruajMeDeduplikim(db, crypto, { dok, meta, perditeso: false });
  kontrollo('9.1 Shkrimi i parë kalon', r1.veprimi === 'shtuar');
  kontrollo('9.2 Dokumenti ruhet me ID deterministe', db.ruajtja.has(`bizneset/${meta.docId}`));
  kontrollo('9.3 Rezervimi emër+qytet krijohet bashkë', [...db.ruajtja.keys()].some((k) => k.startsWith('biznesetIndeks/')));

  let dubl = '';
  try { await ruajMeDeduplikim(db, crypto, { dok, meta, perditeso: false }); }
  catch (e) { dubl = e instanceof GabimDublikat ? e.lloji : 'gabim_tjeter'; }
  kontrollo('9.4 I njëjti placeId → dublikat_google', dubl === 'dublikat_google');

  // I njëjti biznes, placeId TJETËR (Google ndonjëherë ka dy regjistrime).
  const tjeterId = mapoPlace({ ...VEND_I_PLOTE, id: 'ChIJKopjeTjeter' }, { kategoriaEKerkuar: 'Restorante', qytetiIKerkuar: 'Prishtinë' });
  let dubl2 = '';
  try { await ruajMeDeduplikim(db, crypto, { dok: tjeterId.dok, meta: tjeterId.meta, perditeso: false }); }
  catch (e) { dubl2 = e instanceof GabimDublikat ? e.lloji : 'gabim_tjeter'; }
  kontrollo('9.5 placeId i ri me të njëjtin emër+qytet → dublikat_emri', dubl2 === 'dublikat_emri');

  const r3 = await ruajMeDeduplikim(db, crypto, { dok: { ...dok, emri: 'Emër i Ri' }, meta, perditeso: true });
  kontrollo('9.6 perditeso=true → update, jo gabim', r3.veprimi === 'perditesuar');
  kontrollo('9.7 Përditësimi NUK e prek statusin (vendim i njeriut)',
    db.ruajtja.get(`bizneset/${meta.docId}`).status === dok.status);
  kontrollo('9.8 Përditësimi NUK e prek uidPronari', db.ruajtja.get(`bizneset/${meta.docId}`).uidPronari === 'sistemi');
  kontrollo('9.9 Përditësimi shënon perditesuarM', Boolean(db.ruajtja.get(`bizneset/${meta.docId}`).perditesuarM));

  // Qytet tjetër → NUK është dublikat.
  const nePrizren = mapoPlace(
    { ...VEND_I_PLOTE, id: 'ChIJPrizren', formattedAddress: 'Rr. Sheshi, Prizren, Kosovë', location: { latitude: 42.2139, longitude: 20.7397 } },
    { kategoriaEKerkuar: 'Restorante', qytetiIKerkuar: 'Prizren' }
  );
  const r4 = await ruajMeDeduplikim(db, crypto, { dok: nePrizren.dok, meta: nePrizren.meta, perditeso: false });
  kontrollo('9.10 I njëjti emër në qytet tjetër → lejohet', r4.veprimi === 'shtuar');

  // ---- indeksi paraprak ----
  console.log('\n--- 10. Indeksi paraprak ---');
  const indeksi = await ngarkoIndeksin(db);
  kontrollo('10.1 Indeksi mbledh placeId-të', indeksi.placeIds.has('ChIJTestPlotë123'));
  kontrollo('10.2 Indeksi mbledh çelësat emër+qytet', indeksi.emraQytete.size >= 2);
  kontrollo('10.3 Indeksi mbledh telefonat e normalizuar', indeksi.telefonat.has('44123456'));
  kontrollo('10.4 Indeksi numëron dokumentet', indeksi.dokumente >= 2);

  // ---- rrjedha e plotë ----
  console.log('\n--- 11. Rrjedha e plotë e importit ---');

  const vendetFals = [
    VEND_I_PLOTE,
    { ...VEND_I_PLOTE, id: 'ChIJDy', displayName: { text: 'Kafe Dyta' } },
    { ...VEND_I_PLOTE, id: 'ChIJTre', displayName: { text: 'Bar Treta' }, userRatingCount: 0, internationalPhoneNumber: '', websiteUri: '', rating: 0 },
    { id: 'ChIJMbyllur', displayName: { text: 'I Mbyllur' }, businessStatus: 'CLOSED_PERMANENTLY' },
    VEND_I_PLOTE, // i dyfishtë brenda të njëjtit rezultat
  ];

  const dbBosh = firestoreFals();
  const { klienti } = klientiFals([{ data: { places: vendetFals } }]);

  const rez = await ekzekutoImportin({
    db: dbBosh,
    klienti,
    crypto,
    kerkesa: { qytetet: 'Prishtinë', kategorite: 'Restorante', strategjia: 'shpejt', merrFotot: false },
  });

  kontrollo('11.1 Importi përfundon', rez.perfunduar === true);
  kontrollo('11.2 Vende të gjetura numërohen', rez.numeratori.vendeTeGjetura > 0);
  kontrollo('11.3 Bizneset unike shkruhen', rez.numeratori.teShtuara === 3);
  kontrollo('11.4 I mbyllur përgjithmonë anashkalohet', rez.arsyet.i_mbyllur_perfundimisht >= 1);
  kontrollo('11.5 Dublikatat brenda rezultatit kapen', rez.numeratori.dublikateGoogle >= 1);
  kontrollo('11.6 Aprovar + pendshe = të shtuarat',
    rez.numeratori.teAprovuara + rez.numeratori.tePendshe === rez.numeratori.teShtuara);
  kontrollo('11.7 Biznesi i varfër shkon pendshe', rez.numeratori.tePendshe >= 1);
  kontrollo('11.8 Kostoja raportohet', rez.numeratori.kerkesaApi > 0);
  kontrollo('11.9 Mostra kthehet për UI', rez.mostra.length > 0);
  kontrollo('11.10 merrFotot=false → asnjë thirrje fotoje', rez.numeratori.fotoTeMarra === 0);

  // dry-run
  const dbProve = firestoreFals();
  const { klienti: klientiProve } = klientiFals([{ data: { places: vendetFals } }]);
  const rezProve = await ekzekutoImportin({
    db: dbProve,
    klienti: klientiProve,
    crypto,
    kerkesa: { qytetet: 'Prishtinë', kategorite: 'Restorante', strategjia: 'shpejt', prove: true, merrFotot: false },
  });
  kontrollo('11.11 PROVË: asgjë s\u2019shkruhet', dbProve.ruajtja.size === 0);
  kontrollo('11.12 PROVË: vendet prapë numërohen', rezProve.numeratori.vendeUnike > 0);
  kontrollo('11.13 PROVË: asnjë transaksion', dbProve.njehsore.transaksione === 0);

  // tavani i kërkesave
  const dbTavan = firestoreFals();
  const { klienti: klientiTavan } = klientiFals([{ data: { places: [VEND_I_PLOTE] } }]);
  const rezTavan = await ekzekutoImportin({
    db: dbTavan,
    klienti: klientiTavan,
    crypto,
    kerkesa: { qytetet: 'Prishtinë', kategorite: 'Restorante', strategjia: 'shpejt', maksKerkesaApi: 1, merrFotot: false },
  });
  kontrollo('11.14 Tavani i thirrjeve ndal importin', rezTavan.perfunduar === false && rezTavan.ndalesa === 'kufiri_kerkesave');
  kontrollo('11.15 Kursori ruhet për vazhdim', Number.isInteger(rezTavan.kursori.task));

  // tavani i bizneseve
  const dbMaks = firestoreFals();
  const { klienti: klientiMaks } = klientiFals([{ data: { places: vendetFals } }]);
  const rezMaks = await ekzekutoImportin({
    db: dbMaks,
    klienti: klientiMaks,
    crypto,
    kerkesa: { qytetet: 'Prishtinë', kategorite: 'Restorante', strategjia: 'shpejt', maksBiznese: 1, merrFotot: false },
  });
  kontrollo('11.16 Tavani i bizneseve respektohet', rezMaks.numeratori.teShtuara <= 3 && rezMaks.perfunduar === false);

  // gabim i Google → nuk rrëzon gjithçka
  const dbGabim = firestoreFals();
  const { klienti: klientiGabim } = klientiFals([{ ok: false, status: 500 }]);
  const rezGabim = await ekzekutoImportin({
    db: dbGabim,
    klienti: klientiGabim,
    crypto,
    kerkesa: { qytetet: 'Prishtinë', kategorite: 'Restorante', strategjia: 'shpejt', merrFotot: false },
  });
  kontrollo('11.17 Gabimi i Google kapet, s\u2019rrëzon procesin', rezGabim.numeratori.gabime > 0);

  // vazhdimi (resume) — importi i dytë s'krijon dublikatë
  const dbVazhdim = firestoreFals();
  const { klienti: kl1 } = klientiFals([{ data: { places: [VEND_I_PLOTE] } }]);
  await ekzekutoImportin({ db: dbVazhdim, klienti: kl1, crypto, kerkesa: { qytetet: 'Prishtinë', kategorite: 'Restorante', merrFotot: false } });
  const madhesia1 = dbVazhdim.ruajtja.size;
  const { klienti: kl2 } = klientiFals([{ data: { places: [VEND_I_PLOTE] } }]);
  const rez2 = await ekzekutoImportin({ db: dbVazhdim, klienti: kl2, crypto, kerkesa: { qytetet: 'Prishtinë', kategorite: 'Restorante', merrFotot: false } });
  kontrollo('11.18 Rinisja s\u2019krijon dublikatë (idempotente)', dbVazhdim.ruajtja.size === madhesia1);
  kontrollo('11.19 Rinisja i raporton si dublikatë', rez2.numeratori.dublikateGoogle > 0);

  // foto e pasigurt s'ruhet kurrë
  const dbFoto = firestoreFals();
  const fetchFoto = async (url) => ({
    ok: true,
    status: 200,
    json: async () => (url.includes('/media')
      ? { photoUri: 'https://x.com/foto?key=SEKRET_I_RREZIKSHEM' }
      : { places: [VEND_I_PLOTE] }),
  });
  const klientiFoto = new PlacesClient({ apiKey: 'K', fetchImpl: fetchFoto, maksRiprovime: 0 });
  await ekzekutoImportin({ db: dbFoto, klienti: klientiFoto, crypto, kerkesa: { qytetet: 'Prishtinë', kategorite: 'Restorante', merrFotot: true } });
  const dokRuajtur = [...dbFoto.ruajtja.entries()].find(([k]) => k.startsWith('bizneset/'))?.[1];
  kontrollo('11.20 URL fotoje me çelës NUK ruhet kurrë', dokRuajtur.foto === '');
  kontrollo('11.21 Referenca e fotos ruhet gjithsesi', Boolean(dokRuajtur.googleFotoRef));

  // numëratori bosh
  kontrollo('11.22 numeratorBosh ka gjithë fushat', (() => {
    const n = numeratorBosh();
    return ['vendeTeGjetura', 'teShtuara', 'teAprovuara', 'tePendshe', 'dublikateGoogle', 'kerkesaApi'].every((f) => n[f] === 0);
  })());

}

// Testet asinkrone ekzekutohen nga runner-i (ose direkt me `node tests/test-bulk-import.js`).
async function ekzekuto() {
  await testetKlientit();
  await testetFirestore();
  return rezultate;
}

module.exports = { rezultate, ekzekuto };

// Ekzekutim i drejtpërdrejtë: node tests/test-bulk-import.js
if (require.main === module) {
  ekzekuto().then(() => {
    const kaluan = rezultate.filter((t) => t.ok).length;
    const deshtuan = rezultate.length - kaluan;
    console.log(`\n=== IMPORTUESI MASIV: ${kaluan}/${rezultate.length} të kaluara ${deshtuan ? `— ${deshtuan} GABIME ⚠️` : '✅ GJITHÇKA SAKTË'} ===`);
    process.exit(deshtuan > 0 ? 1 : 0);
  }).catch((e) => {
    console.error('❌ Dështim i papritur:', e);
    process.exit(1);
  });
}
