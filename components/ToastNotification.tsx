
import React, { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'xp';

export interface ToastEventDetail {
  message: string;
  type: ToastType;
}

const ToastNotification: React.FC = () => {
  const [toasts, setToasts] = useState<{id: number, message: string, type: ToastType}[]>([]);

  useEffect(() => {
    const handleToast = (e: CustomEvent<ToastEventDetail>) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message: e.detail.message, type: e.detail.type }]);
      
      // Auto remove after 3s
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };

    window.addEventListener('show-toast' as any, handleToast);
    return () => window.removeEventListener('show-toast' as any, handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`
            pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-right-10 duration-300
            ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : ''}
            ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : ''}
            ${toast.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : ''}
            ${toast.type === 'xp' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : ''}
          `}
        >
          <div className={`
            size-8 rounded-full flex items-center justify-center shrink-0
            ${toast.type === 'success' ? 'bg-green-500/20' : ''}
            ${toast.type === 'error' ? 'bg-red-500/20' : ''}
            ${toast.type === 'info' ? 'bg-blue-500/20' : ''}
            ${toast.type === 'xp' ? 'bg-amber-500/20' : ''}
          `}>
            <span className="material-symbols-outlined text-sm font-black">
                {toast.type === 'success' && 'check'}
                {toast.type === 'error' && 'error'}
                {toast.type === 'info' && 'info'}
                {toast.type === 'xp' && 'bolt'}
            </span>
          </div>
          <div>
             <p className="text-xs font-black uppercase tracking-widest opacity-70">
                {toast.type === 'xp' ? 'Experiencia' : 'Notificación'}
             </p>
             <p className="font-bold text-sm text-white">{toast.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper para lanzar notificaciones desde cualquier lugar
export const showToast = (message: string, type: ToastType = 'info') => {
  const event = new CustomEvent('show-toast', { detail: { message, type } });
  window.dispatchEvent(event);
};

export default ToastNotification;
