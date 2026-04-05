'use client';
import DashboardLayout from '@/components/DashboardLayout';

export default function TeacherNotifications() {
    return (
        <DashboardLayout title="Notifications" breadcrumb="Communications Center">
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 800 }}>📲 Notifications hub</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Broadcast messages to class cohorts using WhatsApp integration.</p>
                </div>
                <button className="btn btn-primary">+ New Message Broadcast</button>
            </div>
            
            <div className="card">
                <div style={{display:'flex', alignItems:'center', justifyContent: 'center', height: '20vh', color: 'var(--text-muted)'}}>
                    No active notification requests pending.
                </div>
            </div>
        </DashboardLayout>
    );
}
