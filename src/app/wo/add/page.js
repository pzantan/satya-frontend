'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function WorkOrderAddPage() {
  const router = useRouter();
  
  const [noso, setNoso] = useState('');
  const [tglso, setTglso] = useState('');
  const [qty, setQty] = useState('');
  const [estimasidel, setEstimasidel] = useState('');
  
  const [searchDrawing, setSearchDrawing] = useState('');
  const [drawings, setDrawings] = useState([]);
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('satya_token');
    const userData = localStorage.getItem('satya_user');
    if (!token) {
      router.push('/login');
      return;
    }
    if (userData) setUser(JSON.parse(userData));
    setIsCheckingAuth(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch drawings matching the search query
  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchDrawing.length >= 2) {
        fetchDrawings(searchDrawing);
      } else {
        setDrawings([]);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [searchDrawing]);

  const fetchDrawings = async (query) => {
    setSearching(true);
    try {
      const res = await api.get(`/api/drawings?limit=20&search=${encodeURIComponent(query)}`);
      setDrawings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectDrawing = (dwg) => {
    setSelectedDrawing(dwg);
    setSearchDrawing(dwg.nodrawing);
    setDrawings([]); // close dropdown
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDrawing) {
      alert('Pilih Drawing terlebih dahulu!');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/api/wo', {
        noso,
        tglso,
        qty: parseInt(qty),
        estimasidel,
        nodrawing: selectedDrawing.nodrawing
      });
      alert('Work Order berhasil dibuat!');
      router.push('/wo');
    } catch (err) {
      console.error(err);
      alert('Gagal membuat Work Order');
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return null; // Prevent UI flash before redirect
  }

  return (
    <AppLayout user={user} onLogout={() => {
      localStorage.removeItem('satya_token');
      localStorage.removeItem('satya_user');
      router.push('/login');
    }}>
      <div className="container-fluid" style={{ padding: '24px', maxWidth: '1200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
          <Link href="/wo" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', padding: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </Link>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>Tambah Work Order</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Buat data Work Order baru</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          
          {/* Formulir WO */}
          <div className="card" style={{ flex: '0 0 380px', width: '380px' }}>
            <div className="card-body">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Pilih Drawing *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ketik minimal 2 huruf untuk mencari No Drawing..."
                    value={searchDrawing}
                    onChange={(e) => {
                      setSearchDrawing(e.target.value);
                      if (selectedDrawing && e.target.value !== selectedDrawing.nodrawing) {
                        setSelectedDrawing(null); // clear selection if user types
                      }
                    }}
                    required
                  />
                  {searching && <span style={{ position: 'absolute', right: '10px', top: '35px', fontSize: '12px', color: 'var(--text-muted)' }}>Mencari...</span>}
                  
                  {drawings.length > 0 && (
                    <div style={{ 
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, 
                      background: 'var(--surface, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', 
                      borderRadius: '8px', maxHeight: '250px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      marginTop: '4px'
                    }}>
                      {drawings.map(d => (
                        <div 
                          key={d.id_drawing} 
                          style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color, #e2e8f0)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--surface, #ffffff)' }}
                          onClick={() => handleSelectDrawing(d)}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2, #f8fafc)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface, #ffffff)'}
                        >
                          <div style={{ flex: 1, paddingRight: '8px' }}>
                            <div style={{ fontWeight: '600' }}>{d.nodrawing}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>{d.descrip}</div>
                          </div>
                          {d.linkpict && <span className="badge" style={{ background: '#10b981', color: '#fff', alignSelf: 'flex-start', flexShrink: 0 }}>Ada File</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>S/O Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={noso}
                    onChange={(e) => setNoso(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>S/O Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={tglso}
                    onChange={(e) => setTglso(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Quantity *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Target Delivery (Estimasi)</label>
                  <input
                    type="date"
                    className="form-control"
                    value={estimasidel}
                    onChange={(e) => setEstimasidel(e.target.value)}
                  />
                </div>

                <div style={{ marginTop: '16px' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Simpan Work Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Preview Drawing */}
          <div className="card" style={{ flex: 1, position: 'sticky', top: '24px', height: 'calc(100vh - 140px)' }}>
            <div className="card-body" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Preview Drawing</h3>
              
              {!selectedDrawing ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', border: '2px dashed var(--border-color)', color: 'var(--text-muted)', fontSize: '14px' }}>
                  Pilih Drawing untuk melihat preview PDF
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Detail Drawing - mirip program lama */}
                  <div style={{ marginBottom: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '12px', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <tbody>
                        {[
                          { label: 'Drawing Number', value: selectedDrawing.nodrawing },
                          { label: 'Customer',        value: selectedDrawing.customer_name },
                          { label: 'Sales',           value: selectedDrawing.sales_name },
                          { label: 'Price',           value: selectedDrawing.price ? selectedDrawing.price.toLocaleString('id-ID') : '0' },
                          { label: 'Coating Price',   value: selectedDrawing.coatingprice ? selectedDrawing.coatingprice.toLocaleString('id-ID') : '0' },
                          { label: 'Description',     value: selectedDrawing.descrip },
                        ].map(({ label, value }) => (
                          <tr key={label} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '6px 12px 6px 4px', color: 'var(--text-muted)', fontWeight: '500', width: '40%', whiteSpace: 'nowrap' }}>{label}</td>
                            <td style={{ padding: '6px 4px', fontWeight: '600', textAlign: 'right' }}>{value || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedDrawing.linkpict ? (
                    <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', minHeight: 0 }}>
                      <iframe 
                        src={`http://localhost:5000/api/drawings/${selectedDrawing.id_drawing}/preview?type=drawing`}
                        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                        title="PDF Preview"
                      />
                    </div>
                  ) : (
                    <div style={{ flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', borderRadius: '8px', color: '#ef4444' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '16px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <div style={{ fontWeight: 'bold' }}>File PDF Tidak Ditemukan</div>
                      <p style={{ fontSize: '14px', margin: '8px 0 0' }}>Drawing ini belum memiliki file PDF fisik.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </AppLayout>
  );
}
