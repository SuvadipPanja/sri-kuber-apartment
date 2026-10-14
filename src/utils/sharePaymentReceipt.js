import html2canvas from 'html2canvas';
import { buildReceiptHtml } from './receiptUtils.js';
import { buildWhatsAppUrl, openAppWindow, paymentWhatsAppMessage } from './paymentShare.js';

function receiptFilename(payment) {
  return `Receipt-Flat-${payment.flatNo}-${payment.month}-${payment.year}.png`
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '');
}

async function renderReceiptImage(payment, config) {
  const html = buildReceiptHtml(payment, config || {}, { autoPrint: false });
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:820px;height:1200px;border:0;visibility:hidden;';
  document.body.appendChild(iframe);

  try {
    await new Promise((resolve, reject) => {
      iframe.onload = () => resolve();
      iframe.onerror = () => reject(new Error('Could not draw the receipt.'));
      iframe.srcdoc = html;
    });

    const doc = iframe.contentDocument;
    if (!doc) throw new Error('Could not draw the receipt.');
    const node = doc.querySelector('.receipt') || doc.body;
    const images = [...doc.images];
    await Promise.all(images.map((img) => (img.complete ? null : new Promise((done) => {
      img.onload = done;
      img.onerror = done;
    }))));

    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: node.scrollWidth || 740,
      height: node.scrollHeight || node.offsetHeight,
      windowWidth: 820,
    });

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((fileBlob) => (fileBlob ? resolve(fileBlob) : reject(new Error('Could not create the receipt image.'))), 'image/png');
    });
    return new File([blob], receiptFilename(payment), { type: 'image/png' });
  } finally {
    iframe.remove();
  }
}

function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function copyImage(file) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') return false;
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': file })]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Open WhatsApp on the flat's saved number with the short note.
 * WhatsApp does not let a website attach a file to a chosen number, so the
 * receipt image is copied for one paste into that already-open chat.
 */
export async function sendPaymentWhatsApp({ payment, config, phone }) {
  const societyName = config?.society_name || 'Sri Kuber Apartment';
  const text = paymentWhatsAppMessage(payment, societyName);
  const file = await renderReceiptImage(payment, config);
  const copied = await copyImage(file);
  if (!copied) downloadFile(file);
  const opened = openAppWindow(buildWhatsAppUrl(phone, text));
  return { method: copied ? 'clipboard' : 'download', opened };
}
