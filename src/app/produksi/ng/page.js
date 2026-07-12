'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function FinishNgPage() {
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

  // Completed Details Modal
  const [selectedNgDetail, setSelectedNgDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('satya_token');
    const userData = localStorage.getItem('satya_user');
    if (!token) {
      router.push('/login');
      return;
    }
    if (userData) setUser(JSON.parse(userData));
    setIsCheckingAuth(false);
  }, [router]);

  // Set default sortBy based on tab
  useEffect(() => {
    setSortBy('n.ngdate');
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
      const endpoint = activeTab === 'pending' ? '/api/produksi/ng/pending' : '/api/produksi/ng/completed';
      const res = await api.get(`${endpoint}?page=${page}&limit=10&search=${encodeURIComponent(search)}&sortBy=${sortBy}&sortDir=${sortDir}`);
      setData(res.data);
      setMeta(res.meta);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data Laporan NG.');
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

  const formatRupiah = (num) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const openDetailModal = (row) => {
    setSelectedNgDetail(row);
    setIsDetailModalOpen(true);
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
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)' }}>Finish Production (NG)</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>List Production & Not Good Goods</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-default'}`} 
            style={activeTab === 'pending' ? {} : { backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}
            onClick={() => setActiveTab('pending')}
          >
            Pending NG Receipts
          </button>
          <button 
            className={`btn ${activeTab === 'completed' ? 'btn-success' : 'btn-default'}`}
            style={activeTab === 'completed' ? {} : { backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}
            onClick={() => setActiveTab('completed')}
          >
            Completed NG Report
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
                    placeholder="Cari No NG / No WO / Customer / SO..."
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
                  <tr>
                    <th onClick={() => handleSort('ngcode')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>No NG<SortIcon col="ngcode" /></th>
                    <th onClick={() => handleSort('ngdate')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Date NG<SortIcon col="ngdate" /></th>
                    <th onClick={() => handleSort('nowo')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>No WO<SortIcon col="nowo" /></th>
                    <th onClick={() => handleSort('noso')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>No SO<SortIcon col="noso" /></th>
                    <th onClick={() => handleSort('descrip')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Item<SortIcon col="descrip" /></th>
                    <th onClick={() => handleSort('nm_customer')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Customer<SortIcon col="nm_customer" /></th>
                    <th onClick={() => handleSort('qty')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right', whiteSpace: 'nowrap' }}>Qty NG<SortIcon col="qty" /></th>
                    {activeTab === 'completed' && (
                      <th onClick={() => handleSort('userng')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>User<SortIcon col="userng" /></th>
                    )}
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={activeTab === 'completed' ? 9 : 8} style={{ textAlign: 'center', padding: '40px' }}>Loading data...</td></tr>
                  ) : data.length === 0 ? (
                    <tr><td colSpan={activeTab === 'completed' ? 9 : 8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Tidak ada data</td></tr>
                  ) : (
                    data.map((row, i) => (
                      <tr key={row.ngcode || i}>
                        <td style={{ fontWeight: '600', color: '#dc2626' }}>{row.ngcode}</td>
                        <td>{formatDate(row.ngdate)}</td>
                        <td style={{ fontWeight: '600' }}>{row.nowo}</td>
                        <td>{row.noso || '-'}</td>
                        <td>{row.descrip || '-'}</td>
                        <td>{row.nm_customer || '-'}</td>
                        <td align="right" style={{ fontWeight: 'bold' }}>{row.ngqty}</td>
                        {activeTab === 'completed' && (
                          <td>{row.userng || '-'}</td>
                        )}
                        <td align="center">
                          {activeTab === 'pending' ? (
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '4px 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto' }} 
                              onClick={() => router.push(`/produksi/ng/${row.ngcode}`)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                              Receipt NG
                            </button>
                          ) : (
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '4px 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto' }} 
                              onClick={() => openDetailModal(row)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              Detail
                            </button>
                          )}
                        </td>
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

      {/* Completed NG Detail Modal */}
      {isDetailModalOpen && selectedNgDetail && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '850px', margin: '20px', animation: 'slideUp 0.3s ease', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-body" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>Detail NG: {selectedNgDetail.ngcode}</h2>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>Date: {formatDate(selectedNgDetail.ngdate)} | User: {selectedNgDetail.userng}</p>
                </div>
                <button onClick={() => setIsDetailModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Left Side Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#334155', fontWeight: '600' }}>WO & Item Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>WO Number</span><span style={{ fontWeight: '500' }}>{selectedNgDetail.nowo}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>SO Number</span><span style={{ fontWeight: '500' }}>{selectedNgDetail.noso || '-'}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>SO Date</span><span style={{ fontWeight: '500' }}>{formatDate(selectedNgDetail.tglso)}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Item Description</span><span style={{ fontWeight: '500' }}>{selectedNgDetail.descrip || '-'}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Customer</span><span style={{ fontWeight: '500' }}>{selectedNgDetail.nm_customer || '-'}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Sales Representative</span><span style={{ fontWeight: '500' }}>{selectedNgDetail.nm_sales || '-'}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}><span style={{ color: '#64748b', fontWeight: '600' }}>Quantity NG</span><span style={{ fontWeight: 'bold', color: '#dc2626' }}>{selectedNgDetail.ngqty} PCS</span></div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#334155', fontWeight: '600' }}>Estimate Losses</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Process Loss</span><span style={{ fontWeight: '500' }}>{formatRupiah(selectedNgDetail.costprocess)}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Material Loss</span><span style={{ fontWeight: '500' }}>{formatRupiah(selectedNgDetail.costmaterial)}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Other Loss</span><span style={{ fontWeight: '500' }}>{formatRupiah(selectedNgDetail.costother)}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#334155', fontWeight: 'bold' }}>Total Loss</span>
                        <span style={{ fontWeight: 'bold', color: '#dc2626' }}>
                          {formatRupiah(
                            (selectedNgDetail.costprocess || 0) + 
                            (selectedNgDetail.costmaterial || 0) + 
                            (selectedNgDetail.costother || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#334155', fontWeight: '600' }}>Analysis of NG (5 Whys)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#94a3b8', fontWeight: '600' }}>Why 1:</span><span style={{ color: '#334155' }}>{selectedNgDetail.why1 || '-'}</span></div>
                      <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#94a3b8', fontWeight: '600' }}>Why 2:</span><span style={{ color: '#334155' }}>{selectedNgDetail.why2 || '-'}</span></div>
                      <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#94a3b8', fontWeight: '600' }}>Why 3:</span><span style={{ color: '#334155' }}>{selectedNgDetail.why3 || '-'}</span></div>
                      <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#94a3b8', fontWeight: '600' }}>Why 4:</span><span style={{ color: '#334155' }}>{selectedNgDetail.why4 || '-'}</span></div>
                      <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#94a3b8', fontWeight: '600' }}>Why 5:</span><span style={{ color: '#334155' }}>{selectedNgDetail.why5 || '-'}</span></div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#334155', fontWeight: '600' }}>Corrective Action</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b', fontWeight: '500', width: '60px' }}>What:</span><span style={{ color: '#334155' }}>{selectedNgDetail.what || '-'}</span></div>
                      <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b', fontWeight: '500', width: '60px' }}>Where:</span><span style={{ color: '#334155' }}>{selectedNgDetail.where1 || '-'}</span></div>
                      <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b', fontWeight: '500', width: '60px' }}>When:</span><span style={{ color: '#334155' }}>{selectedNgDetail.when1 || '-'}</span></div>
                      <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b', fontWeight: '500', width: '60px' }}>How:</span><span style={{ color: '#334155' }}>{selectedNgDetail.how || '-'}</span></div>
                      <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b', fontWeight: '500', width: '60px' }}>Who:</span><span style={{ color: '#334155' }}>{selectedNgDetail.who || '-'}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedNgDetail.note && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#334155', fontWeight: '600' }}>NG Note</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap' }}>{selectedNgDetail.note}</p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-default" onClick={() => setIsDetailModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
