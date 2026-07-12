'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function MasterCustomerPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const initialForm = { id_customer: '', nm_customer: '', alamat: '', up_customer: '' };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const token = localStorage.getItem('satya_token');
    const userData = localStorage.getItem('satya_user');
    if (!token) { router.push('/login'); return; }
    if (userData) setUser(JSON.parse(userData));
    loadCustomers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, page]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (page !== 1) setPage(1);
      else loadCustomers();
    }, 500);
    return () => clearTimeout(delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/customers?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      setCustomers(res.data);
      setMeta(res.meta);
    } catch {
      setError('Gagal memuat data pelanggan. Pastikan backend berjalan.');
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

  const openAddModal = () => {
    setForm(initialForm);
    setIsEditMode(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setForm({ id_customer: c.id_customer, nm_customer: c.nm_customer || '', alamat: c.alamat || '', up_customer: c.up_customer || '' });
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
    if (!form.nm_customer) { setFormError('Nama pelanggan wajib diisi.'); return; }
    setFormLoading(true);
    setFormError('');
    try {
      if (isEditMode) {
        await api.put(`/api/customers/${form.id_customer}`, form);
      } else {
        await api.post('/api/customers', form);
      }
      closeModal();
      loadCustomers();
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Yakin ingin menghapus pelanggan "${name}"?`)) return;
    try {
      await api.delete(`/api/customers/${id}`);
      loadCustomers();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  return (
    <AppLayout user={user} onLogout={handleLogout}>
      <header style={{ padding: '20px 32px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <h1 className="page-title">Master Pelanggan</h1>
        <p className="page-subtitle">Kelola data pelanggan untuk keperluan WO, Produksi, dan Invoice.</p>
      </header>

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
              <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari nama, alamat, PIC..."
                  style={{ paddingLeft: '38px' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
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
                <p style={{ marginTop: '14px' }}>Memuat data pelanggan...</p>
              </div>
            ) : (
              <>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>ID</th>
                        <th>Nama Pelanggan</th>
                        <th>UP Customer</th>
                        <th className="hide-on-mobile">Alamat</th>
                        <th style={{ width: '140px', textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            {search ? 'Tidak ada pelanggan yang cocok.' : 'Belum ada data pelanggan.'}
                          </td>
                        </tr>
                      ) : (
                        customers.map((c) => (
                          <tr key={c.id_customer}>
                            <td>{c.id_customer}</td>
                            <td style={{ fontWeight: '600' }}>{c.nm_customer}</td>
                            <td>{c.up_customer || '-'}</td>
                            <td className="hide-on-mobile">{c.alamat || '-'}</td>
                            <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button className="btn btn-outline btn-sm" onClick={() => openEditModal(c)}>Edit</button>
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                onClick={() => handleDelete(c.id_customer, c.nm_customer)}
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

                {meta.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Menampilkan {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} dari {meta.total} data
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline btn-sm" disabled={meta.page === 1} onClick={() => setPage(meta.page - 1)}>Sebelumnya</button>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.875rem', fontWeight: '500' }}>
                        Hal {meta.page} / {meta.totalPages}
                      </div>
                      <button className="btn btn-outline btn-sm" disabled={meta.page === meta.totalPages} onClick={() => setPage(meta.page + 1)}>Selanjutnya</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{isEditMode ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</h3>
              <button className="modal-close" onClick={closeModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert-error">{formError}</div>}
                <div className="form-group">
                  <label className="form-label" htmlFor="nm_customer">Nama Pelanggan <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input type="text" id="nm_customer" name="nm_customer" className="form-control" value={form.nm_customer} onChange={handleFormChange} placeholder="Contoh: PT. Maju Jaya" autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="up_customer">UP Customer (PIC)</label>
                  <input type="text" id="up_customer" name="up_customer" className="form-control" value={form.up_customer} onChange={handleFormChange} placeholder="Contoh: Bpk. Budi" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="alamat">Alamat</label>
                  <textarea id="alamat" name="alamat" className="form-control" value={form.alamat} onChange={handleFormChange} placeholder="Alamat lengkap..." rows="3" style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal} disabled={formLoading}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Pelanggan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
