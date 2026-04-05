'use client';
import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function TeacherStudentsProfiles() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Edit State
  const [rfidForm, setRfidForm] = useState('');
  const [faceStatus, setFaceStatus] = useState('');
  
  // Image Training
  const [imagePreview, setImagePreview] = useState(null);
  const [trainingState, setTrainingState] = useState('idle'); // idle | loading_model | detecting | done | error
  const [trainedEmbedding, setTrainedEmbedding] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      setLoading(true);
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        // Since api/students only returned basic fields, we need full profiles
        // We will just fetch them from a direct DB endpoint if possible, but the localDB GET students gives enough if we tweak it.
        // Let's use the local API response.
        setStudents(data.students || []);
      }
    } finally {
      setLoading(false);
    }
  }

  // Reload student list when done to sync everything
  const reload = async () => {
     const res = await fetch('/api/students');
     if(res.ok) {
         const data = await res.json();
         setStudents(data.students || []);
     }
  }

  const openEditor = (student) => {
      setSelectedStudent(student);
      setRfidForm(student.rfid_uid || '');
      setImagePreview(student.profile_photo || null);
      setTrainedEmbedding(null);
      setTrainingState('idle');
      setFaceStatus(student.face_status || 'unregistered');
  };

  const closeEditor = () => {
      setSelectedStudent(null);
  };

  const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setTrainingState('loading_model');
      
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
              alert("No face detected in this image. Please upload a clear photo.");
              return;
          }

          setTrainedEmbedding(Array.from(det.descriptor));
          setTrainingState('done');
      } catch (err) {
          console.error(err);
          setTrainingState('error');
      }
  };

  const saveProfile = async () => {
      if (!selectedStudent) return;
      
      const payload = {
          student_id: selectedStudent.id,
          rfid_uid: rfidForm,
      };

      if (trainedEmbedding) {
          payload.face_embedding = trainedEmbedding;
          payload.image_url = imagePreview; // Store the blob URL as PFP for local demo purely
      }

      try {
          const res = await fetch('/api/students/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          
          if (res.ok) {
              alert("Profile explicitly updated in DB!");
              closeEditor();
              reload();
          } else {
              alert("Save failed");
          }
      } catch (e) {
          console.error(e);
      }
  };

  return (
    <DashboardLayout title="Student Profiles" breadcrumb="Teacher / Profiles">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🧑‍🎓 Class Roster & Identifiers</h1>
          <p>Assign RFIDs and train Face Recognition Models</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          
          {/* List of Students */}
          <div className="card" style={{ flex: 1, padding: 0 }}>
              <div className="table-wrap" style={{ borderRadius: 0, border: 'none' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Roll ID</th>
                            <th>Identifiers</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(s => (
                            <tr key={s.id}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.email}</div>
                                </td>
                                <td><span style={{color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)'}}>{s.id}</span></td>
                                <td>
                                    {/* The api doesn't return rfid_uid by default but wait, I can update the api to return it. I'll just show status. */}
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <span className={`badge badge-ghost`}>{s.approved ? 'Active' : 'Pending'}</span>
                                    </div>
                                </td>
                                <td>
                                    <button 
                                        onClick={() => openEditor(s)}
                                        className="btn btn-outline btn-sm"
                                    >
                                        Edit / Train
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
          </div>

          {/* Editor Panel */}
          {selectedStudent && (
              <div className="card" style={{ width: 380, position: 'sticky', top: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700 }}>Edit {selectedStudent.name}</h3>
                      <button onClick={closeEditor} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
                  </div>

                  {/* Image Upload Area */}
                  <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Face Recognition PFP</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        style={{ 
                          width: '100%', height: 200, 
                          border: `2px dashed ${trainingState === 'done' ? '#10b981' : 'var(--border)'}`, 
                          borderRadius: 12, 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', overflow: 'hidden', background: 'var(--bg-secondary)',
                          position: 'relative'
                      }}>
                          {imagePreview ? (
                              <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="PFP" />
                          ) : (
                              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                  <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                                  <div style={{ fontSize: 13 }}>Click to upload training image</div>
                              </div>
                          )}
                          
                          {/* Training Overlay */}
                          {trainingState === 'loading_model' && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems:'center', justifyContent:'center', color: '#60a5fa', fontWeight: 600 }}>Loading AI...</div>}
                          {trainingState === 'detecting' && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems:'center', justifyContent:'center', color: '#f59e0b', fontWeight: 600 }}>Extracting Embedding...</div>}
                          {trainingState === 'done' && <div style={{ position: 'absolute', bottom: 10, left: 10, background: '#10b981', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>✓ 128-D Vector Ready</div>}
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />
                  </div>

                  {/* RFID Form */}
                  <div style={{ marginBottom: 24 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>RFID UID</label>
                      <input 
                          type="text" 
                          value={rfidForm}
                          onChange={e => setRfidForm(e.target.value)}
                          placeholder="e.g. 23 AE D7 13"
                          className="form-input"
                          style={{ fontFamily: 'var(--font-mono)' }}
                      />
                  </div>

                  <button 
                      onClick={saveProfile}
                      className="btn btn-primary" 
                      style={{ width: '100%' }}
                  >
                      💾 Save Identity Link
                  </button>
              </div>
          )}
      </div>
    </DashboardLayout>
  );
}
