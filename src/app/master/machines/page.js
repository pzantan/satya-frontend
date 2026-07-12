'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function MasterMachinePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  // Data State
  const [machines, setMachines] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  const initialForm = { kdmesin: '', nm_mesin: '' };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const token = localStorage.getItem('satya_token');
    const userData = localStorage.getItem('satya_user');

    if (!token) {
      router.push('/login');
      return;
    }
    
    if (userData) {
      setUser(JSON.parse(userData));
    }

    loadMachines();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, page]);

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        loadMachines();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadMachines = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/machines?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      setMachines(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError('Gagal memuat data mesin. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('satya_token');
    localStorage.removeItem('satya_user');
    document.cookie = 'satya_token=; path=/; max-age=0';
    router.push('/login');
  };

  // ─── Modal & Form Handlers ───────────────────────────────────────────────

  const openAddModal = () => {
    setForm(initialForm);
    setIsEditMode(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (machine) => {
    setForm({
      kdmesin: machine.kdmesin,
      nm_mesin: machine.nm_mesin || ''
    });
    setIsEditMode(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nm_mesin) {
      setFormError('Nama mesin wajib diisi.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      if (isEditMode) {
        await api.put(`/api/machines/${form.kdmesin}`, form);
      } else {
        await api.post('/api/machines', form);
      }
      closeModal();
      loadMachines();
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus mesin "${name}"?`)) return;
    
    try {
      await api.delete(`/api/machines/${id}`);
      loadMachines();
    } catch (err) {
      alert('Gagal menghapus mesin: ' + err.message);
    }
  };

  return (
    <AppLayout user={user} onLogout={handleLogout}>
      {/* Topbar */}
      <header style={{ padding: '20px 32px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <h1 className="page-title">Master Mesin</h1>
        <p className="page-subtitle">Kelola data mesin untuk keperluan produksi dan penjadwalan.</p>
      </header>

      {/* Content */}
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {error && (
          <div className="alert alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <div className="card">
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Cari kode atau nama mesin..."
                    style={{ paddingLeft: '38px' }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <button className="btn btn-primary" onClick={openAddModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Tambah Baru
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span className="spinner" style={{ borderColor: 'var(--text-muted)', borderTopColor: 'var(--primary)', width: '24px', height: '24px' }} />
                <p style={{ marginTop: '14px' }}>Memuat data mesin...</p>
              </div>
            ) : (
              <>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: '90px' }}>Kode</th>
                        <th>Nama Mesin</th>
                        <th style={{ width: '140px', textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {machines.length === 0 ? (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            {search ? 'Tidak ada mesin yang cocok dengan pencarian.' : 'Belum ada data mesin.'}
                          </td>
                        </tr>
                      ) : (
                        machines.map((m) => (
                          <tr key={m.kdmesin}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{m.kdmesin}</td>
                            <td style={{ fontWeight: '600' }}>{m.nm_mesin}</td>
                            <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn btn-outline btn-sm" 
                                onClick={() => openEditModal(m)}
                                title="Edit"
                              >
                                Edit
                              </button>
                              <button 
                                className="btn btn-outline btn-sm" 
                                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                onClick={() => handleDelete(m.kdmesin, m.nm_mesin)}
                                title="Hapus"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {meta.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Menampilkan {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total} data
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-outline btn-sm" 
                        disabled={meta.page === 1}
                        onClick={() => setPage(meta.page - 1)}
                      >
                        Sebelumnya
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.875rem', fontWeight: '500' }}>
                        Hal {meta.page} / {meta.totalPages}
                      </div>
                      <button 
                        className="btn btn-outline btn-sm" 
                        disabled={meta.page === meta.totalPages}
                        onClick={() => setPage(meta.page + 1)}
                      >
                        Selanjutnya
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Modal Form ──────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{isEditMode ? 'Edit Mesin' : 'Tambah Mesin Baru'}</h3>
              <button className="modal-close" onClick={closeModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert alert-error">
                    {formError}
                  </div>
                )}
                
                <div className="form-group">
                  <label className="form-label" htmlFor="nm_mesin">Nama Mesin <span style={{color: 'var(--danger)'}}>*</span></label>
                  <input
                    type="text"
                    id="nm_mesin"
                    name="nm_mesin"
                    className="form-control"
                    value={form.nm_mesin}
                    onChange={handleFormChange}
                    placeholder="Contoh: Mesin CNC Milling 3 Axis"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal} disabled={formLoading}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Mesin')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
