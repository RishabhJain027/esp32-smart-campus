'use client';
import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function FaceTrainingPage() {
    const [user, setUser] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [trainingState, setTrainingState] = useState('idle'); // idle | loading | detecting | done | error
    const [trainedEmbedding, setTrainedEmbedding] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const authUser = localStorage.getItem('sc_user');
        if (authUser) {
            setUser(JSON.parse(authUser));
        }
    }, []);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setImagePreview(url);
        setTrainingState('loading');
        
        try {
            const fa = await import('face-api.js');
            await Promise.all([
                fa.nets.ssdMobilenetv1.loadFromUri('/models'),
                fa.nets.faceLandmark68Net.loadFromUri('/models'),
                fa.nets.faceRecognitionNet.loadFromUri('/models'),
            ]);
            
            setTrainingState('detecting');
            
            const img = new Image();
            img.src = url;
            await new Promise(r => img.onload = r);

            const det = await fa.detectSingleFace(
                img,
                new fa.SsdMobilenetv1Options({ minConfidence: 0.2 })
            ).withFaceLandmarks().withFaceDescriptor();
            
            if (!det) {
                setTrainingState('error');
                alert("No face detected in this image. Please ensure your face is clearly visible and well-lit.");
                return;
            }

            setTrainedEmbedding(Array.from(det.descriptor));
            setTrainingState('done');
        } catch (err) {
            console.error(err);
            setTrainingState('error');
            alert("Error loading AI models. Make sure /models folder exists locally.");
        }
    };

    const saveProfile = async () => {
        if (!user || !trainedEmbedding) return;
        
        try {
            const res = await fetch('/api/students/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: user.id,
                    face_embedding: trainedEmbedding,
                    image_url: imagePreview
                })
            });
            
            if (res.ok) {
                alert("Face Model Trained & Saved to Database successfully! You can now use the Face Check-In!");
            } else {
                alert("Failed to save face model to network database.");
            }
        } catch (e) {
            console.error(e);
            alert("Network error.");
        }
    };

    if (!user) return <DashboardLayout title="Face Training"><div style={{padding:20}}>Loading profile...</div></DashboardLayout>;

    return (
        <DashboardLayout title="Self-Service Face Training" breadcrumb="Profile / AI Configuration">
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div className="page-header-left">
                    <h1 style={{ fontSize: 26, fontWeight: 800 }}>🤖 Personal AI Identity</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Train your decentralized 128-D face embedding vector for the Live Scanner.</p>
                </div>
            </div>

            <div style={{ maxWidth: 500, margin: '0 auto', background: 'var(--bg-secondary)', padding: 24, borderRadius: 16, border: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 48, marginBottom: 10 }}>📷</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>Upload a Clear Selfie</div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>We extract the geometric mapping of your face locally without storing the image.</p>
                </div>

                {/* Upload Zone */}
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ 
                        width: '100%', height: 280, 
                        border: `2px dashed ${trainingState === 'done' ? '#10b981' : 'var(--color-cyan)'}`, 
                        borderRadius: 12, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', overflow: 'hidden', background: 'var(--bg-card)',
                        position: 'relative', marginBottom: 24
                }}>
                    {imagePreview ? (
                        <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="PFP" />
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--color-cyan)', fontWeight: 600 }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>+</div>
                            Click to Browse File
                        </div>
                    )}
                    
                    {/* overlays */}
                    {trainingState === 'loading' && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems:'center', justifyContent:'center', color: '#60a5fa', fontWeight: 600, flexDirection: 'column', gap: 10 }}><span>Loading TensorFlow...</span><span style={{ animation: 'pulse 1s infinite' }}>⏳</span></div>}
                    {trainingState === 'detecting' && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems:'center', justifyContent:'center', color: '#f59e0b', fontWeight: 600, flexDirection: 'column', gap: 10 }}><span>Extracting 128-D Embedding Arrays...</span><span style={{ animation: 'spin 1.5s linear infinite' }}>⚙️</span></div>}
                    {trainingState === 'done' && <div style={{ position: 'absolute', bottom: 10, left: 10, background: '#10b981', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>✅ Model Computed Ready for Upload</div>}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />

                <button 
                    onClick={saveProfile}
                    disabled={trainingState !== 'done'}
                    className={`btn ${trainingState === 'done' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ width: '100%', height: 48, fontSize: 14, fontWeight: 700 }}
                >
                    {trainingState === 'done' ? '💾 Synchronize Neural Pattern to Database' : 'Awaiting Image...'}
                </button>
            </div>
        </DashboardLayout>
    );
}
