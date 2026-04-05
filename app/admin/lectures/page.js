'use client';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminLectures() {
    const MOCK_LECTURES = [
        { id: 'L001', subject: 'Data Structures', teacher: 'Dr. Meera Sharma', room: 'Lab 1', time: '10:00 AM - 11:30 AM', students: 45 },
        { id: 'L002', subject: 'Computer Networks', teacher: 'Prof. Ramesh Gupta', room: 'Room 304', time: '11:45 AM - 01:15 PM', students: 50 },
        { id: 'L003', subject: 'Database Systems', teacher: 'Dr. Meera Sharma', room: 'Room 305', time: '02:00 PM - 03:30 PM', students: 48 },
    ];

    return (
        <DashboardLayout title="Lectures" breadcrumb="Lecture Schedules">
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 800 }}>📚 Active Lectures</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Manage and monitor currently scheduled classes.</p>
                </div>
                <button className="btn btn-primary">+ Schedule Lecture</button>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '20px 24px' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>Today's Lectures</h3>
                </div>
                <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Lecture ID</th>
                                <th>Subject</th>
                                <th>Teacher</th>
                                <th>Room</th>
                                <th>Time</th>
                                <th>Enrolled</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_LECTURES.map(l => (
                                <tr key={l.id}>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-cyan)' }}>{l.id}</td>
                                    <td style={{ fontWeight: 600 }}>{l.subject}</td>
                                    <td>{l.teacher}</td>
                                    <td><span className="badge">{l.room}</span></td>
                                    <td style={{ fontSize: 13 }}>{l.time}</td>
                                    <td>{l.students}</td>
                                    <td><span className="badge badge-success">Scheduled</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
