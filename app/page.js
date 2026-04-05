'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// === Floating particle system ===
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = -Math.random() * 0.4 - 0.1;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.hue = 190 + Math.random() * 30;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity += Math.sin(Date.now() * 0.001 + this.x) * 0.003;
        if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) this.reset();
        if (this.y < -10) { this.y = canvas.height + 10; }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 90%, 70%, ${Math.max(0, Math.min(1, this.opacity))})`;
        ctx.fill();
        // glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 90%, 70%, ${Math.max(0, Math.min(0.1, this.opacity * 0.15))})`;
        ctx.fill();
      }
    }
    for (let i = 0; i < 80; i++) particles.push(new Particle());
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      animId = requestAnimationFrame(animate);
    }
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />;
}

// === Animated counter ===
function Counter({ end, suffix = '', duration = 2000 }) {
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return <span ref={ref}>{val}{suffix}</span>;
}

// === Stats data ===
const stats = [
  { value: 30, suffix: '+', label: 'API Endpoints', icon: '⚡' },
  { value: 99, suffix: '%', label: 'Uptime SLA', icon: '🛡️' },
  { value: 5, suffix: 'ms', label: 'ESP32 Latency', icon: '📡' },
  { value: 24, suffix: '/7', label: 'Monitoring', icon: '👁️' },
];

const features = [
  { icon: '🔐', title: 'RFID Access Control', desc: 'MFRC522-powered card authentication with ultrasonic tailgate detection and instant WhatsApp alerts.', color: '#0EA5E9' },
  { icon: '🧠', title: 'Face Recognition AI', desc: 'Real-time face embedding extraction via ESP32-CAM with vector matching against registered student database.', color: '#22D3EE' },
  { icon: '📊', title: 'ERP Dashboard', desc: 'SAKEC-grade academic records, timetable management, grievance redressal, and grade analytics.', color: '#38BDF8' },
  { icon: '🌐', title: 'Google Sheets Sync', desc: 'Faculty-readable live attendance ledger. Every RFID scan appends a row instantly via Google Sheets API.', color: '#0369A1' },
  { icon: '📲', title: 'WhatsApp Alerts', desc: 'Meta Cloud API integration for unauthorized entry alerts, low attendance warnings, and parent notifications.', color: '#06B6D4' },
  { icon: '🏫', title: '3D Campus Map', desc: 'Interactive campus visualization with live room occupancy, temperature heatmaps, and gate status overlays.', color: '#2DD4BF' },
];

const techStack = [
  { name: 'Next.js 14', icon: '⚛️', desc: 'React Framework' },
  { name: 'Firebase', icon: '🔥', desc: 'Firestore + Auth' },
  { name: 'ESP32-S3', icon: '🔌', desc: 'Edge IoT Node' },
  { name: 'face-api.js', icon: '🧠', desc: 'Face Detection' },
  { name: 'Google Sheets', icon: '📋', desc: 'Live Ledger' },
  { name: 'JWT + bcrypt', icon: '🛡️', desc: 'Security Layer' },
  { name: 'Recharts', icon: '📈', desc: 'Data Viz' },
  { name: 'WebSockets', icon: '🔗', desc: 'Real-Time Push' },
];

