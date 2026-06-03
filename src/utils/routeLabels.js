/** Human-readable labels for app routes (activity log & breadcrumbs). */
export const ROUTE_LABELS = {
  dashboard: 'Dashboard',
  'monthly-collection': 'Collection & Dues',
  'pending-dues': 'Collection & Dues',
  'my-payments': 'My Payments',
  expenses: 'Expenses',
  'other-income': 'Other Income',
  'society-info': 'Society Info',
  'flat-directory': 'Flat Directory',
  'notice-board': 'Notice Board',
  complaints: 'Complaints',
  'important-contacts': 'Important Contacts',
  'my-account': 'My Account',
  'printable-statement': 'Statement & Reports',
  admin: 'Admin Panel',
  payments: 'Manage Payments',
  income: 'Manage Income',
  owners: 'Manage Owners',
  notices: 'Manage Notices',
  contacts: 'Manage Contacts',
  settings: 'Society Settings',
  'reset-password': 'Reset Password',
  'activity-report': 'Activity Report',
};

export function getPageLabel(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  const key = parts[parts.length - 1] || 'dashboard';
  if (ROUTE_LABELS[key]) return ROUTE_LABELS[key];
  return key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
