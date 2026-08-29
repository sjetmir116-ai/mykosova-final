# 🧪 TEST SIGURIA — MyKosova (S1)

> Script i testimit live të `firestore.rules` v2.0 — ekzekutohet te **browser-i** (jo sandbox-i,
> sepse emulatori Firebase kërkon Java që sandbox-i s'e ka).

## Si ekzekutohet (3 minuta)

1. Hap app-in (preview) dhe **logohu si ADMIN** (matrica e plotë)
2. Shtyp **F12** → tabi **Console**
3. Kopjo **të gjithë** skriptin poshtë → ngjite te Console → Enter
4. Lexo daljen: çdo rresht ✅ = saktë, ❌ = **GABIM — raporte**
5. (Opsional, i rekomanduar) Ripërsërit me një **llogari të zakonshme user** (regjistrohu te 👤 Llogaria me një email test — merr rolin 'user' sepse bootstrap-i është kryer)

> ⚠️ Skripti krijon dokumente TEST me emra "TEST SIGURIA..." dhe i pastron pas (atë që mund).
> S'prek të dhënat reale (favorites-et reale, review-et e vërteta).

## Skripti

```js
(async () => {
  console.log('=== TEST SIGURIA — MyKosova (rules v2.0) ===');
  const { db, auth } = await import('/src/firebase.js');
  const modSrc = await (await fetch('/src/useBookings.js')).text();
  const m = modSrc.match(/from\s+"([^"]*firebase_firestore[^"]*)"/);
  if (!m) { console.error('S\u2019u gjetur moduli i Firestore — rifresho faqen dhe riprovo'); return; }
  const F = await import(m[1]);
  const { doc, getDoc, addDoc, getDocs, collection, updateDoc, deleteDoc } = F;

  const user = auth.currentUser;
  if (!user) { console.error('❌ S\u2019je i loguar — logohu fillimisht'); return; }
  const prof = (await getDoc(doc(db, 'përdoruesit', user.uid))).data() || {};
  const esAdmin = ['admin', 'super_admin'].includes(prof.roli);
  console.log('👤 Testues:', prof.emri || user.email, '| roli:', prof.roli);

  let mire = 0, gabim = 0;
  const test = async (emri, priturja, fn) => {
    let rez;
    try { await fn(); rez = 'LEJOWAR'; } catch (e) { rez = 'E REFUZUAR'; }
    const ok = rez === priturja;
    ok ? mire++ : gabim++;
    console.log((ok ? '✅' : '❌ GABIM') + ' ' + emri + ' → ' + rez + ' (pritur: ' + priturja + ')');
  };

  const FAKE = 'fake-uid-' + Date.now();
  let testBiznesi = null, testBooking = null, testReview = null;

  // ===== 1. SELF-PROMOTION (KRITIKE) =====
  if (!esAdmin) {
    await test('1a. Ndrysho roli VETEN -> admin', 'E REFUZUAR', () => updateDoc(doc(db,'përdoruesit',user.uid), { roli: 'admin' }));
    await test('1b. Ndrysho email VETEN', 'E REFUZUAR', () => updateDoc(doc(db,'përdoruesit',user.uid), { email: 'hack@test.com' }));
  } else {
    console.log('ℹ️  1a/1b: je admin — admini mund të ndryshojë fushat (pa ekzekutim që të mos preket llogaria)');
  }
  await test('1c. Lexo profilin e përdoruesit tjetër (fake)', esAdmin ? 'LEJOWAR' : 'E REFUZUAR', () => getDoc(doc(db,'përdoruesit',FAKE)));

  // ===== 2. BIZNESET =====
  await test('2a. Krijo biznes me uidPronari të huaj', 'E REFUZUAR', () => addDoc(collection(db,'bizneset'), { emri:'TEST X', status:'pendshe', uidPronari:FAKE }));
  await test('2b. Krijo biznes me status "aprovar" (skip verifikim)', 'E REFUZUAR', () => addDoc(collection(db,'bizneset'), { emri:'TEST Y', status:'aprovar', uidPronari:user.uid }));
  await test('2c. Krijo biznes TEST (pendshe, i imi)', 'LEJOWAR', async () => { const r = await addDoc(collection(db,'bizneset'), { emri:'TEST SIGURIA ' + Date.now(), status:'pendshe', uidPronari:user.uid, qyteti:'Test', kategoria:'Test' }); testBiznesi = r.id; });
  if (testBiznesi) {
    await test('2d. Ndrysho emrin e biznesit TIM (fushë e lejuar)', 'LEJOWAR', () => updateDoc(doc(db,'bizneset',testBiznesi), { emri: 'TEST SIGURIA ' + Date.now() }));
    await test('2e. Ndrysho STATUSIN e biznesit tim (skip verifikim)', 'E REFUZUAR', () => updateDoc(doc(db,'bizneset',testBiznesi), { status:'aprovar' }));
    await test('2f. Vendos VERIFIKUAR veten te biznesi im', 'E REFUZUAR', () => updateDoc(doc(db,'bizneset',testBiznesi), { verifikuar:true }));
    await test('2g. Transfero pronësinë (uidPronari -> të huaj)', 'E REFUZUAR', () => updateDoc(doc(db,'bizneset',testBiznesi), { uidPronari:FAKE }));
    if (esAdmin) await test('2h. Fshi biznesin test (admin)', 'LEJOWAR', () => deleteDoc(doc(db,'bizneset',testBiznesi)));
  }

  // ===== 3. OFFERS =====
  await test('3a. Krijo ofertë me uidPronari të huaj', 'E REFUZUAR', () => addDoc(collection(db,'offers'), { biznesiEmri:'X', uidPronari:FAKE, teksti:'test' }));

  // ===== 4. BOOKINGS =====
  await test('4a. Krijo booking për VETE', 'LEJOWAR', async () => { const r = await addDoc(collection(db,'bookings'), { biznesiEmri:'TEST', përdoruesiUid:user.uid, përdoruesiEmri:'Test', data:'2026-09-01', status:'pendshe', uidPronari:user.uid }); testBooking = r.id; });
  if (testBooking) await test('4b. Lexo booking-un TIM', 'LEJOWAR', () => getDoc(doc(db,'bookings',testBooking)));
  await test('4c. Krijo booking me përdoruesiUid TË HUAJ (falsifikim)', 'E REFUZUAR', () => addDoc(collection(db,'bookings'), { biznesiEmri:'X', përdoruesiUid:FAKE, status:'pendshe' }));
  await test('4d. Lexo booking të panjohur (simulon të huaj)', esAdmin ? 'LEJOWAR' : 'E REFUZUAR', () => getDoc(doc(db,'bookings','booking-tjetrit-' + Date.now())));

  // ===== 5. TRIPS =====
  await test('5a. Krijo trip te subcollection-i im', 'LEJOWAR', () => addDoc(collection(db,'trips',user.uid), { emri:'TEST Trip', uid:user.uid, ditet:[] }));
  await test('5b. LISTO trip-et e përdoruesit tjetër (list-exposure)', 'E REFUZUAR', () => getDocs(collection(db,'trips',FAKE)));
  await test('5c. Lexo trip tek përdoruesi tjetër', 'E REFUZUAR', () => getDoc(doc(db,'trips',FAKE,'trip-x')));

  // ===== 6. FAVORITES =====
  await test('6a. Lexo favorites të përdoruesit tjetër', 'E REFUZUAR', () => getDoc(doc(db,'favorites',FAKE)));
  await test('6b. Shkruaj favorites të përdoruesit tjetër', 'E REFUZUAR', () => F.setDoc(doc(db,'favorites',FAKE), { uid:FAKE, bizneset:[] }));

  // ===== 7. REVIEWS =====
  await test('7a. Krijo review (i autentikuar)', 'LEJOWAR', async () => { const r = await addDoc(collection(db,'reviews'), { biznesiEmri:'TEST', emri:'Test', tekst:'test review', yje:5, uid:user.uid, raportuar:0, ndermuesit:[] }); testReview = r.id; });
  if (testReview) {
    await test('7b. Ndrysho TEKSTIN e review-it tim (duhet refuzuar)', 'E REFUZUAR', () => updateDoc(doc(db,'reviews',testReview), { tekst:'hack' }));
    await test('7c. Raporto review-in (raportuar++)', 'LEJOWAR', () => updateDoc(doc(db,'reviews',testReview), { raportuar: F.increment(1) }));
    if (esAdmin) await test('7d. Fshi review-in test (admin)', 'LEJOWAR', () => deleteDoc(doc(db,'reviews',testReview)));
    else console.log('ℹ️  7d. Review-i test mbetet (id: ' + testReview + ') — admini ta fshi nga Console');
  }

  // ===== 8. SUBSCRIPTIONS / PAYMENTS =====
  await test('8a. Shkruaj subscription (i mbyllur nga klienti, edhe admin)', 'E REFUZUAR', () => addDoc(collection(db,'subscriptions'), { x: 1 }));
  await test('8b. Shkruaj payment (i mbyllur nga klienti)', 'E REFUZUAR', () => addDoc(collection(db,'payments'), { x: 1 }));
  await test('8c. Lexo payments', esAdmin ? 'LEJOWAR' : 'E REFUZUAR', () => getDocs(collection(db,'payments')));

  // ===== 9. PASTRIMI (sa mundet) =====
  if (testBooking) await deleteDoc(doc(db,'bookings',testBooking)).catch(()=>{});
  const tripSnap = await getDocs(collection(db,'trips',user.uid)).catch(()=>null);
  if (tripSnap) tripSnap.docs.forEach(t => { if (String(t.data().emri||'').startsWith('TEST Trip')) deleteDoc(doc(db,'trips',user.uid,t.id)).catch(()=>{}); });
  if (!esAdmin && testBiznesi) console.log('ℹ️  Biznesi TEST ' + testBiznesi + ' mbetet te "Pendshe" — admini ta fshi nga Paneli → Menaxho Bizneset');

  console.log('\n=== PËRFUNDIMI: ' + mire + ' të kaluara, ' + gabim + ' GABIME ' + (gabim ? '⚠️ RAPORTE!' : '✅ GJITHÇKA SAKTË') + ' ===');
})();
```

## Interpretimi

| Rezultati | Kuptimi |
|---|---|
| Të gjitha ✅ | Rules v2.0 funksionojnë siç duhet |
| Ndonjë ❌ | **Raportojeni** — rreshti tregon saktësisht cili rregull dështon |
| 2h/7d (non-admin) | Testet e fshirjes i ka vetëm admini — normale |

## Shënim rreth "booking të huaj" (4d)

Me ID të panjohur testohet **rruga e refuzimit** (resource nuk ekziston → s'ka asnjë kusht që kalon).
Për një test të plotë me 2 llogari reale: regjistro një account test, bën një booking, pastaj nga llogaria
admin (ose e kundërta) provoj `getDoc` te ID-ja e booking-ut — pritja: LEJOWAR vetëm për pronar/klient/admin.
