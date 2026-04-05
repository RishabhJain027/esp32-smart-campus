'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminTeachers() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch from localDB API or mock
        fetch('/api/teachers')
            .then(res => res.json())
            .then(data => {
                setTeachers(data.teachers || [
                    { id: 'T001', name: 'Dr. Meera Sharma', email: 'meera@teacher.com', department: 'Computer Science', phone: '+91-9988776655' },
                    { id: 'T002', name: 'Prof. Ramesh Gupta', email: 'ramesh@teacher.com', department: 'Information Technology', phone: '+91-9988776656' }
                ]);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <DashboardLayout title="Teachers"><div style={{padding: 20}}>Loading...</div></DashboardLayout>;

    return (
        <DashboardLayout title="Teacher Management" breadcrumb="Teachers">
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 800 }}>👨‍🏫 Teacher Management</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Manage faculty members, assign roles, and view performance.</p>
                </div>
                <button className="btn btn-primary">+ Add Teacher</button>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '20px 24px' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>Faculty List</h3>
                </div>
                <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Department</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teachers.map(t => (
                                <tr key={t.id}>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-cyan)' }}>{t.id}</td>
                                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                                    <td><span className="badge">{t.department}</span></td>
                                    <td style={{ fontSize: 13 }}>{t.email}</td>
                                    <td style={{ fontSize: 13 }}>{t.phone}</td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm">Edit</button>
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
