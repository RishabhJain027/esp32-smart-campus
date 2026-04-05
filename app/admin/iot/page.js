'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const ZONES = [
  { id: 'main_gate', name: 'Main Gate', icon: '🚪', status: 'online', temp: 28.5, humidity: 62, occupancy: 3, lastPing: '2s ago' },
  { id: 'iot_lab', name: 'IoT Lab (302)', icon: '🔬', status: 'online', temp: 24.1, humidity: 55, occupancy: 12, lastPing: '1s ago' },
  { id: 'library', name: 'Library', icon: '📚', status: 'online', temp: 23.8, humidity: 50, occupancy: 28, lastPing: '3s ago' },
  { id: 'canteen', name: 'Canteen', icon: '🍜', status: 'online', temp: 30.2, humidity: 70, occupancy: 45, lastPing: '5s ago' },
  { id: 'cs_lab', name: 'CS Lab (204)', icon: '💻', status: 'warning', temp: 26.3, humidity: 58, occupancy: 8, lastPing: '12s ago' },
  { id: 'seminar_hall', name: 'Seminar Hall', icon: '🎤', status: 'offline', temp: null, humidity: null, occupancy: 0, lastPing: '5m ago' },
];

export default function IoTMonitor() {
  const [zones, setZones] = useState(ZONES);
  const [selectedZone, setSelectedZone] = useState(null);
  const [telemetryLogs] = useState([
    { time: '10:03:12', zone: 'Main Gate', event: 'RFID Scan: UID A7B45C → Access Granted', type: 'success' },
    { time: '10:03:08', zone: 'IoT Lab', event: 'DHT22 Sync: 24.1°C / 55% RH', type: 'info' },
    { time: '10:02:55', zone: 'Main Gate', event: 'Ultrasonic: 2 persons detected → SECURITY ALERT', type: 'danger' },
    { time: '10:02:41', zone: 'Library', event: 'PIR Motion: Active (28 occupants)', type: 'info' },
    { time: '10:02:30', zone: 'CS Lab', event: 'WiFi Signal Weak → Attempting ESP-MESH Relay', type: 'warning' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setZones(prev => prev.map(z => {
        if (z.status === 'offline') return z;
        return {
          ...z,
          temp: z.temp ? +(z.temp + (Math.random() - 0.5) * 0.4).toFixed(1) : null,
          humidity: z.humidity ? Math.min(95, Math.max(30, z.humidity + Math.floor((Math.random() - 0.5) * 3))) : null,
          occupancy: Math.max(0, z.occupancy + Math.floor((Math.random() - 0.5) * 3)),
        };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = (s) => s === 'online' ? '#10b981' : s === 'warning' ? '#f59e0b' : '#ef4444';
  const statusBg = (s) => s === 'online' ? 'rgba(16,185,129,0.12)' : s === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';

  return (
    <DashboardLayout title="IoT Monitor" breadcrumb="Real-Time Telemetry">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>🌐 IoT Command Center</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Live ESP32 node telemetry · ESP-MESH network · Sensor fusion
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="wifi-dot" />
          <span style={{ fontSize: 12, color: 'var(--color-green)', fontWeight: 600 }}>
            {zones.filter(z => z.status === 'online').length}/{zones.length} Nodes Online
          </span>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        {zones.map(z => (
          <div key={z.id} className="card" style={{
            cursor: 'pointer',
            borderColor: selectedZone === z.id ? 'var(--color-blue)' : undefined,
            boxShadow: selectedZone === z.id ? 'var(--shadow-glow)' : undefined,
          }} onClick={() => setSelectedZone(selectedZone === z.id ? null : z.id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{z.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{z.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last ping: {z.lastPing}</div>
                </div>
              </div>
              <div style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: statusBg(z.status), color: statusColor(z.status),
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>{z.status}</div>
            </div>
            {z.status !== 'offline' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { val: `${z.temp}°C`, label: 'TEMP', color: z.temp > 28 ? '#ef4444' : '#22d3ee' },
                  { val: `${z.humidity}%`, label: 'HUMIDITY', color: '#38bdf8' },
                  { val: z.occupancy, label: 'OCCUPANCY', color: z.occupancy > 30 ? '#f59e0b' : '#10b981' },
                ].map((m, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '10px 0', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.val}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                ⚠️ Node Offline — Check WiFi or ESP-MESH relay
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>📡 Live Telemetry Stream</h3>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>MQTT → WebSocket → UI</span>
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {telemetryLogs.map((log, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', minWidth: 70 }}>{log.time}</span>
              <span className={`badge badge-${log.type === 'success' ? 'success' : log.type === 'danger' ? 'danger' : log.type === 'warning' ? 'warning' : 'blue'}`}>{log.zone}</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{log.event}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
