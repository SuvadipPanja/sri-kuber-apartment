/**
 * Financial calculation utilities
 */

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
 */
export function buildPendingDues(owners, payments, month, year) {
  const activeOwners = owners.filter(o => o.active);
  return activeOwners.map(owner => {
    // If month is 'All', it's hard to define a single 'paid' status for the whole year.
    // We'll calculate total paid vs total expected for the period.
    const flatPayments = payments.filter(
      p => p.flatNo === owner.flatNo && 
      (month === 'All' || p.month === month) && 
      (year === 'All' || p.year === Number(year))
    );
    
    const amountPaid = flatPayments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);
    // Rough estimate: if month is All, expected is 12 * charge, else 1 * charge
    const expected = month === 'All' ? owner.monthlyCharge * 12 : owner.monthlyCharge;
    
    return {
      flatNo: owner.flatNo,
      ownerName: owner.ownerName,
      monthlyCharge: owner.monthlyCharge,
      paid: amountPaid >= expected || flatPayments.length > 0, // simple heuristic
      amountPaid,
      paymentDate: flatPayments.length > 0 ? flatPayments[0].paymentDate : null,
      paymentMode: flatPayments.length > 0 ? flatPayments[0].paymentMode : null,
      status: (amountPaid >= expected || flatPayments.length > 0) ? 'PAID' : 'PENDING',
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
      if (a.year !== b.year) return b.year - a.year;
      const months = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
      return months.indexOf(b.month) - months.indexOf(a.month);
    });
}
