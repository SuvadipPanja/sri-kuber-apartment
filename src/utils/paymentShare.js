import { formatCurrency, formatDate } from './formatters.js';

/** Indian mobile numbers saved as 10 digits, 0-prefixed, or +91. */
export function toWhatsAppNumber(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  let national = '';
  if (digits.length === 10) national = digits;
  else if (digits.length === 11 && digits.startsWith('0')) national = digits.slice(1);
  else if (digits.length === 12 && digits.startsWith('91')) national = digits.slice(2);
  else return '';

  if (!/^[6-9]\d{9}$/.test(national)) return '';
  return `91${national}`;
}

export function paymentWhatsAppMessage(payment, societyName) {
  const lines = [
    `🏠 ${societyName}`,
    'Maintenance payment received',
    '',
    `Dear ${payment.ownerName || 'Resident'},`,
    `We have received your maintenance payment for Flat ${payment.flatNo}.`,
    '',
    `Period: ${payment.month} ${payment.year}`,
    `Amount: ${formatCurrency(payment.amountPaid)}`,
    `Date: ${formatDate(payment.paymentDate)}`,
    `Mode: ${payment.paymentMode || '—'}`,
  ];
  if (payment.remarks) lines.push(`Remarks: ${payment.remarks}`);
  lines.push('', 'Thank you.', `— ${societyName}`);
  return lines.join('\n');
}

export function buildWhatsAppUrl(phone, text) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/** Opens a new tab. Returns false when the browser blocks the popup. */
export function openAppWindow(url) {
  const opened = window.open(url, '_blank');
  if (!opened) return false;
  try { opened.opener = null; } catch { /* ignore */ }
  return true;
}
