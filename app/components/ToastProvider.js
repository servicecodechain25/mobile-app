'use client';

import React from 'react';

export const ToastContext = React.createContext({ notify: (msg, type) => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);
  const notify = (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2500);
  };
  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div style={{ position: 'fixed', right: 12, bottom: 12, display: 'grid', gap: 8, zIndex: 2000 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ padding: '8px 12px', borderRadius: 8, color: '#fff', background: t.type === 'error' ? '#c21c1c' : '#0f7a3b', boxShadow: '0 2px 10px rgba(0,0,0,.15)' }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}


