'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const mockLogs = [
    { id: 1, student: 'Rishabh Jain', roll: 'CS001', gate: 'Main Gate A', entryTime: '09:02:14 AM', exitTime: '05:34:22 PM', method: 'RFID', personCount: 1, alert: false },
    { id: 2, student: 'Priya Sharma', roll: 'CS002', gate: 'Main Gate A', entryTime: '09:04:33 AM', exitTime: '05:30:11 PM', method: 'Face', personCount: 1, alert: false },
    { id: 3, student: 'Unknown', roll: '—', gate: 'Side Gate B', entryTime: '09:07:55 AM', exitTime: '—', method: 'Forced', personCount: 2, alert: true },
    { id: 4, student: 'Arjun Singh', roll: 'IT001', gate: 'Main Gate A', entryTime: '09:08:01 AM', exitTime: '04:58:44 PM', method: 'RFID', personCount: 1, alert: false },
    { id: 5, student: 'Sneha Patel', roll: 'ECE01', gate: 'Main Gate A', entryTime: '09:10:19 AM', exitTime: '05:45:00 PM', method: 'RFID', personCount: 1, alert: false },
    { id: 6, student: 'Unknown', roll: '—', gate: 'Side Gate B', entryTime: '11:23:44 AM', exitTime: '—', method: 'Forced', personCount: 3, alert: true },
];

export default function EntryLogs() {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const logs = mockLogs.filter(l =>
        (filter === 'all' || (filter === 'alerts' && l.alert) || (filter === 'rfid' && l.method === 'RFID') || (filter === 'face' && l.method === 'Face')) &&
        (l.student.toLowerCase().includes(search.toLowerCase()) || l.gate.toLowerCase().includes(search.toLowerCase()))
    );

    const alertCount = mockLogs.filter(l => l.alert).length;

    return (
        <DashboardLayout title="Admin" breadcrumb="Entry Logs">
            <div className="page-header">
                <div className="page-header-left">
                    <h1>🚪 Campus Entry Logs</h1>
                    <p>Real-time gate monitoring · {mockLogs.length} entries today · {alertCount} security alerts</p>
                </div>
                <div className="page-header-right">
                    <button className="btn btn-danger btn-sm">🚨 {alertCount} Alerts</button>
                    <button className="btn btn-ghost btn-sm">📥 Export</button>
                </div>
            </div>

            {/* Alert Banner */}
            {alertCount > 0 && (
                <div className="alert alert-error" style={{ marginBottom: 20 }}>
                    🚨 <strong>{alertCount} security alerts</strong> detected today — multiple person entries at Side Gate B. Buzzer was activated.
                </div>
            )}

            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: 20 }}>
                {[
                    { label: 'Total Entries', value: mockLogs.length, icon: '🚪', color: '#3b82f6' },
                    { label: 'RFID Entries', value: mockLogs.filter(l => l.method === 'RFID').length, icon: '📡', color: '#06b6d4' },
                    { label: 'Face Entries', value: mockLogs.filter(l => l.method === 'Face').length, icon: '📷', color: '#10b981' },
                    { label: 'Security Alerts', value: alertCount, icon: '🚨', color: '#ef4444' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-icon" style={{ background: `${s.color}18`, fontSize: 26 }}>{s.icon}</div>
                        <div className="stat-info">
                            <div className="stat-value" style={{ color: s.color, fontSize: 28 }}>{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters + Search */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
                    <span>🔍</span>
                    <input placeholder="Search student or gate..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {['all', 'alerts', 'rfid', 'face'].map(f => (
                    <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
                        {f === 'all' ? '📋 All' : f === 'alerts' ? `🚨 Alerts (${alertCount})` : f === 'rfid' ? '📡 RFID' : '📷 Face'}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Gate</th>
                            <th>Entry Time</th>
                            <th>Exit Time</th>
                            <th>Method</th>
                            <th>Persons Detected</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(l => (
                            <tr key={l.id} style={{ background: l.alert ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{l.student}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.roll}</div>
                                </td>
                                <td>{l.gate}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{l.entryTime}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{l.exitTime}</td>
                                <td>
                                    <span className={`badge ${l.method === 'RFID' ? 'badge-blue' : l.method === 'Face' ? 'badge-green' : 'badge-danger'}`}>
                                        {l.method === 'RFID' ? '📡 RFID' : l.method === 'Face' ? '📷 Face' : '⚠️ Forced'}
                                    </span>
                                </td>
                                <td>
                                    <span style={{ fontWeight: 700, color: l.personCount > 1 ? 'var(--color-red)' : 'var(--text-primary)' }}>
                                        {l.personCount} {l.personCount > 1 ? '⚠️' : ''}
                                    </span>
                                </td>
                                <td>
                                    {l.alert
                                        ? <span className="badge badge-danger">🚨 Breach</span>
                                        : <span className="badge badge-success">✓ Normal</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div style={{ marginTop: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--color-red)', fontWeight: 700 }}>⚠️ Security Rule:</span> If sensor detects &gt;1 person during single RFID/Face scan → Buzzer activates for 3 seconds → Security alert logged → Admin notified
                </div>
            </div>
        </DashboardLayout>
    );
}
