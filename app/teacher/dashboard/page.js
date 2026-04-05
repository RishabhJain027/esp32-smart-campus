'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TeacherDashboard() {
    const [user, setUser] = useState(null);
    const [sessionActive, setSessionActive] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [time, setTime] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [targetSubject, setTargetSubject] = useState('Data Structures');

    useEffect(() => {
        const t = setInterval(() => {
            setTime(new Date().toLocaleTimeString('en-IN'));
        }, 1000);
        setTime(new Date().toLocaleTimeString('en-IN'));

        const authUser = localStorage.getItem('sc_user');
        if (authUser) {
            const parsedUser = JSON.parse(authUser);
            setUser(parsedUser);
            fetchData(parsedUser.id);
        } else {
            setLoading(false);
        }

        return () => clearInterval(t);
    }, []);

    async function fetchData(teacherId) {
        try {
            const [studentsRes, attRes] = await Promise.all([
                fetch('/api/students'),
                fetch(`/api/attendance?date=${new Date().toISOString().split('T')[0]}`)
            ]);

            if (studentsRes.ok && attRes.ok) {
                const studentsData = await studentsRes.json();
                const attData = await attRes.json();

                // Merge today's attendance into student list
                const mappedStudents = studentsData.students.map(s => {
                    const record = attData.records.find(r => r.student_id === s.id && r.subject === targetSubject);
                    return {
                        id: s.id,
                        name: s.name,
                        roll: s.id,
                        method: record ? record.method : '-',
                        time: record ? new Date(record.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-',
                        status: record ? record.status : 'absent',
                    };
                });
                setStudents(mappedStudents);
            }
        } catch (e) {
            console.error("Error fetching data:", e);
        } finally {
            setLoading(false);
        }
    }

    async function toggleSession() {
        if (!sessionActive) {
            setSessionId(`LEC_${Date.now()}`);
            setSessionActive(true);
        } else {
            setSessionActive(false);
            setSessionId(null);
        }
    }

    async function markAttendance(studentId, currentStatus) {
        if (!user) return;
        const newStatus = currentStatus === 'present' ? 'absent' : 'present';
        
        try {
            // First we need to get the student name
            const student = students.find(s => s.id === studentId);
            
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: studentId,
                    student_name: student?.name,
                    subject: targetSubject,
                    date: new Date().toISOString().split('T')[0],
                    status: newStatus,
                    method: 'Manual',
                    teacher_id: user.id
                })
            });

            if (res.ok) {
                setStudents(prev => prev.map(s => {
                    if (s.id === studentId) {
                        return { ...s, status: newStatus, method: 'Manual', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
                    }
                    return s;
                }));
            }
        } catch (e) {
            console.error("Error marking attendance:", e);
        }
    }

    function downloadExcel() {
        const rows = [['Roll No', 'Name', 'Status', 'Method', 'Time']];
        students.forEach(s => rows.push([s.roll, s.name, s.status, s.method, s.time]));
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'attendance.csv'; a.click();
    }

    if (loading) return <DashboardLayout title="Teacher Portal"><div style={{padding: 20}}>Loading...</div></DashboardLayout>;

    const presentCount = students.filter(s => s.status === 'present').length;
    const absentCount = students.filter(s => s.status === 'absent').length;

    // Mock weekly chart data because calculating it dynamically takes a separate API right now
    const classData = [
        { day: 'Mon', count: Math.floor(students.length * 0.8) }, 
        { day: 'Tue', count: Math.floor(students.length * 0.9) },
        { day: 'Wed', count: Math.floor(students.length * 0.85) }, 
        { day: 'Thu', count: Math.floor(students.length * 0.95) }, 
        { day: 'Fri', count: presentCount },
    ];

    return (
        <DashboardLayout title="Teacher Portal">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 800 }}>Welcome, {user?.name || 'Teacher'}!</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                        {targetSubject} – {new Date().toDateString()} · {time}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <select 
                        value={targetSubject} 
                        onChange={e => {
                            setTargetSubject(e.target.value);
                            fetchData(user?.id);
                        }}
                        className="form-input"
                        style={{ height: 36, padding: '0 12px', minWidth: 200 }}
                    >
                        <option value="Data Structures">Data Structures</option>
                        <option value="Computer Networks">Computer Networks</option>
                        <option value="DBMS">DBMS</option>
                    </select>
                    <button className="btn btn-ghost btn-sm" onClick={downloadExcel}>📥 Export CSV</button>
                    <button
                        className={`btn btn-${sessionActive ? 'danger' : 'success'}`}
                        onClick={toggleSession}
                        style={{ minWidth: 180 }}
                    >
                        {sessionActive ? '⏹️ Stop Attendance' : '▶️ Live Session'}
                    </button>
                </div>
            </div>

            {/* Session banner */}
            {sessionActive && (
                <div className="alert alert-success" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
                    <span>🟢 <strong>Live Session Active</strong> – Students can now mark attendance via RFID or Face</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{sessionId}</span>
                </div>
            )}

            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { icon: '🧑‍🎓', label: 'Total Students', value: students.length, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
                    { icon: '✅', label: 'Present', value: presentCount, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
                    { icon: '❌', label: 'Absent', value: absentCount, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
                    { icon: '📡', label: 'Scanned', value: students.filter(s => s.method !== '-' && s.method !== 'Manual').length, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-icon" style={{ background: s.bg }}><span style={{ fontSize: 26 }}>{s.icon}</span></div>
                        <div className="stat-info">
                            <div className="stat-value" style={{ color: s.color, fontSize: 30 }}>{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ alignItems: 'start' }}>
                {/* Live attendance table */}
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                            {sessionActive ? (<><span className="wifi-dot" style={{ display: 'inline-block', marginRight: 8 }} />Live Attendance</>) : 'Attendance Record'}
                        </h3>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{presentCount}/{students.length} present</span>
                    </div>
                    <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Method</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className="avatar avatar-sm">{s.name.charAt(0)}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {s.method !== '-' && (
                                                <span className={`badge badge-${s.method === 'Manual' ? 'default' : 'blue'}`}>
                                                    {s.method === 'RFID' ? '📡 RFID' : s.method === 'Face' ? '📷 Face' : '✍️ Manual'}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.time}</td>
                                        <td>
                                            <span className={`badge badge-${s.status === 'present' ? 'success' : 'danger'}`}>
                                                {s.status === 'present' ? '✓ Present' : '✕ Absent'}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                onClick={() => markAttendance(s.id, s.status)}
                                                className={`btn btn-sm ${s.status === 'present' ? 'btn-ghost' : 'btn-primary'}`} 
                                                style={{ padding: '4px 10px', fontSize: 11 }}
                                            >
                                                {s.status === 'present' ? 'Mark Absent' : 'Mark Present'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Chart + info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card">
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📈 Weekly Overview</h3>
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={classData} barSize={28}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }} />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Present" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>⚡ Quick Actions</h3>
                        {[
                            { icon: '📲', label: 'Broadcast Message', action: () => alert('Broadcast feature pending WhatsApp integration!') },
                            { icon: '📊', label: 'Generate Reports', href: '#' },
                            { icon: '🧑‍🎓', label: 'View Absentees', href: '#' },
                        ].map((a, i) => (
                            a.href
                                ? <a key={i} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>
                                    <span style={{ fontSize: 18 }}>{a.icon}</span>{a.label}<span style={{ marginLeft: 'auto' }}>→</span>
                                </a>
                                : <button key={i} onClick={a.action} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', width: '100%', background: 'none', border: 'none', cursor: 'pointer', borderBottomColor: 'var(--border)', paddingBottom: 10, marginBottom: 0 }}>
                                    <span style={{ fontSize: 18 }}>{a.icon}</span>{a.label}
                                </button>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
