import assert from 'node:assert/strict';
import { buildWhatsAppUrl, paymentPurposeLabel, paymentWhatsAppMessage, toWhatsAppNumber } from '../src/utils/paymentShare.js';
import { buildReceiptHtml, generateReceipt } from '../src/utils/receiptUtils.js';

const payment = {
  id: 'PAY-TEST-402',
  flatNo: '402',
  ownerName: 'Prashanta Das',
  month: 'October',
  year: 2026,
  amountPaid: 500,
  paymentDate: '2026-10-14',
  paymentMode: 'UPI',
  remarks: 'October maintenance',
};

const phoneCases = [
  ['9876543210', '919876543210'],
  ['98765 43210', '919876543210'],
  ['+91 98765 43210', '919876543210'],
  ['+91-9876543210', '919876543210'],
  ['09876543210', '919876543210'],
  ['919876543210', '919876543210'],
  ['', ''],
  ['12345', ''],
  ['5876543210', ''],
  ['abcdefghij', ''],
];

for (const [input, expected] of phoneCases) {
  assert.equal(toWhatsAppNumber(input), expected, `phone: ${input}`);
}

assert.equal(paymentPurposeLabel(payment), 'maintenance');
assert.equal(paymentPurposeLabel({ ...payment, remarks: '' }), 'maintenance');
assert.equal(paymentPurposeLabel({ ...payment, remarks: 'Parking fee' }), 'Parking fee');

const message = paymentWhatsAppMessage(payment);
assert.equal(message, [
  'Dear Prashanta Das,',
  'Thank you for your maintenance payment for Flat 402.',
  '— Society Maintenance Team',
].join('\n'));
assert.equal(message.includes('₹500'), false);
assert.equal(message.includes('UPI'), false);

const other = paymentWhatsAppMessage({ ...payment, ownerName: 'Amit Chakraborty', flatNo: '201', remarks: 'Parking fee' });
assert.ok(other.includes('Thank you for your Parking fee payment for Flat 201.'));
assert.ok(other.includes('Society Maintenance Team'));

const waUrl = buildWhatsAppUrl('919876543210', message);
assert.ok(waUrl.startsWith('https://wa.me/919876543210?text='));
assert.equal(decodeURIComponent(waUrl.split('text=')[1]), message);

const html = buildReceiptHtml(payment, {
  society_name: 'Sri Kuber Apartment',
  address: 'Kolkata',
  contact_phone: '9876543210',
});
for (const part of ['Prashanta Das', 'Flat', '402', 'October', '2026', 'UPI', '500', 'October maintenance', 'Sri Kuber Apartment']) {
  assert.ok(html.includes(part), `receipt missing ${part}`);
}

const imageHtml = buildReceiptHtml(payment, { society_name: 'Sri Kuber Apartment' }, { autoPrint: false });
assert.equal(imageHtml.includes('window.print'), false);
assert.ok(html.includes('window.print'));

const unsafe = buildReceiptHtml({ ...payment, ownerName: 'A & B <script>' }, {});
assert.ok(unsafe.includes('A &amp; B &lt;script&gt;'));
assert.equal(unsafe.includes('A & B <script>'), false);

assert.equal(generateReceipt(null).success, false);

const downloads = [];
globalThis.window = { open: () => null, location: { origin: 'http://localhost:5173' } };
globalThis.document = {
  createElement() {
    const link = { href: '', download: '', rel: '' };
    link.click = () => downloads.push(link.download);
    link.remove = () => {};
    return link;
  },
  body: { appendChild() {}, removeChild() {} },
};

const blocked = generateReceipt(payment, { society_name: 'Sri Kuber Apartment' });
assert.equal(blocked.success, true);
assert.equal(blocked.mode, 'download');
assert.equal(downloads.length, 1);
assert.match(downloads[0], /^Receipt-Flat-402-October-2026\.html$/);

downloads.length = 0;
globalThis.window.open = () => ({});
const preview = generateReceipt(payment, { society_name: 'Sri Kuber Apartment' });
assert.equal(preview.success, true);
assert.equal(preview.mode, 'preview');
assert.equal(downloads.length, 0);

console.log('payment action checks passed');
process.exit(0);
