import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      className={`pointer-events-auto p-3.5 rounded-2xl shadow-glass shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] border flex items-center justify-between space-x-3 transition-all duration-300 transform translate-y-0 animate-in slide-in-from-bottom-2 ${
        isSuccess
          ? 'bg-emerald-950 dark:bg-emerald-950 border-emerald-400/30 text-emerald-100'
          : isError
          ? 'bg-rose-950 dark:bg-rose-950 border-rose-400/30 text-rose-100'
          : 'bg-slate-900 dark:bg-slate-900 border-slate-700 text-slate-100'
      }`}
    >
      <div className="flex items-center space-x-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 border ${
            isSuccess
              ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400'
              : isError
              ? 'bg-rose-500/20 border-rose-400/30 text-rose-400'
              : 'bg-sky-500/20 border-sky-400/30 text-sky-400'
          }`}
        >
          {isSuccess && <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
          {isError && <AlertCircle className="w-4 h-4 stroke-[2.5]" />}
          {!isSuccess && !isError && <Info className="w-4 h-4 stroke-[2.5]" />}
        </div>
        <p className="text-xs sm:text-sm font-semibold leading-snug break-words">{toast.message}</p>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
