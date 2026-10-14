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

/** Maintenance unless the payment remarks name a different purpose. */
export function paymentPurposeLabel(payment) {
  const remarks = String(payment?.remarks || '').trim().replace(/\s+/g, ' ');
  if (!remarks) return 'maintenance';
  if (/maint[ae]n|monthly(\s+charge)?|society\s+(due|charge)/i.test(remarks)) return 'maintenance';
  return remarks.slice(0, 60);
}

export function paymentWhatsAppMessage(payment) {
  const name = payment?.ownerName || 'Resident';
  const purpose = paymentPurposeLabel(payment);
  return [
    `Dear ${name},`,
    `Thank you for your ${purpose} payment for Flat ${payment?.flatNo}.`,
    '— Society Maintenance Team',
  ].join('\n');
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