export default function LandingPage() {
  const [time, setTime] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fadeEls = document.querySelectorAll('.ocean-fade');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('ocean-visible'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    fadeEls.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="ocean-landing">
      <ParticleField />

      {/* ─── NAVIGATION ─── */}
      <nav className="ocean-nav" id="ocean-nav">
        <div className="ocean-nav-inner">
          <Link href="/" className="ocean-logo">
            <div className="ocean-logo-icon">🏫</div>
            <div>
              <div className="ocean-logo-text">SAKEC<span className="ocean-logo-dot">.</span>AI</div>
              <div className="ocean-logo-sub">AUTONOMOUS CAMPUS</div>
            </div>
          </Link>
          <div className={`ocean-nav-links ${menuOpen ? 'open' : ''}`}>
            <a href="#features">Features</a>
            <a href="#architecture">Architecture</a>
            <a href="#tech">Stack</a>
            <Link href="/login" className="ocean-nav-cta">Launch Dashboard →</Link>
          </div>
          <button className="ocean-hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="ocean-hero">
        <div className="ocean-hero-rays" />
        <div className="ocean-hero-content">
          <div className="ocean-hero-badge ocean-fade">
            <span className="ocean-pulse-dot" />
            SYSTEM ONLINE · {time || '--:--:--'}
          </div>
          <h1 className="ocean-hero-title ocean-fade">
            The Autonomous<br />
            <span className="ocean-gradient-text">Smart Campus</span>
          </h1>
          <p className="ocean-hero-desc ocean-fade">
            Enterprise AIoT platform merging ESP32 edge nodes, real-time facial recognition, 
            RFID access control, and a bioluminescent command center — built for SAKEC.
          </p>
          <div className="ocean-hero-actions ocean-fade">
            <Link href="/login" className="ocean-btn-primary" id="hero-launch-btn">
              🚀 Launch Command Center
            </Link>
            <Link href="/login?tab=signup" className="ocean-btn-outline" id="hero-register-btn">
              ✨ Register Now
            </Link>
          </div>

          {/* Stats */}
          <div className="ocean-hero-stats ocean-fade">
            {stats.map((s, i) => (
              <div key={i} className="ocean-stat-item">
                <div className="ocean-stat-icon">{s.icon}</div>
                <div className="ocean-stat-value">
                  <Counter end={s.value} suffix={s.suffix} />
                </div>
                <div className="ocean-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="ocean-scroll-hint">
          <div className="ocean-scroll-line" />
          <span>EXPLORE</span>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="ocean-section">
        <div className="ocean-container">
          <div className="ocean-section-header ocean-fade">
            <span className="ocean-section-label">CAPABILITIES</span>
            <h2 className="ocean-section-title">Enterprise-Grade<br /><span className="ocean-gradient-text">Feature Arsenal</span></h2>
            <p className="ocean-section-desc">Every component engineered for scale. From edge AI to cloud analytics.</p>
          </div>
          <div className="ocean-features-grid">
            {features.map((f, i) => (
              <div key={i} className="ocean-feature-card ocean-fade" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="ocean-feature-glow" style={{ background: `radial-gradient(circle, ${f.color}15 0%, transparent 70%)` }} />
                <div className="ocean-feature-icon" style={{ background: `${f.color}15`, color: f.color }}>{f.icon}</div>
                <h3 className="ocean-feature-title">{f.title}</h3>
                <p className="ocean-feature-desc">{f.desc}</p>
                <div className="ocean-feature-line" style={{ background: `linear-gradient(90deg, ${f.color}, transparent)` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ARCHITECTURE ─── */}
      <section id="architecture" className="ocean-section ocean-section-alt">
        <div className="ocean-container">
          <div className="ocean-section-header ocean-fade">
            <span className="ocean-section-label">SYSTEM DESIGN</span>
            <h2 className="ocean-section-title">Data Flow<br /><span className="ocean-gradient-text">Architecture</span></h2>
          </div>
          <div className="ocean-arch-flow ocean-fade">
            {[
              { icon: '🔌', label: 'ESP32-S3 Edge', sub: 'RFID + Camera + DHT22' },
              { icon: '📡', label: 'MQTT / REST', sub: 'JWT-Signed Payloads' },
              { icon: '⚡', label: 'Next.js API', sub: 'Route Handlers' },
              { icon: '🔥', label: 'Firebase', sub: 'Firestore + Storage' },
              { icon: '📋', label: 'Google Sheets', sub: 'Live Faculty Ledger' },
              { icon: '🖥️', label: 'Dashboard', sub: 'Real-Time UI' },
            ].map((node, i) => (
              <div key={i} className="ocean-arch-node">
                <div className="ocean-arch-icon">{node.icon}</div>
                <div className="ocean-arch-label">{node.label}</div>
                <div className="ocean-arch-sub">{node.sub}</div>
                {i < 5 && <div className="ocean-arch-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TECH STACK ─── */}
      <section id="tech" className="ocean-section">
        <div className="ocean-container">
          <div className="ocean-section-header ocean-fade">
            <span className="ocean-section-label">BUILT WITH</span>
            <h2 className="ocean-section-title">Professional<br /><span className="ocean-gradient-text">Tech Stack</span></h2>
          </div>
          <div className="ocean-tech-grid ocean-fade">
            {techStack.map((t, i) => (
              <div key={i} className="ocean-tech-card">
                <div className="ocean-tech-icon">{t.icon}</div>
                <div className="ocean-tech-name">{t.name}</div>
                <div className="ocean-tech-desc">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="ocean-section ocean-cta-section">
        <div className="ocean-container">
          <div className="ocean-cta-card ocean-fade">
            <div className="ocean-cta-glow" />
            <h2 className="ocean-cta-title">Ready to Experience the Future?</h2>
            <p className="ocean-cta-desc">
              Register as a student, teacher, or admin. Get approved and access the full 
              autonomous campus command center.
            </p>
            <div className="ocean-cta-actions">
              <Link href="/login?tab=signup" className="ocean-btn-primary">✨ Create Account</Link>
              <Link href="/login" className="ocean-btn-outline">🔑 Sign In</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="ocean-footer">
        <div className="ocean-container">
          <div className="ocean-footer-inner">
            <div className="ocean-footer-brand">
              <div className="ocean-logo" style={{ marginBottom: 12 }}>
                <div className="ocean-logo-icon">🏫</div>
                <div>
                  <div className="ocean-logo-text">SAKEC<span className="ocean-logo-dot">.</span>AI</div>
                  <div className="ocean-logo-sub">AUTONOMOUS CAMPUS</div>
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 300 }}>
                Enterprise AIoT Smart Campus System. ESP32 + Firebase + Next.js.
              </p>
            </div>
            <div className="ocean-footer-links">
              <div>
                <h4>Platform</h4>
                <a href="#features">Features</a>
                <a href="#architecture">Architecture</a>
                <a href="#tech">Tech Stack</a>
              </div>
              <div>
                <h4>Access</h4>
                <Link href="/login">Sign In</Link>
                <Link href="/login?tab=signup">Register</Link>
                <Link href="/admin/dashboard">Admin Panel</Link>
              </div>
              <div>
                <h4>Connect</h4>
                <a href="https://www.linkedin.com/in/rish-abh27/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <a href="https://github.com/RishabhJain027" target="_blank" rel="noopener noreferrer">GitHub</a>
              </div>
            </div>
          </div>
          <div className="ocean-footer-bottom">
            <p>© 2026 SAKEC Autonomous Campus · Built by Rishabh Jain · All Rights Reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
