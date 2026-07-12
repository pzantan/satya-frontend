'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function FinishGoodsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed'
  
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  // Receipt Modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedWo, setSelectedWo] = useState(null);
  const [receiptForm, setReceiptForm] = useState({ qtyfg: 0, fgdate: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  }, [router]);

  // Set default sortBy based on tab
  useEffect(() => {
    if (activeTab === 'pending') {
      setSortBy('w.tgl_wo');
    } else {
      setSortBy('f.fgdate');
    }
    setPage(1);
    setSearch('');
  }, [activeTab]);

  useEffect(() => {
    if (!isCheckingAuth && sortBy) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckingAuth, activeTab, page, sortBy, sortDir]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (page !== 1) setPage(1);
      else if (!isCheckingAuth && sortBy) loadData();
    }, 500);
    return () => clearTimeout(delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const endpoint = activeTab === 'pending' ? '/api/produksi/fg/pending' : '/api/produksi/fg/completed';
      const res = await api.get(`${endpoint}?page=${page}&limit=10&search=${encodeURIComponent(search)}&sortBy=${sortBy}&sortDir=${sortDir}`);
      setData(res.data);
      setMeta(res.meta);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data Finish Goods.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span style={{ color: '#cbd5e1', marginLeft: '4px' }}>⇅</span>;
    return <span style={{ color: '#3b82f6', marginLeft: '4px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID');
  };

  const openReceiptModal = (row) => {
    setSelectedWo(row);
    setReceiptForm({
      qtyfg: row.fg || row.qty || 0,
      fgdate: new Date().toISOString().slice(0, 10)
    });
    setIsReceiptModalOpen(true);
  };

  const handleReceiptSubmit = async (e) => {
    e.preventDefault();
    if (!receiptForm.qtyfg) return alert("Quantity FG harus diisi!");
    
    setIsSubmitting(true);
    try {
      await api.post('/api/produksi/fg/receipt', {
        wono: selectedWo.wo_no,
        qtyfg: receiptForm.qtyfg,
        fgdate: receiptForm.fgdate
      });
      alert('Berhasil membuat Receipt FG!');
      setIsReceiptModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal membuat Receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAuth) return null;

  return (
    <AppLayout user={user} onLogout={() => {
      localStorage.removeItem('satya_token');
      localStorage.removeItem('satya_user');
      router.push('/login');
    }}>
      <div className="container-fluid" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)' }}>Finish Production</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>List Production & Finish Goods</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-default'}`} 
            style={activeTab === 'pending' ? {} : { backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}
            onClick={() => setActiveTab('pending')}
          >
            List Finish Production
          </button>
          <button 
            className={`btn ${activeTab === 'completed' ? 'btn-success' : 'btn-default'}`}
            style={activeTab === 'completed' ? {} : { backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}
            onClick={() => setActiveTab('completed')}
          >
            Finish Goods
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>{error}</div>
        )}

        <div className="card">
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '500px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Cari NO WO / Customer / FG Code..."
                    style={{ paddingLeft: '38px' }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  {activeTab === 'pending' ? (
                    <tr>
                      <th onClick={() => handleSort('kdwo')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Wo Num<SortIcon col="kdwo" /></th>
                      <th onClick={() => handleSort('tgl_wo')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>WO Date<SortIcon col="tgl_wo" /></th>
                      <th onClick={() => handleSort('noso')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>NO SO<SortIcon col="noso" /></th>
                      <th onClick={() => handleSort('tglso')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>SO Date<SortIcon col="tglso" /></th>
                      <th onClick={() => handleSort('descrip')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Item<SortIcon col="descrip" /></th>
                      <th onClick={() => handleSort('nm_customer')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Customer<SortIcon col="nm_customer" /></th>
                      <th onClick={() => handleSort('qty')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right', whiteSpace: 'nowrap' }}>Qty<SortIcon col="qty" /></th>
                      <th onClick={() => handleSort('starton')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Start ON<SortIcon col="starton" /></th>
                      <th onClick={() => handleSort('finishon')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Finish On<SortIcon col="finishon" /></th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  ) : (
                    <tr>
                      <th onClick={() => handleSort('fgcode')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>FG Code<SortIcon col="fgcode" /></th>
                      <th onClick={() => handleSort('fgdate')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Date<SortIcon col="fgdate" /></th>
                      <th onClick={() => handleSort('nowo')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Wo Num<SortIcon col="nowo" /></th>
                      <th onClick={() => handleSort('tgl_wo')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>WO Date<SortIcon col="tgl_wo" /></th>
                      <th onClick={() => handleSort('noso')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>NO SO<SortIcon col="noso" /></th>
                      <th onClick={() => handleSort('descrip')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Item<SortIcon col="descrip" /></th>
                      <th onClick={() => handleSort('nm_customer')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Customer<SortIcon col="nm_customer" /></th>
                      <th onClick={() => handleSort('fg_qty')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right', whiteSpace: 'nowrap' }}>Qty<SortIcon col="fg_qty" /></th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="10" style={{ textAlign: 'center', padding: '40px' }}>Loading data...</td></tr>
                  ) : data.length === 0 ? (
                    <tr><td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Tidak ada data</td></tr>
                  ) : (
                    data.map((row, i) => activeTab === 'pending' ? (
                      <tr key={row.kdwo || i}>
                        <td style={{ fontWeight: '600' }}>{row.kdwo}</td>
                        <td>{formatDate(row.tgl_wo)}</td>
                        <td>{row.noso || '-'}</td>
                        <td>{formatDate(row.tglso)}</td>
                        <td>{row.descrip || '-'}</td>
                        <td>{row.nm_customer || '-'}</td>
                        <td align="right" style={{ fontWeight: 'bold' }}>{row.qty}</td>
                        <td>{formatDate(row.starton)}</td>
                        <td>{formatDate(row.finishon)}</td>
                        <td align="center">
                          <button className="btn btn-success" style={{ padding: '4px 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto' }} onClick={() => openReceiptModal(row)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={row.fgcode || i}>
                        <td style={{ fontWeight: '600', color: '#16a34a' }}>{row.fgcode}</td>
                        <td>{formatDate(row.fgdate)}</td>
                        <td style={{ fontWeight: '600' }}>{row.nowo}</td>
                        <td>{formatDate(row.tgl_wo)}</td>
                        <td>{row.noso || '-'}</td>
                        <td>{row.descrip || '-'}</td>
                        <td>{row.nm_customer || '-'}</td>
                        <td align="right" style={{ fontWeight: 'bold' }}>{row.fg_qty}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && meta.last_page > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  Total <strong>{meta.total}</strong> data
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '14px', fontWeight: '500' }}>
                    {page} / {meta.last_page}
                  </span>
                  <button className="btn btn-outline" onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}>Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Receipt */}
      {isReceiptModalOpen && selectedWo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', margin: '20px', animation: 'slideUp 0.3s ease', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-body" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Finish Goods Receipt</h2>
                <button onClick={() => setIsReceiptModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <form onSubmit={handleReceiptSubmit}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  
                  {/* Left Column (Inputs) */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#334155' }}>Detail WO</h3>
                      
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>S/O Number</label>
                        <input type="text" className="form-control" readOnly value={selectedWo.noso || '-'} style={{ backgroundColor: '#e2e8f0' }} />
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>W/O Number</label>
                        <input type="text" className="form-control" readOnly value={selectedWo.wo_no || selectedWo.kdwo || '-'} style={{ backgroundColor: '#e2e8f0' }} />
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Quantity FG</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          value={receiptForm.qtyfg}
                          onChange={(e) => setReceiptForm({ ...receiptForm, qtyfg: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Date</label>
                        <input 
                          type="date" 
                          className="form-control" 
                          value={receiptForm.fgdate}
                          onChange={(e) => setReceiptForm({ ...receiptForm, fgdate: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Info) */}
                  <div style={{ flex: 1 }}>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', height: '100%' }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#334155' }}>View Detail Item</h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
                          <span style={{ color: '#64748b' }}>Drawing Number</span>
                          <span style={{ fontWeight: '500' }}>{selectedWo.nodrawing || '-'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
                          <span style={{ color: '#64748b' }}>Customer</span>
                          <span style={{ fontWeight: '500' }}>{selectedWo.nm_customer || '-'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
                          <span style={{ color: '#64748b' }}>Sales</span>
                          <span style={{ fontWeight: '500' }}>{selectedWo.nm_sales || '-'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
                          <span style={{ color: '#64748b' }}>Description</span>
                          <span style={{ fontWeight: '500' }}>{selectedWo.descrip || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button type="button" className="btn btn-default" onClick={() => setIsReceiptModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Done'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
