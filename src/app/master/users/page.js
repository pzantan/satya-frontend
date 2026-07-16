'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function MasterUserPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);

  const [users, setUsers] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  const initialForm = { 
    id: '', 
    first_name: '', 
    last_name: '', 
    email_addres: '', 
    user_name: '', 
    pass_word: '', 
    role: '2' 
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const token = localStorage.getItem('satya_token');
    const userData = localStorage.getItem('satya_user');
    if (!token) { router.push('/login'); return; }
    if (userData) {
      const u = JSON.parse(userData);
      setCurrentUser(u);
      if (u.role !== '1') {
        router.push('/home');
        return;
      }
    }
    loadUsers();
    loadRoles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, page]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (page !== 1) setPage(1);
      else loadUsers();
    }, 500);
    return () => clearTimeout(delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/users?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      setUsers(res.data);
      setMeta(res.meta);
    } catch {
      setError('Gagal memuat data user. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await api.get('/api/roles');
      setRolesList(res);
    } catch (err) {
      console.error('Failed to load roles list:', err);
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

  const openEditModal = (u) => {
    setForm({ 
      id: u.id, 
      first_name: u.first_name || '', 
      last_name: u.last_name || '', 
      email_addres: u.email_addres || '', 
      user_name: u.user_name || '', 
      pass_word: '', // Leave blank for edit unless they want to change it
      role: u.role || '2' 
    });
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
    if (!form.user_name) { setFormError('Username wajib diisi.'); return; }
    if (!form.email_addres) { setFormError('Email wajib diisi.'); return; }
    if (!isEditMode && !form.pass_word) { setFormError('Password wajib diisi.'); return; }
    
    setFormLoading(true);
    setFormError('');
    try {
      if (isEditMode) {
        await api.put(`/api/users/${form.id}`, form);
      } else {
        await api.post('/api/users', form);
      }
      closeModal();
      loadUsers();
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (id === 1) {
      alert('Default Administrator account cannot be deleted.');
      return;
    }
    if (!confirm(`Yakin ingin menghapus user "${name}"?`)) return;
    try {
      await api.delete(`/api/users/${id}`);
      loadUsers();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  return (
    <AppLayout user={currentUser} onLogout={handleLogout}>
      <header style={{ padding: '20px 32px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <h1 className="page-title">Master User (Pengguna)</h1>
        <p className="page-subtitle">Kelola akun pengguna, password, dan pembagian departemen/role kerja.</p>
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
                  placeholder="Cari nama, email, username..."
                  style={{ paddingLeft: '38px' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" onClick={openAddModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Tambah User
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span className="spinner" style={{ borderColor: 'var(--text-muted)', borderTopColor: 'var(--primary)', width: '24px', height: '24px' }} />
                <p style={{ marginTop: '14px' }}>Memuat data user...</p>
              </div>
            ) : (
              <>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>ID</th>
                        <th>Nama Lengkap</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role Departemen</th>
                        <th style={{ width: '140px', textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            {search ? 'Tidak ada user yang cocok.' : 'Belum ada data user.'}
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id}>
                            <td>{u.id}</td>
                            <td style={{ fontWeight: '600' }}>{`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.user_name}</td>
                            <td><code>{u.user_name}</code></td>
                            <td>{u.email_addres}</td>
                            <td>
                              <span className={`badge ${u.role === '1' ? 'badge-admin' : ''}`} style={{
                                padding: '4px 8px',
                                borderRadius: '999px',
                                fontSize: '11px',
                                fontWeight: '600',
                                background: u.role === '1' ? '#dbeafe' : '#f1f5f9',
                                color: u.role === '1' ? '#1e40af' : '#475569'
                              }}>
                                {u.role_name}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button className="btn btn-outline btn-sm" onClick={() => openEditModal(u)}>Edit</button>
                              {u.id !== 1 && (
                                <button
                                  className="btn btn-outline btn-sm"
                                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                  onClick={() => handleDelete(u.id, u.user_name)}
                                >
                                  Hapus
                                </button>
                              )}
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
              <h3 className="modal-title">{isEditMode ? 'Edit Akun User' : 'Tambah User Baru'}</h3>
              <button className="modal-close" onClick={closeModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert-error">{formError}</div>}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="first_name">Nama Depan</label>
                    <input type="text" id="first_name" name="first_name" className="form-control" value={form.first_name} onChange={handleFormChange} placeholder="First name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="last_name">Nama Belakang</label>
                    <input type="text" id="last_name" name="last_name" className="form-control" value={form.last_name} onChange={handleFormChange} placeholder="Last name" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="email_addres">Alamat Email <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input type="email" id="email_addres" name="email_addres" className="form-control" value={form.email_addres} onChange={handleFormChange} placeholder="Contoh: user@satyatehnik.co.id" disabled={isEditMode} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="user_name">Username Login <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input type="text" id="user_name" name="user_name" className="form-control" value={form.user_name} onChange={handleFormChange} placeholder="Contoh: budi_sti" disabled={isEditMode} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="pass_word">
                    Password {isEditMode && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(biarkan kosong jika tidak diganti)</span>} {!isEditMode && <span style={{ color: 'var(--danger)' }}>*</span>}
                  </label>
                  <input type="password" id="pass_word" name="pass_word" className="form-control" value={form.pass_word} onChange={handleFormChange} placeholder="Masukkan password baru..." />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="role">Role Departemen <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select id="role" name="role" className="form-control" value={form.role} onChange={handleFormChange}>
                    {rolesList.map(r => (
                      <option key={r.id_role} value={r.id_role}>{r.role_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal} disabled={formLoading}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
