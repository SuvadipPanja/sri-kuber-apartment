/**
 * Financial calculation utilities
 */

const MONTHS_ORDER = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

/**
 * Get the previous month/year given a month string and year.
 * Returns null if month or year is 'All'.
 */
export function getPrevMonthYear(month, year) {
  if (month === 'All' || year === 'All') return null;
  const idx = MONTHS_ORDER.indexOf(month);
  if (idx <= 0) return { month: 'December', year: Number(year) - 1 };
  return { month: MONTHS_ORDER[idx - 1], year: Number(year) };
}

/**
 * Compute the opening balance for a given month by rolling forward from the seed.
 *
 * Rules:
 *   - config.carry_forward is a map { "Month-YYYY": number } that stores SEED values
 *     (manually entered starting balances) for the earliest months.
 *   - Once a month has real transaction data in its previous month, the opening
 *     balance is ALWAYS computed dynamically as prev month's net balance.
 *   - This prevents stale manual values from overriding correct computed values.
 *
 * @param {string} month
 * @param {number|string} year
 * @param {object} config  - the config row (with carry_forward map)
 * @param {Array}  payments
 * @param {Array}  expenses
 * @param {Array}  income
 * @returns {number}
 */
export function computeOpeningBalance(month, year, config, payments, expenses, income) {
  if (month === 'All' || year === 'All') return 0;

  const seed = config?.carry_forward?.[`${month}-${year}`];
  const p = getPrevMonthYear(month, year);

  if (!p) {
    // No previous month exists (e.g., January of the first year) — use seed or 0
    return seed || 0;
  }

  const prevPayments = totalCollection(payments, p.month, p.year);
  const prevExpenses = totalExpenses(expenses, p.month, p.year);
  const prevIncome   = totalOtherIncome(income, p.month, p.year);
  const prevSeed     = config?.carry_forward?.[`${p.month}-${p.year}`];
  const prevHasData  = prevPayments > 0 || prevExpenses > 0 || prevIncome > 0 || (prevSeed || 0) > 0;

  if (!prevHasData) {
    // Previous month has no data at all — fall back to this month's seed if available
    return seed || 0;
  }

  // Previous month has data — roll forward: prev opening + prev net activity
  const prevOpening = computeOpeningBalance(p.month, p.year, config, payments, expenses, income);
  return prevOpening + prevPayments + prevIncome - prevExpenses;
}

/**
 * Get all payments for a specific month and year
 */
export function getMonthPayments(payments, month, year) {
  return payments.filter(p => 
    (month === 'All' || p.month === month) && 
    (year === 'All' || p.year === Number(year))
  );
}

/**
 * Get all expenses for a specific month and year
 */
export function getMonthExpenses(expenses, month, year) {
  return expenses.filter(e => 
    (month === 'All' || e.month === month) && 
    (year === 'All' || e.year === Number(year))
  );
}

/**
 * Get all other income for a specific month and year
 */
export function getMonthIncome(income, month, year) {
  return income.filter(i => 
    (month === 'All' || i.month === month) && 
    (year === 'All' || i.year === Number(year))
  );
}

/**
 * Calculate total collected for a month
 */
export function totalCollection(payments, month, year) {
  return getMonthPayments(payments, month, year)
    .reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);
}

/**
 * Calculate total net expenses for a month
 */
export function totalExpenses(expenses, month, year) {
  return getMonthExpenses(expenses, month, year)
    .reduce((sum, e) => sum + Number(e.netExpense || 0), 0);
}

/**
 * Calculate total other income for a month
 */
export function totalOtherIncome(income, month, year) {
  return getMonthIncome(income, month, year)
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);
}

/**
 * Calculate net balance for a month
 * netBalance = openingBalance + collection + otherIncome - expenses
 */
export function calculateNetBalance(payments, expenses, income, month, year, openingBalance = 0) {
  const collected = totalCollection(payments, month, year);
  const spent = totalExpenses(expenses, month, year);
  const extra = totalOtherIncome(income, month, year);
  return openingBalance + collected + extra - spent;
}

/**
 * Build pending dues list for a given month/year
 * Returns array of { flatNo, ownerName, monthlyCharge, paid, amountPaid, paymentDate, status }
 *
 * IMPORTANT: A flat is considered PAID for a specific month only if:
 *   - There is at least one payment record for EXACTLY that month/year, AND
 *   - The total amount paid >= their monthly charge.
 * (Using flatPayments.length > 0 alone is WRONG — it would mark a flat as paid
 *  even if its payment was recorded under a different month.)
 */
export function buildPendingDues(owners, payments, month, year) {
  const activeOwners = owners.filter(o => o.active);
  return activeOwners.map(owner => {
    const flatPayments = payments.filter(
      p => p.flatNo === owner.flatNo &&
      (month === 'All' || p.month === month) &&
      (year === 'All' || p.year === Number(year))
    );

    const amountPaid = flatPayments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);
    // For 'All' mode: expected is 12 months * charge; for specific month: 1 * charge
    const expected = month === 'All' ? owner.monthlyCharge * 12 : owner.monthlyCharge;

    // A flat is PAID only if they actually have a payment AND paid enough
    const hasPaid = flatPayments.length > 0 && amountPaid >= expected;

    return {
      flatNo:       owner.flatNo,
      ownerName:    owner.ownerName,
      monthlyCharge: owner.monthlyCharge,
      paid:         hasPaid,
      amountPaid,
      paymentDate:  flatPayments.length > 0 ? flatPayments[0].paymentDate : null,
      paymentMode:  flatPayments.length > 0 ? flatPayments[0].paymentMode : null,
      status:       hasPaid ? 'PAID' : 'PENDING',
    };
  });
}

/**
 * Count paid, pending, inactive flats
 */
export function getFlatStats(owners, payments, month, year) {
  const active = owners.filter(o => o.active);
  const inactive = owners.filter(o => !o.active);
  
  const dues = buildPendingDues(owners, payments, month, year);
  const paid = dues.filter(d => d.paid).length;
  const pending = dues.filter(d => !d.paid).length;
  
  return {
    total: owners.length,
    active: active.length,
    inactive: inactive.length,
    paid,
    pending,
  };
}

/**
 * Get payment history for a specific flat
 */
export function getFlatPayments(payments, flatNo) {
  return payments
    .filter(p => p.flatNo === flatNo)
    .sort((a, b) => {
      if (Number(a.year) !== Number(b.year)) return Number(b.year) - Number(a.year);
      const months = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
      return months.indexOf(b.month) - months.indexOf(a.month);
    });
}
