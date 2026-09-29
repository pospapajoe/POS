"use client";

import { useState } from "react";
import Link from "next/link";
import { addEmployee } from "../actions";

type User = {
  id: string;
  nik: string;
  name: string;
  role: string;
  createdAt: string;
};

export default function EmployeeClient({ initialEmployees }: { initialEmployees: User[] }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  
  const [nik, setNik] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("KASIR");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addEmployee({ nik, name, password, role });
      setAlertMsg("Karyawan berhasil ditambahkan!");
      setShowModal(false);
      setNik(""); setName(""); setPassword(""); setRole("KASIR");
    } catch (err: any) {
      setAlertMsg("Gagal menambahkan karyawan. NIK mungkin sudah dipakai.");
    }
    setLoading(false);
  };

  return (
    <div className="stock-container" style={{ position: 'relative' }}>
      {showModal && (
        <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <div style={{background: 'white', padding: '32px', borderRadius: '12px', width: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '24px'}}>
              <h2>Tambah Karyawan Baru</h2>
              <button onClick={() => setShowModal(false)} style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer'}}>×</button>
            </div>
            
            <form onSubmit={handleAdd} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 600}}>NIK Karyawan</label>
                <input required type="text" value={nik} onChange={e => setNik(e.target.value)} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}} placeholder="Contoh: 00123" />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 600}}>Nama Lengkap</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}} placeholder="Nama Lengkap" />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 600}}>Password / PIN</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}} placeholder="••••••" />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 600}}>Role (Hak Akses)</label>
                <select value={role} onChange={e => setRole(e.target.value)} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}}>
                  <option value="KASIR">Kasir (Hanya POS & Tutup Kasir)</option>
                  <option value="ADMIN">Admin (Akses Penuh / Semua Menu)</option>
                </select>
              </div>
              
              <button type="submit" disabled={loading} className="add-new-btn" style={{marginTop: '16px', width: '100%', padding: '16px', fontSize: '18px', opacity: loading ? 0.7 : 1}}>
                {loading ? "Menyimpan..." : "Simpan Karyawan"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="stock-header">
        <div className="stock-header-left">
          <Link href="/" className="back-btn">← Kembali</Link>
          <h1>Manajemen Karyawan</h1>
        </div>
        <div className="stock-header-right">
          <button className="add-new-btn" onClick={() => setShowModal(true)}>+ Tambah Karyawan</button>
        </div>
      </div>

      <div className="stock-table-container">
        <table className="stock-table">
          <thead>
            <tr>
              <th>NIK</th>
              <th>Nama Karyawan</th>
              <th>Role (Hak Akses)</th>
              <th>Tanggal Didaftarkan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {initialEmployees.map(emp => (
              <tr key={emp.id}>
                <td style={{fontWeight: 700}}>{emp.nik}</td>
                <td>{emp.name}</td>
                <td>
                  <span className="badge" style={{background: emp.role === "ADMIN" ? '#e0e7ff' : '#f3f4f6', color: emp.role === "ADMIN" ? '#3730a3' : '#4b5563'}}>
                    {emp.role}
                  </span>
                </td>
                <td>{new Date(emp.createdAt).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                <td>
                  <button className="btn-edit" onClick={() => setAlertMsg("Fitur edit belum tersedia (Tahap selanjutnya)")}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Custom Alert Modal */}
      {alertMsg !== "" && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'}}>
          <div style={{background: 'white', padding: '32px', borderRadius: '16px', width: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center'}}>
            <div style={{fontSize: '48px', marginBottom: '16px'}}>ℹ️</div>
            <h2 style={{fontSize: '24px', fontWeight: 800, marginBottom: '12px'}}>Informasi</h2>
            <p style={{color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5'}}>{alertMsg}</p>
            <button onClick={() => setAlertMsg("")} style={{width: '100%', padding: '16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '16px', cursor: 'pointer'}}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
