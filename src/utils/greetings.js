/** First word of owner name for welcome messages */
export function getFirstName(fullName) {
  if (!fullName?.trim()) return 'Resident';
  return fullName.trim().split(/\s+/)[0];
}

/** Time-of-day greeting */
export function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}
