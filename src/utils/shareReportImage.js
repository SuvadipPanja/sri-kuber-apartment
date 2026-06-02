import html2canvas from 'html2canvas';

/**
 * Capture a DOM node as PNG and share via Web Share API (WhatsApp on mobile) or download fallback.
 */
export async function shareReportAsImage(element, { title, filename }) {
  if (!element) throw new Error('Report element not found');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#f4f6f9',
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
  if (!blob) throw new Error('Could not create image');

  const file = new File([blob], filename, { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title, text: title, files: [file] });
    return { method: 'share' };
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);

  const waText = encodeURIComponent(`${title}\n\nPlease find the monthly report image attached (downloaded to your device).`);
  window.open(`https://wa.me/?text=${waText}`, '_blank');
  return { method: 'download' };
}
