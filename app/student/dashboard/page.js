'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function StudentDashboard() {
    const [user, setUser] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [summary, setSummary] = useState([]);
    const [entries, setEntries] = useState([]);
    const [time, setTime] = useState('');
    const [loading, setLoading] = useState(true);

    const overall = summary.length > 0
        ? Math.round(summary.reduce((s, a) => s + (a.percentage || 0), 0) / summary.length)
        : 0;

    useEffect(() => {
        const t = setInterval(() => setTime(new Date().toLocaleTimeString('en-IN')), 1000);
        setTime(new Date().toLocaleTimeString('en-IN'));

        const authUser = localStorage.getItem('sc_user');
        if (authUser) {
            const parsedUser = JSON.parse(authUser);
            setUser(parsedUser);
            fetchData(parsedUser.id);
        } else {
            setLoading(false);
        }

        return () => clearInterval(t);
    }, []);

    async function fetchData(studentId) {
        try {
            const [attRes, entryRes] = await Promise.all([
                fetch(`/api/attendance?student_id=${studentId}`),
                fetch(`/api/entries?student_id=${studentId}`)
            ]);
            
            if (attRes.ok) {
                const attData = await attRes.json();
                setAttendance(attData.records || []);
                setSummary(attData.summary || []);
            }
            if (entryRes.ok) {
                const entryData = await entryRes.json();
                setEntries((entryData.entries || []).slice(0, 5));
            }
        } catch (e) {
            console.error("Error fetching data:", e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <DashboardLayout title="Student Dashboard"><div style={{padding: 20}}>Loading...</div></DashboardLayout>;

    return (
        <DashboardLayout title="Student Dashboard">
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                    <div className="avatar avatar-lg" style={{ background: 'var(--grad-blue)' }}>{user?.name?.charAt(0) || 'U'}</div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Welcome back, {user?.name?.split(' ')[0] || 'Student'}! 👋</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{user?.department || 'Department Base'} – Semester {user?.semester || '1'} · Roll: {user?.id} · {time}</p>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { icon: '📊', label: 'Overall Attendance', value: `${overall}%`, color: overall >= 75 ? '#10b981' : '#f59e0b', bg: overall >= 75 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', change: overall >= 75 ? '✓ Good standing' : '⚠ Improve attendance' },
                    { icon: '✅', label: 'Today\'s Status', value: attendance.some(a => new Date(a.date).toDateString() === new Date().toDateString() && a.status === 'present') ? 'Present' : 'Not Marked', color: '#10b981', bg: 'rgba(16,185,129,0.12)', change: 'Auto-updated' },
                    { icon: '🚪', label: 'Recent Entry', value: entries.length > 0 ? new Date(entries[0].time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'None', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', change: entries.length > 0 ? `Via ${entries[0].method} – ${entries[0].gate}` : '' },
                    { icon: '📚', label: 'Active Subjects', value: summary.length.toString(), color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', change: 'Tracking' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-icon" style={{ background: s.bg }}><span style={{ fontSize: 26 }}>{s.icon}</span></div>
                        <div className="stat-info">
                            <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.change}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ marginBottom: 24, alignItems: 'start' }}>
                {/* Subject-wise attendance */}
                <div className="card">
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📚 Subject-wise Attendance</h3>
                    {summary.length > 0 ? summary.map((s, i) => (
                        <div key={i} style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 500 }}>{s.subject}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: (s.percentage || 0) >= 75 ? '#10b981' : '#f59e0b' }}>{s.percentage || 0}%</span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className={`progress-fill ${(s.percentage || 0) >= 75 ? 'green' : 'amber'}`}
                                    style={{ width: `${s.percentage || 0}%` }}
                                />
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                {s.present}/{s.total} lectures — {(s.percentage || 0) < 75 ? `⚠ Need ${Math.ceil(0.75 * s.total) - s.present} more` : '✓ On track'}
                            </div>
                        </div>
                    )) : <div style={{color:'var(--text-muted)'}}>No attendance records yet.</div>}
                </div>

                {/* Right col */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Attendance score ring */}
                    <div className="card" style={{ textAlign: 'center', padding: '28px 24px' }}>
                        <div style={{
                            width: 120, height: 120,
                            borderRadius: '50%',
                            background: `conic-gradient(${overall >= 75 ? '#10b981' : '#f59e0b'} ${overall * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px',
                            position: 'relative',
                        }}>
                            <div style={{
                                width: 90, height: 90, borderRadius: '50%',
                                background: 'var(--bg-card)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexDirection: 'column',
                            }}>
                                <div style={{ fontSize: 24, fontWeight: 900, color: overall >= 75 ? '#10b981' : '#f59e0b' }}>{overall}%</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Overall</div>
                            </div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>Attendance Score</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                            {overall >= 75 ? '✅ Eligible for exams' : '⚠️ Below 75% threshold'}
                        </div>
                        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                            <a href="/face-attendance" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                                📷 Face Check-In
                            </a>
                        </div>
                    </div>

                    {/* Campus Entry Logs */}
                    <div className="card">
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>🚪 Recent Campus Entries</h3>
                        {entries.length > 0 ? entries.map((e, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                                    {e.method === 'RFID' ? '📡' : '📷'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{e.gate}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(e.time).toLocaleString([], {month:'short', day:'numeric', hour: '2-digit', minute:'2-digit'})} · Via {e.method}</div>
                                </div>
                                <span className={`badge badge-${e.status === 'granted' ? 'success' : 'danger'}`}>
                                    {e.status === 'granted' ? '✓' : '✕'}
                                </span>
                            </div>
                        )) : <div style={{color:'var(--text-muted)'}}>No recent entries.</div>}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
