'use client';
import DashboardLayout from '@/components/DashboardLayout';

export default function TeacherLectures() {
    return (
        <DashboardLayout title="My Lectures" breadcrumb="My Lectures">
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 800 }}>📚 My Lectures</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Manage your allocated classes and schedules.</p>
                </div>
                <button className="btn btn-primary">+ Create Lecture Link</button>
            </div>
            
            <div className="card">
                <div style={{display:'flex', alignItems:'center', justifyContent: 'center', height: '20vh', color: 'var(--text-muted)'}}>
                    No active lectures scheduled for today.
                </div>
            </div>
        </DashboardLayout>
    );
}
