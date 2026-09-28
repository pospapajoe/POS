import Link from "next/link";
import { getSession, logout } from "./actions";
import LoginClient from "./LoginClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return <LoginClient />;
  }

  // Jika KASIR, langsung masuk ke mesin POS
  if (session.role === "KASIR") {
    redirect("/pos");
  }

  const isAdmin = session.role === "ADMIN";

  return (
    <div className="dashboard-container" style={{ position: 'relative' }}>
      {/* Header Info */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: '18px' }}>{session.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px', textTransform: 'uppercase' }}>{session.role} • NIK: {session.nik}</div>
        </div>
        <form action={logout}>
          <button type="submit" style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
            Logout
          </button>
        </form>
      </div>

      <div className="dashboard-content" style={{ marginTop: '60px' }}>
        <h1 className="dashboard-title">PAPA JOE SYSTEM</h1>
        <p className="dashboard-subtitle">Pilih menu untuk memulai aktivitas Anda hari ini</p>
        
        <div className="dashboard-grid">
          {/* Kasir - Semua Role Bisa Akses */}
          <Link href="/pos" className="dash-card primary">
            <div className="dash-icon">🛒</div>
            <h2>Kasir (POS)</h2>
            <p>Buka mesin kasir untuk melayani transaksi pembelian.</p>
          </Link>

          {/* Fitur Admin Saja */}
          {isAdmin && (
            <>
              <Link href="/stock" className="dash-card secondary">
                <div className="dash-icon">📦</div>
                <h2>Manajemen Stok</h2>
                <p>Tambah barang baru, update HPP, dan edit stok.</p>
              </Link>
              
              <Link href="/retur" className="dash-card" style={{borderColor: 'var(--danger)'}}>
                <div className="dash-icon">🔄</div>
                <h2>Retur Barang</h2>
                <p>Catat barang rusak atau ditarik dari stok gudang.</p>
              </Link>

              <Link href="/employees" className="dash-card" style={{borderColor: '#8b5cf6'}}>
                <div className="dash-icon">👥</div>
                <h2>Manajemen Karyawan</h2>
                <p>Tambah akun kasir baru, reset password, & hak akses.</p>
              </Link>

              <Link href="/reports" className="dash-card" style={{borderColor: '#10b981'}}>
                <div className="dash-icon">📊</div>
                <h2>Laporan & EOD</h2>
                <p>Lihat profit, riwayat shift, dan laporan penjualan harian.</p>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
