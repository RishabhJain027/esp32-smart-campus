'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

// ── Static pin-map for the wiring reference panel ─────────────────
const PIN_MAP = [
  { pin: 'D2',  component: 'RELAY',                       type: 'output',  color: '#f59e0b', icon: '⚡' },
  { pin: 'D4',  component: 'BUZZER',                      type: 'output',  color: '#ef4444', icon: '🔔' },
  { pin: 'D5',  component: 'DHT11 (Temp + Humidity)',      type: 'sensor',  color: '#22d3ee', icon: '🌡️' },
  { pin: 'D12', component: 'LED 1 – Green (Access OK)',    type: 'output',  color: '#10b981', icon: '🟢' },
  { pin: 'D13', component: 'LED 2 – Red (Access Denied)',  type: 'output',  color: '#ef4444', icon: '🔴' },
  { pin: 'D14', component: 'LED 3 – Yellow (Alert)',       type: 'output',  color: '#f59e0b', icon: '🟡' },
  { pin: 'D15', component: 'RFID SS/CS  (HSPI)',           type: 'rfid',    color: '#8b5cf6', icon: '📡' },
  { pin: 'D18', component: 'RFID SCK    (HSPI)',           type: 'rfid',    color: '#8b5cf6', icon: '📡' },
  { pin: 'D19', component: 'RFID MISO   (HSPI)',           type: 'rfid',    color: '#8b5cf6', icon: '📡' },
  { pin: 'D21', component: 'I2C SDA  (LCD 16×2)',          type: 'i2c',     color: '#06b6d4', icon: '🖥️' },
  { pin: 'D22', component: 'I2C SCL  (LCD 16×2)',          type: 'i2c',     color: '#06b6d4', icon: '🖥️' },
  { pin: 'D23', component: 'Switch / Digital Sensor',      type: 'input',   color: '#3b82f6', icon: '🔘' },
  { pin: 'D25', component: 'Ultrasonic TRIG (HC-SR04)',    type: 'sensor',  color: '#22d3ee', icon: '📶' },
  { pin: 'D26', component: 'Ultrasonic ECHO (HC-SR04)',    type: 'sensor',  color: '#22d3ee', icon: '📶' },
  { pin: 'D27', component: 'RFID RST    (HSPI)',           type: 'rfid',    color: '#8b5cf6', icon: '📡' },
  { pin: 'D33', component: 'RFID MOSI   (HSPI)',           type: 'rfid',    color: '#8b5cf6', icon: '📡' },
  { pin: 'D34', component: 'Potentiometer (Analog Input)', type: 'analog',  color: '#a78bfa', icon: '🎚️' },
  { pin: 'D35', component: 'LDR – Light Sensor (Analog)',  type: 'analog',  color: '#fbbf24', icon: '💡' },
  { pin: 'D1',  component: 'Un-used',                      type: 'unused',  color: '#374151', icon: '—' },
  { pin: 'D3',  component: 'Un-used',                      type: 'unused',  color: '#374151', icon: '—' },
  { pin: 'D16', component: 'Un-used',                      type: 'unused',  color: '#374151', icon: '—' },
  { pin: 'D17', component: 'Un-used',                      type: 'unused',  color: '#374151', icon: '—' },
  { pin: 'D32', component: 'Un-used',                      type: 'unused',  color: '#374151', icon: '—' },
  { pin: 'D36', component: 'Un-used (input only)',          type: 'unused',  color: '#374151', icon: '—' },
  { pin: 'D39', component: 'Un-used (input only)',          type: 'unused',  color: '#374151', icon: '—' },
];

function typeColor(t) {
  return { sensor:'#22d3ee', output:'#10b981', rfid:'#8b5cf6', i2c:'#06b6d4', input:'#3b82f6', analog:'#fbbf24', unused:'#374151' }[t] || '#64748b';
}

