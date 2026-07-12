'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function MasterMaterialPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  // Data State
  const [materials, setMaterials] = useState([]);
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
  
  const initialForm = { kdmatrial: '', nmmatrial: '', harga: '', stok: '' };
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

    loadMaterials();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, page]);

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        loadMaterials();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadMaterials = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/materials?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      setMaterials(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError('Gagal memuat data material. Pastikan backend berjalan.');
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

  const openEditModal = (material) => {
    setForm({
      kdmatrial: material.kdmatrial,
      nmmatrial: material.nmmatrial || '',
      harga: material.harga || '',
      stok: material.stok || ''
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
    if (!form.nmmatrial) {
      setFormError('Nama material wajib diisi.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      if (isEditMode) {
        await api.put(`/api/materials/${form.kdmatrial}`, form);
      } else {
        await api.post('/api/materials', form);
      }
      closeModal();
      loadMaterials();
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus material "${name}"?`)) return;
    
    try {
      await api.delete(`/api/materials/${id}`);
      loadMaterials();
    } catch (err) {
      alert('Gagal menghapus material: ' + err.message);
    }
  };

  return (
    <AppLayout user={user} onLogout={handleLogout}>
      {/* Topbar */}
      <header style={{ padding: '20px 32px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <h1 className="page-title">Master Material</h1>
        <p className="page-subtitle">Kelola data bahan baku (material) untuk keperluan gudang dan produksi.</p>
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
                    placeholder="Cari kode atau nama material..."
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
                <p style={{ marginTop: '14px' }}>Memuat data material...</p>
              </div>
            ) : (
              <>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: '90px' }}>Kode</th>
                        <th>Nama Material</th>
                        <th className="hide-on-mobile">Harga (Rp)</th>
                        <th>Stok</th>
                        <th style={{ width: '140px', textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            {search ? 'Tidak ada material yang cocok dengan pencarian.' : 'Belum ada data material.'}
                          </td>
                        </tr>
                      ) : (
                        materials.map((m) => (
                          <tr key={m.kdmatrial}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{m.kdmatrial}</td>
                            <td style={{ fontWeight: '600' }}>{m.nmmatrial}</td>
                            <td className="hide-on-mobile">
                              {new Intl.NumberFormat('id-ID').format(m.harga || 0)}
                            </td>
                            <td>
                              <span className={`badge ${m.stok > 10 ? 'badge-success' : m.stok > 0 ? 'badge-warning' : 'badge-danger'}`}>
                                {m.stok || 0}
                              </span>
                            </td>
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
                                onClick={() => handleDelete(m.kdmatrial, m.nmmatrial)}
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
              <h3 className="modal-title">{isEditMode ? 'Edit Material' : 'Tambah Material Baru'}</h3>
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
                  <label className="form-label" htmlFor="nmmatrial">Nama Material <span style={{color: 'var(--danger)'}}>*</span></label>
                  <input
                    type="text"
                    id="nmmatrial"
                    name="nmmatrial"
                    className="form-control"
                    value={form.nmmatrial}
                    onChange={handleFormChange}
                    placeholder="Contoh: Plat Besi 5mm"
                    autoFocus
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="harga">Harga (Rp)</label>
                    <input
                      type="number"
                      id="harga"
                      name="harga"
                      className="form-control"
                      value={form.harga}
                      onChange={handleFormChange}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="stok">Stok Awal</label>
                    <input
                      type="number"
                      id="stok"
                      name="stok"
                      className="form-control"
                      value={form.stok}
                      onChange={handleFormChange}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal} disabled={formLoading}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Material')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
