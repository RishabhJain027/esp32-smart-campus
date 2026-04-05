'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import BiometricsManager from '@/components/BiometricsManager';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [tab, setTab] = useState('login');
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [signupForm, setSignupForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        phone: '', department: '', semester: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', reqs: {} });

    useEffect(() => {
        if (searchParams.get('tab') === 'signup') setTab('signup');
    }, [searchParams]);

    function checkPasswordStrength(pwd) {
        const reqs = {
            length: pwd.length >= 8,
            uppercase: /[A-Z]/.test(pwd),
            lowercase: /[a-z]/.test(pwd),
            number: /\d/.test(pwd),
            special: /[@$!%*?&]/.test(pwd),
        };
        const score = Object.values(reqs).filter(Boolean).length;
        const label = score <= 1 ? 'weak' : score <= 3 ? 'fair' : score === 4 ? 'good' : 'strong';
        setPasswordStrength({ score, label, reqs });
    }

    async function handleLogin(e) {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...loginForm, role }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            document.cookie = `sc_token=${data.token}; path=/; max-age=86400; SameSite=Strict`;
            localStorage.setItem('sc_user', JSON.stringify(data.user));
            router.push(`/${data.user.role}/dashboard`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSignup(e) {
        e.preventDefault();
        setError('');
        if (signupForm.password !== signupForm.confirmPassword) {
            setError('Passwords do not match'); return;
        }
        if (passwordStrength.score < 5) {
            setError('Password does not meet all requirements'); return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...signupForm, role }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');
            setSuccess('Account created! Please wait for admin approval, then log in.');
            setTab('login');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const roleColors = { admin: '#ef4444', teacher: '#3b82f6', student: '#10b981' };
    const roleColor = roleColors[role];

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'var(--bg-primary)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background */}
            <div style={{
                position: 'fixed', top: '20%', left: '5%',
                width: 700, height: 700,
                background: `radial-gradient(circle, ${roleColor}18 0%, transparent 70%)`,
                borderRadius: '50%', pointerEvents: 'none',
                transition: 'background 0.5s ease',
            }} />
            <div style={{
                position: 'fixed', bottom: '5%', right: '5%',
                width: 500, height: 500,
                background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
                borderRadius: '50%', pointerEvents: 'none',
            }} />

            <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 60, height: 60,
                        background: 'var(--grad-blue)',
                        borderRadius: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, margin: '0 auto 12px',
                    }}>🏫</div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>PSR Campus</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>AI-Powered Attendance System</p>
                </div>

                {/* Card */}
                <div className="card-glass" style={{ padding: 32 }}>
                    {/* Tab Toggle */}
                    <div style={{
                        display: 'flex', gap: 4, marginBottom: 28,
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 10, padding: 4,
                    }}>
                        {['login', 'signup'].map(t => (
                            <button key={t} onClick={() => setTab(t)} style={{
                                flex: 1, padding: '9px', border: 'none',
                                borderRadius: 8, fontSize: 14, fontWeight: 600,
                                background: tab === t ? 'var(--bg-secondary)' : 'transparent',
                                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                                boxShadow: tab === t ? '0 1px 6px rgba(0,0,0,0.3)' : 'none',
                                transition: 'var(--transition)', cursor: 'pointer',
                            }}>{t === 'login' ? 'Sign In' : 'Sign Up'}</button>
                        ))}
                    </div>

                    {/* Role Selector */}
                    <div style={{ marginBottom: 24 }}>
                        <div className="form-label">Login as</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['student', 'teacher', 'admin'].map(r => (
                                <button key={r} onClick={() => setRole(r)} style={{
                                    flex: 1, padding: '9px 6px', border: `2px solid ${role === r ? roleColors[r] : 'var(--border)'}`,
                                    borderRadius: 8, fontSize: 12, fontWeight: 700,
                                    background: role === r ? `${roleColors[r]}15` : 'transparent',
                                    color: role === r ? roleColors[r] : 'var(--text-muted)',
                                    textTransform: 'capitalize', transition: 'var(--transition)', cursor: 'pointer',
                                }}>
                                    {r === 'admin' ? '🛠️' : r === 'teacher' ? '👨‍🏫' : '🧑‍🎓'} {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Alerts */}
                    {error && <div className="alert alert-error">⚠️ {error}</div>}
                    {success && <div className="alert alert-success">✅ {success}</div>}



                    {/* LOGIN FORM */}
                    {tab === 'login' && (
                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <div className="form-input-icon">
                                    <span className="icon">📧</span>
                                    <input
                                        className="form-input"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={loginForm.email}
                                        onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16 }}>🔒</span>
                                    <input
                                        className="form-input"
                                        style={{ paddingLeft: 40, paddingRight: 44 }}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Your password"
                                        value={loginForm.password}
                                        onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPassword(s => !s)} style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        color: 'var(--text-muted)', fontSize: 16, background: 'none', border: 'none', cursor: 'pointer',
                                    }}>{showPassword ? '🙈' : '👁️'}</button>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', marginBottom: 20 }}>
                                <a href="/forgot-password" style={{ fontSize: 12, color: 'var(--color-blue)' }}>Forgot password?</a>
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px' }} type="submit" disabled={loading}>
                                {loading ? <><span className="spinner" /> Signing in...</> : `🚀 Sign In as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                            </button>
                            
                            <div style={{ position: 'relative', margin: '20px 0', textAlign: 'center' }}>
                                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed var(--border)' }} />
                                <span style={{ position: 'relative', background: 'var(--bg-card)', padding: '0 10px', fontSize: 12, color: 'var(--text-muted)' }}>OR</span>
                            </div>

                            <BiometricsManager 
                                userId="last_user" // Simplified for demo purpose
                                mode="authenticate" 
                                buttonText="Sign In with OS Fingerprint"
                                style={{ width: '100%', justifyContent: 'center', background: 'var(--bg-secondary)', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
                                onSuccess={() => {
                                    const savedUserStr = localStorage.getItem('sc_user');
                                    let navRole = 'student';
                                    if (savedUserStr) {
                                        const saved = JSON.parse(savedUserStr);
                                        navRole = saved.role || 'student';
                                    }
                                    // Set demo biometric token
                                    document.cookie = `sc_token=demo-biometric-token; path=/; max-age=86400; SameSite=Strict`;
                                    router.push(`/${navRole}/dashboard`);
                                }}
                            />
                        </form>
                    )}

                    {/* SIGNUP FORM */}
                    {tab === 'signup' && (
                        <form onSubmit={handleSignup}>
                            <div className="grid-2" style={{ gap: 12, marginBottom: 0 }}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input className="form-input" placeholder="Rishabh Jain" value={signupForm.name}
                                        onChange={e => setSignupForm(p => ({ ...p, name: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className="form-input" placeholder="+91 9XXXXXXXXX" value={signupForm.phone}
                                        onChange={e => setSignupForm(p => ({ ...p, phone: e.target.value }))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input className="form-input" type="email" placeholder="you@college.edu" value={signupForm.email}
                                    onChange={e => setSignupForm(p => ({ ...p, email: e.target.value }))} required />
                            </div>
                            {role === 'student' && (
                                <div className="grid-2" style={{ gap: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">Department</label>
                                        <input className="form-input" placeholder="Computer Science" value={signupForm.department}
                                            onChange={e => setSignupForm(p => ({ ...p, department: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Semester</label>
                                        <input className="form-input" placeholder="4" value={signupForm.semester}
                                            onChange={e => setSignupForm(p => ({ ...p, semester: e.target.value }))} />
                                    </div>
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="form-input"
                                        style={{ paddingRight: 44 }}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Create a strong password"
                                        value={signupForm.password}
                                        onChange={e => {
                                            setSignupForm(p => ({ ...p, password: e.target.value }));
                                            checkPasswordStrength(e.target.value);
                                        }}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPassword(s => !s)} style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        color: 'var(--text-muted)', fontSize: 16, background: 'none', border: 'none', cursor: 'pointer',
                                    }}>{showPassword ? '🙈' : '👁️'}</button>
                                </div>
                                {/* Strength meter */}
                                {signupForm.password && (
                                    <>
                                        <div className="strength-bar">
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <div key={n} className={`strength-bar-seg ${n <= passwordStrength.score ? `active-${passwordStrength.label}` : ''}`} />
                                            ))}
                                        </div>
                                        <div className={`strength-label ${passwordStrength.label}`}>
                                            {passwordStrength.label.charAt(0).toUpperCase() + passwordStrength.label.slice(1)} password
                                        </div>
                                        <div className="requirements-list">
                                            {[
                                                ['length', '8–32 characters'],
                                                ['uppercase', 'One uppercase letter'],
                                                ['lowercase', 'One lowercase letter'],
                                                ['number', 'One number'],
                                                ['special', 'One special character (@$!%*?&)'],
                                            ].map(([key, label]) => (
                                                <div key={key} className={`req-item ${passwordStrength.reqs[key] ? 'met' : ''}`}>
                                                    <div className="req-dot" />
                                                    {label}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <input
                                    className="form-input"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Repeat password"
                                    value={signupForm.confirmPassword}
                                    onChange={e => setSignupForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                    required
                                />
                                {signupForm.confirmPassword && signupForm.password !== signupForm.confirmPassword && (
                                    <div className="form-error">Passwords do not match</div>
                                )}
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px' }} type="submit" disabled={loading}>
                                {loading ? <><span className="spinner" /> Creating Account...</> : '✨ Create Account'}
                            </button>
                        </form>
                    )}

                    <div className="divider-text" style={{ marginTop: 24 }}>
                        <a href="/" style={{ color: 'var(--text-muted)', fontSize: 12 }}>← Back to home</a>
                    </div>
                </div>

                {/* Security note */}
                <div style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-muted)', fontSize: 12 }}>
                    🔒 Secured with JWT · bcrypt · Rate Limiting · HTTPS
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><span className="spinner spinner-lg" /></div>}>
            <LoginContent />
        </Suspense>
    );
}
