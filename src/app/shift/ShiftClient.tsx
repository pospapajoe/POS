"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { closeShift } from "../actions";

export default function ShiftClient({ shift, session }: { shift: any, session: any }) {
  const [actualCash, setActualCash] = useState<number | "">("");
  const [actualCashStr, setActualCashStr] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPrintState, setIsPrintState] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  
  const [shiftSnapshot, setShiftSnapshot] = useState(shift);

  useEffect(() => {
    if (shift && !isProcessing) {
      setShiftSnapshot(shift);
    }
  }, [shift, isProcessing]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
  };

  const handleCloseShift = async () => {
    if (typeof actualCash !== "number" || actualCashStr === "") {
      setAlertMsg("Masukkan jumlah uang tunai fisik yang ada di laci kasir terlebih dahulu!");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmClose = async () => {
    setShowConfirmModal(false);
    setIsProcessing(true);
    setIsPrintState(true);
  };

  useEffect(() => {
    const doCloseAndPrint = async () => {
      if (isPrintState && shiftSnapshot) {
        // Beri waktu sejenak agar DOM struk ter-render
        setTimeout(async () => {
          window.print();
          
          // Setelah print dialog muncul/selesai, baru eksekusi ke database
          await closeShift(shiftSnapshot.id, actualCash as number);
          
          // Redirect
          setTimeout(() => {
            if (session.role === "KASIR") {
              document.cookie = "pos_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              window.location.href = "/";
            } else {
              window.location.href = "/";
            }
          }, 1000);
        }, 500);
      }
    };
    doCloseAndPrint();
  }, [isPrintState]);

  if (!shiftSnapshot) {
    return (
      <div className="stock-container" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
        <h2>Belum ada Shift aktif.</h2>
        <p style={{color: 'var(--text-muted)', marginBottom: '24px'}}>Silakan lakukan transaksi pertama di menu POS untuk memulai shift baru.</p>
        <Link href={session.role === 'KASIR' ? '/pos' : '/'} className="back-btn" style={{padding: '12px 24px', background: 'var(--primary)', color: 'white'}}>Kembali</Link>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-shift-report, #printable-shift-report * { visibility: visible; }
          #printable-shift-report { position: absolute; left: 0; top: 0; width: 58mm; padding: 0; margin: 0; font-family: monospace; font-size: 12px; color: black; }
        }
      `}} />
      <div className="stock-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <div style={{background: 'var(--surface)', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', width: '600px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '24px', marginBottom: '24px'}}>
            <div>
              <h1 style={{fontSize: '28px'}}>Tutup Kasir (EOD)</h1>
              <p style={{color: 'var(--text-muted)'}}>Kasir: {session.name} | Shift Mulai: {new Date(shiftSnapshot.startTime).toLocaleString('id-ID')}</p>
            </div>
            {session.role === 'ADMIN' && <Link href="/" className="back-btn">← Kembali</Link>}
            {session.role === 'KASIR' && <Link href="/pos" className="back-btn">← Ke POS</Link>}
          </div>

          <div style={{display: 'flex', gap: '24px', marginBottom: '32px'}}>
            <div style={{flex: 1, background: '#e0e7ff', padding: '24px', borderRadius: '12px'}}>
              <div style={{color: '#3730a3', fontWeight: 600}}>Total Pendapatan QRIS (Sistem)</div>
              <div style={{fontSize: '28px', fontWeight: 800, color: '#312e81'}}>{formatPrice(shiftSnapshot.expectedQris)}</div>
            </div>
          </div>

          <div style={{marginBottom: '32px'}}>
            <label style={{display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '18px'}}>Hitung Uang Tunai Laci (Fisik)</label>
            <p style={{color: 'var(--text-muted)', marginBottom: '16px'}}>Silakan hitung uang tunai yang ada di dalam laci dan masukkan totalnya. (Target uang sistem dirahasiakan)</p>
            <input 
              type="text" 
              value={actualCashStr} 
              onChange={e => {
                 const num = e.target.value.replace(/\D/g, "");
                 setActualCashStr(num.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
                 setActualCash(Number(num));
              }}
              style={{width: '100%', padding: '20px', fontSize: '24px', fontWeight: 800, borderRadius: '12px', border: '2px solid var(--border)'}}
              placeholder="Ketik Nominal..."
            />
          </div>

          <button 
            onClick={handleCloseShift}
            disabled={isProcessing}
            style={{width: '100%', padding: '20px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '20px', fontWeight: 700, cursor: 'pointer', opacity: isProcessing ? 0.7 : 1}}
          >
            {isProcessing ? "Menyimpan & Mencetak Laporan..." : "SELESAIKAN SETORAN & CETAK LAPORAN"}
          </button>
        </div>
      </div>

      {/* Custom Alert Modal */}
      {alertMsg !== "" && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'}}>
          <div style={{background: 'white', padding: '32px', borderRadius: '16px', width: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center'}}>
            <div style={{fontSize: '48px', marginBottom: '16px'}}>⚠️</div>
            <h2 style={{fontSize: '24px', fontWeight: 800, marginBottom: '12px'}}>Perhatian</h2>
            <p style={{color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5'}}>{alertMsg}</p>
            <button onClick={() => setAlertMsg("")} style={{width: '100%', padding: '16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '16px', cursor: 'pointer'}}>Mengerti</button>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {showConfirmModal && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'}}>
          <div style={{background: 'white', padding: '32px', borderRadius: '16px', width: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center'}}>
            <div style={{fontSize: '48px', marginBottom: '16px'}}>🔒</div>
            <h2 style={{fontSize: '24px', fontWeight: 800, marginBottom: '12px'}}>Konfirmasi Tutup Kasir</h2>
            <p style={{color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5'}}>
              Anda yakin ingin menutup shift sekarang? Laporan EOD akan langsung dicetak.
            </p>
            <div style={{display: 'flex', gap: '12px', flexDirection: 'column'}}>
              <button onClick={confirmClose} style={{width: '100%', padding: '16px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '16px', cursor: 'pointer'}}>Ya, Tutup & Cetak</button>
              <button onClick={() => setShowConfirmModal(false)} style={{width: '100%', padding: '16px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '16px', cursor: 'pointer'}}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable Shift Report */}
      {isPrintState && (
        <div id="printable-shift-report" style={{background: 'white', padding: '10px'}}>
          <div style={{textAlign: 'center', marginBottom: '10px'}}>
            <h2 style={{margin: '0 0 5px 0', fontSize: '16px'}}>PAPA JOE</h2>
            <div style={{fontWeight: 'bold'}}>LAPORAN SETORAN SHIFT</div>
          </div>
          
          <div style={{borderTop: '1px dashed black', borderBottom: '1px dashed black', padding: '5px 0', margin: '5px 0'}}>
            <div>Kasir: {session.name}</div>
            <div>Mulai: {new Date(shiftSnapshot.startTime).toLocaleString('id-ID')}</div>
            <div>Tutup: {new Date().toLocaleString('id-ID')}</div>
          </div>
          
          <div style={{marginTop: '10px', marginBottom: '10px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
              <span>QRIS (Sistem)</span>
              <span>{formatPrice(shiftSnapshot.expectedQris)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
              <span>CASH (Laci)</span>
              <span>{formatPrice(Number(actualCash))}</span>
            </div>
          </div>

          <div style={{borderTop: '1px dashed black', paddingTop: '5px', marginTop: '5px', textAlign: 'center'}}>
            <div style={{marginBottom: '15px'}}>Laporan ini sah dicetak oleh sistem.</div>
            <div>TTD Kasir</div>
            <br/><br/>
            <div>___________________</div>
          </div>
        </div>
      )}
    </>
  );
}
