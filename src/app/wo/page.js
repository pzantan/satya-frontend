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

  // Import XML SO States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [xmlFile, setXmlFile] = useState(null);
  const [previewList, setPreviewList] = useState(null);
  const [checkingFile, setCheckingFile] = useState(false);
  const [importingData, setImportingData] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setXmlFile(e.target.files[0]);
      setPreviewList(null);
      setImportError('');
      setImportSuccess('');
    }
  };

  const handlePreviewXml = async () => {
    if (!xmlFile) return;
    setCheckingFile(true);
    setImportError('');
    setImportSuccess('');
    try {
      const token = localStorage.getItem('satya_token');
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const formData = new FormData();
      formData.append('xmlfile', xmlFile);
      
      const response = await fetch(`${API_BASE}/api/wo/import-xml/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.error || 'Gagal memproses pratinjau file XML.');
      }
      setPreviewList(res.data);
    } catch (err) {
      console.error(err);
      setImportError(err.message || 'Gagal memproses pratinjau file XML.');
    } finally {
      setCheckingFile(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!previewList) return;
    setImportingData(true);
    setImportError('');
    try {
      const res = await api.post('/api/wo/import-xml/execute', { previewList });
      alert(res.message || 'Import data berhasil dilakukan!');
      setIsImportModalOpen(false);
      resetImportStates();
      loadData();
    } catch (err) {
      console.error(err);
      setImportError(err.response?.data?.error || 'Gagal mengimpor data ke database.');
    } finally {
      setImportingData(false);
    }
  };

  const resetImportStates = () => {
    setXmlFile(null);
    setPreviewList(null);
    setCheckingFile(false);
    setImportingData(false);
    setImportError('');
    setImportSuccess('');
  };

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

  const handleDelete = async (wo_no) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Work Order "${wo_no}"?`)) {
      return;
    }
    try {
      const res = await api.delete(`/api/wo/${encodeURIComponent(wo_no)}`);
      alert(res.message || 'Work Order berhasil dihapus.');
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Gagal menghapus Work Order.');
    }
  };

  const canDelete = user?.role === '1' || user?.permissions?.find(p => p.module_name === 'wo')?.can_delete;

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
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-success" onClick={() => setIsImportModalOpen(true)} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#10b981', borderColor: '#10b981' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Import XML SO
                </button>
                <Link href="/wo/add" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Tambah Work Order
                </Link>
              </div>
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
                     <th style={{ width: '140px', textAlign: 'center' }}>Aksi</th>
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
                              style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                minWidth: '32px',
                                padding: 0,
                                flexShrink: 0,
                                borderRadius: '6px'
                              }}
                              title="View Detail WO"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </Link>
                            <button 
                              className="btn btn-primary" 
                              style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                minWidth: '32px',
                                padding: 0,
                                flexShrink: 0,
                                borderRadius: '6px'
                              }}
                              onClick={() => downloadPdf(row.wo_no)}
                              title="Cetak PDF"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
                            </button>
                            {canDelete && (
                              <button
                                className="btn btn-outline"
                                style={{ 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  minWidth: '32px',
                                  padding: 0,
                                  flexShrink: 0,
                                  borderRadius: '6px',
                                  color: 'var(--danger, #ef4444)',
                                  borderColor: 'var(--danger, #ef4444)'
                                }}
                                onClick={() => handleDelete(row.wo_no)}
                                title="Hapus WO"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  <line x1="10" y1="11" x2="10" y2="17"></line>
                                  <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                              </button>
                            )}
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

      {/* Modal Import XML SO */}
      {isImportModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '900px', margin: '20px', animation: 'slideUp 0.3s ease', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-body" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Import Sales Order XML Accurate</h2>
                <button onClick={() => { setIsImportModalOpen(false); resetImportStates(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {importError && (
                <div className="alert alert-danger" style={{ marginBottom: '20px' }}>{importError}</div>
              )}

              {!previewList ? (
                /* STEP 1: UPLOAD FILE */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 0' }}>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>Pilih file XML Sales Order Accurate (format .xml) untuk diunggah dan diverifikasi.</p>
                  <div style={{ border: '2px dashed #cbd5e1', padding: '40px 20px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                    <input 
                      type="file" 
                      accept=".xml" 
                      id="xml-upload-input"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="xml-upload-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>
                      </svg>
                      <span style={{ fontWeight: '600', color: '#4f46e5' }}>
                        {xmlFile ? xmlFile.name : 'Klik untuk memilih file XML'}
                      </span>
                      {xmlFile && <span style={{ fontSize: '12px', color: '#64748b' }}>({(xmlFile.size / 1024).toFixed(1)} KB)</span>}
                    </label>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                    <button type="button" className="btn btn-outline" onClick={() => { setIsImportModalOpen(false); resetImportStates(); }}>
                      Batal
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={handlePreviewXml} 
                      disabled={!xmlFile || checkingFile}
                    >
                      {checkingFile ? 'Memproses File...' : 'Periksa & Pratinjau'}
                    </button>
                  </div>
                </div>
              ) : (
                /* STEP 2: PREVIEW & CONFIRMATION */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '8px', fontSize: '14px', color: '#166534' }}>
                    <strong>Verifikasi Berhasil!</strong> Silakan periksa detail data Sales Order di bawah ini sebelum mengeksekusi impor ke database.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '45vh', overflowY: 'auto', paddingRight: '4px' }}>
                    {previewList.map((so, idx) => {
                      const hasCustomerError = so.customerStatus === 'NOT_FOUND';
                      return (
                        <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#fff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
                            <div>
                              <strong style={{ fontSize: '16px', color: '#1e3a8a' }}>{so.sono}</strong>
                              <span style={{ marginLeft: '12px', fontSize: '13px', color: '#64748b' }}>Tanggal SO: {so.sodate ? new Date(so.sodate).toLocaleDateString('id-ID') : '-'}</span>
                            </div>
                            <span className="badge" style={{ 
                              background: hasCustomerError ? '#f8d7da' : '#d1e7dd', 
                              color: hasCustomerError ? '#842029' : '#0f5132',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {so.customerStatusText}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', marginBottom: '12px' }}>
                            <strong>Customer Name:</strong> {so.customerName}
                          </div>

                          <table className="table table-bordered" style={{ fontSize: '12px', margin: 0 }}>
                            <thead style={{ backgroundColor: '#f8fafc' }}>
                              <tr>
                                <th>No Drawing (Accurate Item)</th>
                                <th>Deskripsi Item</th>
                                <th style={{ textAlign: 'right' }}>Qty</th>
                                <th style={{ textAlign: 'right' }}>Harga Satuan</th>
                                <th>Status Gambar</th>
                              </tr>
                            </thead>
                            <tbody>
                              {so.items.map((item, itemIdx) => (
                                <tr key={itemIdx}>
                                  <td style={{ fontWeight: '600' }}>{item.itemNo}</td>
                                  <td>{item.descrip}</td>
                                  <td align="right">{item.qty} pcs</td>
                                  <td align="right">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price)}</td>
                                  <td>
                                    <span style={{ 
                                      color: item.status === 'NEW_DRAWING' ? '#b58900' : '#2aa198',
                                      fontWeight: '600'
                                    }}>
                                      {item.statusText}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>

                  {/* Warning if there's any unmapped customer */}
                  {previewList.some(so => so.customerStatus === 'NOT_FOUND') && (
                    <div className="alert alert-danger" style={{ fontSize: '13px', margin: 0 }}>
                      <strong>Peringatan Blocker:</strong> Terdapat customer Accurate yang tidak terdaftar di database ERP. Harap daftarkan kode Accurate customer tersebut pada menu Master Customer terlebih dahulu sebelum melakukan impor.
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '12px' }}>
                    <button type="button" className="btn btn-outline" onClick={resetImportStates}>
                      Kembali / Unggah Ulang
                    </button>
                    <button type="button" className="btn btn-default" style={{ border: '1px solid #d1d5db' }} onClick={() => { setIsImportModalOpen(false); resetImportStates(); }}>
                      Batal (Cancel)
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={handleExecuteImport} 
                      disabled={previewList.some(so => so.customerStatus === 'NOT_FOUND') || importingData}
                    >
                      {importingData ? 'Sedang Mengimpor...' : 'Jalankan Eksekusi'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
