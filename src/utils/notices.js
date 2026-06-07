/** Last moment of the expiry calendar day (local time). */
export function parseNoticeExpiryEnd(expiresAt) {
  if (!expiresAt) return null;
  const datePart = String(expiresAt).split('T')[0];
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

/** True if notice has no expiry or today is on/before the expiry date. */
export function isNoticeActive(notice, at = new Date()) {
  if (!notice?.expires_at) return true;
  const end = parseNoticeExpiryEnd(notice.expires_at);
  if (!end) return true;
  return at.getTime() <= end.getTime();
}

/** Store expiry as end of selected day so it stays visible through that date. */
export function toNoticeExpiryStorage(dateStr) {
  if (!dateStr) return null;
  const end = parseNoticeExpiryEnd(dateStr);
  return end ? end.toISOString() : null;
}
