'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function MasterDrawingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const [drawings, setDrawings] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [fileStatus, setFileStatus] = useState('all');
  const [page, setPage] = useState(1);

  // References Data
  const [customers, setCustomers] = useState([]);
  const [salesList, setSalesList] = useState([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeDrawingId, setActiveDrawingId] = useState(null);
  
  // Forms
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const initialForm = {
    nodrawing: '', id_customer: '', id_sales: '', descrip: '',
    price: '', coatingprice: '', leadtime: '', cnc_cycletime: '',
    toolkind: '', dimensi: ''
  };
  const [form, setForm] = useState(initialForm);

  // Upload Form
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState('drawing'); // drawing or checksheet
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('satya_token');
    const userData = localStorage.getItem('satya_user');
    if (!token) { router.push('/login'); return; }
    if (userData) setUser(JSON.parse(userData));
    loadDrawings();
    loadReferences();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, page]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (page !== 1) setPage(1);
      else loadDrawings();
    }, 500);
    return () => clearTimeout(delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, fileStatus]);

  const loadDrawings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/drawings?page=${page}&limit=10&search=${encodeURIComponent(search)}&fileStatus=${fileStatus}`);
      setDrawings(res.data);
      setMeta(res.meta);
      setError('');
    } catch (err) {
      setError(err.message || 'Gagal memuat data drawing.');
    } finally {
      setLoading(false);
    }
  };

  const loadReferences = async () => {
    try {
      // In a real app we might want a specific endpoint for dropdowns, 
      // but for now we can just load the first 500 items.
      const [custRes, salesRes] = await Promise.all([
        api.get('/api/customers?limit=500'),
        // api.get('/api/sales?limit=500') // Placeholder, since sales API isn't built yet
      ]);
      setCustomers(custRes.data || []);
      // setSalesList(salesRes.data || []);
    } catch (err) {
      console.warn("Failed to load references", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('satya_token');
    localStorage.removeItem('satya_user');
    document.cookie = 'satya_token=; path=/; max-age=0';
    router.push('/login');
  };

  // ─── CRUD ────────────────────────────────────────────────────────
  const openAddModal = () => {
    setForm(initialForm);
    setIsEditMode(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (d) => {
    setForm({
      nodrawing: d.nodrawing || '',
      id_customer: d.id_customer || '',
      id_sales: d.id_sales || '',
      descrip: d.descrip || '',
      price: d.price || '',
      coatingprice: d.coatingprice || '',
      leadtime: d.leadtime || '',
      cnc_cycletime: d.cnc_cycletime || '',
      toolkind: d.toolkind || '',
      dimensi: d.dimensi || ''
    });
    setActiveDrawingId(d.id_drawing);
    setIsEditMode(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nodrawing) { setFormError('Nomor Drawing wajib diisi.'); return; }
    
    setFormLoading(true);
    setFormError('');
    try {
      if (isEditMode) {
        await api.put(`/api/drawings/${activeDrawingId}`, form);
      } else {
        await api.post('/api/drawings', form);
      }
      closeModal();
      loadDrawings();
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, nodrawing) => {
    if (!confirm(`Yakin ingin menghapus drawing "${nodrawing}"?`)) return;
    try {
      await api.delete(`/api/drawings/${id}`);
      loadDrawings();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  // ─── UPLOAD & VIEW ────────────────────────────────────────────────
  const openUploadModal = (id) => {
    setActiveDrawingId(id);
    setUploadFile(null);
    setUploadType('drawing');
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => setIsUploadModalOpen(false);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Pilih file terlebih dahulu.');
      return;
    }

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('imagedata', uploadFile);
    formData.append('type', uploadType);
    
    // Find nodrawing for naming fallback just in case
    const drw = drawings.find(d => d.id_drawing === activeDrawingId);
    if (drw) formData.append('nodrawing', drw.nodrawing);

    const token = localStorage.getItem('satya_token');
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/drawings/${activeDrawingId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        closeUploadModal();
        loadDrawings();
      } else {
        alert(data.message || 'Gagal mengunggah file');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleViewPdf = async (id, type) => {
    const token = localStorage.getItem('satya_token');
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    try {
      const res = await fetch(`${API_BASE}/api/drawings/${id}/file?type=${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 404) alert('File PDF belum diunggah atau tidak ditemukan.');
        else alert('Gagal memuat file PDF.');
        return;
      }

      // Read as blob and open in new tab
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Revoke the object URL after a short delay
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      
    } catch (err) {
      alert('Terjadi kesalahan saat memuat PDF.');
    }
  };


  return (
    <AppLayout user={user} onLogout={handleLogout}>
      <header className="page-header">
        <div>
          <h1 className="page-title">Master Item</h1>
          <p className="page-subtitle">Kelola data item, spesifikasi, dan dokumen PDF.</p>
        </div>
      </header>

      <div className="page-content">
        {error && (
          <div className="alert alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <div className="card">
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', flex: '1', maxWidth: '500px' }}>
                <div style={{ position: 'relative', flex: '1' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cari No. Item / Drawing..."
                      style={{ paddingLeft: '38px' }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select 
                  className="form-control" 
                  style={{ width: '160px' }} 
                  value={fileStatus} 
                  onChange={(e) => setFileStatus(e.target.value)}
                >
                  <option value="all">Semua File</option>
                  <option value="uploaded">Sudah Upload</option>
                  <option value="missing">Belum Upload</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={openAddModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Tambah Baru
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span className="spinner" />
                <p style={{ marginTop: '14px' }}>Memuat data drawing...</p>
              </div>
            ) : (
              <>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>No. Item / Drawing</th>
                        <th>Customer</th>
                        <th className="hide-on-mobile">Deskripsi</th>
                        <th className="hide-on-mobile">Price</th>
                        <th style={{ textAlign: 'center' }}>File</th>
                        <th style={{ textAlign: 'right', minWidth: '180px' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drawings.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Belum ada data.</td></tr>
                      ) : (
                        drawings.map((d) => (
                          <tr key={d.id_drawing}>
                            <td style={{ fontWeight: '600' }}>{d.nodrawing}</td>
                            <td>{d.customer_name}</td>
                            <td className="hide-on-mobile">{d.descrip || '-'}</td>
                            <td className="hide-on-mobile">{d.price ? 'Rp ' + d.price.toLocaleString('id-ID') : '-'}</td>
                            <td style={{ textAlign: 'center' }}>
                               <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                                 <button 
                                  className={`btn btn-sm ${d.linkpict ? 'btn-primary' : 'btn-outline'}`}
                                  onClick={() => d.linkpict ? handleViewPdf(d.id_drawing, 'drawing') : openUploadModal(d.id_drawing)}
                                  title={d.linkpict ? "Lihat PDF" : "Upload PDF"}
                                 >
                                   DWG
                                 </button>
                               </div>
                               <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                 {d.linkpict || 'kosong'}
                               </div>
                            </td>
                            <td style={{ textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button className="btn btn-outline btn-sm" style={{ color: 'var(--primary)' }} onClick={() => router.push(`/master/drawings/${d.id_drawing}/proses`)}>Proses</button>
                              <button className="btn btn-outline btn-sm" onClick={() => openUploadModal(d.id_drawing)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                              </button>
                              <button className="btn btn-outline btn-sm" onClick={() => openEditModal(d)}>Edit</button>
                              <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDelete(d.id_drawing, d.nodrawing)}>Hapus</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {meta.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Hal {meta.page} dari {meta.totalPages}</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline btn-sm" disabled={meta.page === 1} onClick={() => setPage(meta.page - 1)}>Prev</button>
                      <button className="btn btn-outline btn-sm" disabled={meta.page === meta.totalPages} onClick={() => setPage(meta.page + 1)}>Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{isEditMode ? 'Edit Item' : 'Tambah Item Baru'}</h3>
              <button className="modal-close" onClick={closeModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert-error">{formError}</div>}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="nodrawing">No. Drawing <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input type="text" id="nodrawing" name="nodrawing" className="form-control" value={form.nodrawing} onChange={handleFormChange} autoFocus />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="id_customer">Customer</label>
                    <select id="id_customer" name="id_customer" className="form-control" value={form.id_customer} onChange={handleFormChange}>
                      <option value="">-- Pilih Customer --</option>
                      {customers.map(c => <option key={c.id_customer} value={c.id_customer}>{c.nm_customer}</option>)}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="id_sales">Sales</label>
                    {/* Placeholder for Sales Dropdown */}
                    <input type="number" id="id_sales" name="id_sales" className="form-control" value={form.id_sales} onChange={handleFormChange} placeholder="ID Sales" />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="dimensi">Dimensi</label>
                    <input type="text" id="dimensi" name="dimensi" className="form-control" value={form.dimensi} onChange={handleFormChange} />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="toolkind">Toolkind</label>
                    <input type="text" id="toolkind" name="toolkind" className="form-control" value={form.toolkind} onChange={handleFormChange} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="leadtime">Lead Time (Days)</label>
                    <input type="number" id="leadtime" name="leadtime" className="form-control" value={form.leadtime} onChange={handleFormChange} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="price">Harga</label>
                    <input type="number" id="price" name="price" className="form-control" value={form.price} onChange={handleFormChange} />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="descrip">Deskripsi</label>
                    <textarea id="descrip" name="descrip" className="form-control" value={form.descrip} onChange={handleFormChange} rows="2" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal} disabled={formLoading}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Upload File PDF</h3>
              <button className="modal-close" onClick={closeUploadModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Jenis Dokumen</label>
                  <select className="form-control" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                    <option value="drawing">PDF (Drawing / Referensi)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Pilih File (Max 10MB)</label>
                  <input 
                    type="file" 
                    accept="application/pdf"
                    className="form-control"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    style={{ padding: '8px' }}
                  />
                  <small style={{ color: 'var(--text-muted)' }}>Hanya file .pdf yang diperbolehkan</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeUploadModal} disabled={uploadLoading}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={uploadLoading}>
                  {uploadLoading ? 'Mengunggah...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AppLayout>
  );
}
