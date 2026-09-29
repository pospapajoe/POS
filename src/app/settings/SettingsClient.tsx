"use client";

import { useState } from "react";
import Link from "next/link";
import { updateStoreSetting } from "./actions";

export default function SettingsClient({ setting }: { setting: any }) {
  const [formData, setFormData] = useState({
    name: setting?.name || "",
    address: setting?.address || "",
    phone: setting?.phone || "",
    email: setting?.email || ""
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const showToast = (message: string, type: 'success'|'error' = 'success') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateStoreSetting(formData);
      showToast("Pengaturan berhasil disimpan!");
    } catch (err) {
      showToast("Gagal menyimpan pengaturan.", "error");
    }
    setLoading(false);
  };

  return (
    <div className="stock-container" style={{display: 'flex', flexDirection: 'column'}}>
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : '#10b981', color: 'white', 
          padding: '16px 32px', borderRadius: '50px', fontWeight: 700, fontSize: '18px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)', animation: 'slideDown 0.3s ease-out'
        }}>
          {toast.type === 'error' ? '⚠️ ' : '✅ '} {toast.message}
        </div>
      )}

      <div className="stock-header" style={{marginBottom: '24px'}}>
        <div className="stock-header-left">
          <Link href="/" className="back-btn">← Kembali ke Dashboard</Link>
          <h1 style={{marginTop: '16px'}}>Pengaturan Toko</h1>
        </div>
      </div>

      <div style={{background: 'var(--surface)', padding: '32px', borderRadius: '16px', boxShadow: 'var(--shadow)', maxWidth: '600px'}}>
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
          <div>
            <label style={{display: 'block', fontWeight: 600, marginBottom: '8px'}}>Nama Toko / Cabang</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={{width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '8px', border: '1px solid var(--border)'}}
            />
          </div>
          <div>
            <label style={{display: 'block', fontWeight: 600, marginBottom: '8px'}}>Alamat Lengkap</label>
            <textarea 
              required
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              style={{width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '100px'}}
            />
          </div>
          <div>
            <label style={{display: 'block', fontWeight: 600, marginBottom: '8px'}}>Nomor Telepon / WA</label>
            <input 
              type="text" 
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              style={{width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '8px', border: '1px solid var(--border)'}}
            />
          </div>
          <div>
            <label style={{display: 'block', fontWeight: 600, marginBottom: '8px'}}>Email</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={{width: '100%', padding: '12px 16px', fontSize: '16px', borderRadius: '8px', border: '1px solid var(--border)'}}
            />
          </div>
          <button type="submit" disabled={loading} style={{padding: '16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '18px', cursor: 'pointer', opacity: loading ? 0.7 : 1, marginTop: '12px'}}>
            {loading ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </form>
      </div>
    </div>
  );
}
