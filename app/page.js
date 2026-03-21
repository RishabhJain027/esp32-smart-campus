'use client';
import Link from 'next/link';

export default function LandingPage() {
    const features = [
        { icon: '🔐', title: 'RFID Entry Control', desc: 'Secure campus gate access with verified RFID card scanning and real-time logging.' },
        { icon: '📷', title: 'AI Face Recognition', desc: 'face-api.js powered in-browser face matching — no third-party servers needed.' },
        { icon: '📲', title: 'WhatsApp Alerts', desc: 'Instant Twilio WhatsApp notifications for students & parents on every scan.' },
        { icon: '☁️', title: 'Firebase Cloud Sync', desc: 'Real-time Firestore database with live teacher dashboard updates in under 2s.' },
        { icon: '📊', title: 'Analytics Dashboard', desc: 'Attendance heatmaps, trend charts, and absentee alerts for every class.' },
        { icon: '🌐', title: 'Google Sheets Sync', desc: 'Auto-export attendance to Google Sheets with live API sync.' },
    ];

    const stats = [
        { value: '3', label: 'User Roles' },
        { value: '30+', label: 'REST APIs' },
        { value: '2s', label: 'Real-time Sync' },
        { value: '99%', label: 'Uptime Target' },
    ];

    const modules = [
        { icon: '🚪', label: 'Campus Entry' },
        { icon: '📡', label: 'RFID Scan' },
        { icon: '🤖', label: 'Face AI' },
        { icon: '☁️', label: 'Cloud DB' },
        { icon: '📋', label: 'Sheets Sync' },
        { icon: '💬', label: 'WhatsApp' },
        { icon: '👤', label: 'Student Profiles' },
        { icon: '👨‍🏫', label: 'Teacher Portal' },
    ];

    return (
        <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>
            {/* ── HERO ── */}
            <section style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 24px 60px',
                position: 'relative',
                textAlign: 'center',
                overflow: 'hidden',
            }}>
                {/* Background blobs */}
                <div style={{
                    position: 'absolute', top: '15%', left: '10%',
                    width: 600, height: 600,
                    background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', bottom: '10%', right: '5%',
                    width: 500, height: 500,
                    background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none',
                }} />

                {/* Nav */}
                <nav style={{
                    position: 'fixed', top: 0, left: 0, right: 0,
                    height: 64,
                    background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 40px',
                    zIndex: 100,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 24 }}>🏫</span>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2 }}>PSR Campus</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>IoT Attendance System</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Link href="/login" className="btn btn-outline btn-sm">Sign In</Link>
                        <Link href="/login?tab=signup" className="btn btn-primary btn-sm">Get Started</Link>
                    </div>
                </nav>

                {/* Hero content */}
                <div style={{ position: 'relative', zIndex: 1, maxWidth: 820 }}>
                    <div className="badge badge-blue animate-fade-in" style={{ marginBottom: 24, fontSize: 13, padding: '6px 16px' }}>
                        🎓 College Project · Finals-Ready · Startup-Grade
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(36px, 6vw, 72px)',
                        fontWeight: 900,
                        lineHeight: 1.05,
                        letterSpacing: '-0.03em',
                        marginBottom: 24,
                        background: 'linear-gradient(135deg, #0f172a 30%, #2563eb 60%, #0891b2)',
                        backgroundSize: '200% 200%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: 'gradientShift 4s ease infinite',
                    }}>
                        AI-Powered Smart<br />Campus Attendance
                    </h1>

                    <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 620, margin: '0 auto 40px', lineHeight: 1.7 }}>
                        IoT · RFID · Face Recognition · Cloud Database · WhatsApp Notifications —
                        a startup-grade attendance & entry system built for modern campuses.
                    </p>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/login" className="btn btn-primary btn-lg">
                            🚀 Launch Dashboard
                        </Link>
                        <button className="btn btn-outline btn-lg" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
                            Explore Features
                        </button>
                    </div>

                    {/* Stats bar */}
                    <div style={{
                        display: 'flex', gap: 0, justifyContent: 'center',
                        marginTop: 60,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-xl)',
                        overflow: 'hidden',
                        maxWidth: 560,
                        margin: '60px auto 0',
                    }}>
                        {stats.map((s, i) => (
                            <div key={i} style={{
                                flex: 1, padding: '20px 16px', textAlign: 'center',
                                borderRight: i < stats.length - 1 ? '1px solid var(--border)' : 'none',
                            }}>
                                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-blue)', letterSpacing: '-0.02em' }}>{s.value}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MODULES ── */}
            <section style={{ padding: '80px 32px', background: 'var(--bg-secondary)' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 8 }}>8 Core Modules</h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 48, fontSize: 15 }}>Everything integrated in one system</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                        {modules.map((m, i) => (
                            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', flex: '0 0 auto' }}>
                                <span style={{ fontSize: 24 }}>{m.icon}</span>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section id="features" style={{ padding: '80px 32px' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Why PSR Campus?</h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 48, fontSize: 15 }}>Enterprise-grade features in a college project</p>
                    <div className="grid-3" style={{ gap: 20 }}>
                        {features.map((f, i) => (
                            <div key={i} className="card" style={{ padding: '28px 24px' }}>
                                <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
                                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FLOW ── */}
            <section style={{ padding: '80px 32px', background: 'var(--bg-secondary)' }}>
                <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>System Data Flow</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 48, fontSize: 15 }}>From RFID scan to WhatsApp — end to end in seconds</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {['RFID Scan', 'ESP32', 'REST API', 'Firestore', 'Dashboard', 'Sheets', 'WhatsApp'].map((step, i, arr) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{
                                    padding: '10px 16px',
                                    background: i === 0 ? 'var(--grad-blue)' : 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: i === 0 ? '#fff' : 'var(--text-secondary)',
                                }}>{step}</div>
                                {i < arr.length - 1 && <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>→</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ROLES ── */}
            <section style={{ padding: '80px 32px' }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Three Portals</h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 48 }}>Separate dashboards optimized for each role</p>
                    <div className="grid-3" style={{ gap: 20 }}>
                        {[
                            { role: 'Admin', icon: '🛠️', color: 'var(--color-red)', items: ['Manage Students & Teachers', 'Assign RFID Cards', 'Entry Logs & Alerts', 'System Settings'] },
                            { role: 'Teacher', icon: '👨‍🏫', color: 'var(--color-blue)', items: ['Start/Stop Attendance', 'Live Student Feed', 'Download Excel Reports', 'Send WhatsApp Alerts'] },
                            { role: 'Student', icon: '🧑‍🎓', color: 'var(--color-green)', items: ['Attendance Dashboard', 'RFID / Face Check-In', 'LinkedIn Profile', 'Monthly Reports'] },
                        ].map((r, i) => (
                            <div key={i} className="card" style={{ textAlign: 'center', padding: '32px 24px', borderTop: `3px solid ${r.color}` }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>{r.icon}</div>
                                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, color: r.color }}>{r.role}</h3>
                                <ul style={{ listStyle: 'none', textAlign: 'left' }}>
                                    {r.items.map((it, j) => (
                                        <li key={j} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '6px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                                            <span style={{ color: r.color }}>✓</span>{it}
                                        </li>
                                    ))}
                                </ul>
                                <Link href="/login" className="btn btn-primary btn-sm" style={{ marginTop: 20, width: '100%', display: 'flex', justifyContent: 'center' }}>
                                    Login as {r.role}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section style={{
                padding: '80px 32px',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(6,182,212,0.08))',
                borderTop: '1px solid var(--border)',
                textAlign: 'center',
            }}>
                <div style={{ maxWidth: 600, margin: '0 auto' }}>
                    <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Ready to go live?</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15, lineHeight: 1.7 }}>
                        Add your Firebase keys and Twilio credentials, connect your ESP32, and your campus goes smart in minutes.
                    </p>
                    <Link href="/login" className="btn btn-primary btn-lg" style={{ padding: '16px 48px', fontSize: 18, display: 'inline-flex' }}>
                        🏫 Open Dashboard
                    </Link>
                </div>
                <div style={{ marginTop: 60, paddingTop: 32, borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13 }}>
                    PSR Campus System · Built with Next.js, Firebase, ESP32 · 2026
                </div>
            </section>
        </div>
    );
}
