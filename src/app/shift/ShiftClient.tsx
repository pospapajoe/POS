"use client";

import { useState } from "react";
import Link from "next/link";
import { closeShift } from "../actions";

export default function ShiftClient({ shift, session }: { shift: any, session: any }) {
  const [actualCash, setActualCash] = useState<number | "">("");
  const [isProcessing, setIsProcessing] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
  };

  const handleCloseShift = async () => {
    if (typeof actualCash !== "number") {
      alert("Masukkan jumlah uang tunai fisik yang ada di laci kasir!");
      return;
    }

    if (confirm("Anda yakin ingin menutup shift sekarang? Transaksi selanjutnya akan tercatat di shift baru.")) {
      setIsProcessing(true);
      await closeShift(shift.id, actualCash);
      alert("Shift berhasil ditutup! (Setoran selesai)");
      
      // If Kasir, logout automatically
      if (session.role === "KASIR") {
        document.cookie = "pos_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.href = "/";
      } else {
        window.location.href = "/";
      }
    }
  };

  if (!shift) {
    return (
      <div className="stock-container" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
        <h2>Belum ada Shift aktif.</h2>
        <p style={{color: 'var(--text-muted)', marginBottom: '24px'}}>Silakan lakukan transaksi pertama di menu POS untuk memulai shift baru.</p>
        <Link href={session.role === 'KASIR' ? '/pos' : '/'} className="back-btn" style={{padding: '12px 24px', background: 'var(--primary)', color: 'white'}}>Kembali</Link>
      </div>
    );
  }

  const selisih = typeof actualCash === "number" ? actualCash - shift.expectedCash : 0;

  return (
    <div className="stock-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{background: 'var(--surface)', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', width: '600px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '24px', marginBottom: '24px'}}>
          <div>
            <h1 style={{fontSize: '28px'}}>Tutup Kasir (EOD)</h1>
            <p style={{color: 'var(--text-muted)'}}>Kasir: {session.name} | Shift Mulai: {new Date(shift.startTime).toLocaleString('id-ID')}</p>
          </div>
          {session.role === 'ADMIN' && <Link href="/" className="back-btn">← Kembali</Link>}
          {session.role === 'KASIR' && <Link href="/pos" className="back-btn">← Ke POS</Link>}
        </div>

        <div style={{display: 'flex', gap: '24px', marginBottom: '32px'}}>
          <div style={{flex: 1, background: '#e0e7ff', padding: '24px', borderRadius: '12px'}}>
            <div style={{color: '#3730a3', fontWeight: 600}}>Total QRIS (Sistem)</div>
            <div style={{fontSize: '28px', fontWeight: 800, color: '#312e81'}}>{formatPrice(shift.expectedQris)}</div>
          </div>
          <div style={{flex: 1, background: '#d1fae5', padding: '24px', borderRadius: '12px'}}>
            <div style={{color: '#065f46', fontWeight: 600}}>Total Cash (Sistem)</div>
            <div style={{fontSize: '28px', fontWeight: 800, color: '#064e3b'}}>{formatPrice(shift.expectedCash)}</div>
          </div>
        </div>

        <div style={{marginBottom: '24px'}}>
          <label style={{display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '18px'}}>Hitung Uang Tunai Laci (Fisik)</label>
          <p style={{color: 'var(--text-muted)', marginBottom: '16px'}}>Silakan hitung uang tunai yang ada di dalam laci dan masukkan jumlah totalnya ke bawah ini untuk dicocokkan dengan sistem.</p>
          <input 
            type="number" 
            value={actualCash} 
            onChange={e => setActualCash(Number(e.target.value))}
            style={{width: '100%', padding: '20px', fontSize: '24px', fontWeight: 800, borderRadius: '12px', border: '2px solid var(--border)'}}
            placeholder="Rp 0"
          />
        </div>

        {typeof actualCash === "number" && (
          <div style={{
            padding: '20px', borderRadius: '12px', marginBottom: '24px',
            background: selisih === 0 ? '#d1fae5' : (selisih < 0 ? '#fee2e2' : '#fef3c7'),
            color: selisih === 0 ? '#065f46' : (selisih < 0 ? '#991b1b' : '#92400e')
          }}>
            <div style={{fontWeight: 700, fontSize: '18px'}}>
              Status Setoran: {selisih === 0 ? 'BALANCE (COCOK)' : (selisih < 0 ? 'MINUS (KEKURANGAN)' : 'PLUS (KELEBIHAN)')}
            </div>
            <div style={{fontSize: '24px', fontWeight: 800}}>Selisih: {formatPrice(selisih)}</div>
          </div>
        )}

        <button 
          onClick={handleCloseShift}
          disabled={isProcessing}
          style={{width: '100%', padding: '20px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '20px', fontWeight: 700, cursor: 'pointer', opacity: isProcessing ? 0.7 : 1}}
        >
          {isProcessing ? "Menutup Shift..." : "SELESAIKAN SETORAN & TUTUP KASIR"}
        </button>
      </div>
    </div>
  );
}
