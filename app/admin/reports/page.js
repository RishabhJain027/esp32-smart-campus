'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const monthlyData = [
    { month: 'Oct', pct: 88 }, { month: 'Nov', pct: 82 }, { month: 'Dec', pct: 75 },
    { month: 'Jan', pct: 90 }, { month: 'Feb', pct: 85 }, { month: 'Mar', pct: 91 },
];
const subjectData = [
    { subject: 'DS', present: 14, absent: 2 },
    { subject: 'CN', present: 12, absent: 3 },
    { subject: 'DBMS', present: 13, absent: 1 },
    { subject: 'OS', present: 10, absent: 5 },
    { subject: 'Algo', present: 15, absent: 1 },
];
const methodData = [{ name: 'RFID', value: 68 }, { name: 'Face', value: 32 }];
const COLORS = ['#3b82f6', '#10b981'];

const allStudentReport = [
    { name: 'Sneha Patel', roll: 'ECE01', dept: 'ECE', pct: 95, status: 'safe' },
    { name: 'Rishabh Jain', roll: 'CS001', dept: 'CS', pct: 91, status: 'safe' },
    { name: 'Arjun Singh', roll: 'IT001', dept: 'IT', pct: 85, status: 'safe' },
    { name: 'Priya Sharma', roll: 'CS002', dept: 'CS', pct: 78, status: 'safe' },
    { name: 'Rahul Kumar', roll: 'ME001', dept: 'ME', pct: 62, status: 'danger' },
];

export default function Reports() {
    const [view, setView] = useState('monthly');

    function downloadReport() {
        const rows = [['Name', 'Roll', 'Dept', 'Attendance%', 'Status']];
        allStudentReport.forEach(s => rows.push([s.name, s.roll, s.dept, s.pct, s.status === 'danger' ? 'Low' : 'Good']));
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'report.csv'; a.click();
    }

    return (
        <DashboardLayout title="Reports & Analytics">
            <div className="page-header">
                <div className="page-header-left">
                    <h1>📈 Attendance Reports</h1>
                    <p>Academic Year 2025–26 · Semester 4 · March 2026</p>
                </div>
                <div className="page-header-right">
                    <div style={{ display: 'flex', gap: 6 }}>
                        {['monthly', 'subject', 'method'].map(v => (
                            <button key={v} className={`btn btn-sm ${view === v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView(v)} style={{ textTransform: 'capitalize' }}>{v}</button>
                        ))}
                    </div>
                    <button className="btn btn-success btn-sm" onClick={downloadReport}>📥 Export CSV</button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Avg Attendance', value: '84%', icon: '📊', color: '#3b82f6' },
                    { label: 'Total Lectures', value: '78', icon: '📚', color: '#10b981' },
                    { label: 'Low Attendance', value: '1', icon: '⚠️', color: '#ef4444' },
                    { label: 'On Track', value: '4', icon: '✅', color: '#06b6d4' },
                ].map((s, i) => (
                    <div key={i} className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="card">
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
                        {view === 'monthly' ? '📅 Monthly Trend' : view === 'subject' ? '📚 Subject-wise' : '🔄 Verification Method'}
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                        {view === 'monthly' ? (
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[60, 100]} />
                                <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }} />
                                <Line type="monotone" dataKey="pct" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} name="Attendance %" />
                            </LineChart>
                        ) : view === 'subject' ? (
                            <BarChart data={subjectData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }} />
                                <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} name="Present" />
                                <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absent" />
                            </BarChart>
                        ) : (
                            <PieChart>
                                <Pie data={methodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                                    {methodData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
                            </PieChart>
                        )}
                    </ResponsiveContainer>
                </div>

                {/* Student Report Table */}
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '20px 24px 16px' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>🎓 Student Summary</h3>
                    </div>
                    <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>Student</th><th>Dept</th><th>Attendance</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {allStudentReport.map((s, i) => (
                                    <tr key={i}>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.roll}</div>
                                        </td>
                                        <td>{s.dept}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="progress-bar" style={{ width: 50, height: 5 }}>
                                                    <div className={`progress-fill ${s.pct >= 75 ? 'green' : 'amber'}`} style={{ width: `${s.pct}%` }} />
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: s.pct >= 75 ? '#10b981' : '#f59e0b' }}>{s.pct}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${s.status === 'safe' ? 'success' : 'danger'}`}>
                                                {s.status === 'safe' ? '✓ Good' : '⚠ Low'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* WhatsApp Report */}
            <div className="card" style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 32 }}>💬</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>Send Monthly Reports via WhatsApp</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Send attendance reports to all parents for March 2026. 248 students · Requires Twilio API key.</div>
                    </div>
                    <button className="btn btn-success" onClick={() => alert('WhatsApp reports queued! (Add Twilio keys to .env.local)')}>
                        📲 Send to All Parents
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}
