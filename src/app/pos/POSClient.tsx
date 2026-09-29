"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { processTransaction, getLastTransaction } from "../actions";

type Product = {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  price: number;
  hpp: number;
  category: string;
  image: string;
};

type CartItem = Product & {
  quantity: number;
};

export default function POSClient({ initialProducts, session }: { initialProducts: Product[], session: any }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Scanner
  const [barcodeInput, setBarcodeInput] = useState("");

  // Payment States
  const [showPayment, setShowPayment] = useState(false);
  
  const [showTutupKasirModal, setShowTutupKasirModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [authAction, setAuthAction] = useState<{type: 'REPRINT' | 'VOID' | 'DELETE', payload?: any} | null>(null);
  const [authPin, setAuthPin] = useState("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState<number | "">("");
  const [cashReceivedStr, setCashReceivedStr] = useState("");
  
  // Receipt States
  const [receiptData, setReceiptData] = useState<any>(null);

  // Manual search string
  const [searchQuery, setSearchQuery] = useState("");

  // Listen for physical keyboard F-keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F3") {
        e.preventDefault();
        if (cart.length > 0) setShowPayment(true);
      }
      if (e.key === "F1") {
        e.preventDefault();
        setShowSearchModal(true);
      }
      if (e.key === "F4") {
        e.preventDefault();
        setAuthAction({ type: 'VOID' });
      }
      if (e.key === "F9") {
        e.preventDefault();
        setAuthAction({ type: 'REPRINT' });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matchedProduct = initialProducts.find(p => 
      (p.barcode && p.barcode === barcodeInput) || 
      (p.sku && p.sku.toUpperCase() === barcodeInput.toUpperCase())
    );

    if (matchedProduct) {
      addToCart(matchedProduct);
      setBarcodeInput("");
    } else {
      showToast("Barcode/SKU tidak ditemukan!");
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter((item) => item.quantity > 0)
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal;

  const cashChange = paymentMethod === "CASH" && typeof cashReceived === "number" ? Math.max(0, cashReceived - total) : 0;

  const handleCheckout = async () => {
    if (paymentMethod === "CASH" && (typeof cashReceived !== "number" || cashReceived < total)) {
      showToast("Uang tunai kurang!");
      return;
    }

    setIsProcessing(true);
    try {
      const receiptNo = await processTransaction(
        cart, 
        total, 
        paymentMethod, 
        paymentMethod === "CASH" ? Number(cashReceived) : null,
        paymentMethod === "CASH" ? cashChange : null,
        session.id
      );
      
      setReceiptData({
        receiptNo,
        date: new Date().toLocaleString("id-ID"),
        items: [...cart],
        subtotal,
        total,
        paymentMethod,
        cashReceived: paymentMethod === "CASH" ? Number(cashReceived) : null,
        cashChange: paymentMethod === "CASH" ? cashChange : null,
        cashierName: session.name
      });

      setShowPayment(false);
      setCart([]);
      setCashReceived("");
      setCashReceivedStr("");
      showToast("Transaksi Berhasil!", "success");
    } catch (e) {
      showToast("Terjadi kesalahan sistem saat checkout.");
    }
    setIsProcessing(false);
  };

  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);
  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // BLUETOOTH PRINTER STATE
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [printerDevice, setPrinterDevice] = useState<any>(null); // Uses any to avoid TS missing Web Bluetooth types

  const connectBluetoothPrinter = async () => {
    try {
      // @ts-ignore - Web Bluetooth API
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] // UUID standar printer kasir (SPP)
      });
      // @ts-ignore
      const server = await device.gatt?.connect();
      setPrinterDevice(server);
      setIsBluetoothConnected(true);
      showToast("Printer Bluetooth Terhubung!", "success");
    } catch (error) {
      console.error(error);
      showToast("Gagal menghubungkan printer bluetooth", "error");
    }
  };

  const printDirectly = async (receiptData: any) => {
    if (!printerDevice) return false;
    
    try {
      // UUID ini adalah yang paling umum untuk printer thermal BLE generik dari China (seperti MP-58A)
      // Terkadang menggunakan service: e7810a71-73ae-499d-8c15-faa9aef0c3f2 (jika yang standar gagal)
      let service;
      try {
        service = await printerDevice.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      } catch (e) {
        // Fallback generic UUID
        service = await printerDevice.getPrimaryService('e7810a71-73ae-499d-8c15-faa9aef0c3f2');
      }

      const characteristics = await service.getCharacteristics();
      // Cari characteristic yang mendukung 'write' (biasanya TX)
      const characteristic = characteristics.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
      
      if (!characteristic) {
        throw new Error("Characteristic untuk menulis tidak ditemukan");
      }

      // ==========================================
      // FORMAT STRUK UNTUK PRINTER 58mm (MP-58A)
      // Lebar maksimal rata-rata 32 karakter
      // ==========================================
      
      const pad = (str: string, len: number, char = ' ') => str.padEnd(len, char);
      const center = (str: string, len = 32) => {
        const left = Math.max(0, Math.floor((len - str.length) / 2));
        return pad('', left) + str;
      };

      let text = "";
      text += "\x1B\x40"; // ESC @ : Initialize printer
      text += "\x1B\x61\x01"; // ESC a 1 : Center align
      
      text += center("PAPA JOE") + "\n";
      text += center("Jl. Contoh POS No. 123") + "\n";
      text += center("Telp: 0812-3456-7890") + "\n";
      text += "--------------------------------\n";
      
      text += "\x1B\x61\x00"; // ESC a 0 : Left align
      text += `${receiptData.date}\n`;
      text += `Kasir: ${receiptData.cashierName}\n`;
      text += `No   : ${receiptData.receiptNo}\n`;
      text += "--------------------------------\n";
      
      receiptData.items.forEach((item: any) => {
        text += `${item.name}\n`;
        const qtyPrice = `${item.quantity} x ${formatPrice(item.price)}`;
        const total = formatPrice(item.price * item.quantity);
        // Menyusun rata kiri-kanan (total 32 char)
        const spaces = 32 - qtyPrice.length - total.length;
        text += qtyPrice + (spaces > 0 ? pad('', spaces) : ' ') + total + "\n";
      });
      
      text += "--------------------------------\n";
      
      const sub = formatPrice(receiptData.subtotal);
      text += "Subtotal" + pad('', 32 - 8 - sub.length) + sub + "\n";
      
      const tot = formatPrice(receiptData.total);
      text += "TOTAL   " + pad('', 32 - 8 - tot.length) + tot + "\n";
      text += "\n";

      const pay = formatPrice(receiptData.paymentMethod === 'CASH' ? receiptData.cashReceived : receiptData.total);
      text += pad(receiptData.paymentMethod, 8) + pad('', 32 - 8 - pay.length) + pay + "\n";
      
      if (receiptData.paymentMethod === 'CASH') {
        const chg = formatPrice(receiptData.cashChange);
        text += "KEMBALI " + pad('', 32 - 8 - chg.length) + chg + "\n";
      }
      
      text += "--------------------------------\n";
      text += "\x1B\x61\x01"; // ESC a 1 : Center align
      text += center("Terima Kasih") + "\n";
      text += center("Silakan Datang Kembali") + "\n";
      text += "\n\n\n"; // Feed paper

      // Convert to Uint8Array and send chunks
      const encoder = new TextEncoder();
      const encoded = encoder.encode(text);
      
      // Kirim data dalam ukuran kecil (chunk) karena BLE punya batasan payload
      const CHUNK_SIZE = 100; 
      for (let i = 0; i < encoded.length; i += CHUNK_SIZE) {
        const chunk = encoded.slice(i, i + CHUNK_SIZE);
        await characteristic.writeValue(chunk);
      }
      
      showToast("Struk berhasil dicetak ke Printer Bluetooth!", "success");
      return true;
    } catch (error) {
      console.error("Print error:", error);
      showToast("Gagal mencetak ke Printer Bluetooth. Pastikan perangkat mendukung Web BLE.", "error");
      return false;
    }
  };

  useEffect(() => {
    if (receiptData) {
      // Coba print via bluetooth dulu jika terhubung
      if (isBluetoothConnected && printerDevice) {
        printDirectly(receiptData);
        // Setelah print langsung, hilangkan modal struk secara otomatis
        setTimeout(() => setReceiptData(null), 2000); 
      } else {
        // Fallback: Munculkan modal dan pop-up print browser (seperti sekarang)
        setTimeout(() => {
          window.print();
        }, 300); 
      }
    }
  }, [receiptData, isBluetoothConnected, printerDevice]);

  const handleReprint = async () => {
    setAuthAction({ type: 'REPRINT' });
  };

  const handleAuthConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authPin === "123456") {
      const actionType = authAction?.type;
      const payload = authAction?.payload;
      
      setAuthAction(null);
      setAuthPin("");
      
      if (actionType === 'REPRINT') {
        try {
          const tx = await getLastTransaction(session.id);
          if (tx) {
            setReceiptData(tx);
          } else {
            showToast("Belum ada transaksi terakhir untuk dicetak ulang.", "error");
          }
        } catch (e) {
          showToast("Gagal mengambil data transaksi terakhir.", "error");
        }
      } else if (actionType === 'VOID') {
        setCart([]);
        showToast("Transaksi berhasil dibatalkan (Void).", "success");
      } else if (actionType === 'DELETE') {
        setCart(prev => prev.filter(item => item.id !== payload));
        showToast("Barang berhasil dihapus.", "success");
      }
    } else {
      showToast("PIN Otorisasi Salah!", "error");
    }
  };

  const filteredSearch = initialProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (showPayment) {
    return (
      <div style={{height: '100vh', display: 'flex', flexDirection: 'column', background: '#f3f4f6', zIndex: 10}}>
        <div style={{padding: '24px', background: 'white', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '24px'}}>
           <button onClick={() => setShowPayment(false)} style={{padding: '12px 24px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 700, cursor: 'pointer'}}>← Kembali (Edit Keranjang)</button>
           <h1 style={{fontSize: '28px'}}>Pembayaran Transaksi</h1>
        </div>
        <div style={{flex: 1, display: 'flex', padding: '32px', gap: '32px'}}>
           {/* Kiri: Ringkasan Keranjang */}
           <div style={{flex: 1, background: 'white', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column'}}>
              <h2>Ringkasan Pesanan</h2>
              <div style={{flex: 1, overflowY: 'auto', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px'}}>
                 {cart.map(item => (
                   <div key={item.id} style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '16px'}}>
                     <div>
                       <div style={{fontWeight: 700, fontSize: '18px'}}>{item.name}</div>
                       <div style={{color: '#64748b'}}>{item.quantity} x {formatPrice(item.price)}</div>
                     </div>
                     <div style={{fontWeight: 800, fontSize: '18px'}}>{formatPrice(item.price * item.quantity)}</div>
                   </div>
                 ))}
              </div>
              <div style={{marginTop: '24px', borderTop: '2px solid #e2e8f0', paddingTop: '24px'}}>
                 <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '20px', marginBottom: '12px'}}>
                    <span style={{color: '#64748b'}}>Subtotal</span>
                    <span style={{fontWeight: 700}}>{formatPrice(subtotal)}</span>
                 </div>
                 <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '32px', fontWeight: 800, color: 'var(--primary)', marginTop: '24px', paddingTop: '24px', borderTop: '2px dashed #cbd5e1'}}>
                    <span>TOTAL BAYAR</span>
                    <span>{formatPrice(total)}</span>
                 </div>
              </div>
           </div>

           {/* Kanan: Metode Pembayaran & Input Uang */}
           <div style={{flex: 1, background: 'white', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column'}}>
              <h2>Pilih Metode Pembayaran</h2>
              <div style={{display: 'flex', gap: '16px', marginTop: '24px'}}>
                <button onClick={() => setPaymentMethod("CASH")} style={{flex: 1, padding: '24px', borderRadius: '12px', border: paymentMethod === 'CASH' ? '3px solid var(--primary)' : '2px solid var(--border)', background: paymentMethod === 'CASH' ? '#e0e7ff' : 'white', fontWeight: 700, fontSize: '24px', cursor: 'pointer', transition: '0.2s'}}>💵 Tunai (CASH)</button>
                <button onClick={() => setPaymentMethod("QRIS")} style={{flex: 1, padding: '24px', borderRadius: '12px', border: paymentMethod === 'QRIS' ? '3px solid var(--primary)' : '2px solid var(--border)', background: paymentMethod === 'QRIS' ? '#e0e7ff' : 'white', fontWeight: 700, fontSize: '24px', cursor: 'pointer', transition: '0.2s'}}>📱 QRIS</button>
              </div>

              {paymentMethod === "CASH" && (
                <div style={{marginTop: '48px'}}>
                  <label style={{display: 'block', marginBottom: '16px', fontWeight: 700, fontSize: '20px'}}>Uang Diterima (Dari Pelanggan)</label>
                  <input type="text" value={cashReceivedStr} onChange={e => {
                     const num = e.target.value.replace(/\D/g, "");
                     setCashReceivedStr(num.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
                     setCashReceived(Number(num));
                  }} style={{width: '100%', padding: '24px', borderRadius: '12px', border: '2px solid #ddd', fontSize: '32px', fontWeight: 800, letterSpacing: '2px'}} placeholder="Ketik Nominal..." autoFocus />
                  
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px'}}>
                     {[50000, 100000, 150000, 200000].map(val => (
                       <button key={val} onClick={() => {
                          setCashReceived(val);
                          setCashReceivedStr(val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."));
                       }} style={{padding: '16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '18px', cursor: 'pointer'}}>{formatPrice(val)}</button>
                     ))}
                  </div>

                  {typeof cashReceived === 'number' && cashReceived >= total && (
                    <div style={{marginTop: '32px', padding: '24px', background: '#d1fae5', color: '#065f46', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span style={{fontWeight: 700, fontSize: '24px'}}>Uang Kembalian:</span>
                      <span style={{fontWeight: 800, fontSize: '40px'}}>{formatPrice(cashChange)}</span>
                    </div>
                  )}
                </div>
              )}

              <div style={{marginTop: 'auto'}}>
                <button onClick={handleCheckout} disabled={isProcessing || (paymentMethod === "CASH" && (typeof cashReceived !== "number" || cashReceived < total))} style={{width: '100%', padding: '24px', background: (paymentMethod !== "CASH" || (typeof cashReceived === "number" && cashReceived >= total)) ? 'var(--primary)' : '#94a3b8', color: 'white', border: 'none', borderRadius: '12px', fontSize: '24px', fontWeight: 800, cursor: (paymentMethod !== "CASH" || (typeof cashReceived === "number" && cashReceived >= total)) ? 'pointer' : 'not-allowed', opacity: isProcessing ? 0.7 : 1}}>
                  {isProcessing ? "Memproses..." : "SELESAIKAN PEMBAYARAN SEKARANG"}
                </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-receipt, #printable-receipt * { visibility: visible; }
          #printable-receipt { position: absolute; left: 0; top: 0; width: 58mm; padding: 0; margin: 0; }
        }
        .f-btn {
          flex: 1; padding: 16px; border: 2px solid var(--border); border-radius: 8px; font-weight: 800; font-size: 18px; cursor: pointer; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; transition: 0.2s;
        }
        .f-btn:active { transform: scale(0.95); }
      `}} />

      <div style={{height: '100vh', display: 'flex', flexDirection: 'column', background: '#f3f4f6'}}>
        
        {/* HEADER */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'white', borderBottom: '1px solid var(--border)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            {session?.role === 'ADMIN' && <Link href="/" className="back-btn">←</Link>}
            <img src="/logo.png" alt="Papa Joe POS" style={{ height: '40px', objectFit: 'contain' }} />
          </div>
          
          <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
            <button 
              onClick={connectBluetoothPrinter} 
              style={{padding: '12px 24px', background: isBluetoothConnected ? '#d1fae5' : '#f1f5f9', color: isBluetoothConnected ? '#065f46' : '#334155', border: isBluetoothConnected ? '1px solid #10b981' : '1px solid var(--border)', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '16px'}}
            >
              {isBluetoothConnected ? '✓ Printer Terhubung' : '🖨️ Hubungkan Printer BT'}
            </button>
            <button onClick={() => setShowTutupKasirModal(true)} style={{padding: '12px 24px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '16px'}}>
              Tutup Kasir
            </button>
            {session?.role === 'KASIR' && (
              <button onClick={() => { document.cookie = "pos_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"; window.location.href="/"; }} style={{padding: '12px 24px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer'}}>
                Logout
              </button>
            )}
          </div>
        </div>

        {/* MAIN AREA */}
        <div style={{display: 'flex', flex: 1, overflow: 'hidden'}}>
          
          {/* LEFT: SCANNER & CART TABLE */}
          <div style={{flex: 3, display: 'flex', flexDirection: 'column', padding: '24px', borderRight: '1px solid var(--border)'}}>
            
            {/* SCANNER INPUT */}
            <form onSubmit={handleBarcodeSubmit} style={{display: 'flex', gap: '12px', marginBottom: '24px'}}>
              <input 
                type="text" 
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                placeholder="Scan Barcode / SKU di sini..."
                style={{flex: 1, padding: '20px', fontSize: '24px', borderRadius: '8px', border: '2px solid var(--primary)', outline: 'none', fontWeight: 700, letterSpacing: '2px'}}
                autoFocus
              />
              <button type="submit" style={{padding: '0 32px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '20px', cursor: 'pointer'}}>
                INPUT
              </button>
            </form>

            {/* CART TABLE */}
            <div style={{flex: 1, background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflowY: 'auto', boxShadow: 'var(--shadow)'}}>
              <table className="stock-table" style={{width: '100%', textAlign: 'left'}}>
                <thead style={{position: 'sticky', top: 0, background: '#f8f9fa'}}>
                  <tr>
                    <th style={{padding: '16px'}}>Produk</th>
                    <th style={{padding: '16px'}}>Harga</th>
                    <th style={{padding: '16px'}}>QTY</th>
                    <th style={{padding: '16px'}}>Subtotal</th>
                    <th style={{padding: '16px'}}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr><td colSpan={5} style={{textAlign: 'center', padding: '48px', color: 'var(--text-muted)'}}>Keranjang kosong. Mulai scan barang!</td></tr>
                  ) : (
                    cart.map(item => (
                      <tr key={item.id} style={{borderBottom: '1px solid #eee'}}>
                        <td style={{padding: '16px', fontWeight: 700, fontSize: '18px'}}>
                          {item.name} 
                          <div style={{fontSize: '12px', color: '#888'}}>{item.sku}</div>
                        </td>
                        <td style={{padding: '16px', fontSize: '18px'}}>{formatPrice(item.price)}</td>
                        <td style={{padding: '16px'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                            <button onClick={() => updateQuantity(item.id, -1)} style={{width: '40px', height: '40px', fontSize: '24px', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer'}}>-</button>
                            <span style={{fontSize: '20px', fontWeight: 700}}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} style={{width: '40px', height: '40px', fontSize: '24px', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer'}}>+</button>
                          </div>
                        </td>
                        <td style={{padding: '16px', fontSize: '18px', fontWeight: 800}}>
                          {formatPrice(item.price * item.quantity)}
                        </td>
                        <td style={{padding: '16px'}}>
                          <div style={{display: 'flex', gap: '8px'}}>
                            <button onClick={() => setAuthAction({ type: 'DELETE', payload: item.id })} style={{padding: '8px 16px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer'}}>
                              HAPUS
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* F-KEYS BUTTONS (TABLET TOUCH) */}
            <div style={{display: 'flex', gap: '16px', marginTop: '24px'}}>
              <button onClick={() => setShowSearchModal(true)} className="f-btn" style={{background: 'white'}}>
                <span style={{fontSize: '24px'}}>🔍</span>
                <div>[F1] Cari Manual</div>
              </button>
              <button onClick={() => { if(cart.length > 0) setAuthAction({ type: 'VOID' }); }} className="f-btn" style={{background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5'}}>
                <span style={{fontSize: '24px'}}>🗑️</span>
                <div>[F4] Void / Batal</div>
              </button>
              <button onClick={handleReprint} className="f-btn" style={{background: '#e0f2fe', color: '#0369a1', borderColor: '#7dd3fc'}}>
                <span style={{fontSize: '24px'}}>🖨️</span>
                <div>[F9] Reprint Terakhir</div>
              </button>
              <button onClick={() => { if(cart.length > 0) setShowPayment(true); }} className="f-btn" style={{background: '#d1fae5', color: '#065f46', borderColor: '#6ee7b7', flex: 1.5}}>
                <span style={{fontSize: '24px'}}>💳</span>
                <div>[F3] LANJUT BAYAR</div>
              </button>
            </div>
          </div>

          {/* RIGHT: BILLING SUMMARY */}
          <div style={{flex: 1.2, background: '#1e293b', color: 'white', padding: '32px', display: 'flex', flexDirection: 'column'}}>
            <h2 style={{color: '#94a3b8', fontSize: '18px', marginBottom: '24px'}}>TOTAL TAGIHAN</h2>
            <div style={{fontSize: '56px', fontWeight: 800, color: '#10b981', marginBottom: '48px', wordBreak: 'break-all'}}>
              {formatPrice(total)}
            </div>

            <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '20px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '16px'}}>
                <span style={{color: '#cbd5e1'}}>Subtotal</span>
                <span style={{fontWeight: 700}}>{formatPrice(subtotal)}</span>
              </div>
            </div>
            
            <button 
              onClick={() => { if(cart.length > 0) setShowPayment(true); }}
              disabled={cart.length === 0}
              style={{width: '100%', padding: '24px', background: cart.length > 0 ? '#10b981' : '#475569', color: 'white', border: 'none', borderRadius: '12px', fontSize: '24px', fontWeight: 800, cursor: cart.length > 0 ? 'pointer' : 'not-allowed', marginTop: 'auto', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'}}
            >
              [F3] BAYAR SEKARANG
            </button>
          </div>
        </div>

        {/* MODALS BELOW */}

        {/* Modal Cari Manual */}
        {showSearchModal && (
          <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 120, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'}}>
            <div style={{background: 'white', padding: '32px', borderRadius: '16px', width: '800px', height: '600px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '24px'}}>
                <h2>Cari Barang Manual</h2>
                <button onClick={() => setShowSearchModal(false)} style={{background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer'}}>×</button>
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Ketik nama barang..."
                style={{width: '100%', padding: '16px', fontSize: '20px', borderRadius: '8px', border: '2px solid var(--border)', marginBottom: '24px'}}
                autoFocus
              />
              <div style={{flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignContent: 'start'}}>
                {filteredSearch.map(p => (
                  <div key={p.id} onClick={() => { addToCart(p); setShowSearchModal(false); }} style={{border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', cursor: 'pointer', textAlign: 'center'}}>
                    <div style={{fontWeight: 700, marginBottom: '8px'}}>{p.name}</div>
                    <div style={{color: 'var(--primary)', fontWeight: 800}}>{formatPrice(p.price)}</div>
                  </div>
                ))}
                {filteredSearch.length === 0 && <div style={{gridColumn: '1 / -1', textAlign: 'center', color: '#888'}}>Tidak ada hasil.</div>}
              </div>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Tutup Kasir */}
        {showTutupKasirModal && (
          <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'}}>
            <div style={{background: 'white', padding: '32px', borderRadius: '16px', width: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center'}}>
              <div style={{fontSize: '56px', marginBottom: '16px', animation: 'pulse 2s infinite'}}>🚨</div>
              <h2 style={{fontSize: '24px', fontWeight: 800, marginBottom: '12px'}}>Konfirmasi Tutup Kasir</h2>
              <p style={{color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5'}}>
                Apakah Anda yakin ingin menutup kasir sekarang? Tindakan ini akan <b>mengakhiri shift Anda</b> dan memandu Anda ke halaman penyetoran uang.
              </p>
              
              <div style={{display: 'flex', gap: '12px', flexDirection: 'column'}}>
                <button onClick={() => window.location.href = "/shift"} style={{width: '100%', padding: '16px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '16px', cursor: 'pointer'}}>Ya, Tutup Kasir Sekarang</button>
                <button onClick={() => setShowTutupKasirModal(false)} style={{width: '100%', padding: '16px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '16px', cursor: 'pointer'}}>Batal, Kembali Bekerja</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Otorisasi Universal (Reprint / Void / Hapus) */}
        {authAction && (
          <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'}}>
            <div style={{background: 'white', padding: '32px', borderRadius: '16px', width: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '24px'}}>
                <h2 style={{fontSize: '24px', fontWeight: 800}}>Otorisasi Supervisor</h2>
                <button onClick={() => { setAuthAction(null); setAuthPin(""); }} style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer'}}>×</button>
              </div>
              <p style={{color: 'var(--text-muted)', marginBottom: '16px'}}>
                {authAction.type === 'REPRINT' && "Masukkan PIN Supervisor untuk mencetak ulang struk sebelumnya."}
                {authAction.type === 'VOID' && "Masukkan PIN Supervisor untuk membatalkan (void) seluruh transaksi."}
                {authAction.type === 'DELETE' && "Masukkan PIN Supervisor untuk menghapus barang ini dari keranjang."}
              </p>
              <form onSubmit={handleAuthConfirm} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <input 
                  type="password" 
                  value={authPin}
                  onChange={e => setAuthPin(e.target.value)}
                  placeholder="Masukkan PIN (123456)"
                  style={{width: '100%', padding: '16px', fontSize: '20px', borderRadius: '8px', border: '2px solid var(--border)', textAlign: 'center', letterSpacing: '4px', fontWeight: 700}}
                  autoFocus
                />
                <button type="submit" style={{width: '100%', padding: '16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '18px', cursor: 'pointer'}}>Konfirmasi</button>
              </form>
            </div>
          </div>
        )}



        {/* Modal Pembayaran removed from here */}

        {/* Modal Struk */}
        {receiptData && (
          <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div style={{background: '#f3f4f6', padding: '32px', borderRadius: '12px', width: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              
              <div id="printable-receipt" style={{background: 'white', padding: '20px', width: '300px', fontFamily: 'monospace', fontSize: '12px', color: 'black', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
                <div style={{textAlign: 'center', marginBottom: '10px'}}>
                  <h2 style={{margin: '0 0 5px 0', fontSize: '16px'}}>PAPA JOE</h2>
                  <div>Jl. Contoh POS No. 123</div>
                  <div>Telp: 0812-3456-7890</div>
                </div>
                
                <div style={{borderTop: '1px dashed black', borderBottom: '1px dashed black', padding: '5px 0', margin: '5px 0', display: 'flex', justifyContent: 'space-between'}}>
                  <div>{receiptData.date}</div>
                  <div>Kasir: {receiptData.cashierName}</div>
                </div>
                <div style={{marginBottom: '5px'}}>No: {receiptData.receiptNo}</div>
                
                <div style={{borderBottom: '1px dashed black', paddingBottom: '5px', marginBottom: '5px'}}>
                  {receiptData.items.map((item: any, idx: number) => (
                    <div key={idx} style={{marginBottom: '4px'}}>
                      <div>{item.name}</div>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <div>{item.quantity} x {item.price}</div>
                        <div>{item.price * item.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '5px'}}>
                  <div>Subtotal</div>
                  <div>{receiptData.subtotal}</div>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '5px', borderTop: '1px dashed black', paddingTop: '5px'}}>
                  <div>TOTAL</div>
                  <div>{receiptData.total}</div>
                </div>
                
                <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '10px'}}>
                  <div>{receiptData.paymentMethod}</div>
                  <div>{receiptData.paymentMethod === 'CASH' ? receiptData.cashReceived : receiptData.total}</div>
                </div>
                {receiptData.paymentMethod === 'CASH' && (
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <div>KEMBALI</div>
                    <div>{receiptData.cashChange}</div>
                  </div>
                )}
                
                <div style={{textAlign: 'center', marginTop: '15px', borderTop: '1px dashed black', paddingTop: '10px'}}>
                  <div>Terima Kasih</div>
                  <div>Silakan Datang Kembali</div>
                </div>
              </div>

              <div style={{display: 'flex', gap: '16px', marginTop: '24px', width: '100%'}}>
                <button onClick={() => window.print()} style={{flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'}}>🖨️ Cetak Struk</button>
                <button onClick={() => setReceiptData(null)} style={{flex: 1, padding: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'}}>Selesai</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
