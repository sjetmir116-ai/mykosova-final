// ===== BILLING — MAKINA E GJENDJES =====
// GJENDJET: pending → active ⇄ overdue → expiring → canceled
// computeTransition = PURE (testueshme pa Firebase)
// apikoNgaEvent = e shkruan në Firestore (vetëm kjo + webhook)

function computeTransition(eventType, payload, statusiAktual) {
  switch (eventType) {
    case 'subscription.created':
      return { me: 'pending', arsyeja: 'subscription.created' };

    case 'subscription.activated':
      return { me: 'active', arsyeja: 'subscription.activated' };

    case 'subscription.past_due':
    case 'invoice.payment_failed':
      return statusiAktual === 'active'
        ? { me: 'overdue', arsyeja: eventType }
        : null; // nëse s'është aktiv, s'ndryshon

    case 'subscription.paused':
      return statusiAktual === 'active' ? { me: 'overdue', arsyeja: 'subscription.paused' } : null;

    case 'subscription.resumed':
      return statusiAktual === 'overdue' ? { me: 'active', arsyeja: 'subscription.resumed' } : null;

    case 'subscription.canceled': {
      const ts = payload && payload.cancellation_details
        ? payload.cancellation_details.cancellation_effective_timestamp
        : null;
      // "at period end" → expiring (mbetet deri atëherë); "immediate" → canceled
      if (ts && new Date(ts).getTime() > Date.now()) {
        return { me: 'expiring', arsyeja: 'canceled — at period end', fundit: ts };
      }
      return { me: 'canceled', arsyeja: 'subscription.canceled' };
    }

    case 'refund.created':
      return { me: 'canceled', arsyeja: 'refund.created' };

    default:
      return null; // event i panjohur → regjistrohet por injorohet
  }
}

// ================= APLIKIMI NË FIRESTORE =================
const getAdmin = require('./admin-lazy');
const { regjistroAudit } = require('./audit');

// custom_data i checkout-it: { biznesiId, uidPronari, paketa }
function dekodeCustomData(sub) {
  try {
    const raw = (sub && sub.billing_info && sub.billing_info.custom_data)
      || (sub && sub.custom_data)
      || null;
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    return null;
  }
}

// Përpunon event-in: ndryshon subscriptions + bizneset.paketa + payments + audit
async function apikoNgaEvent(event) {
  const db = getAdmin().firestore();
  const eventType = event.event;
  const sub = (event.data && event.data.item) || event.data || {};
  const subId = sub.id || event.data?.id;
  if (!subId) throw new Error('Event pa subscription ID: ' + eventType);

  const custom = dekodeCustomData(sub);
  const biznesiId = custom ? custom.biznesiId : null;
  const paketa = custom ? custom.paketa : null;
  const uidPronari = custom ? custom.uidPronari : null;

  const subRef = db.collection('subscriptions').doc(subId);
  const subSnap = await subRef.get();
  const statusiAktual = subSnap.exists ? subSnap.data().status : 'none';

  const trans = computeTransition(eventType, sub, statusiAktual);

  // Regjistro pagesën (histori) për transaction.paid
  if (eventType === 'transaction.paid' && sub.transaction_id) {
    const amount = (sub.amounts && sub.amounts[0] && sub.amounts[0].amount) || 0;
    const currency = (sub.amounts && sub.amounts[0] && sub.amounts[0].currency_code) || 'EUR';
    await db.collection('payments').add({
      biznesiId: biznesiId || '',
      uidPronari: uidPronari || '',
      subscriptionId: sub.subscription_id || subId,
      providerTransactionId: sub.transaction_id,
      providerEventId: event.notification_id,
      shuma: amount,
      monedha: currency,
      lloji: 'pagese',
      status: 'e-paguar',
      koha: getAdmin().firestore().FieldValue.serverTimestamp(),
    });
  }

  if (!trans) {
    // Event i panjohur ose i papërshtatshëm — vetëm audit
    await regjistroAudit(uidPronari || 'sistemi', 'system', 'webhook_event_injoruar', { eventType, subId });
    return { statusi: statusiAktual, ndryshuar: false };
  }

  const tani = getAdmin().firestore().FieldValue.serverTimestamp();
  await subRef.set(
    {
      biznesiId: biznesiId || '',
      uidPronari: uidPronari || '',
      provider: 'paddle',
      providerSubscriptionId: subId,
      paketa: paketa || (subSnap.exists ? subSnap.data().paketa : ''),
      status: trans.me,
      arsyeja: trans.arsyeja,
      statusPerditësuarM: tani,
    },
    { merge: true }
  );

  // Sinkronizon paketa te biznesi (publike — app-i e lexon)
  if (biznesiId) {
    const bizRef = db.collection('bizneset').doc(biznesiId);
    const bizSnap = await bizRef.get();
    if (bizSnap.exists) {
      let paketaEfektive = 'basic';
      if (trans.me === 'active' && paketa) paketaEfektive = paketa;
      if (trans.me === 'expiring' && paketa) paketaEfektive = paketa; // deri në fund të periodit
      await bizRef.update({
        paketa: paketaEfektive,
        paketaStatus: trans.me,
        paketaPerditësuarM: tani,
      });
      await regjistroAudit(uidPronari || 'system', 'system', 'paketa_aktivizuar', {
        biznesiId, paketa: paketaEfektive, status: trans.me,
      });
    }
  }

  return { statusi: trans.me, ndryshuar: true };
}

module.exports = { computeTransition, apikoNgaEvent, dekodeCustomData };
