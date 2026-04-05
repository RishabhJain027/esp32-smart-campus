'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

// ── Euclidean distance between two float arrays ──
function euclidean(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
    return Math.sqrt(sum);
}

const MATCH_THRESHOLD = 0.65;   // Increased tolerance for single-shot PFP lighting differences
const SCAN_INTERVAL_MS = 120;
const AUTO_MARK_COOLDOWN = 5000; // ms between back-to-back auto-marks

export default function FaceAttendancePage() {
    const videoRef   = useRef(null);
    const canvasRef  = useRef(null);
    const overlayRef = useRef(null);
    const faceApi    = useRef(null);
    const intervalId = useRef(null);
    const lastMark   = useRef(0);

    const [phase, setPhase]         = useState('init');   // init|ready|live|done
    const [profiles, setProfiles]   = useState([]);
    const [status, setStatus]       = useState('Loading AI models...');
    const [liveResult, setLiveResult] = useState(null);   // { matched, name, distance, roll_no }
    const [log, setLog]             = useState([]);
    const [lectureId, setLectureId] = useState('');
    const [error, setError]         = useState('');
    const [liveBox, setLiveBox]     = useState(null);
    const [faceFound, setFaceFound] = useState(false);
    const [modelsReady, setModelsReady] = useState(false);

    // ── Load face-api + all enrolled embeddings ──
    useEffect(() => {
        const boot = async () => {
            try {
                const fa = await import('face-api.js');
                faceApi.current = fa;
                await Promise.all([
                    fa.nets.ssdMobilenetv1.loadFromUri('/models'),
                    fa.nets.faceLandmark68Net.loadFromUri('/models'),
                    fa.nets.faceRecognitionNet.loadFromUri('/models'),
                ]);
                setModelsReady(true);
                setStatus('✅ AI models ready — fetching enrolled faces...');
            } catch (e) {
                setStatus('⚠️ Models not found — demo mode active (no real matching).');
                setModelsReady(true);
            }

            // Fetch all enrolled face embeddings from cloud
            try {
                const res = await fetch('/api/students/face-embeddings');
                const data = await res.json();
                setProfiles(data.profiles || []);
                const count = (data.profiles || []).length;
                setStatus(count > 0
                    ? `✅ ${count} enrolled face${count > 1 ? 's' : ''} loaded. Start camera to scan.`
                    : '⚠️ No enrolled faces yet. Ask students to register first.');
            } catch (e) {
                setStatus('⚠️ Could not load face profiles — offline mode.');
            }
            setPhase('ready');
        };
        boot();
        return () => stopLoop();
    }, []);

    // ── Start camera ──
    const startCamera = async () => {
        setError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setPhase('live');
            setStatus('🎥 Camera live — scanning faces...');
            setTimeout(startLoop, 1000);
        } catch (e) {
            setError('❌ Camera access denied.');
        }
    };

    // ── Stop camera ──
    const stopCamera = () => {
        stopLoop();
        const stream = videoRef.current?.srcObject;
        if (stream) stream.getTracks().forEach(t => t.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        setPhase('ready');
        setLiveResult(null);
        setLiveBox(null);
        setFaceFound(false);
        setStatus('Camera stopped.');
    };

    // ── Detection loop ──
    const startLoop = useCallback(() => {
        if (intervalId.current) clearInterval(intervalId.current);
        intervalId.current = setInterval(async () => {
            const video = videoRef.current;
            const fa = faceApi.current;
            if (!video || !fa || video.readyState < 2) return;

            try {
                const det = await fa.detectSingleFace(video,
                    new fa.SsdMobilenetv1Options({ minConfidence: 0.5 })
                ).withFaceLandmarks().withFaceDescriptor();

                if (!det) {
                    setFaceFound(false);
                    setLiveBox(null);
                    setLiveResult(null);
                    if (canvasRef.current && video) {
                        const faLocal = faceApi.current;
                        const canvas = canvasRef.current;
                        faLocal.matchDimensions(canvas, video);
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                    return;
                }

                setFaceFound(true);
                const { x, y, width, height } = det.box;
                const vw = video.videoWidth;
                const vh = video.videoHeight;
                setLiveBox({
                    left: `${(x / vw) * 100}%`,
                    top: `${(y / vh) * 100}%`,
                    width: `${(width / vw) * 100}%`,
                    height: `${(height / vh) * 100}%`,
                });

                if (canvasRef.current) {
                    const canvas = canvasRef.current;
                    const faLocal = faceApi.current;
                    faLocal.matchDimensions(canvas, video);
                    const resizedDetections = faLocal.resizeResults(det, video);
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    faLocal.draw.drawFaceLandmarks(canvas, resizedDetections);
                }

                const descriptor = Array.from(det.descriptor);

                // Match against all enrolled profiles
                let best = null, bestDist = Infinity;
                for (const p of profiles) {
                    if (!p.face_embedding || p.face_embedding.length !== 128) continue;
                    const d = euclidean(descriptor, p.face_embedding);
                    if (d < bestDist) { bestDist = d; best = p; }
                }

                if (best && bestDist < MATCH_THRESHOLD) {
                    const confidence = Math.round((1 - bestDist / MATCH_THRESHOLD) * 100);
                    setLiveResult({ matched: true, name: best.name, roll_no: best.roll_no, distance: bestDist, confidence, id: best.id });

                    // Auto-mark attendance once per cooldown window
                    const now = Date.now();
                    if (now - lastMark.current > AUTO_MARK_COOLDOWN) {
                        lastMark.current = now;
                        markAttendance(best, descriptor, lectureId);
                    }
                } else {
                    setLiveResult({ matched: false, distance: bestDist });
                }
            } catch (e) { /* frame error */ }
        }, SCAN_INTERVAL_MS);
    }, [profiles, lectureId]);

    const stopLoop = () => {
        if (intervalId.current) { clearInterval(intervalId.current); intervalId.current = null; }
    };

    // ── Mark attendance via API ──
    const markAttendance = async (student, descriptor, lecture_id) => {
        try {
            const token = document.cookie.match(/sc_token=([^;]+)/)?.[1] || '';
            const res = await fetch('/api/attendance/face', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ faceId: student.id, lecture_id: lecture_id || null, timestamp: new Date().toISOString() }),
            });
            const data = await res.json();
            const entry = {
                id: Date.now(),
                name: student.name,
                roll_no: student.roll_no,
                time: new Date().toLocaleTimeString('en-IN'),
                status: data.success ? 'Marked ✅' : data.message || 'Already marked',
            };
            setLog(prev => [entry, ...prev.slice(0, 19)]);
        } catch (e) { /* API offline */ }
    };

    // Color helpers
    const boxColor = liveResult?.matched ? '#22c55e' : faceFound ? '#f59e0b' : 'rgba(96,165,250,0.5)';
    const confidenceColor = liveResult?.confidence >= 80 ? '#22c55e' : liveResult?.confidence >= 60 ? '#f59e0b' : '#ef4444';

    return (
        <DashboardLayout title="Live Face Attendance">
            <div style={{ maxWidth: 960, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>🤖 Live Face Recognition Attendance</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        Real-time face matching against {profiles.length} enrolled student{profiles.length !== 1 ? 's' : ''} — powered by face-api.js + TensorFlow.js
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, alignItems: 'start' }}>

                    {/* ── Left: Camera + Detection ── */}
                    <div>
                        {/* Lecture selector */}
                        <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                            <input
                                placeholder="Lecture ID (optional)"
                                value={lectureId}
                                onChange={e => setLectureId(e.target.value)}
                                style={{
                                    flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                    borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)'
                                }}
                            />
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                {profiles.length} enrolled
                            </span>
                        </div>

                        {/* Video container */}
                        <div ref={overlayRef} style={{
                            position: 'relative', width: '100%', aspectRatio: '4/3',
                            background: '#08080f', borderRadius: 16, overflow: 'hidden',
                            border: `2px solid ${boxColor}`, transition: 'border-color 0.2s'
                        }}>
                            <video ref={videoRef} autoPlay muted playsInline style={{
                                width: '100%', height: '100%', objectFit: 'cover',
                                display: 'block', transform: 'scaleX(-1)'
                            }} />
                            <canvas ref={canvasRef} style={{ 
                                position: 'absolute', inset: 0, width: '100%', height: '100%', 
                                pointerEvents: 'none', transform: 'scaleX(-1)' 
                            }} />

                            {/* Bounding box */}
                            {liveBox && (
                                <div style={{
                                    position: 'absolute', ...liveBox,
                                    border: `2px solid ${boxColor}`,
                                    boxShadow: `0 0 12px ${boxColor}60`,
                                    borderRadius: 4, pointerEvents: 'none',
                                    transform: 'scaleX(-1)'   // mirror to match video flip
                                }}>
                                    {liveResult?.matched && (
                                        <div style={{
                                            position: 'absolute', bottom: '100%', left: 0, marginBottom: 4,
                                            background: '#22c55e', color: '#fff',
                                            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {liveResult.name} ({liveResult.confidence}%)
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Corner brackets */}
                            {['tl','tr','bl','br'].map(c => (
                                <div key={c} style={{
                                    position: 'absolute', width: 20, height: 20,
                                    borderTop: c.startsWith('t') ? `2px solid rgba(96,165,250,0.6)` : 'none',
                                    borderBottom: c.startsWith('b') ? `2px solid rgba(96,165,250,0.6)` : 'none',
                                    borderLeft: c.endsWith('l') ? `2px solid rgba(96,165,250,0.6)` : 'none',
                                    borderRight: c.endsWith('r') ? `2px solid rgba(96,165,250,0.6)` : 'none',
                                    top: c.startsWith('t') ? 10 : 'auto', bottom: c.startsWith('b') ? 10 : 'auto',
                                    left: c.endsWith('l') ? 10 : 'auto', right: c.endsWith('r') ? 10 : 'auto',
                                }} />
                            ))}

                            {/* No camera placeholder */}
                            {phase !== 'live' && (
                                <div style={{
                                    position: 'absolute', inset: 0, display: 'flex',
                                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--text-muted)'
                                }}>
                                    <div style={{ fontSize: 52, marginBottom: 10 }}>📷</div>
                                    <div style={{ fontSize: 14 }}>{phase === 'init' ? 'Loading...' : 'Click Start Scan below'}</div>
                                </div>
                            )}

                            {/* Live badge */}
                            {phase === 'live' && (
                                <div style={{
                                    position: 'absolute', top: 10, left: 10,
                                    background: 'rgba(239,68,68,0.9)', color: '#fff',
                                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: 6
                                }}>
                                    <span style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                                    LIVE SCAN
                                </div>
                            )}

                            {/* Face status badge */}
                            {phase === 'live' && (
                                <div style={{
                                    position: 'absolute', top: 10, right: 10,
                                    background: faceFound ? 'rgba(34,197,94,0.9)' : 'rgba(100,100,120,0.9)',
                                    color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600
                                }}>
                                    {faceFound ? '● Face detected' : '○ No face'}
                                </div>
                            )}
                        </div>

                        {/* Status bar */}
                        <div style={{
                            background: 'var(--bg-secondary)', borderRadius: 10, padding: '10px 16px',
                            marginTop: 10, fontSize: 12, fontWeight: 600, color: '#60a5fa',
                            border: '1px solid var(--border)'
                        }}>
                            {status}
                        </div>

                        {/* Controls */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                            {phase !== 'live'
                                ? <button className="btn btn-primary" onClick={startCamera} disabled={phase === 'init'} style={{ flex: 1 }}>
                                    🎥 Start Live Scan
                                  </button>
                                : <button className="btn btn-danger" onClick={stopCamera} style={{ flex: 1 }}>
                                    ⏹ Stop Scan
                                  </button>
                            }
                        </div>
                        {error && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{error}</div>}
                    </div>

                    {/* ── Right: Match result + Log ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                        {/* Current match */}
                        <div style={{
                            padding: 20, borderRadius: 14,
                            background: liveResult?.matched ? 'rgba(34,197,94,0.08)' :
                                        faceFound ? 'rgba(245,158,11,0.08)' : 'var(--bg-secondary)',
                            border: `1px solid ${liveResult?.matched ? 'rgba(34,197,94,0.4)' :
                                        faceFound ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                            minHeight: 140,
                            transition: 'all 0.3s'
                        }}>
                            {liveResult?.matched ? (
                                <>
                                    <div style={{ fontSize: 32, marginBottom: 6 }}>✅</div>
                                    <div style={{ fontWeight: 800, fontSize: 18, color: '#22c55e' }}>{liveResult.name}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{liveResult.roll_no}</div>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8
                                    }}>
                                        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                                            <div style={{ width: `${liveResult.confidence}%`, height: '100%', background: confidenceColor, borderRadius: 3, transition: 'width 0.3s' }} />
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: confidenceColor }}>{liveResult.confidence}%</span>
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        Distance: {liveResult.distance?.toFixed(4)} (threshold: {MATCH_THRESHOLD})
                                    </div>
                                </>
                            ) : faceFound ? (
                                <>
                                    <div style={{ fontSize: 32, marginBottom: 6 }}>🔍</div>
                                    <div style={{ fontWeight: 700, fontSize: 15, color: '#f59e0b' }}>Unknown Face</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                        Not enrolled or below confidence threshold.<br />
                                        Best distance: {liveResult?.distance?.toFixed(4) || '—'}
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 28 }}>
                                    <div style={{ fontSize: 32, marginBottom: 6 }}>👤</div>
                                    <div style={{ fontSize: 13 }}>Waiting for face in frame...</div>
                                </div>
                            )}
                        </div>

                        {/* Attendance log */}
                        <div style={{ padding: 16, borderRadius: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                                📋 Attendance Log
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{log.length} records</span>
                            </div>
                            {log.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                                    No attendance marked yet in this session
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                                    {log.map(entry => (
                                        <div key={entry.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '8px 12px', borderRadius: 8, background: 'var(--bg-card)',
                                            border: '1px solid var(--border)', fontSize: 12
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{entry.name}</div>
                                                <div style={{ color: 'var(--text-muted)' }}>{entry.roll_no}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ color: '#22c55e', fontWeight: 600 }}>{entry.status}</div>
                                                <div style={{ color: 'var(--text-muted)' }}>{entry.time}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 12 }}>
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>ℹ️ How It Works</div>
                            {[
                                `Face matched using Euclidean distance (threshold: ${MATCH_THRESHOLD})`,
                                'SSD MobileNetV1 detects faces at ~120ms intervals',
                                'Attendance auto-marked once per 5s cooldown',
                                'Duplicates blocked per lecture session via API',
                                'Embeddings fetched live from Firebase Firestore',
                            ].map((t, i) => (
                                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5, color: 'var(--text-muted)' }}>
                                    <span style={{ color: '#60a5fa' }}>•</span> {t}
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
