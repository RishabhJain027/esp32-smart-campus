'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// ── Helpers ────────────────────────────────────────────────────────
function euclidean(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
    return Math.sqrt(sum);
}

function cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const MATCH_THRESHOLD  = 0.55;
const COSINE_THRESHOLD = 0.78;
const SCAN_INTERVAL_MS = 200;

// ── Main Component ─────────────────────────────────────────────────
export default function FacePayment({ userId, userName, onSuccess, buttonText, style, disabled }) {
    const [showModal, setShowModal]     = useState(false);
    const [phase, setPhase]             = useState('init'); // init | loading | ready | live | matched | error
    const [profiles, setProfiles]       = useState([]);
    const [status, setStatus]           = useState('');
    const [liveResult, setLiveResult]   = useState(null);
    const [faceFound, setFaceFound]     = useState(false);
    const [liveBox, setLiveBox]         = useState(null);
    const [matchProgress, setMatchProgress] = useState(0);
    const [confirmedMatch, setConfirmedMatch] = useState(null);

    const videoRef   = useRef(null);
    const canvasRef  = useRef(null);
    const faceApi    = useRef(null);
    const intervalId = useRef(null);
    const matchCount = useRef(0);

    const REQUIRED_CONSECUTIVE_MATCHES = 5; // Need 5 consecutive matches for confirmation

    // ── Boot: load models + profiles ──
    const boot = useCallback(async () => {
        setPhase('loading');
        setStatus('⏳ Loading face recognition AI...');

        try {
            const fa = await import('face-api.js');
            faceApi.current = fa;

            await Promise.all([
                fa.nets.ssdMobilenetv1.loadFromUri('/models'),
                fa.nets.faceLandmark68Net.loadFromUri('/models'),
                fa.nets.faceRecognitionNet.loadFromUri('/models'),
                fa.nets.tinyFaceDetector.loadFromUri('/models').catch(() => {}),
            ]);

            setStatus('✅ AI models loaded — fetching enrolled faces...');
        } catch (e) {
            console.warn('Model load error:', e);
            setStatus('⚠️ Models not available — using demo mode.');
        }

        try {
            const res = await fetch('/api/students/face-embeddings');
            const data = await res.json();
            setProfiles(data.profiles || []);
            const count = (data.profiles || []).length;
            setStatus(count > 0
                ? `✅ ${count} face${count > 1 ? 's' : ''} enrolled — starting camera...`
                : '⚠️ No enrolled faces. Register via Face Training first.');
        } catch (e) {
            setStatus('⚠️ Could not load face profiles.');
        }

        setPhase('ready');
    }, []);

    // ── Start camera ──
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setPhase('live');
            setStatus('🎥 Look at the camera — scanning your face...');
            matchCount.current = 0;
            setMatchProgress(0);
        } catch (e) {
            setPhase('error');
            setStatus('❌ Camera access denied. Please allow camera permissions.');
        }
    }, []);

    // ── Start scanning loop ──
    const startLoop = useCallback(() => {
        if (intervalId.current) clearInterval(intervalId.current);

        intervalId.current = setInterval(async () => {
            const video = videoRef.current;
            const fa = faceApi.current;
            if (!video || !fa || video.readyState < 2) return;

            try {
                let det = await fa.detectSingleFace(
                    video,
                    new fa.SsdMobilenetv1Options({ minConfidence: 0.35, maxResults: 1 })
                ).withFaceLandmarks().withFaceDescriptor();

                // Fallback to tiny detector
                if (!det && fa.nets.tinyFaceDetector.isLoaded) {
                    det = await fa.detectSingleFace(
                        video,
                        new fa.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.35 })
                    ).withFaceLandmarks().withFaceDescriptor();
                }

                if (!det) {
                    setFaceFound(false);
                    setLiveBox(null);
                    setLiveResult(null);
                    matchCount.current = 0;
                    setMatchProgress(0);
                    return;
                }

                setFaceFound(true);

                // Calc box position (mirrored)
                const { x, y, width, height } = det.detection.box;
                const vw = video.videoWidth || video.clientWidth;
                const vh = video.videoHeight || video.clientHeight;
                setLiveBox({
                    left:   `${((vw - x - width) / vw) * 100}%`,
                    top:    `${(y / vh) * 100}%`,
                    width:  `${(width / vw) * 100}%`,
                    height: `${(height / vh) * 100}%`,
                });

                const descriptor = Array.from(det.descriptor);

                // Match against enrolled profiles
                let best = null, bestEucDist = Infinity, bestCosSimil = -1;
                for (const p of profiles) {
                    if (!p.face_embedding || p.face_embedding.length !== 128) continue;
                    const euc = euclidean(descriptor, p.face_embedding);
                    const cos = cosineSimilarity(descriptor, p.face_embedding);
                    if (euc < bestEucDist) {
                        bestEucDist = euc;
                        bestCosSimil = cos;
                        best = p;
                    }
                }

                const eucMatch = best && bestEucDist < MATCH_THRESHOLD;
                const cosMatch = best && bestCosSimil > COSINE_THRESHOLD;

                if (best && (eucMatch || cosMatch)) {
                    const eucPct = Math.max(0, Math.round((1 - bestEucDist / MATCH_THRESHOLD) * 100));
                    const cosPct = Math.round(bestCosSimil * 100);
                    const confidence = Math.min(Math.round((eucPct + cosPct) / 2), 99);

                    // Check if this is the correct user
                    if (best.id === userId) {
                        matchCount.current++;
                        setMatchProgress(Math.min(matchCount.current / REQUIRED_CONSECUTIVE_MATCHES * 100, 100));

                        setLiveResult({
                            matched: true,
                            name: best.name,
                            roll_no: best.roll_no,
                            confidence,
                            id: best.id,
                        });

                        // Confirmed after enough consecutive matches
                        if (matchCount.current >= REQUIRED_CONSECUTIVE_MATCHES) {
                            clearInterval(intervalId.current);
                            intervalId.current = null;
                            setConfirmedMatch({ name: best.name, roll_no: best.roll_no, confidence, id: best.id });
                            setPhase('matched');
                            setStatus(`✅ Identity confirmed: ${best.name}`);
                        }
                    } else {
                        // Different student — wrong person
                        matchCount.current = 0;
                        setMatchProgress(0);
                        setLiveResult({
                            matched: false,
                            name: best.name,
                            message: `Detected ${best.name} — not your account.`,
                        });
                    }
                } else {
                    matchCount.current = 0;
                    setMatchProgress(0);
                    setLiveResult({ matched: false });
                }
            } catch (e) {
                // Frame processing error — skip
            }
        }, SCAN_INTERVAL_MS);
    }, [profiles, userId]);

    // ── Cleanup ──
    const cleanup = useCallback(() => {
        if (intervalId.current) { clearInterval(intervalId.current); intervalId.current = null; }
        const stream = videoRef.current?.srcObject;
        if (stream) stream.getTracks().forEach(t => t.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        setPhase('init');
        setLiveResult(null);
        setLiveBox(null);
        setFaceFound(false);
        setMatchProgress(0);
        setConfirmedMatch(null);
        matchCount.current = 0;
        setStatus('');
    }, []);

    // Auto-start camera when phase becomes ready
    useEffect(() => {
        if (showModal && phase === 'ready') {
            startCamera();
        }
    }, [showModal, phase, startCamera]);

    // Auto-start loop when phase becomes live
    useEffect(() => {
        if (phase === 'live') {
            setTimeout(() => startLoop(), 500);
        }
    }, [phase, startLoop]);

    // Handle open
    const handleOpen = () => {
        setShowModal(true);
        boot();
    };

    // Handle close
    const handleClose = () => {
        cleanup();
        setShowModal(false);
    };

    // Handle confirm payment
    const handleConfirmPayment = () => {
        if (confirmedMatch && onSuccess) {
            onSuccess(confirmedMatch);
        }
        handleClose();
    };

    const boxColor = liveResult?.matched ? '#22c55e' : faceFound ? '#f59e0b' : 'rgba(139,92,246,0.4)';

    return (
        <>
            {/* ── Trigger Button ── */}
            <button
                onClick={handleOpen}
                disabled={disabled}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}
            >
                <span style={{ fontSize: 18 }}>🧠</span>
                {buttonText || 'Pay with Face Recognition'}
            </button>

            {/* ── Full-screen Face Scan Modal ── */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(5,12,30,0.95)',
                    backdropFilter: 'blur(20px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999,
                    animation: 'faceFadeIn 0.3s ease',
                }}>
                    <style>{`
                        @keyframes faceFadeIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
                        @keyframes facePulse { 0%,100%{box-shadow:0 0 30px rgba(139,92,246,0.2)} 50%{box-shadow:0 0 60px rgba(139,92,246,0.5)} }
                        @keyframes faceSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                        @keyframes faceGlow { 0%,100%{opacity:0.4} 50%{opacity:1} }
                        @keyframes facePop { 0%{transform:scale(0.7);opacity:0} 70%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
                        @keyframes scanLine { 0%{top:0%} 100%{top:90%} }
                        @keyframes cornerPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
                    `}</style>

                    <div style={{
                        maxWidth: 460, width: '94%',
                        background: 'rgba(15,20,40,0.95)',
                        border: '1px solid rgba(139,92,246,0.3)',
                        borderRadius: 24, overflow: 'hidden',
                        animation: 'facePulse 3s ease-in-out infinite',
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '18px 24px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            borderBottom: '1px solid rgba(139,92,246,0.15)',
                            background: 'rgba(139,92,246,0.05)',
                        }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    🧠 Face Recognition Payment
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                    CNN-powered identity verification
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                style={{
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff', cursor: 'pointer', fontSize: 18,
                                    width: 36, height: 36, borderRadius: 10,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >✕</button>
                        </div>

                        {/* Camera Area */}
                        <div style={{ padding: '16px 20px 0' }}>
                            {phase === 'matched' && confirmedMatch ? (
                                /* ── Success View ── */
                                <div style={{
                                    textAlign: 'center', padding: '40px 20px',
                                    animation: 'facePop 0.4s ease forwards',
                                }}>
                                    <div style={{
                                        width: 90, height: 90, borderRadius: '50%',
                                        background: 'rgba(34,197,94,0.15)', border: '3px solid #22c55e',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 16px', fontSize: 44,
                                    }}>✅</div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e', marginBottom: 4 }}>
                                        Identity Verified!
                                    </div>
                                    <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>
                                        {confirmedMatch.name}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                                        Confidence: <span style={{ color: '#22c55e', fontWeight: 700 }}>{confirmedMatch.confidence}%</span>
                                    </div>
                                    <button
                                        onClick={handleConfirmPayment}
                                        className="btn btn-primary"
                                        style={{
                                            width: '100%', height: 52, fontSize: 15, fontWeight: 700,
                                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                            border: 'none', borderRadius: 12,
                                        }}
                                    >
                                        ✅ Confirm & Pay Now
                                    </button>
                                </div>
                            ) : (
                                /* ── Camera View ── */
                                <div style={{
                                    position: 'relative', width: '100%', aspectRatio: '4/3',
                                    background: '#04080f', borderRadius: 16, overflow: 'hidden',
                                    border: `2px solid ${boxColor}`,
                                    transition: 'border-color 0.3s',
                                    boxShadow: `0 0 30px ${boxColor}20`,
                                }}>
                                    <video ref={videoRef} autoPlay muted playsInline style={{
                                        width: '100%', height: '100%', objectFit: 'cover',
                                        display: 'block', transform: 'scaleX(-1)',
                                    }} />
                                    <canvas ref={canvasRef} style={{
                                        position: 'absolute', inset: 0,
                                        width: '100%', height: '100%', pointerEvents: 'none',
                                        transform: 'scaleX(-1)',
                                    }} />

                                    {/* Face bounding box */}
                                    {liveBox && (
                                        <div style={{
                                            position: 'absolute', ...liveBox,
                                            border: `2px solid ${boxColor}`,
                                            boxShadow: `0 0 16px ${boxColor}80`,
                                            borderRadius: 8, pointerEvents: 'none',
                                            transition: 'all 0.15s ease-out',
                                        }}>
                                            {liveResult?.matched && (
                                                <div style={{
                                                    position: 'absolute', bottom: '100%', left: -2, marginBottom: 4,
                                                    background: '#22c55e', color: '#fff',
                                                    fontSize: 11, fontWeight: 700,
                                                    padding: '3px 10px', borderRadius: 6,
                                                    whiteSpace: 'nowrap',
                                                    boxShadow: '0 2px 8px rgba(34,197,94,0.4)',
                                                }}>
                                                    ✔ {liveResult.name} ({liveResult.confidence}%)
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Scanning line animation */}
                                    {phase === 'live' && !liveResult?.matched && (
                                        <div style={{
                                            position: 'absolute', left: '10%', right: '10%',
                                            height: 2, background: 'linear-gradient(90deg, transparent, #8b5cf6, transparent)',
                                            boxShadow: '0 0 12px #8b5cf6',
                                            animation: 'scanLine 2s ease-in-out infinite alternate',
                                            pointerEvents: 'none',
                                        }} />
                                    )}

                                    {/* Corner brackets (face scanning UI) */}
                                    {['tl','tr','bl','br'].map(c => (
                                        <div key={c} style={{
                                            position: 'absolute', width: 28, height: 28,
                                            borderTop:    c.startsWith('t') ? '3px solid rgba(139,92,246,0.8)' : 'none',
                                            borderBottom: c.startsWith('b') ? '3px solid rgba(139,92,246,0.8)' : 'none',
                                            borderLeft:   c.endsWith('l')   ? '3px solid rgba(139,92,246,0.8)' : 'none',
                                            borderRight:  c.endsWith('r')   ? '3px solid rgba(139,92,246,0.8)' : 'none',
                                            top:    c.startsWith('t') ? 16 : 'auto',
                                            bottom: c.startsWith('b') ? 16 : 'auto',
                                            left:   c.endsWith('l')   ? 16 : 'auto',
                                            right:  c.endsWith('r')   ? 16 : 'auto',
                                            borderRadius: c === 'tl' ? '8px 0 0 0' :
                                                          c === 'tr' ? '0 8px 0 0' :
                                                          c === 'bl' ? '0 0 0 8px' :
                                                                       '0 0 8px 0',
                                            animation: 'cornerPulse 2s ease-in-out infinite',
                                        }} />
                                    ))}

                                    {/* LIVE badge */}
                                    {phase === 'live' && (
                                        <div style={{
                                            position: 'absolute', top: 12, left: 12,
                                            background: 'rgba(139,92,246,0.9)', color: '#fff',
                                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            backdropFilter: 'blur(8px)',
                                        }}>
                                            <span style={{
                                                width: 6, height: 6, background: '#fff',
                                                borderRadius: '50%', display: 'inline-block',
                                                animation: 'faceGlow 1s infinite',
                                            }} />
                                            FACE SCAN
                                        </div>
                                    )}

                                    {/* Face detection badge */}
                                    {phase === 'live' && (
                                        <div style={{
                                            position: 'absolute', top: 12, right: 12,
                                            background: faceFound ? 'rgba(34,197,94,0.9)' : 'rgba(30,40,60,0.9)',
                                            color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                            backdropFilter: 'blur(8px)',
                                        }}>
                                            {faceFound ? '● Face detected' : '○ Scanning...'}
                                        </div>
                                    )}

                                    {/* Loading / no camera state */}
                                    {(phase === 'init' || phase === 'loading' || phase === 'ready') && (
                                        <div style={{
                                            position: 'absolute', inset: 0, display: 'flex',
                                            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--text-muted)', background: 'rgba(5,10,25,0.8)',
                                        }}>
                                            <div style={{
                                                width: 18, height: 18, border: '2px solid #8b5cf6',
                                                borderTopColor: 'transparent', borderRadius: '50%',
                                                animation: 'faceSpin 0.8s linear infinite', marginBottom: 12,
                                            }} />
                                            <div style={{ fontSize: 13 }}>
                                                {phase === 'loading' ? 'Loading AI models...' : 'Starting camera...'}
                                            </div>
                                        </div>
                                    )}

                                    {/* Error state */}
                                    {phase === 'error' && (
                                        <div style={{
                                            position: 'absolute', inset: 0, display: 'flex',
                                            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            color: '#ef4444', background: 'rgba(5,10,25,0.9)',
                                        }}>
                                            <div style={{ fontSize: 42, marginBottom: 8 }}>❌</div>
                                            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Camera Access Denied</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                Please allow camera permissions
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom Status Bar */}
                        <div style={{ padding: '12px 20px 18px' }}>
                            {/* Match progress bar */}
                            {phase === 'live' && (
                                <div style={{ marginBottom: 10 }}>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        fontSize: 11, color: 'var(--text-muted)', marginBottom: 4,
                                    }}>
                                        <span>Recognition Progress</span>
                                        <span style={{ color: matchProgress > 60 ? '#22c55e' : matchProgress > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                                            {Math.round(matchProgress)}%
                                        </span>
                                    </div>
                                    <div style={{
                                        background: 'rgba(255,255,255,0.06)', borderRadius: 6,
                                        height: 6, overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            height: '100%', width: `${matchProgress}%`,
                                            background: matchProgress > 60
                                                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                                : matchProgress > 0
                                                ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                                : 'linear-gradient(90deg, #8b5cf6, #7c3aed)',
                                            borderRadius: 6, transition: 'width 0.2s ease-out',
                                            boxShadow: matchProgress > 0 ? `0 0 8px ${matchProgress > 60 ? '#22c55e' : '#f59e0b'}40` : 'none',
                                        }} />
                                    </div>
                                </div>
                            )}

                            {/* Status message */}
                            <div style={{
                                padding: '8px 14px', borderRadius: 10,
                                background: 'rgba(139,92,246,0.08)',
                                border: '1px solid rgba(139,92,246,0.15)',
                                fontSize: 12, fontWeight: 600,
                                color: '#a78bfa', textAlign: 'center',
                            }}>
                                {status || 'Initializing...'}
                            </div>

                            {/* Info text */}
                            {phase === 'live' && (
                                <div style={{
                                    marginTop: 10, fontSize: 11, color: 'var(--text-muted)',
                                    textAlign: 'center', lineHeight: 1.5,
                                }}>
                                    {liveResult?.message
                                        ? <span style={{ color: '#f59e0b' }}>{liveResult.message}</span>
                                        : faceFound && !liveResult?.matched
                                        ? 'Face detected — verifying identity...'
                                        : liveResult?.matched
                                        ? `Hold steady — confirming ${liveResult.name}...`
                                        : 'Position your face in the frame'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
