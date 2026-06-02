const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function lt100(n) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
}

function lt1000(n) {
  if (n < 100) return lt100(n);
  return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + lt100(n % 100) : '');
}

export function amountToWords(amount) {
  const num = Math.floor(Number(amount) || 0);
  if (num === 0) return 'Zero Rupees Only';

  let n = num;
  const parts = [];

  if (n >= 10000000) { parts.push(lt100(Math.floor(n / 10000000)) + ' Crore'); n %= 10000000; }
  if (n >= 100000) { parts.push(lt100(Math.floor(n / 100000)) + ' Lakh'); n %= 100000; }
  if (n >= 1000) { parts.push(lt100(Math.floor(n / 1000)) + ' Thousand'); n %= 1000; }
  if (n > 0) { parts.push(lt1000(n)); }

  return parts.join(' ') + ' Rupees Only';
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getAppOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

function buildReceiptHtml(payment, config) {
  const societyName = config?.society_name || 'Sri Kuber Apartment';
  const addressParts = [config?.address, config?.city, config?.state].filter(Boolean);
  const address = addressParts.join(', ');
  const phone = config?.contact_phone || '';

  const idSuffix = (payment.id || '').split('-').pop() || '0000';
  const monthAbbr = payment.month?.substring(0, 3).toUpperCase() || 'MON';
  const receiptNo = `SKA/RCP/${payment.year}/${monthAbbr}-${idSuffix}`;

  const issueDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const payDate = payment.paymentDate
    ? new Date(payment.paymentDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const amountNum = Number(payment.amountPaid || 0);
  const amountFmt = '₹ ' + amountNum.toLocaleString('en-IN');
  const amountWords = amountToWords(amountNum);
  const signatureSrc = `${getAppOrigin()}/signature.jpg`;

  const ownerName = escapeHtml(payment.ownerName || '—');
  const flatNo = escapeHtml(payment.flatNo);
  const month = escapeHtml(payment.month);
  const year = escapeHtml(payment.year);
  const paymentMode = escapeHtml(payment.paymentMode || 'In Cash');
  const remarks = payment.remarks ? escapeHtml(payment.remarks) : '';
  const society = escapeHtml(societyName);
  const addr = escapeHtml(address);
  const phoneEsc = escapeHtml(phone);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Receipt — ${ownerName} — ${month} ${year}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13.5px;
      color: #111;
      background: #fff;
      padding: 24px;
    }
    .receipt {
      max-width: 700px;
      margin: 0 auto;
      border: 3px double #111;
      padding: 36px 40px 28px;
      position: relative;
      overflow: hidden;
    }
    .wm {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 96px;
      font-weight: 900;
      font-family: Arial, sans-serif;
      color: rgba(0,0,0,0.04);
      white-space: nowrap;
      pointer-events: none;
      letter-spacing: 12px;
      user-select: none;
    }
    .hdr { text-align: center; padding-bottom: 18px; border-bottom: 2px solid #111; margin-bottom: 18px; }
    .hdr-name { font-size: 24px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; }
    .hdr-addr { font-size: 12px; color: #444; margin-top: 4px; }
    .title-band {
      text-align: center;
      border: 1.5px solid #111;
      padding: 7px 20px;
      font-size: 17px;
      font-weight: bold;
      letter-spacing: 5px;
      text-transform: uppercase;
      margin-bottom: 22px;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 12.5px;
      margin-bottom: 20px;
      border-bottom: 1px dashed #bbb;
      padding-bottom: 12px;
    }
    .meta span { font-weight: bold; }
    .field { margin-bottom: 14px; }
    .fl { font-size: 10.5px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 3px; }
    .fv { font-size: 15px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 14px; }
    .amt-box {
      background: #f4f4f4;
      border: 2px solid #111;
      padding: 14px 18px;
      margin: 18px 0;
      display: flex;
      align-items: baseline;
      gap: 14px;
      flex-wrap: wrap;
    }
    .amt-num { font-size: 30px; font-weight: 900; font-family: Arial, sans-serif; }
    .amt-words { font-size: 12.5px; font-style: italic; color: #333; }
    .towards {
      border-left: 4px solid #111;
      padding: 10px 14px;
      background: #fafafa;
      margin-bottom: 18px;
      font-size: 13.5px;
      line-height: 1.6;
    }
    .towards small { color: #555; font-size: 11.5px; }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 40px;
      border-top: 1px dashed #bbb;
      padding-top: 20px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .stamp {
      width: 110px; height: 110px;
      border: 2px dashed #aaa;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      text-align: center;
      color: #aaa;
      font-size: 11px;
      line-height: 1.4;
    }
    .sig { text-align: center; }
    .sig-img {
      display: block;
      width: 180px;
      height: auto;
      margin: 0 auto 4px;
      mix-blend-mode: multiply;
    }
    .sig-line { border-top: 1.5px solid #111; width: 220px; margin: 0 auto 8px; }
    .sig-lbl { font-size: 13px; font-weight: bold; }
    .sig-sub { font-size: 11px; color: #555; margin-top: 2px; }
    .footnote {
      text-align: center;
      font-size: 10.5px;
      color: #888;
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px dashed #ddd;
      font-style: italic;
    }
    .print-hint {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-top: 12px;
    }
    @media print {
      body { padding: 0; }
      .print-hint { display: none; }
      @page { margin: 15mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="wm">PAID</div>
    <div class="hdr">
      <div class="hdr-name">${society}</div>
      ${address ? `<div class="hdr-addr">${addr}${phone ? ' &nbsp;|&nbsp; Ph: ' + phoneEsc : ''}</div>` : ''}
    </div>
    <div class="title-band">Money Receipt</div>
    <div class="meta">
      <div>Receipt No: <span>${escapeHtml(receiptNo)}</span></div>
      <div>Issue Date: <span>${escapeHtml(issueDate)}</span></div>
    </div>
    <div class="field">
      <div class="fl">Received with thanks from</div>
      <div class="fv">${ownerName}</div>
    </div>
    <div class="grid2">
      <div class="field">
        <div class="fl">Flat / Unit Number</div>
        <div class="fv">Flat ${flatNo}</div>
      </div>
      <div class="field">
        <div class="fl">Payment Date</div>
        <div class="fv">${escapeHtml(payDate)}</div>
      </div>
    </div>
    <div class="amt-box">
      <div class="amt-num">${escapeHtml(amountFmt)}</div>
      <div class="amt-words">(${escapeHtml(amountWords)})</div>
    </div>
    <div class="towards">
      <strong>Towards:</strong> Maintenance Charge for <strong>${month} ${year}</strong>
      ${remarks ? `<br><small>Remarks: ${remarks}</small>` : ''}
    </div>
    <div class="grid2">
      <div class="field">
        <div class="fl">Payment Mode</div>
        <div class="fv">${paymentMode}</div>
      </div>
      <div class="field">
        <div class="fl">For Period</div>
        <div class="fv">${month} ${year}</div>
      </div>
    </div>
    <div class="footer">
      <div class="stamp">Office<br>Stamp</div>
      <div class="sig">
        <img src="${signatureSrc}" alt="Signature" class="sig-img" onerror="this.style.display='none'" />
        <div class="sig-line"></div>
        <div class="sig-lbl">Suvadip Panja</div>
        <div class="sig-sub">Secretary, ${society}</div>
      </div>
    </div>
    <div class="footnote">This is a system-generated receipt &nbsp;|&nbsp; ${society}</div>
  </div>
  <p class="print-hint">Use your browser menu → Print or Save as PDF</p>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 400);
    });
  </script>
</body>
</html>`;
}

/**
 * Open printable receipt or download HTML if pop-ups are blocked.
 * @returns {{ success: boolean, mode?: 'preview'|'download', message?: string }}
 */
export function generateReceipt(payment, config = null) {
  if (!payment) {
    return { success: false, message: 'Payment record is missing.' };
  }

  try {
    const html = buildReceiptHtml(payment, config || {});
    const filename = `Receipt-Flat-${payment.flatNo}-${payment.month}-${payment.year}.html`
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]/g, '');

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const preview = window.open(url, '_blank', 'noopener,noreferrer');
    if (preview) {
      setTimeout(() => URL.revokeObjectURL(url), 120_000);
      return { success: true, mode: 'preview' };
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);

    return {
      success: true,
      mode: 'download',
      message: 'Receipt downloaded. Open the file to print or save as PDF.',
    };
  } catch (err) {
    return { success: false, message: err?.message || 'Could not generate receipt.' };
  }
}
