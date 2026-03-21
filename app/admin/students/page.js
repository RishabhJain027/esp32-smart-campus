'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const initialStudents = [
    { id: 1, name: 'Rishabh Jain', roll: 'CS2021001', dept: 'CS', sem: 4, email: 'rishabh@college.edu', phone: '+91 9876543210', rfid: 'A7B45C2D', face: true, attendance: 91, status: 'active' },
    { id: 2, name: 'Priya Sharma', roll: 'CS2021002', dept: 'CS', sem: 4, email: 'priya@college.edu', phone: '+91 9876543211', rfid: 'B8C56D3E', face: true, attendance: 78, status: 'active' },
    { id: 3, name: 'Arjun Singh', roll: 'IT2021001', dept: 'IT', sem: 4, email: 'arjun@college.edu', phone: '+91 9876543212', rfid: 'C9D67E4F', face: false, attendance: 85, status: 'active' },
    { id: 4, name: 'Sneha Patel', roll: 'ECE21001', dept: 'ECE', sem: 3, email: 'sneha@college.edu', phone: '+91 9876543213', rfid: 'D0E78F5G', face: true, attendance: 95, status: 'active' },
    { id: 5, name: 'Rahul Kumar', roll: 'ME2021001', dept: 'ME', sem: 4, email: 'rahul@college.edu', phone: '+91 9876543214', rfid: '', face: false, attendance: 62, status: 'active' },
];

export default function AdminStudents() {
    const [students, setStudents] = useState(initialStudents);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editStudent, setEdit] = useState(null);
    const [form, setForm] = useState({ name: '', roll: '', dept: '', sem: '', email: '', phone: '', rfid: '' });

    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.roll.toLowerCase().includes(search.toLowerCase()) ||
        s.dept.toLowerCase().includes(search.toLowerCase())
    );

    function openAdd() { setForm({ name: '', roll: '', dept: '', sem: '', email: '', phone: '', rfid: '' }); setEdit(null); setShowModal(true); }
    function openEdit(s) { setForm(s); setEdit(s.id); setShowModal(true); }

    function saveStudent() {
        if (editStudent) {
            setStudents(prev => prev.map(s => s.id === editStudent ? { ...s, ...form } : s));
        } else {
            setStudents(prev => [...prev, { ...form, id: Date.now(), face: false, attendance: 0, status: 'active' }]);
        }
        setShowModal(false);
    }

    function deleteStudent(id) {
        if (confirm('Remove this student from the system?')) {
            setStudents(prev => prev.filter(s => s.id !== id));
        }
    }

    function exportCSV() {
        const rows = [['Roll No', 'Name', 'Department', 'Semester', 'Email', 'Phone', 'RFID', 'Attendance%']];
        students.forEach(s => rows.push([s.roll, s.name, s.dept, s.sem, s.email, s.phone, s.rfid, s.attendance]));
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'students.csv'; a.click();
    }

    return (
        <DashboardLayout title="Admin" breadcrumb="Students">
            {/* Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h1>🧑‍🎓 Manage Students</h1>
                    <p>{students.length} students registered · {students.filter(s => s.rfid).length} with RFID · {students.filter(s => s.face).length} with Face ID</p>
                </div>
                <div className="page-header-right">
                    <button className="btn btn-ghost btn-sm" onClick={exportCSV}>📥 Export CSV</button>
                    <button className="btn btn-primary" onClick={openAdd}>➕ Add Student</button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: 20 }}>
                {[
                    { label: 'Total', value: students.length, color: '#3b82f6' },
                    { label: 'RFID Assigned', value: students.filter(s => s.rfid).length, color: '#06b6d4' },
                    { label: 'Face Registered', value: students.filter(s => s.face).length, color: '#10b981' },
                    { label: 'Low Attendance', value: students.filter(s => s.attendance < 75).length, color: '#ef4444' },
                ].map((s, i) => (
                    <div key={i} className="card" style={{ textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="search-bar" style={{ marginBottom: 16 }}>
                <span>🔍</span>
                <input placeholder="Search by name, roll number, or department..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Table */}
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Roll No</th>
                            <th>Dept/Sem</th>
                            <th>RFID</th>
                            <th>Face ID</th>
                            <th>Attendance</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(s => (
                            <tr key={s.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div className="avatar avatar-sm">{s.name.charAt(0)}</div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.roll}</span></td>
                                <td>{s.dept} · Sem {s.sem}</td>
                                <td>
                                    {s.rfid
                                        ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-cyan)' }}>{s.rfid}</span>
                                        : <span className="badge badge-warning">⚠ Not Assigned</span>
                                    }
                                </td>
                                <td>
                                    <span className={`badge badge-${s.face ? 'success' : 'danger'}`}>
                                        {s.face ? '✓ Registered' : '✕ Missing'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div className="progress-bar" style={{ width: 60, height: 5 }}>
                                            <div className={`progress-fill ${s.attendance >= 75 ? 'green' : 'amber'}`} style={{ width: `${s.attendance}%` }} />
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: s.attendance >= 75 ? '#10b981' : '#f59e0b' }}>{s.attendance}%</span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>✏️</button>
                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-red)' }} onClick={() => deleteStudent(s.id)}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">{editStudent ? '✏️ Edit Student' : '➕ Add New Student'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)', fontSize: 24, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div className="grid-2" style={{ gap: 12 }}>
                            {[
                                ['Full Name', 'name', 'text'],
                                ['Roll Number', 'roll', 'text'],
                                ['Department', 'dept', 'text'],
                                ['Semester', 'sem', 'number'],
                                ['Email', 'email', 'email'],
                                ['Phone', 'phone', 'tel'],
                                ['RFID UID', 'rfid', 'text'],
                                ['Parent Phone', 'parentPhone', 'tel'],
                            ].map(([label, field, type]) => (
                                <div key={field} className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">{label}</label>
                                    <input className="form-input" type={type} value={form[field] || ''} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} placeholder={label} />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveStudent}>{editStudent ? '💾 Update' : '➕ Add Student'}</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
