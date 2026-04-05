'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const INITIAL_GRIEVANCES = [
  { id: 'GRV-001', student: 'Priya Sharma', dept: 'CS', subject: 'Lab equipment malfunction', description: 'The oscilloscope in IoT Lab is not functioning properly since last week.', status: 'Pending', priority: 'High', date: '2026-04-03' },
  { id: 'GRV-002', student: 'Arjun Singh', dept: 'IT', subject: 'WiFi connectivity issues', description: 'WiFi drops frequently in the library area during peak hours.', status: 'Investigating', priority: 'Medium', date: '2026-04-02' },
  { id: 'GRV-003', student: 'Sneha Patel', dept: 'ECE', subject: 'Incorrect attendance marked', description: 'My attendance for FLAT lecture on March 28 was not recorded despite RFID scan.', status: 'Resolved', priority: 'Low', date: '2026-03-29' },
];

export default function GrievancePage() {
  const [grievances, setGrievances] = useState(INITIAL_GRIEVANCES);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ subject: '', description: '', priority: 'Medium' });

  const filtered = filter === 'all' ? grievances : grievances.filter(g => g.status === filter);

  const statusColors = {
    Pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    Investigating: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
    Resolved: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
  };

  const priorityColors = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

  function handleSubmit(e) {
    e.preventDefault();
    const newGrievance = {
      id: `GRV-${String(grievances.length + 1).padStart(3, '0')}`,
      student: 'You',
      dept: 'CS',
      ...form,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
    };
    setGrievances(prev => [newGrievance, ...prev]);
    setShowForm(false);
    setForm({ subject: '', description: '', priority: 'Medium' });
  }

  function updateStatus(id, newStatus) {
    setGrievances(prev => prev.map(g => g.id === id ? { ...g, status: newStatus } : g));
  }

  return (
    <DashboardLayout title="Grievance Redressal" breadcrumb="ERP Module">
      <div className="page-header">
        <div className="page-header-left">
          <h1>📋 Grievance Redressal System</h1>
          <p>SAKEC-grade digital complaint management · Track, escalate, resolve</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '➕ New Grievance'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total', value: grievances.length, color: '#3b82f6', icon: '📋' },
          { label: 'Pending', value: grievances.filter(g => g.status === 'Pending').length, color: '#f59e0b', icon: '⏳' },
          { label: 'Investigating', value: grievances.filter(g => g.status === 'Investigating').length, color: '#3b82f6', icon: '🔍' },
          { label: 'Resolved', value: grievances.filter(g => g.status === 'Resolved').length, color: '#10b981', icon: '✅' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: `${s.color}15` }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
            </div>
            <div className="stat-info">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* New Grievance Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📝 Submit New Grievance</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input className="form-input" placeholder="Brief description of the issue" value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={form.priority}
                  onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Detailed Description</label>
              <textarea className="form-input" style={{ minHeight: 100, resize: 'vertical' }}
                placeholder="Provide full details about the grievance..."
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-success">📨 Submit Grievance</button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'Pending', 'Investigating', 'Resolved'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Grievance List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(g => (
          <div key={g.id} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-cyan)' }}>{g.id}</span>
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: statusColors[g.status].bg, color: statusColors[g.status].color,
                }}>{g.status}</span>
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: `${priorityColors[g.priority]}15`, color: priorityColors[g.priority],
                }}>{g.priority}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.date}</span>
            </div>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{g.subject}</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{g.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>By: {g.student} ({g.dept})</span>
              {g.status !== 'Resolved' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {g.status === 'Pending' && (
                    <button className="btn btn-sm btn-primary" onClick={() => updateStatus(g.id, 'Investigating')}>
                      🔍 Investigate
                    </button>
                  )}
                  <button className="btn btn-sm btn-success" onClick={() => updateStatus(g.id, 'Resolved')}>
                    ✅ Resolve
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
