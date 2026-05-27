export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const PAYMENT_MODES = ['In Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Online'];

export const EXPENSE_TYPES = [
  'Electricity Bill',
  'Water Bill',
  'Security Guard Salary',
  'Cleaning / Sweeping',
  'Lift Maintenance',
  'Generator / Backup',
  'Garden / Landscaping',
  'Pest Control',
  'Plumbing',
  'Electrical Repairs',
  'Painting / Renovation',
  'CCTV / Security System',
  'Other',
];

/**
 * Format a number as Indian Rupee currency string
 */
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN');
}

/**
 * Format a date string to display format
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Get short month name from full month name
 */
export function shortMonth(month) {
  return month ? month.substring(0, 3) : '';
}

/**
 * Generate a unique ID for payments/expenses
 */
export function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

/**
 * Get initials from a name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

/**
 * Get current month name
 */
export function getCurrentMonth() {
  return MONTHS[new Date().getMonth()];
}

/**
 * Get current year
 */
export function getCurrentYear() {
  return new Date().getFullYear();
}
