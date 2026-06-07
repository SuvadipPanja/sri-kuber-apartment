import { createPortal } from 'react-dom';
import { useEffect } from 'react';

/**
 * Renders modals on document.body so they are not clipped by page animations (transform)
 * or overflow on main-content / page-container.
 */
export default function Modal({ open, onClose, children, wide = false, narrow = false, className = '' }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !onClose) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const boxClass = ['modal-box', wide && 'wide', narrow && 'narrow', className].filter(Boolean).join(' ');

  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className={boxClass} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body
  );
}
