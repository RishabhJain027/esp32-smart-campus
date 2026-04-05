'use client';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminAlerts() {
    const MOCK_ALERTS = [
        { id: 'ALT-01', type: 'Tailgating Detection', gate: 'Main Gate', time: '10:05 AM', severity: 'High', status: 'Unresolved' },
        { id: 'ALT-02', type: 'Unauthorized Access', gate: 'Lab 3', time: '09:15 AM', severity: 'Critical', status: 'Resolved' },
        { id: 'ALT-03', type: 'Unregistered Face Scan', gate: 'Main Gate', time: '08:45 AM', severity: 'Medium', status: 'Resolved' },
    ];

    const getSeverityColor = (sev) => sev === 'Critical' ? 'danger' : sev === 'High' ? 'warning' : 'success';

    return (
        <DashboardLayout title="Security Alerts" breadcrumb="Alerts">
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 800 }}>🔔 Security Alerts</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Monitor critical security events and tailgating incidents.</p>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '20px 24px' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Incidents</h3>
                </div>
                <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Alert ID</th>
                                <th>Incident Type</th>
                                <th>Location (Gate)</th>
                                <th>Time</th>
                                <th>Severity</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_ALERTS.map(a => (
                                <tr key={a.id}>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-cyan)' }}>{a.id}</td>
                                    <td style={{ fontWeight: 600 }}>{a.type}</td>
                                    <td><span className="badge">{a.gate}</span></td>
                                    <td style={{ fontSize: 13 }}>{a.time}</td>
                                    <td><span className={`badge badge-${getSeverityColor(a.severity)}`}>{a.severity}</span></td>
                                    <td style={{ fontSize: 13, color: a.status === 'Resolved' ? '#10b981' : '#f59e0b' }}>{a.status}</td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm">Review Video</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
