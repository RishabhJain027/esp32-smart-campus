'use client';
import { useEffect, useRef } from 'react';

export default function ToastContainer({ toasts, removeToast }) {
    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast-${t.type}`}>
                    <span style={{ fontSize: 18 }}>
                        {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
                    </span>
                    <span style={{ flex: 1 }}>{t.message}</span>
                    <button
                        onClick={() => removeToast(t.id)}
                        style={{ color: 'var(--text-muted)', fontSize: 16, background: 'none', border: 'none', cursor: 'pointer' }}
                    >✕</button>
                </div>
            ))}
        </div>
    );
}