export default function IoTMonitor() {
  const [sensorData, setSensorData] = useState(null);    // latest reading from ESP32
  const [history,    setHistory]    = useState([]);       // up to 50 readings
  const [loading,    setLoading]    = useState(true);
  const [lastFetch,  setLastFetch]  = useState('—');
  const [filter,     setFilter]     = useState('all');

  const fetchSensors = useCallback(async () => {
    try {
      const res = await fetch('/api/esp32/sensors', {
        headers: { 'x-api-key': 'esp32_secret_2026' }
      });
      if (!res.ok) throw new Error('Not found');
      const json = await res.json();
      const data = json.data || [];
      setHistory(data.slice(0, 50));
      if (data.length > 0) setSensorData(data[0]);
      setLastFetch(new Date().toLocaleTimeString('en-IN'));
    } catch {
      // no readings yet – keep previous state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSensors();
    const t = setInterval(fetchSensors, 15000); // refresh every 15 s
    return () => clearInterval(t);
  }, [fetchSensors]);

  // LDR raw (0-4095) → lux approximation
  const ldrToLux = (raw) => raw ? Math.round((4095 - raw) / 4095 * 1000) : 0;
  // Pot raw (0-4095) → 0-100%
  const potPct   = (raw) => raw != null ? Math.round(raw / 4095 * 100) : 0;

  const live = sensorData || { temperature: null, humidity: null, ldr: null, pot: null };

  const bigCards = [
    {
      icon: '🌡️', label: 'Temperature', value: live.temperature != null ? `${live.temperature.toFixed(1)}°C` : '—',
      sub: live.temperature > 30 ? '⚠️ High' : live.temperature != null ? '✓ Normal' : 'No Data',
      color: live.temperature > 30 ? '#ef4444' : '#22d3ee', bg: 'rgba(34,211,238,0.08)',
    },
    {
      icon: '💧', label: 'Humidity', value: live.humidity != null ? `${live.humidity.toFixed(1)}%` : '—',
      sub: live.humidity > 80 ? '⚠️ High' : live.humidity != null ? '✓ Normal' : 'No Data',
      color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',
    },
    {
      icon: '💡', label: 'Light (LDR)', value: live.ldr != null ? `${ldrToLux(live.ldr)} lux` : '—',
      sub: live.ldr != null ? `Raw: ${live.ldr}` : 'No Data',
      color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',
    },
    {
      icon: '🎚️', label: 'Potentiometer', value: live.pot != null ? `${potPct(live.pot)}%` : '—',
      sub: live.pot != null ? `Raw: ${live.pot}` : 'No Data',
      color: '#a78bfa', bg: 'rgba(167,139,250,0.08)',
    },
  ];

  const filtered = filter === 'all' ? PIN_MAP : PIN_MAP.filter(p => p.type === filter);

  return (
    <DashboardLayout title="IoT Monitor" breadcrumb="Real-Time Telemetry">

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.02em' }}>🌐 IoT Command Center</h1>
          <p style={{ color:'var(--text-muted)', fontSize:14, marginTop:4 }}>
            Live ESP32 sensor telemetry · Last update: <b style={{color:'var(--color-green)'}}>{lastFetch}</b>
          </p>
        </div>
        <button
          onClick={fetchSensors}
          style={{ padding:'8px 18px', background:'var(--color-blue)', border:'none', borderRadius:8,
                   color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13 }}>
          🔄 Refresh
        </button>
      </div>

      {/* Live sensor big cards */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        {bigCards.map((c, i) => (
          <div key={i} className="card" style={{ background: c.bg, border:`1px solid ${c.color}33` }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{c.icon}</div>
            <div style={{ fontSize:28, fontWeight:800, color: c.color, lineHeight:1 }}>{c.value}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{c.label}</div>
            <div style={{ fontSize:11, color: c.color, marginTop:6, fontWeight:600 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Servo / IR NOTE */}
      <div className="card" style={{ marginBottom:24, background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.3)' }}>
        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12, color:'#f59e0b' }}>⚠️ Servo &amp; IR Sensor – Connection Notes</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, fontSize:13, color:'var(--text-secondary)' }}>
          <div>
            <b style={{color:'#f59e0b'}}>Servo Motor (SG90 / MG996R)</b><br/>
            Not connected in current wiring. If you add it, use <b>any free PWM pin</b> e.g. <code style={{color:'#a78bfa'}}>D32</code> or <code style={{color:'#a78bfa'}}>D33</code>.<br/>
            Requires <b>external 5V power supply</b> with common GND to ESP32.<br/>
            In firmware: <code>gateServo.attach(32)</code> — the RELAY (D2) currently handles gate control.
          </div>
          <div>
            <b style={{color:'#f59e0b'}}>IR Sensor (TCRT5000 / FC-51)</b><br/>
            Not connected in current wiring. If you add it, use <b>D16</b> or <b>D17</b> (both free).<br/>
            Wire: <code>VCC→3.3V</code>, <code>GND→GND</code>, <code>OUT→D16</code>.<br/>
            In firmware add: <code>pinMode(16, INPUT); if(digitalRead(16)==LOW) &#123; /* object detected */ &#125;</code>
          </div>
        </div>
      </div>

      {/* History table */}
      {history.length > 0 && (
        <div className="card" style={{ marginBottom:24, padding:0 }}>
          <div style={{ padding:'18px 24px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontSize:16, fontWeight:700 }}>📊 Sensor History (last 50 readings)</h3>
            <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
              {history.length} readings · refreshes every 15 s
            </span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Temp (°C)</th>
                  <th>Humidity (%)</th>
                  <th>LDR (lux)</th>
                  <th>Pot (%)</th>
                  <th>Node</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={r.id || i}>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>
                      {new Date(r.timestamp).toLocaleTimeString('en-IN')}
                    </td>
                    <td style={{ color: r.temperature > 30 ? '#ef4444' : '#22d3ee', fontWeight:700 }}>
                      {r.temperature?.toFixed(1) ?? '—'}
                    </td>
                    <td style={{ color:'#38bdf8' }}>{r.humidity?.toFixed(1) ?? '—'}</td>
                    <td style={{ color:'#fbbf24' }}>{ldrToLux(r.ldr)}</td>
                    <td style={{ color:'#a78bfa' }}>{potPct(r.pot)}</td>
                    <td><span className="badge badge-blue">{r.hardware_id || 'main_gate'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="card" style={{ textAlign:'center', color:'var(--text-muted)', padding:40 }}>
          ⏳ Loading sensor data...
        </div>
      )}
      {!loading && history.length === 0 && (
        <div className="card" style={{ textAlign:'center', color:'var(--text-muted)', padding:40, marginBottom:24 }}>
          📡 No sensor readings yet. ESP32 sends data every 30 s once powered on.
        </div>
      )}

      {/* Pin Map */}
      <div className="card" style={{ padding:0 }}>
        <div style={{ padding:'18px 24px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
          <h3 style={{ fontSize:16, fontWeight:700 }}>🔌 ESP32 Pin Wiring Map</h3>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {['all','sensor','output','rfid','i2c','input','analog','unused'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', border:'none',
                background: filter === f ? typeColor(f) : 'rgba(255,255,255,0.06)',
                color: filter === f ? '#fff' : 'var(--text-muted)',
                transition:'all 0.2s',
              }}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Pin</th><th>Component / Connection</th><th>Type</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.pin}>
                  <td>
                    <code style={{ fontFamily:'var(--font-mono)', color:'#a78bfa', fontWeight:700, fontSize:13 }}>
                      {p.pin}
                    </code>
                  </td>
                  <td style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span>{p.icon}</span>
                    <span style={{ fontSize:13, color: p.type === 'unused' ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                      {p.component}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700,
                      background: typeColor(p.type) + '22', color: typeColor(p.type),
                      textTransform:'uppercase', letterSpacing:'0.5px',
                    }}>
                      {p.type}
                    </span>
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
