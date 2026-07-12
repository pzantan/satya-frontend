'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function MasterToolkindPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const [toolkinds, setToolkinds] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const initialForm = { id_tk: '', nm_tk: '' };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const token = localStorage.getItem('satya_token');
    const userData = localStorage.getItem('satya_user');
    if (!token) { 
      router.push('/login'); 
      return; 
    }
    if (userData) setUser(JSON.parse(userData));
    setIsCheckingAuth(false);
    loadToolkinds();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, page]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (page !== 1) setPage(1);
      else loadToolkinds();
    }, 500);
    return () => clearTimeout(delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadToolkinds = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/toolkind?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      setToolkinds(res.data);
      setMeta(res.meta);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data toolkind. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setForm(initialForm);
    setIsEditMode(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (t) => {
    setForm({ id_tk: t.id_tk, nm_tk: t.nm_tk || '' });
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
    if (!form.nm_tk) { setFormError('Nama Toolkind wajib diisi.'); return; }
    setFormLoading(true);
    setFormError('');
    try {
      if (isEditMode) {
        await api.put(`/api/toolkind/${form.id_tk}`, form);
      } else {
        await api.post('/api/toolkind', form);
      }
      closeModal();
      loadToolkinds();
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Apakah Anda yakin ingin menghapus Toolkind "${name}"?`)) {
      try {
        await api.delete(`/api/toolkind/${id}`);
        loadToolkinds();
      } catch (err) {
        alert(err.message || 'Gagal menghapus data.');
      }
    }
  };

  if (isCheckingAuth) {
    return null; // or a loading spinner
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
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)' }}>Master Toolkind</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Kelola data toolkind (m_toolkind)</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>{error}</div>
        )}

        <div className="card">
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari Nama Toolkind..."
                  style={{ paddingLeft: '38px' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" onClick={openAddModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Tambah Toolkind
              </button>
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th>Nama Toolkind</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}>Loading data...</td></tr>
                  ) : toolkinds.length === 0 ? (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Tidak ada data toolkind</td></tr>
                  ) : (
                    toolkinds.map((row) => (
                      <tr key={row.id_tk}>
                        <td>{row.id_tk}</td>
                        <td style={{ fontWeight: '500' }}>{row.nm_tk}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => openEditModal(row)} title="Edit">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => handleDelete(row.id_tk, row.nm_tk)} title="Hapus">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '20px', animation: 'slideUp 0.3s ease' }}>
            <div className="card-body" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                  {isEditMode ? 'Edit Toolkind' : 'Tambah Toolkind Baru'}
                </h2>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {formError && <div className="alert alert-danger" style={{ marginBottom: '20px' }}>{formError}</div>}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Nama Toolkind *</label>
                  <input
                    type="text"
                    name="nm_tk"
                    className="form-control"
                    value={form.nm_tk}
                    onChange={handleFormChange}
                    placeholder="Contoh: Insert Tools"
                    required
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={closeModal}>Batal</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={formLoading}>
                    {formLoading ? 'Menyimpan...' : 'Simpan Data'}
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
