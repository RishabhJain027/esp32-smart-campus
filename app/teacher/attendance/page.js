'use client';
import DashboardLayout from '@/components/DashboardLayout';

export default function TeacherAttendanceRoster() {
    return (
        <DashboardLayout title="Attendance Records" breadcrumb="Attendance Records">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800 }}>✅ Class Attendance Records</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Review automated face and RFID entry logs.</p>
            </div>
            
            <div className="card">
                <div style={{display:'flex', alignItems:'center', justifyContent: 'center', height: '20vh', color: 'var(--text-muted)'}}>
                    Select a lecture ID to view specific attendance sheets spanning this semester.
                </div>
            </div>
        </DashboardLayout>
    );
}
