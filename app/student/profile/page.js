'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const defaultProfile = {
    name: 'Rishabh Jain',
    roll: 'CS2021001',
    department: 'Computer Science',
    semester: '4',
    email: 'rishabh.jain@college.edu',
    phone: '+91 9876543210',
    parentPhone: '+91 9876543211',
    rfidUid: 'A7B45C2D',
    faceId: 'FACE_001_RJ',
    linkedinUrl: 'https://linkedin.com/in/rishabhjain',
    githubUrl: 'https://github.com/rishabhjain24',
    portfolioUrl: 'https://rishabhjain.dev',
    skills: ['Python', 'React', 'Node.js', 'Firebase', 'ESP32', 'Machine Learning'],
    projects: [
        { title: 'PSR Campus System', desc: 'IoT attendance with RFID + Face Recognition + Firebase', tech: 'ESP32, Next.js, Firebase' },
        { title: 'ML Stock Predictor', desc: 'LSTM-based stock price prediction model', tech: 'Python, TensorFlow' },
    ],
};

export default function StudentProfile() {
    const [profile, setProfile] = useState(defaultProfile);
    const [editMode, setEditMode] = useState(false);
    const [saved, setSaved] = useState(false);
    const [newSkill, setNewSkill] = useState('');

    function save() {
        setSaved(true);
        setEditMode(false);
        setTimeout(() => setSaved(false), 3000);
    }

    function addSkill() {
        if (newSkill.trim()) {
            setProfile(p => ({ ...p, skills: [...p.skills, newSkill.trim()] }));
            setNewSkill('');
        }
    }

    function removeSkill(skill) {
        setProfile(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }));
    }

    const initials = profile.name.split(' ').map(w => w[0]).join('').toUpperCase();

    return (
        <DashboardLayout title="My Profile">
            {saved && <div className="alert alert-success animate-fade-in">✅ Profile updated successfully!</div>}

            <div className="grid-2" style={{ alignItems: 'start', gap: 20 }}>
                {/* Left – Profile Card */}
                <div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {/* Cover */}
                        <div style={{
                            height: 110,
                            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                            position: 'relative',
                        }}>
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)',
                            }} />
                        </div>
                        <div style={{ padding: '0 24px 24px' }}>
                            <div style={{ marginTop: -40, marginBottom: 16, position: 'relative', display: 'inline-block' }}>
                                <div className="avatar avatar-xl" style={{ background: 'var(--grad-blue)', border: '4px solid var(--bg-secondary)' }}>
                                    {initials}
                                </div>
                                {editMode && (
                                    <button style={{
                                        position: 'absolute', bottom: 0, right: 0,
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: 'var(--grad-blue)', border: '2px solid var(--bg-secondary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, cursor: 'pointer',
                                    }}>📷</button>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <h2 style={{ fontSize: 20, fontWeight: 800 }}>{profile.name}</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
                                        {profile.department} · Sem {profile.semester} · {profile.roll}
                                    </p>
                                </div>
                                <button className={`btn ${editMode ? 'btn-success' : 'btn-outline'} btn-sm`} onClick={editMode ? save : () => setEditMode(true)}>
                                    {editMode ? '💾 Save' : '✏️ Edit'}
                                </button>
                            </div>

                            {/* Social Links */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '7px 14px',
                                    background: 'rgba(10,102,194,0.15)',
                                    border: '1px solid rgba(10,102,194,0.3)',
                                    borderRadius: 8, fontSize: 12, fontWeight: 600,
                                    color: '#0a66c2', textDecoration: 'none',
                                    transition: 'var(--transition)',
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                                    LinkedIn
                                </a>
                                <a href={profile.githubUrl} target="_blank" rel="noreferrer" style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '7px 14px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 8, fontSize: 12, fontWeight: 600,
                                    color: 'var(--text-secondary)', textDecoration: 'none',
                                }}>⌨️ GitHub</a>
                                {profile.portfolioUrl && (
                                    <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '7px 14px',
                                        background: 'rgba(139,92,246,0.1)',
                                        border: '1px solid rgba(139,92,246,0.25)',
                                        borderRadius: 8, fontSize: 12, fontWeight: 600,
                                        color: '#8b5cf6', textDecoration: 'none',
                                    }}>🌐 Portfolio</a>
                                )}
                            </div>

                            {/* RFID / Face IDs */}
                            <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: '14px', marginBottom: 16 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>System IDs</div>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>RFID Card UID</div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-cyan)', fontWeight: 600 }}>{profile.rfidUid}</div>
                                    </div>
                                    <div style={{ width: 1, background: 'var(--border)' }} />
                                    <div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Face ID</div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-purple)', fontWeight: 600 }}>{profile.faceId}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Skills */}
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🛠️ Skills</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {profile.skills.map((skill, i) => (
                                        <span key={i} style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            padding: '4px 12px',
                                            background: 'rgba(59,130,246,0.1)',
                                            border: '1px solid rgba(59,130,246,0.2)',
                                            borderRadius: 20,
                                            fontSize: 12, fontWeight: 500, color: '#3b82f6',
                                        }}>
                                            {skill}
                                            {editMode && (
                                                <button onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-red)', fontSize: 12, lineHeight: 1 }}>✕</button>
                                            )}
                                        </span>
                                    ))}
                                    {editMode && (
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <input
                                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 10px', fontSize: 12, color: 'var(--text-primary)', width: 100 }}
                                                placeholder="Add skill"
                                                value={newSkill}
                                                onChange={e => setNewSkill(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && addSkill()}
                                            />
                                            <button onClick={addSkill} className="btn btn-primary btn-sm" style={{ padding: '4px 10px' }}>+</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right – Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Contact Info */}
                    <div className="card">
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📋 Contact Information</h3>
                        {[
                            { icon: '📧', label: 'Email', field: 'email', type: 'email' },
                            { icon: '📱', label: 'Phone', field: 'phone', type: 'tel' },
                            { icon: '👨‍👩‍👦', label: 'Parent Phone', field: 'parentPhone', type: 'tel' },
                            { icon: '🔗', label: 'LinkedIn URL', field: 'linkedinUrl', type: 'url' },
                            { icon: '⌨️', label: 'GitHub URL', field: 'githubUrl', type: 'url' },
                        ].map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{f.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{f.label}</div>
                                    {editMode
                                        ? <input
                                            className="form-input"
                                            type={f.type}
                                            value={profile[f.field]}
                                            onChange={e => setProfile(p => ({ ...p, [f.field]: e.target.value }))}
                                            style={{ padding: '6px 10px', fontSize: 13 }}
                                        />
                                        : <div style={{ fontSize: 13, fontWeight: 500 }}>{profile[f.field] || '—'}</div>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Projects */}
                    <div className="card">
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🚀 Projects</h3>
                        {profile.projects.map((p, i) => (
                            <div key={i} style={{ padding: '14px', marginBottom: 10, background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.title}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{p.desc}</div>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {p.tech.split(', ').map((t, j) => (
                                        <span key={j} className="chip" style={{ fontSize: 11 }}>{t}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Attendance Summary */}
                    <div className="card">
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📊 Attendance Summary</h3>
                        {[
                            { subject: 'Data Structures', pct: 87 },
                            { subject: 'Computer Networks', pct: 80 },
                            { subject: 'DBMS', pct: 93 },
                            { subject: 'OS', pct: 67 },
                        ].map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <div style={{ fontSize: 12, width: 130, flexShrink: 0 }}>{s.subject}</div>
                                <div className="progress-bar" style={{ flex: 1 }}>
                                    <div className={`progress-fill ${s.pct >= 75 ? 'green' : 'amber'}`} style={{ width: `${s.pct}%` }} />
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 700, width: 38, textAlign: 'right', color: s.pct >= 75 ? '#10b981' : '#f59e0b' }}>{s.pct}%</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
