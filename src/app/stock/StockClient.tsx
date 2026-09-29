"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { addProduct, processBatchInbound, deleteProduct } from "../actions";
import ReturClient from "../retur/ReturClient";

type Product = {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  price: number;
  hpp: number;
  category: string;
  stock: number;
  image: string;
};

type InboundItem = Product & { qtyToAdd: number };

export default function StockClient({ initialProducts }: { initialProducts: Product[] }) {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'MASTER' | 'INBOUND' | 'RETUR'>('MASTER');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Add Product Form
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [hpp, setHpp] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const dynamicCategories = Array.from(new Set(initialProducts.map(p => p.category).filter(Boolean)));
  if (dynamicCategories.length === 0) dynamicCategories.push("Umum");

  const [category, setCategory] = useState(dynamicCategories[0]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [imageFile, setImageFile] = useState<string>("/images/placeholder.jpg");

  // Inbound Scanner State
  const [barcodeInput, setBarcodeInput] = useState("");
  const [inboundList, setInboundList] = useState<InboundItem[]>([]);
  const [isProcessingInbound, setIsProcessingInbound] = useState(false);

  const filtered = initialProducts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) || 
    (p.barcode && p.barcode.includes(search))
  );

  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);
  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await addProduct({
      sku, barcode, name, hpp: Number(hpp.replace(/\D/g, "")), price: Number(price.replace(/\D/g, "")), category, stock: 0, image: imageFile
    });
    setShowAddModal(false);
    setSku(""); setBarcode(""); setName(""); setHpp(""); setPrice(""); setQty(""); setImageFile("/images/placeholder.jpg");
    setIsCustomCategory(false);
    showToast("Barang baru berhasil ditambahkan!", "success");
  };

  // --- INBOUND SCANNER LOGIC ---
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matchedProduct = initialProducts.find(p => 
      (p.barcode && p.barcode === barcodeInput) || 
      (p.sku && p.sku.toUpperCase() === barcodeInput.toUpperCase())
    );

    if (matchedProduct) {
      setInboundList(prev => {
        const existing = prev.find(item => item.id === matchedProduct.id);
        if (existing) {
          return prev.map(item => item.id === matchedProduct.id ? { ...item, qtyToAdd: item.qtyToAdd + 1 } : item);
        }
        return [{ ...matchedProduct, qtyToAdd: 1 }, ...prev];
      });
      setBarcodeInput("");
    } else {
      showToast("Barcode/SKU tidak ditemukan!");
    }
  };

  const updateInboundQty = (id: string, val: string) => {
    setInboundList(prev => prev.map(item => item.id === id ? { ...item, qtyToAdd: Math.max(1, Number(val)) } : item));
  };

  const removeInboundItem = (id: string) => {
    setInboundList(prev => prev.filter(item => item.id !== id));
  };

  const handleProcessInbound = async () => {
    if (inboundList.length === 0) return;
    setIsProcessingInbound(true);
    try {
      const batchData = inboundList.map(item => ({ id: item.id, qty: item.qtyToAdd }));
      await processBatchInbound(batchData);
      showToast("Penerimaan barang berhasil diproses! Stok bertambah.", "success");
      setInboundList([]);
      setActiveTab('MASTER');
    } catch (e) {
      showToast("Gagal memproses inbound.");
    }
    setIsProcessingInbound(false);
  };

  return (
    <div className="stock-layout">
      {/* Mobile Hamburger Header */}
      <div className="mobile-hamburger" style={{position: 'absolute', top: 0, left: 0, right: 0, height: '60px', background: 'white', borderBottom: '1px solid var(--border)', zIndex: 900, display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between'}}>
        <div style={{fontWeight: 800, color: 'var(--primary)', fontSize: '20px'}}>PAPA JOE</div>
        <button onClick={() => setIsSidebarOpen(true)} style={{background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', padding: '4px'}}>☰</button>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div className="mobile-hamburger" onClick={() => setIsSidebarOpen(false)} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 950}} />
      )}

      {/* Sidebar */}
      <div className={`stock-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div style={{padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
           <h2 style={{fontSize: '22px', fontWeight: 800, color: 'var(--primary)', margin: 0}}>📦 Manajemen Stok</h2>
           <button className="mobile-hamburger" onClick={() => setIsSidebarOpen(false)} style={{background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', padding: '4px'}}>×</button>
        </div>
        <div className="stock-sidebar-menu" style={{padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1}}>
           <button onClick={() => { setActiveTab('MASTER'); setIsSidebarOpen(false); }} style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', background: activeTab === 'MASTER' ? '#ecfdf5' : 'transparent', color: activeTab === 'MASTER' ? '#059669' : '#64748b', border: 'none', fontWeight: 700, fontSize: '16px', cursor: 'pointer', transition: '0.2s', textAlign: 'left'}}>
              <span style={{fontSize: '20px'}}>📋</span> Master Barang
           </button>
           <button onClick={() => { setActiveTab('INBOUND'); setIsSidebarOpen(false); }} style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', background: activeTab === 'INBOUND' ? '#ecfdf5' : 'transparent', color: activeTab === 'INBOUND' ? '#059669' : '#64748b', border: 'none', fontWeight: 700, fontSize: '16px', cursor: 'pointer', transition: '0.2s', textAlign: 'left'}}>
              <span style={{fontSize: '20px'}}>📥</span> Terima Barang
           </button>
           <button onClick={() => { setActiveTab('RETUR'); setIsSidebarOpen(false); }} style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', background: activeTab === 'RETUR' ? '#ecfdf5' : 'transparent', color: activeTab === 'RETUR' ? '#059669' : '#64748b', border: 'none', fontWeight: 700, fontSize: '16px', cursor: 'pointer', transition: '0.2s', textAlign: 'left'}}>
              <span style={{fontSize: '20px'}}>📤</span> Retur Barang
           </button>
        </div>
        <div style={{marginTop: 'auto', padding: '16px'}}>
           <Link href="/" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', background: '#f1f5f9', color: '#64748b', textDecoration: 'none', fontWeight: 700}}>
             <span style={{fontSize: '20px'}}>🏠</span> Kembali ke Dashboard
           </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="stock-main-content">
         {toast && (
           <div style={{
             position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
             background: toast.type === 'error' ? '#ef4444' : '#10b981', color: 'white', 
             padding: '16px 32px', borderRadius: '50px', fontWeight: 700, fontSize: '18px',
             boxShadow: '0 10px 25px rgba(0,0,0,0.2)', animation: 'slideDown 0.3s ease-out'
           }}>
             {toast.type === 'error' ? '⚠️ ' : '✅ '} {toast.message}
           </div>
         )}

         {/* MASTER TAB */}
         {activeTab === 'MASTER' && (
           <div style={{padding: '32px'}}>
             <div className="stock-header">
               <div className="stock-header-left">
                 <h1>Daftar Master Barang</h1>
               </div>
               <div className="stock-header-right" style={{display: 'flex', gap: '12px'}}>
                 <input 
                   type="text" 
                   placeholder="Cari Barang..." 
                   className="search-bar"
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                 />
                 <button className="add-new-btn" onClick={() => setShowAddModal(true)}>
                   + Master Barang Baru
                 </button>
               </div>
             </div>

             <div className="stock-table-container">
               <table className="stock-table">
                 <thead>
                   <tr>
                     <th>Gambar</th>
                     <th>SKU & Barcode</th>
                     <th>Nama Barang</th>
                     <th>Kategori</th>
                     <th>HPP (Modal)</th>
                     <th>Harga Jual</th>
                     <th>Sisa Stok</th>
                     <th>Aksi</th>
                   </tr>
                 </thead>
                 <tbody>
                   {filtered.map(product => (
                     <tr key={product.id}>
                       <td>
                         <div className="table-img-wrap">
                           <Image src={product.image} alt={product.name} fill sizes="60px" style={{objectFit: "cover"}} />
                         </div>
                       </td>
                       <td>
                         <div style={{fontWeight: 600}}>{product.sku}</div>
                         <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>{product.barcode}</div>
                       </td>
                       <td className="fw-bold">{product.name}</td>
                       <td><span className="badge">{product.category}</span></td>
                       <td>Rp {product.hpp.toLocaleString("id-ID")}</td>
                       <td>Rp {product.price.toLocaleString("id-ID")}</td>
                       <td>
                         <span className={`stock-badge ${product.stock < 10 ? "low" : "good"}`}>
                           {product.stock}
                         </span>
                       </td>
                       <td>
                         <button onClick={async () => {
                           if (window.confirm("Yakin ingin menghapus produk ini?")) {
                             const res = await deleteProduct(product.id);
                             if (res.success) {
                               showToast("Produk berhasil dihapus", "success");
                             } else {
                               showToast(res.error || "Gagal menghapus produk");
                             }
                           }
                         }} style={{padding: '8px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px'}}>
                           Hapus
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
         )}

         {/* INBOUND TAB */}
         {activeTab === 'INBOUND' && (
           <div className="split-view">
              {/* Left: Scanner */}
              <div className="split-left">
                <div className="header" style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px'}}>
                  <h1>Penerimaan Barang Datang</h1>
                </div>

                <div style={{background: 'var(--surface)', padding: '32px', borderRadius: '12px', boxShadow: 'var(--shadow)', marginBottom: '24px'}}>
                  <h2 style={{fontSize: '20px', marginBottom: '16px'}}>Pindai Barcode Barang Datang</h2>
                  <form onSubmit={handleBarcodeSubmit} style={{display: 'flex', gap: '12px'}}>
                    <input 
                      type="text" 
                      value={barcodeInput}
                      onChange={e => setBarcodeInput(e.target.value)}
                      placeholder="Arahkan scanner ke barcode produk..."
                      style={{flex: 1, padding: '20px', fontSize: '24px', borderRadius: '8px', border: '2px solid #10b981', outline: 'none'}}
                      autoFocus
                    />
                    <button type="submit" style={{padding: '0 32px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '18px', cursor: 'pointer'}}>
                      Input
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
                        <div key={product.id} className="product-card" onClick={() => {
                          setInboundList(prev => {
                            const existing = prev.find(item => item.id === product.id);
                            if (existing) return prev.map(item => item.id === product.id ? { ...item, qtyToAdd: item.qtyToAdd + 1 } : item);
                            return [{ ...product, qtyToAdd: 1 }, ...prev];
                          });
                          setSearch(""); 
                        }}>
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

              {/* Right: Inbound List */}
              <div className="split-right">
                <div className="cart-header"><h2>Daftar Barang Masuk</h2></div>
                <div className="cart-items" style={{padding: '16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  {inboundList.length === 0 ? (
                    <div className="empty-cart">Belum ada barang di-scan.</div>
                  ) : (
                    inboundList.map(item => (
                      <div key={item.id} style={{background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', position: 'relative'}}>
                        <button onClick={() => removeInboundItem(item.id)} style={{position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: 'var(--danger)', fontSize: '20px', cursor: 'pointer'}}>×</button>
                        <div style={{fontWeight: 700, fontSize: '16px', marginBottom: '4px'}}>{item.name}</div>
                        <div style={{fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px'}}>SKU: {item.sku} | Stok Saat Ini: {item.stock}</div>
                        
                        <div>
                          <label style={{fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px'}}>QTY Diterima</label>
                          <input 
                            type="number" 
                            value={item.qtyToAdd} 
                            onChange={e => updateInboundQty(item.id, e.target.value)}
                            min="1"
                            style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '16px', fontWeight: 600}}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="cart-footer">
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 700}}>
                    <span>Total Item Diterima:</span>
                    <span>{inboundList.reduce((sum, i) => sum + i.qtyToAdd, 0)} Pcs</span>
                  </div>
                  <button 
                    className="checkout-btn" 
                    style={{background: '#10b981'}}
                    disabled={inboundList.length === 0 || isProcessingInbound}
                    onClick={handleProcessInbound}
                  >
                    {isProcessingInbound ? "Menyimpan..." : "Simpan Barang Masuk"}
                  </button>
                </div>
              </div>
           </div>
         )}

         {/* RETUR TAB */}
         {activeTab === 'RETUR' && (
            <div style={{height: '100%'}}>
              <ReturClient initialProducts={initialProducts} isEmbedded={true} />
            </div>
         )}
      </div>

      {/* ADD NEW PRODUCT MODAL */}
      {showAddModal && (
        <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <div style={{background: 'white', padding: '32px', borderRadius: '12px', width: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '24px'}}>
              <h2>Tambah Barang Baru</h2>
              <button onClick={() => setShowAddModal(false)} style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer'}}>×</button>
            </div>
            
            <form onSubmit={handleAddProduct} style={{display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 600}}>Foto Barang</label>
                <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
                  <div style={{width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa'}}>
                    {imageFile && imageFile !== "/images/placeholder.jpg" && imageFile !== "" ? (
                      <Image src={imageFile} alt="Preview" fill sizes="80px" style={{objectFit: 'cover'}} />
                    ) : (
                      <span style={{fontSize: '32px', color: '#cbd5e1'}}>📦</span>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setImageFile(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} style={{flex: 1, padding: '8px'}} />
                </div>
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 600}}>SKU Barang</label>
                <input required type="text" value={sku} onChange={e => setSku(e.target.value)} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}} placeholder="Contoh: KOP-001" />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 600}}>Barcode</label>
                <input required type="text" value={barcode} onChange={e => setBarcode(e.target.value)} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}} placeholder="Scan atau ketik barcode" />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 600}}>Nama Barang</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}} placeholder="Nama produk" />
              </div>
              <div style={{display: 'flex', gap: '16px'}}>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 600}}>Modal (HPP)</label>
                  <input required type="text" value={hpp} onChange={e => {
                     const num = e.target.value.replace(/\D/g, "");
                     setHpp(num.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
                  }} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}} placeholder="Contoh: 15.000" />
                </div>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 600}}>Harga Jual</label>
                  <input required type="text" value={price} onChange={e => {
                     const num = e.target.value.replace(/\D/g, "");
                     setPrice(num.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
                  }} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}} placeholder="Contoh: 20.000" />
                </div>
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 600}}>Kategori</label>
                {isCustomCategory ? (
                  <div style={{display: 'flex', gap: '8px'}}>
                    <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Ketik kategori baru..." style={{flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}} autoFocus />
                    <button type="button" onClick={() => { setIsCustomCategory(false); setCategory(dynamicCategories[0]); }} style={{padding: '0 16px', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600}}>Batal</button>
                  </div>
                ) : (
                  <select value={category} onChange={(e) => {
                    if (e.target.value === "___NEW___") {
                      setCategory("");
                      setIsCustomCategory(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd'}}>
                    {dynamicCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="___NEW___" style={{fontWeight: 'bold', color: 'var(--primary)'}}>+ Tambah Kategori Baru</option>
                  </select>
                )}
              </div>
              <button type="submit" className="add-new-btn" style={{marginTop: '16px', width: '100%', padding: '16px', fontSize: '18px'}}>Simpan Master Barang</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
