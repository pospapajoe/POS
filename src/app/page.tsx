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
    <div className="stock-layout">
      {/* Sidebar Kiri */}
      <div className="stock-sidebar" style={{ padding: '24px', justifyContent: 'space-between' }}>
           <img src="/logo.png" alt="Papa Joe POS" style={{ height: '40px', objectFit: 'contain', marginBottom: '32px' }} />
           
           <div className="stock-sidebar-menu" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Link href="/pos" style={{ padding: '16px', background: 'var(--surface)', border: '1px solid var(--primary)', borderRadius: '12px', textDecoration: 'none', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, boxShadow: 'var(--shadow)' }}>
                <span style={{ fontSize: '24px' }}>🛒</span> Kasir (POS)
              </Link>

              {isAdmin && (
                <>
                  <Link href="/stock" style={{ padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, transition: 'all 0.2s' }}>
                    <span style={{ fontSize: '24px' }}>📦</span> Manajemen Stok
                  </Link>

                  {/* Retur dihapus dari sini */}

                  <Link href="/employees" style={{ padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, transition: 'all 0.2s' }}>
                    <span style={{ fontSize: '24px' }}>👥</span> Karyawan
                  </Link>

                  <Link href="/reports" style={{ padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, transition: 'all 0.2s' }}>
                    <span style={{ fontSize: '24px' }}>📊</span> Laporan & EOD
                  </Link>
                </>
              )}
           </div>
        </div>

        {/* Profil dan Logout di bawah sidebar */}
        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>{session.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '16px' }}>{session.role} • NIK: {session.nik}</div>
          <form action={logout}>
            <button type="submit" style={{ width: '100%', background: '#fee2e2', color: '#991b1b', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* Konten Utama Kanan */}
      <div className="stock-main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '64px', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>👋</div>
          <h1 style={{ fontSize: '40px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>Selamat Datang!</h1>
          <p style={{ fontSize: '20px', color: 'var(--text-muted)' }}>Pilih menu di sidebar sebelah kiri untuk memulai.</p>
        </div>
      </div>
    </div>
  );
}
