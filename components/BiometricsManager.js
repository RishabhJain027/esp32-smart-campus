'use client';
import { useState, useEffect } from 'react';

// Generates random buffer
function generateRandomBuffer(length) {
    const arr = new Uint8Array(length);
    window.crypto.getRandomValues(arr);
    return arr;
}

export default function BiometricsManager({ userId, userName, mode = 'register', onSuccess, buttonText, style }) {
    const [supported, setSupported] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (window.PublicKeyCredential) {
            PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
                .then(res => setSupported(res))
                .catch(() => setSupported(false));
        }
    }, []);

    const handleRegister = async () => {
        setLoading(true);
        try {
            const publicKey = {
                challenge: generateRandomBuffer(32),
                rp: { name: "SAKEC Campus System", id: window.location.hostname },
                user: {
                    id: generateRandomBuffer(16),
                    name: userName || "user",
                    displayName: userName || "User"
                },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256
                authenticatorSelection: {
                    authenticatorAttachment: "platform", // Enforces built-in fingerprint/face
                    userVerification: "required"
                },
                timeout: 60000,
            };

            const credential = await navigator.credentials.create({ publicKey });
            if (credential) {
                // Successfully stored securely on the user's OS layer
                localStorage.setItem(`sc_fingerprint_id_${userId}`, credential.id);
                if (onSuccess) onSuccess(credential);
                alert("✅ Biometric Fingerprint Registered Successfully!");
            }
        } catch (err) {
            console.error(err);
            alert("Biometric registration cancelled or failed.");
        }
        setLoading(false);
    };

    const handleAuthenticate = async () => {
        setLoading(true);
        try {
            const credentialId = localStorage.getItem(`sc_fingerprint_id_${userId}`);
            
            // Convert stored base64 or string ID back to Buffer (mocking for simple implementation)
            const publicKey = {
                challenge: generateRandomBuffer(32),
                rpId: window.location.hostname,
                userVerification: "required",
                timeout: 60000,
            };

            const assertion = await navigator.credentials.get({ publicKey });
            if (assertion) {
                if (onSuccess) onSuccess(assertion);
            }
        } catch (err) {
            console.error(err);
            alert("Biometric authentication failed or cancelled.");
        }
        setLoading(false);
    };

    if (!supported) return <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fingerprint/Biometrics not supported on this device.</div>;

    const action = mode === 'register' ? handleRegister : handleAuthenticate;

    return (
        <button 
            onClick={action} 
            disabled={loading}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}
        >
            <span style={{ fontSize: 20 }}>{loading ? '⏳' : '☝️'}</span>
            {buttonText || (mode === 'register' ? 'Register Fingerprint' : 'Verify with Fingerprint')}
        </button>
    );
}
