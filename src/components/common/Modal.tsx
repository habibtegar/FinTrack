import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ft-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`ft-modal-container ft-modal-${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ft-modal-header">
          <div>
            <h3 className="ft-modal-title">{title}</h3>
            {subtitle && <p className="ft-modal-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="ft-modal-close-btn"
            onClick={onClose}
            aria-label="Tutup dialog"
          >
            <X size={20} />
          </button>
        </div>
        <div className="ft-modal-body">{children}</div>
      </div>
    </div>
  );
};
