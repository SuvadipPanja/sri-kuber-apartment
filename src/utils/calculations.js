/**
 * Financial calculation utilities
 */

/**
 * Get all payments for a specific month and year
 */
export function getMonthPayments(payments, month, year) {
  return payments.filter(p => p.month === month && p.year === Number(year));
}

/**
 * Get all expenses for a specific month and year
 */
export function getMonthExpenses(expenses, month, year) {
  return expenses.filter(e => e.month === month && e.year === Number(year));
}

/**
 * Get all other income for a specific month and year
 */
export function getMonthIncome(income, month, year) {
  return income.filter(i => i.month === month && i.year === Number(year));
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
 */
export function buildPendingDues(owners, payments, month, year) {
  const activeOwners = owners.filter(o => o.active);
  return activeOwners.map(owner => {
    const payment = payments.find(
      p => p.flatNo === owner.flatNo && p.month === month && p.year === Number(year)
    );
    return {
      flatNo: owner.flatNo,
      ownerName: owner.ownerName,
      monthlyCharge: owner.monthlyCharge,
      paid: !!payment,
      amountPaid: payment?.amountPaid || 0,
      paymentDate: payment?.paymentDate || null,
      paymentMode: payment?.paymentMode || null,
      status: payment ? 'PAID' : 'PENDING',
    };
  });
}

/**
 * Count paid, pending, inactive flats
 */
export function getFlatStats(owners, payments, month, year) {
  const active = owners.filter(o => o.active);
  const inactive = owners.filter(o => !o.active);
  const paid = active.filter(o =>
    payments.some(p => p.flatNo === o.flatNo && p.month === month && p.year === Number(year))
  );
  const pending = active.filter(o =>
    !payments.some(p => p.flatNo === o.flatNo && p.month === month && p.year === Number(year))
  );
  return {
    total: owners.length,
    active: active.length,
    inactive: inactive.length,
    paid: paid.length,
    pending: pending.length,
  };
}

/**
 * Get payment history for a specific flat
 */
export function getFlatPayments(payments, flatNo) {
  return payments
    .filter(p => p.flatNo === flatNo)
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      const months = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
      return months.indexOf(b.month) - months.indexOf(a.month);
    });
}
