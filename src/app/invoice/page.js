'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function InvoiceListPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('ih.createtime');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  // Detail Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
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

  useEffect(() => {
    if (!isCheckingAuth) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckingAuth, page, sortBy, sortDir]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (page !== 1) setPage(1);
      else if (!isCheckingAuth) loadData();
    }, 500);
    return () => clearTimeout(delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/api/invoice?page=${page}&limit=10&search=${encodeURIComponent(search)}&sortBy=${sortBy}&sortDir=${sortDir}`);
      setData(res.data);
      setMeta(res.meta);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data invoice.');
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

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const openDetailModal = async (noinv) => {
    try {
      const res = await api.get(`/api/invoice/${noinv}`);
      setSelectedInvoice(res.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      alert('Gagal mengambil detail invoice');
    }
  };

  const handleDelete = async (noinv) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus invoice ${noinv}? Tindakan ini akan mengembalikan status barang dikirim menjadi belum di-invoice dan mengurangi kuantitas tertagih di WO.`)) {
      return;
    }
    try {
      await api.delete(`/api/invoice/${noinv}`);
      alert('Invoice berhasil dihapus!');
      loadData();
    } catch (err) {
      alert('Gagal menghapus invoice');
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
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)' }}>Daftar Invoice</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Kelola Penagihan / Invoice Pelanggan</p>
          </div>
          <button className="btn btn-primary" onClick={() => router.push('/invoice/create')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Buat Invoice Baru
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
                    placeholder="Cari No Invoice / Customer / No Accurate..."
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
                    <th onClick={() => handleSort('noinv')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>No Invoice<SortIcon col="noinv" /></th>
                    <th onClick={() => handleSort('tglinv')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Tgl Invoice<SortIcon col="tglinv" /></th>
                    <th onClick={() => handleSort('nm_customer')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Customer<SortIcon col="nm_customer" /></th>
                    <th onClick={() => handleSort('totalhrg')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', textAlign: 'right' }}>Total Tagihan<SortIcon col="totalhrg" /></th>
                    <th onClick={() => handleSort('no_accurate')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Accurate Invoice No<SortIcon col="no_accurate" /></th>
                    <th style={{ textAlign: 'center', width: '200px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading data...</td></tr>
                  ) : data.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Tidak ada data</td></tr>
                  ) : (
                    data.map((row, i) => (
                      <tr key={row.noinv || i}>
                        <td style={{ fontWeight: '600', color: '#10b981' }}>{row.noinv}</td>
                        <td>{formatDate(row.tglinv)}</td>
                        <td style={{ fontWeight: '500' }}>{row.nm_customer || '-'}</td>
                        <td align="right" style={{ fontWeight: 'bold', color: '#2563eb' }}>{formatCurrency(row.totalhrg)}</td>
                        <td>{row.no_accurate || '-'}</td>
                        <td align="center">
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '13px' }} onClick={() => openDetailModal(row.noinv)}>
                              Detail
                            </button>
                            <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '13px', backgroundColor: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(row.noinv)}>
                              Delete
                            </button>
                          </div>
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

      {/* Detail Modal */}
      {isDetailModalOpen && selectedInvoice && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '850px', margin: '20px', animation: 'slideUp 0.3s ease', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-body" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Invoice: {selectedInvoice.noinv}</h2>
                <button onClick={() => setIsDetailModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div><span style={{ color: '#64748b' }}>Customer:</span> <strong style={{ color: '#334155' }}>{selectedInvoice.nm_customer}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Alamat:</span> <span style={{ color: '#334155' }}>{selectedInvoice.alamat || '-'}</span></div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div><span style={{ color: '#64748b' }}>Tgl Invoice:</span> <span style={{ color: '#334155', fontWeight: '500' }}>{formatDate(selectedInvoice.tglinv)}</span></div>
                  <div><span style={{ color: '#64748b' }}>Accurate Invoice No:</span> <strong style={{ color: '#334155' }}>{selectedInvoice.no_accurate || '-'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Total Tagihan:</span> <strong style={{ color: '#10b981', fontSize: '15px' }}>{formatCurrency(selectedInvoice.totalhrg)}</strong></div>
                </div>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Daftar Item Penagihan</h3>
              <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="table table-bordered">
                  <thead style={{ backgroundColor: '#f8fafc' }}>
                    <tr>
                      <th>No WO</th>
                      <th>No SO</th>
                      <th>Tgl WO</th>
                      <th>Drawing Item</th>
                      <th>Description</th>
                      <th style={{ textAlign: 'right' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Harga Satuan</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={item.idtrans || idx}>
                        <td style={{ fontWeight: '500' }}>{item.wonumber}</td>
                        <td>{item.noso || '-'}</td>
                        <td>{formatDate(item.tgl_wo)}</td>
                        <td style={{ fontWeight: '500' }}>{item.nodrawing}</td>
                        <td>{item.descrip || '-'}</td>
                        <td align="right" style={{ fontWeight: 'bold' }}>{item.qty} PCS</td>
                        <td align="right">{formatCurrency(item.hrg)}</td>
                        <td align="right" style={{ fontWeight: 'bold', color: '#2563eb' }}>{formatCurrency(item.qty * item.hrg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
