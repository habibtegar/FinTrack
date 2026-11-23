import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { ToastNotification } from '../../types/finance';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useFinance();

  if (toasts.length === 0) return null;

  const renderIcon = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} className="ft-toast-icon-svg" />;
      case 'error':
        return <AlertCircle size={18} className="ft-toast-icon-svg" />;
      case 'warning':
        return <AlertTriangle size={18} className="ft-toast-icon-svg" />;
      case 'info':
      default:
        return <Info size={18} className="ft-toast-icon-svg" />;
    }
  };

  return (
    <div className="ft-toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`ft-toast-item ft-toast-${toast.type}`}>
          <div className="ft-toast-icon">{renderIcon(toast.type)}</div>
          <div className="ft-toast-content">
            <h5 className="ft-toast-title">{toast.title}</h5>
            {toast.message && <p className="ft-toast-msg">{toast.message}</p>}
          </div>
          <button
            type="button"
            className="ft-toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Tutup notifikasi"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
