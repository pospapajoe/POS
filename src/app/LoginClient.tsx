"use client";

import { useState } from "react";
import { login } from "./actions";

export default function LoginClient() {
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(nik, password);
      window.location.reload(); // Reload to let server component read the new cookie
    } catch (err: any) {
      setError(err.message || "Gagal login. Periksa kembali NIK dan Password.");
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--background)', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', padding: '48px', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', width: '450px', textAlign: 'center' }}>
        <img src="/logo.png" alt="Papa Joe POS" style={{ height: '80px', objectFit: 'contain', marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Silakan masuk menggunakan NIK Anda.</p>
        
        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>NIK Karyawan</label>
            <input 
              type="text" 
              required
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              placeholder="Contoh: 123456"
              style={{ width: '100%', padding: '16px', fontSize: '20px', borderRadius: '12px', border: '2px solid var(--border)', outline: 'none', transition: '0.2s' }} 
            />
          </div>
          
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>PIN / Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              style={{ width: '100%', padding: '16px', fontSize: '20px', borderRadius: '12px', border: '2px solid var(--border)', outline: 'none', transition: '0.2s', letterSpacing: '4px' }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '16px', width: '100%', padding: '20px', fontSize: '20px', fontWeight: 700, 
              background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Memeriksa..." : "MASUK"}
          </button>
        </form>
        
        <p style={{ marginTop: '32px', color: 'var(--text-muted)', fontSize: '14px' }}>
          *Admin Default: NIK 123456 | Pass 123
        </p>
      </div>
    </div>
  );
}
