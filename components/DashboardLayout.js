'use client';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ToastContainer from './ToastContainer';

export default function DashboardLayout({ children, title = '', breadcrumb = '' }) {
    const [user, setUser] = useState({ name: '', role: 'student' });
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const stored = localStorage.getItem('sc_user');
        if (stored) setUser(JSON.parse(stored));
    }, []);

    function addToast(message, type = 'info') {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }

    function removeToast(id) {
        setToasts(prev => prev.filter(t => t.id !== id));
    }

    return (
        <div className="app-layout">
            <Sidebar role={user.role} user={user} />

            {/* Topbar */}
            <header className="topbar">
                <div className="topbar-left">
                    {title && <h1 className="topbar-title">{title}</h1>}
                    {breadcrumb && <span className="topbar-breadcrumb">/ {breadcrumb}</span>}
                </div>
                <div className="topbar-right">
                    <button className="topbar-btn" title="Notifications">
                        🔔<span className="badge" />
                    </button>
                    <button className="topbar-btn" title="Settings">⚙️</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="wifi-dot" title="System Online" />
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Live</span>
                    </div>
                </div>
            </header>

            <main className="main-content">
                <div className="page-content">
                    {typeof children === 'function' ? children({ addToast }) : children}
                </div>
            </main>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}
