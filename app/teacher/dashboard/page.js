'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockStudentsLive = [
    { id: 1, name: 'Rishabh Jain', roll: 'CS001', method: 'RFID', time: '09:02', status: 'present' },
    { id: 2, name: 'Priya Sharma', roll: 'CS002', method: 'Face', time: '09:04', status: 'present' },
    { id: 3, name: 'Arjun Singh', roll: 'CS003', method: 'RFID', time: '09:05', status: 'present' },
    { id: 4, name: 'Sneha Patel', roll: 'CS004', method: 'Face', time: '09:08', status: 'present' },
    { id: 5, name: 'Rahul Kumar', roll: 'CS005', method: '-', time: '-', status: 'absent' },
    { id: 6, name: 'Meera Nair', roll: 'CS006', method: 'RFID', time: '09:12', status: 'present' },
];

const classData = [
    { day: 'Mon', count: 38 }, { day: 'Tue', count: 41 },
    { day: 'Wed', count: 35 }, { day: 'Thu', count: 42 }, { day: 'Fri', count: 39 },
];

export default function TeacherDashboard() {
    const [sessionActive, setSessionActive] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [time, setTime] = useState('');
    const [tick, setTick] = useState(0);

    const presentCount = mockStudentsLive.filter(s => s.status === 'present').length;
    const absentCount = mockStudentsLive.filter(s => s.status === 'absent').length;

    useEffect(() => {
        const t = setInterval(() => {
            setTime(new Date().toLocaleTimeString('en-IN'));
            setTick(n => n + 1);
        }, 1000);
        setTime(new Date().toLocaleTimeString('en-IN'));
        return () => clearInterval(t);
    }, []);

    async function toggleSession() {
        if (!sessionActive) {
            setSessionId(`LEC_${Date.now()}`);
            setSessionActive(true);
        } else {
            setSessionActive(false);
            setSessionId(null);
        }
    }

    function downloadExcel() {
        const rows = [['Roll No', 'Name', 'Status', 'Method', 'Time']];
        mockStudentsLive.forEach(s => rows.push([s.roll, s.name, s.status, s.method, s.time]));
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'attendance.csv'; a.click();
    }

    return (
        <DashboardLayout title="Teacher Portal">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 800 }}>Teacher Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                        Data Structures – CS301 · 18 March 2026 · {time}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button className="btn btn-ghost btn-sm" onClick={downloadExcel}>📥 Export CSV</button>
                    <a href="/face-attendance" className="btn btn-ghost btn-sm">📷 Face Scanner</a>
                    <button
                        className={`btn btn-${sessionActive ? 'danger' : 'success'}`}
                        onClick={toggleSession}
                        style={{ minWidth: 180 }}
                    >
                        {sessionActive
                            ? '⏹️ Stop Attendance'
                            : '▶️ Start Attendance'}
                    </button>
                </div>
            </div>

            {/* Session banner */}
            {sessionActive && (
                <div className="alert alert-success" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
                    <span>🟢 <strong>Live Session Active</strong> – Students can now mark attendance via RFID or Face</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{sessionId}</span>
                </div>
            )}

            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { icon: '🧑‍🎓', label: 'Total Students', value: mockStudentsLive.length, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
                    { icon: '✅', label: 'Present', value: presentCount, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
                    { icon: '❌', label: 'Absent', value: absentCount, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
                    { icon: '📡', label: 'RFID Scans', value: mockStudentsLive.filter(s => s.method === 'RFID').length, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-icon" style={{ background: s.bg }}><span style={{ fontSize: 26 }}>{s.icon}</span></div>
                        <div className="stat-info">
                            <div className="stat-value" style={{ color: s.color, fontSize: 30 }}>{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ alignItems: 'start' }}>
                {/* Live attendance table */}
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                            {sessionActive ? (<><span className="wifi-dot" style={{ display: 'inline-block', marginRight: 8 }} />Live Attendance</>) : 'Attendance Record'}
                        </h3>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{presentCount}/{mockStudentsLive.length} present</span>
                    </div>
                    <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Method</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockStudentsLive.map(s => (
                                    <tr key={s.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className="avatar avatar-sm">{s.name.charAt(0)}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.roll}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {s.method !== '-' && (
                                                <span className="badge badge-blue">{s.method === 'RFID' ? '📡 RFID' : '📷 Face'}</span>
                                            )}
                                        </td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.time}</td>
                                        <td>
                                            <span className={`badge badge-${s.status === 'present' ? 'success' : 'danger'}`}>
                                                {s.status === 'present' ? '✓ Present' : '✕ Absent'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: 11 }}>
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Chart + info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card">
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📈 Weekly Attendance</h3>
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={classData} barSize={28}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }} />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Present" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>⚡ Quick Actions</h3>
                        {[
                            { icon: '📲', label: 'Send WhatsApp Alert', action: () => alert('WhatsApp notification sent!') },
                            { icon: '📊', label: 'View Full Report', href: '/teacher/reports' },
                            { icon: '🧑‍🎓', label: 'Student Profiles', href: '/teacher/students' },
                            { icon: '📅', label: 'Schedule Lecture', href: '/teacher/lecture' },
                        ].map((a, i) => (
                            a.href
                                ? <a key={i} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>
                                    <span style={{ fontSize: 18 }}>{a.icon}</span>{a.label}<span style={{ marginLeft: 'auto' }}>→</span>
                                </a>
                                : <button key={i} onClick={a.action} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', width: '100%', background: 'none', border: 'none', cursor: 'pointer', borderBottomColor: 'var(--border)', paddingBottom: 10, marginBottom: 0 }}>
                                    <span style={{ fontSize: 18 }}>{a.icon}</span>{a.label}
                                </button>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
