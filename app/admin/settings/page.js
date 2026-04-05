'use client';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminSettings() {
    return (
        <DashboardLayout title="System Settings" breadcrumb="Settings">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800 }}>⚙️ System Settings</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Configure the global application parameters and API keys.</p>
            </div>
            
            <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>General Configuration</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{display:'block', marginBottom: 8, fontSize: 13, fontWeight:600}}>System Name</label>
                        <input type="text" className="form-control" defaultValue="SAKEC Autonomous Campus" style={{width: '100%', padding: 10, background:'var(--bg-app)', border:'1px solid var(--border)', color:'#fff', borderRadius: 8}} />
                    </div>
                    <div>
                        <label style={{display:'block', marginBottom: 8, fontSize: 13, fontWeight:600}}>Attendance Time Window (mins)</label>
                        <input type="number" className="form-control" defaultValue={15} style={{width: '100%', padding: 10, background:'var(--bg-app)', border:'1px solid var(--border)', color:'#fff', borderRadius: 8}} />
                    </div>
                    <button className="btn btn-primary" style={{width: 'fit-content'}}>Save Changes</button>
                </div>
            </div>
        </DashboardLayout>
    );
}
