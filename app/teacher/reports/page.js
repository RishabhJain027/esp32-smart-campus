'use client';
import DashboardLayout from '@/components/DashboardLayout';

export default function TeacherReports() {
    return (
        <DashboardLayout title="Reports" breadcrumb="Reports & Analytics">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800 }}>📈 Reports & Analytics</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Generate classroom metrics and student performance summaries.</p>
            </div>
            
            <div className="card">
                <div style={{display:'flex', alignItems:'center', justifyContent: 'center', height: '20vh', color: 'var(--text-muted)'}}>
                    Currently generating historical CSVs for this academic quarter.
                </div>
            </div>
        </DashboardLayout>
    );
}
