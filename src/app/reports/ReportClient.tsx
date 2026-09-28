"use client";

import { useState } from "react";
import Link from "next/link";

export default function ReportClient({ transactions, shifts }: { transactions: any[], shifts: any[] }) {
  const [activeTab, setActiveTab] = useState("performa");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
  };

  const totalSales = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalHpp = transactions.reduce((sum, t) => sum + t.totalHpp, 0);
  const totalMargin = totalSales - totalHpp;
  const totalDiscount = transactions.reduce((sum, t) => sum + t.discount, 0);
  const cashSales = transactions.filter(t => t.paymentMethod === 'CASH').reduce((sum, t) => sum + t.totalAmount, 0);
  const qrisSales = transactions.filter(t => t.paymentMethod === 'QRIS').reduce((sum, t) => sum + t.totalAmount, 0);

  // Performa Penjualan Calculations
  const transactionsByDate = transactions.reduce((acc, t) => {
    const dateStr = new Date(t.createdAt).toLocaleDateString('id-ID'); 
    if (!acc[dateStr]) acc[dateStr] = { sales: 0, struk: 0 };
    acc[dateStr].sales += t.totalAmount;
    acc[dateStr].struk += 1;
    return acc;
  }, {} as Record<string, { sales: number, struk: number }>);

  const totalDays = Object.keys(transactionsByDate).length || 1;
  const avgSpd = totalSales / totalDays;
  const avgStd = transactions.length / totalDays;

  // Fast/Slow moving items
  const productSales = transactions.reduce((acc, t) => {
    t.items.forEach((item: any) => {
      const pName = item.product?.name || "Unknown (Deleted)";
      if (!acc[pName]) acc[pName] = { qty: 0, revenue: 0 };
      acc[pName].qty += item.quantity;
      acc[pName].revenue += (item.quantity * item.priceAtTime);
    });
    return acc;
  }, {} as Record<string, { qty: number, revenue: number }>);

  const sortedProducts = Object.entries(productSales).sort((a, b) => b[1].qty - a[1].qty);
  const fastMove = sortedProducts.slice(0, 5); 
  const slowMove = sortedProducts.slice(-5).reverse(); 

  return (
    <div className="stock-container" style={{display: 'flex', flexDirection: 'column'}}>
      <div className="stock-header" style={{marginBottom: '24px'}}>
        <div className="stock-header-left">
          <Link href="/" className="back-btn">← Kembali ke Dashboard</Link>
          <h1 style={{marginTop: '16px'}}>Laporan & EOD (End of Day)</h1>
        </div>
      </div>

      <div style={{display: 'flex', gap: '16px', marginBottom: '24px'}}>
        <button onClick={() => setActiveTab("performa")} style={{padding: '12px 24px', borderRadius: '8px', border: 'none', background: activeTab === 'performa' ? 'var(--primary)' : 'var(--surface)', color: activeTab === 'performa' ? 'white' : 'var(--text-main)', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow)'}}>
          📈 Performa Penjualan
        </button>
        <button onClick={() => setActiveTab("sales")} style={{padding: '12px 24px', borderRadius: '8px', border: 'none', background: activeTab === 'sales' ? 'var(--primary)' : 'var(--surface)', color: activeTab === 'sales' ? 'white' : 'var(--text-main)', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow)'}}>
          Daftar Struk (Sales)
        </button>
        <button onClick={() => setActiveTab("shifts")} style={{padding: '12px 24px', borderRadius: '8px', border: 'none', background: activeTab === 'shifts' ? 'var(--primary)' : 'var(--surface)', color: activeTab === 'shifts' ? 'white' : 'var(--text-main)', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow)'}}>
          Riwayat Setoran (Shifts)
        </button>
      </div>

      {activeTab === "performa" && (
        <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px'}}>
            <div style={{background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', color: 'white', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)'}}>
              <div style={{fontSize: '14px', fontWeight: 600, opacity: 0.8}}>Sales Per Day (SPD)</div>
              <div style={{fontSize: '28px', fontWeight: 800, marginTop: '8px'}}>{formatPrice(avgSpd)}</div>
              <div style={{fontSize: '12px', marginTop: '4px', opacity: 0.8}}>Rata-rata Penjualan / Hari</div>
            </div>
            <div style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)'}}>
              <div style={{fontSize: '14px', fontWeight: 600, opacity: 0.8}}>Struk Per Day (STD)</div>
              <div style={{fontSize: '28px', fontWeight: 800, marginTop: '8px'}}>{avgStd.toFixed(1)} <span style={{fontSize: '16px'}}>Struk</span></div>
              <div style={{fontSize: '12px', marginTop: '4px', opacity: 0.8}}>Rata-rata Transaksi / Hari</div>
            </div>
            <div style={{background: 'var(--surface)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)'}}>
              <div style={{color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600}}>Total Penjualan Kotor</div>
              <div style={{fontSize: '28px', fontWeight: 800, marginTop: '8px'}}>{formatPrice(totalSales)}</div>
            </div>
            <div style={{background: 'var(--surface)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)'}}>
              <div style={{color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600}}>Total Laba Kotor</div>
              <div style={{fontSize: '28px', fontWeight: 800, color: '#10b981', marginTop: '8px'}}>{formatPrice(totalMargin)}</div>
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
            <div style={{background: 'var(--surface)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)'}}>
              <h3 style={{marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>🔥 Fast Moving Items (Top 5)</h3>
              {fastMove.length === 0 ? <p style={{color: 'var(--text-muted)'}}>Belum ada data penjualan.</p> : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  {fastMove.map((item, i) => (
                    <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--background)', borderRadius: '8px'}}>
                      <div style={{fontWeight: 700}}>{i + 1}. {item[0]}</div>
                      <div style={{textAlign: 'right'}}>
                        <div style={{fontWeight: 800, color: 'var(--primary)'}}>{item[1].qty} Pcs</div>
                        <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>{formatPrice(item[1].revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{background: 'var(--surface)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)'}}>
              <h3 style={{marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>🐢 Slow Moving Items (Bottom 5)</h3>
              {slowMove.length === 0 ? <p style={{color: 'var(--text-muted)'}}>Belum ada data penjualan.</p> : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  {slowMove.map((item, i) => (
                    <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--background)', borderRadius: '8px'}}>
                      <div style={{fontWeight: 700}}>{i + 1}. {item[0]}</div>
                      <div style={{textAlign: 'right'}}>
                        <div style={{fontWeight: 800, color: 'var(--danger)'}}>{item[1].qty} Pcs</div>
                        <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>{formatPrice(item[1].revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "sales" && (
        <>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px'}}>
            <div style={{background: 'var(--surface)', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow)'}}>
              <div style={{color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600}}>Total Omzet</div>
              <div style={{fontSize: '24px', fontWeight: 800, color: 'var(--primary)'}}>{formatPrice(totalSales)}</div>
            </div>
            <div style={{background: 'var(--surface)', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow)'}}>
              <div style={{color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600}}>Total Modal (HPP)</div>
              <div style={{fontSize: '24px', fontWeight: 800}}>{formatPrice(totalHpp)}</div>
            </div>
            <div style={{background: '#d1fae5', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow)'}}>
              <div style={{color: '#065f46', fontSize: '14px', fontWeight: 600}}>Laba / Margin Bersih</div>
              <div style={{fontSize: '24px', fontWeight: 800, color: '#064e3b'}}>{formatPrice(totalMargin)}</div>
            </div>
            <div style={{background: 'var(--surface)', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow)'}}>
              <div style={{color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600}}>Cash Masuk</div>
              <div style={{fontSize: '24px', fontWeight: 800}}>{formatPrice(cashSales)}</div>
            </div>
            <div style={{background: 'var(--surface)', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow)'}}>
              <div style={{color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600}}>QRIS Masuk</div>
              <div style={{fontSize: '24px', fontWeight: 800}}>{formatPrice(qrisSales)}</div>
            </div>
          </div>

          <div className="stock-table-container">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>No. Struk</th>
                  <th>Waktu Transaksi</th>
                  <th>Kasir</th>
                  <th>Metode</th>
                  <th>Total Belanja</th>
                  <th>Diskon/Promo</th>
                  <th>Margin</th>
                  <th>Detail Item</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td style={{fontWeight: 700}}>{t.receiptNumber}</td>
                    <td>{new Date(t.createdAt).toLocaleString('id-ID')}</td>
                    <td>{t.user?.name || "Unknown"}</td>
                    <td><span className="badge">{t.paymentMethod}</span></td>
                    <td style={{fontWeight: 700}}>{formatPrice(t.totalAmount)}</td>
                    <td style={{color: 'var(--danger)'}}>{t.discount > 0 ? `-${formatPrice(t.discount)}` : '-'}</td>
                    <td style={{color: 'var(--success)', fontWeight: 600}}>{formatPrice(t.totalAmount - t.totalHpp)}</td>
                    <td style={{fontSize: '12px'}}>
                      {t.items.map((item: any) => (
                        <div key={item.id}>{item.quantity}x {item.product?.name} (HPP: {item.hppAtTime}, Jual: {item.priceAtTime})</div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "shifts" && (
        <div className="stock-table-container">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Kasir (PIC)</th>
                <th>Waktu Mulai</th>
                <th>Waktu Selesai (Tutup)</th>
                <th>QRIS (Sistem)</th>
                <th>Cash (Sistem)</th>
                <th>Cash (Fisik / Setor)</th>
                <th>Selisih (Balance)</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map(s => {
                const selisih = s.actualCash !== null ? s.actualCash - s.expectedCash : null;
                return (
                  <tr key={s.id}>
                    <td>
                      <span className="badge" style={{background: s.status === 'OPEN' ? '#d1fae5' : '#e5e7eb', color: s.status === 'OPEN' ? '#065f46' : 'black'}}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{fontWeight: 700}}>{s.user?.name || "Unknown"}</td>
                    <td>{new Date(s.startTime).toLocaleString('id-ID')}</td>
                    <td>{s.endTime ? new Date(s.endTime).toLocaleString('id-ID') : '-'}</td>
                    <td>{formatPrice(s.expectedQris)}</td>
                    <td>{formatPrice(s.expectedCash)}</td>
                    <td style={{fontWeight: 600}}>{s.actualCash !== null ? formatPrice(s.actualCash) : '-'}</td>
                    <td>
                      {selisih !== null ? (
                        <span style={{color: selisih === 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700}}>
                          {selisih === 0 ? 'COCOK' : formatPrice(selisih)}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
