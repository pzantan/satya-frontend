'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function WorkOrderPage() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(''); // '' = Semua, '0' = Proses, '1' = Selesai
  const [page, setPage] = useState(1);
  const router = useRouter();
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
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (page !== 1) setPage(1);
      else if (!isCheckingAuth) loadData();
    }, 500);
    return () => clearTimeout(delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/wo?page=${page}&limit=10&search=${encodeURIComponent(search)}&status=${status}`);
      setData(res.data);
      setMeta(res.meta);
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil data Work Order');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (wo_no) => {
    try {
      const token = localStorage.getItem('satya_token');
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/wo/${wo_no}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Gagal mencetak PDF');
      }
      
      const blob = await response.blob();
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL, '_blank');
      
      // Bersihkan URL object setelah beberapa detik
      setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
    } catch (err) {
      console.error(err);
      alert('Gagal mencetak PDF');
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
      <div className="container-fluid" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)' }}>
              Work Order
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Kelola data Work Order dan cetak PDF</p>
          </div>
        </div>

        {/* Summary Dashboard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', color: 'white' }}>
            <div className="card-body" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9 }}>Total Work Order</h3>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{meta.summary?.total?.toLocaleString() || 0}</div>
            </div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}>
            <div className="card-body" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9 }}>Sedang Proses</h3>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{meta.summary?.proses?.toLocaleString() || 0}</div>
            </div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
            <div className="card-body" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9 }}>Selesai</h3>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{meta.summary?.selesai?.toLocaleString() || 0}</div>
            </div>
          </div>
        </div>

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
                    placeholder="Cari No WO / Drawing..."
                    style={{ paddingLeft: '38px', width: '100%' }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="form-control"
                  style={{ width: '150px' }}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Semua Status</option>
                  <option value="0">Proses</option>
                  <option value="1">Selesai</option>
                </select>
              </div>
              <Link href="/wo/add" className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Tambah Work Order
              </Link>
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>NO WO</th>
                    <th>WO Date</th>
                    <th>NO SO</th>
                    <th>SO Date</th>
                    <th>No Drawing</th>
                    <th>Customer</th>
                    <th>Qty</th>
                    <th>Status</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>Loading data...</td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Tidak ada data Work Order</td>
                    </tr>
                  ) : (
                    data.map((row) => (
                      <tr key={row.wo_no}>
                        <td><strong>{row.wo_no}</strong></td>
                        <td>{row.tgl_wo ? new Date(row.tgl_wo).toLocaleDateString() : '-'}</td>
                        <td>{row.noso || '-'}</td>
                        <td>{row.tglso ? new Date(row.tglso).toLocaleDateString() : '-'}</td>
                        <td>{row.nodrawing}</td>
                        <td>{row.customer_name}</td>
                        <td>{row.qty ? row.qty.toLocaleString() : '0'}</td>
                        <td>
                          {row.sts === 0 ? <span className="badge" style={{ background: '#f59e0b', color: '#fff' }}>Proses</span> : <span className="badge" style={{ background: '#10b981', color: '#fff' }}>Selesai</span>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <Link
                              href={`/wo/${encodeURIComponent(row.wo_no)}`}
                              className="btn btn-outline"
                              style={{ padding: '6px' }}
                              title="View Detail WO"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </Link>
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '6px' }}
                              onClick={() => downloadPdf(row.wo_no)}
                              title="Cetak PDF"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
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
                  <button 
                    className="btn btn-outline" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '14px', fontWeight: '500' }}>
                    {page} / {meta.last_page}
                  </span>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                    disabled={page === meta.last_page}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
