"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { processBatchRetur } from "../actions";

type Product = {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  stock: number;
  image: string;
};

type ReturItem = Product & {
  qtyToReturn: number;
  reason: string;
};

export default function ReturClient({ initialProducts, isEmbedded }: { initialProducts: Product[], isEmbedded?: boolean }) {
  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [returList, setReturList] = useState<ReturItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const filtered = initialProducts.filter(p => 
    search !== "" && (
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) || 
      (p.barcode && p.barcode.includes(search))
    )
  );

  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);
  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addProductToRetur = (product: Product) => {
    setReturList(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, qtyToReturn: Math.min(item.stock, item.qtyToReturn + 1) } : item
        );
      }
      return [{ ...product, qtyToReturn: 1, reason: "Rusak" }, ...prev];
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
      addProductToRetur(matchedProduct);
      setBarcodeInput(""); // Reset after success
    } else {
      showToast("Barcode/SKU tidak ditemukan di database!");
    }
  };

  const updateItem = (id: string, field: "qtyToReturn" | "reason", value: any) => {
    setReturList(prev => prev.map(item => {
      if (item.id === id) {
        if (field === "qtyToReturn") {
          const numValue = Math.max(1, Math.min(item.stock, Number(value)));
          return { ...item, qtyToReturn: numValue };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setReturList(prev => prev.filter(item => item.id !== id));
  };

  const handleProcessRetur = async () => {
    if (returList.length === 0) return;
    setIsProcessing(true);
    try {
      const batchData = returList.map(item => ({
        id: item.id,
        qty: item.qtyToReturn,
        reason: item.reason
      }));
      await processBatchRetur(batchData);
      showToast("Semua data retur berhasil diproses! Stok telah dikurangi.", "success");
      setReturList([]);
    } catch (e) {
      showToast("Terjadi kesalahan sistem saat memproses retur.");
    }
    setIsProcessing(false);
  };

  return (
    <div className={isEmbedded ? "split-view" : "pos-container"} style={isEmbedded ? { height: '100%', width: '100%' } : {}}>
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
      {/* Left Area: Scanner & Search */}
      <div className={isEmbedded ? "split-left" : "pos-main"} style={{paddingRight: '24px'}}>
        <div className="header" style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px'}}>
          {!isEmbedded && <Link href="/" className="back-btn">← Dashboard</Link>}
          <h1>{isEmbedded ? "Retur Barang Rusak / Expired" : "Scan Retur (Pusat Pengembalian)"}</h1>
        </div>

        {/* Barcode Scanner Input */}
        <div style={{background: 'var(--surface)', padding: '24px', borderRadius: '12px', boxShadow: 'var(--shadow)', marginBottom: '24px'}}>
          <h2 style={{fontSize: '18px', marginBottom: '12px'}}>Pindai Barcode / Ketik SKU</h2>
          <form onSubmit={handleBarcodeSubmit} style={{display: 'flex', gap: '12px'}}>
            <input 
              type="text" 
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              placeholder="Arahkan scanner ke barcode dan otomatis tercatat..."
              style={{flex: 1, padding: '16px', fontSize: '20px', borderRadius: '8px', border: '2px solid var(--primary)', outline: 'none'}}
              autoFocus
            />
            <button type="submit" style={{padding: '0 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '16px', cursor: 'pointer'}}>
              Submit
            </button>
          </form>
        </div>

        {/* Manual Search */}
        <div>
          <h3 style={{marginBottom: '12px'}}>Atau Cari Manual:</h3>
          <input 
            type="text" 
            placeholder="Ketik nama barang..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-bar"
            style={{width: '100%', marginBottom: '16px'}}
          />

          {search !== "" && (
            <div className="product-grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))'}}>
              {filtered.map(product => (
                <div key={product.id} className="product-card" onClick={() => addProductToRetur(product)}>
                  <div style={{ position: "relative", width: "100%", height: "120px" }}>
                    <Image src={product.image} alt={product.name} fill sizes="150px" style={{ objectFit: "cover" }} />
                  </div>
                  <div className="product-info" style={{padding: '12px'}}>
                    <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>{product.sku}</span>
                    <span className="product-name" style={{fontSize: '14px'}}>{product.name}</span>
                    <span className="product-price" style={{fontSize: '12px', color: 'var(--primary)'}}>Stok: {product.stock} pcs</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p style={{color: 'var(--text-muted)'}}>Tidak ada barang cocok.</p>}
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Retur List (Cart style) */}
      <div className={isEmbedded ? "split-right" : "pos-sidebar"}>
        <div className="cart-header">
          <h2>Daftar Retur</h2>
        </div>

        <div className="cart-items" style={{padding: '16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px'}}>
          {returList.length === 0 ? (
            <div className="empty-cart">Scan barcode untuk memasukkan barang ke daftar retur.</div>
          ) : (
            returList.map((item) => (
              <div key={item.id} style={{background: 'var(--background)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', position: 'relative'}}>
                <button onClick={() => removeItem(item.id)} style={{position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: 'var(--danger)', fontSize: '20px', cursor: 'pointer'}}>×</button>
                
                <div style={{fontWeight: 700, fontSize: '16px', marginBottom: '4px', paddingRight: '20px'}}>{item.name}</div>
                <div style={{fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px'}}>SKU: {item.sku} | Stok Asli: {item.stock}</div>
                
                <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                  <div style={{flex: 1}}>
                    <label style={{fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px'}}>QTY Retur</label>
                    <input 
                      type="number" 
                      value={item.qtyToReturn} 
                      onChange={e => updateItem(item.id, 'qtyToReturn', e.target.value)}
                      min="1" max={item.stock}
                      style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)'}}
                    />
                  </div>
                  <div style={{flex: 2}}>
                    <label style={{fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px'}}>Alasan</label>
                    <select 
                      value={item.reason} 
                      onChange={e => updateItem(item.id, 'reason', e.target.value)}
                      style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)'}}
                    >
                      <option value="Rusak">Rusak / Cacat</option>
                      <option value="Kadaluarsa">Kadaluarsa</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 700}}>
            <span>Total Item Retur:</span>
            <span>{returList.reduce((sum, i) => sum + i.qtyToReturn, 0)} Pcs</span>
          </div>
          <button 
            className="checkout-btn" 
            style={{background: 'var(--danger)'}}
            disabled={returList.length === 0 || isProcessing}
            onClick={handleProcessRetur}
          >
            {isProcessing ? "Memproses..." : "Proses Semua Retur"}
          </button>
        </div>
      </div>
    </div>
  );
}
