import html2canvas from 'html2canvas';

/**
 * Capture a DOM node as PNG and share via Web Share API (WhatsApp on mobile) or download fallback.
 */
export async function shareReportAsImage(element, { title, filename }) {
  if (!element) throw new Error('Report element not found');

  element.scrollIntoView({ block: 'start', behavior: 'instant' });
  await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const width = element.scrollWidth || element.offsetWidth;
  const height = element.scrollHeight || element.offsetHeight;
  if (!width || !height) throw new Error('Report is not visible yet — please try again');

  const wrapper = document.createElement('div');
  wrapper.setAttribute('aria-hidden', 'true');
  wrapper.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;background:#f4f6f9;z-index:-1;`;
  const clone = element.cloneNode(true);
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  let canvas;
  try {
    canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f4f6f9',
      logging: false,
      width,
      height,
      scrollX: 0,
      scrollY: 0,
      windowWidth: width,
      windowHeight: height,
    });
  } finally {
    document.body.removeChild(wrapper);
  }

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create image'))), 'image/png', 0.95);
  });

  const file = new File([blob], filename, { type: 'image/png' });

  if (navigator.share) {
    try {
      const payload = { title, text: title, files: [file] };
      if (!navigator.canShare || navigator.canShare(payload)) {
        await navigator.share(payload);
        return { method: 'share' };
      }
    } catch (err) {
      if (err?.name === 'AbortError') return { method: 'cancelled' };
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 5000);

  try {
    await navigator.clipboard.writeText(title);
  } catch {
    /* clipboard optional */
  }

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title}\n\n📎 Monthly report image downloaded — please attach "${filename}" here.`)}`;
  const waWin = window.open(waUrl, '_blank', 'noopener,noreferrer');
  if (!waWin) {
    window.location.href = waUrl;
  }

  return { method: 'download' };
}
