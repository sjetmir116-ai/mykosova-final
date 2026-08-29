// TEST: Makina e gjendjes së billing (pa rrjet, pa Firebase)
const { computeTransition } = require('../src/billing');

const rezultate = [];
const kontrollo = (emri, kusht) => {
  rezultate.push({ emri, ok: kusht });
  console.log((kusht ? '✅' : '❌ GABIM') + ' ' + emri);
};

const tani = Date.now();
const eArdhshme = new Date(tani + 86400000).toISOString();
const eKaluar = new Date(tani - 86400000).toISOString();

// 1. created → pending
kontrollo('1. subscription.created → pending', computeTransition('subscription.created', {}, 'none').me === 'pending');

// 2. activated → active
kontrollo('2. subscription.activated → active', computeTransition('subscription.activated', {}, 'pending').me === 'active');

// 3. payment_failed te active → overdue
kontrollo('3. invoice.payment_failed (active) → overdue', computeTransition('invoice.payment_failed', {}, 'active').me === 'overdue');

// 4. payment_failed te none → null (s\u2019ndryshon)
kontrollo('4. invoice.payment_failed (none) → injorohet', computeTransition('invoice.payment_failed', {}, 'none') === null);

// 5. paused te active → overdue
kontrollo('5. subscription.paused (active) → overdue', computeTransition('subscription.paused', {}, 'active').me === 'overdue');

// 6. resumed te overdue → active
kontrollo('6. subscription.resumed (overdue) → active', computeTransition('subscription.resumed', {}, 'overdue').me === 'active');

// 7. canceled me effect të ardhshëm → expiring
kontrollo('7. canceled (at period end) → expiring',
  computeTransition('subscription.canceled', { cancellation_details: { cancellation_effective_timestamp: eArdhshme } }, 'active').me === 'expiring');

// 8. canceled menjëherë → canceled
kontrollo('8. canceled (immediate) → canceled',
  computeTransition('subscription.canceled', { cancellation_details: { cancellation_effective_timestamp: eKaluar } }, 'active').me === 'canceled');

// 9. refund → canceled
kontrollo('9. refund.created → canceled', computeTransition('refund.created', {}, 'active').me === 'canceled');

// 10. event i panjohur → null
kontrollo('10. event i panjohur injorohet', computeTransition('ndonje.event_i_ri', {}, 'active') === null);

module.exports = { rezultate };
