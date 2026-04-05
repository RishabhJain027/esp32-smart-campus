'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const mockTimetable = [
  { time: '09:00 AM - 10:00 AM', mon: 'Data Structures (CS301)', tue: 'Data Structures (CS301)', wed: 'DBMS (CS302)', thu: 'OS (CS303)', fri: 'DBMS (CS302)' },
  { time: '10:00 AM - 11:00 AM', mon: 'DBMS (CS302)', tue: 'OS (CS303)', wed: 'Computer Networks (CS304)', thu: 'Data Structures (CS301)', fri: 'Computer Networks (CS304)' },
  { time: '11:00 AM - 12:00 PM', mon: 'OS (CS303)', tue: 'Computer Networks (CS304)', wed: 'Algorithms (CS305)', thu: 'DBMS (CS302)', fri: 'OS (CS303)' },
  { time: '12:00 PM - 01:00 PM', mon: '--- BREAK ---', tue: '--- BREAK ---', wed: '--- BREAK ---', thu: '--- BREAK ---', fri: '--- BREAK ---' },
  { time: '01:00 PM - 03:00 PM', mon: 'DS Lab (L1)', tue: 'DBMS Lab (L2)', wed: 'Web Dev Lab (L3)', thu: 'CN Lab (L4)', fri: 'Project Session' },
];

export default function TimetablePage() {
  const [department, setDepartment] = useState('Computer Science');
  const [semester, setSemester] = useState('4');

  return (
    <DashboardLayout title="Timetable Manager" breadcrumb="ERP Module">
      <div className="page-header">
        <div className="page-header-left">
          <h1>📅 Master Timetable</h1>
          <p>Schedule algorithms and logic flow for the automated campus</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary">➕ New Schedule</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Select Department</label>
          <select value={department} onChange={e => setDepartment(e.target.value)} className="form-input">
            <option>Computer Science</option>
            <option>Information Technology</option>
            <option>Electronics & Telecom</option>
            <option>Artificial Intelligence</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Select Semester</label>
          <select value={semester} onChange={e => setSemester(e.target.value)} className="form-input">
            <option>1</option><option>2</option><option>3</option><option>4</option>
            <option>5</option><option>6</option><option>7</option><option>8</option>
          </select>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-outline" style={{ height: 44, width: '100%' }}>🔍 Fetch Timetable</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ borderRadius: 0, border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time Slot</th>
                <th>Monday</th>
                <th>Tuesday</th>
                <th>Wednesday</th>
                <th>Thursday</th>
                <th>Friday</th>
              </tr>
            </thead>
            <tbody>
              {mockTimetable.map((row, i) => (
                <tr key={i} style={row.mon.includes('BREAK') ? { background: 'rgba(255,255,255,0.02)' } : {}}>
                  <td style={{ fontWeight: 600, color: 'var(--color-cyan)', fontSize: 13 }}>{row.time}</td>
                  <td style={{ color: row.mon.includes('BREAK') ? 'var(--text-muted)' : 'inherit' }}>{row.mon}</td>
                  <td style={{ color: row.tue.includes('BREAK') ? 'var(--text-muted)' : 'inherit' }}>{row.tue}</td>
                  <td style={{ color: row.wed.includes('BREAK') ? 'var(--text-muted)' : 'inherit' }}>{row.wed}</td>
                  <td style={{ color: row.thu.includes('BREAK') ? 'var(--text-muted)' : 'inherit' }}>{row.thu}</td>
                  <td style={{ color: row.fri.includes('BREAK') ? 'var(--text-muted)' : 'inherit' }}>{row.fri}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
