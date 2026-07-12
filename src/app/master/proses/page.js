'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function MasterProsesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [prosesData, setProsesData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const initialForm = { kd_proses: '', nm_proses: '', codepr: '', kd_mesin: '', pelaksana: '' };
  const [form, setForm] = useState(initialForm);

  const [machines, setMachines] = useState([]);
  const [searchingMachine, setSearchingMachine] = useState(false);

  const fetchMachines = async (query) => {
    setSearchingMachine(true);
    try {
      const res = await api.get(`/api/machines?limit=10&search=${encodeURIComponent(query)}`);
      setMachines(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingMachine(false);
    }
  };

  const handleSelectMachine = (machine) => {
    setForm({ ...form, kd_mesin: machine.kdmesin });
    setMachines([]); // close dropdown
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
    loadProses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, page]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (page !== 1) setPage(1);
      else if (!isCheckingAuth) loadProses();
    }, 500);
    return () => clearTimeout(delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadProses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/proses?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      setProsesData(res.data);
      setMeta(res.meta);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data proses. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setForm(initialForm);
    setIsEditMode(false);
    setFormError('');
    setMachines([]); // Clear machines list
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setForm({ 
      kd_proses: p.kd_proses, 
      nm_proses: p.nm_proses || '', 
      codepr: p.codepr || '', 
      kd_mesin: p.kd_mesin || '', 
      pelaksana: p.pelaksana || '' 
    });
    setIsEditMode(true);
    setFormError('');
    setMachines([]); // Clear machines list
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nm_proses || (isEditMode && !form.kd_proses)) { 
      setFormError('Nama Proses wajib diisi.'); 
      return; 
    }
    setFormLoading(true);
    setFormError('');
    try {
      if (isEditMode) {
        await api.put(`/api/proses/${encodeURIComponent(form.kd_proses)}`, form);
      } else {
        await api.post('/api/proses', form);
      }
      closeModal();
      loadProses();
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Apakah Anda yakin ingin menghapus Proses "${name}"?`)) {
      try {
        await api.delete(`/api/proses/${encodeURIComponent(id)}`);
        loadProses();
      } catch (err) {
        alert(err.message || 'Gagal menghapus data.');
      }
    }
  };

  if (isCheckingAuth) {
    return null; // Prevent UI flash
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
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)' }}>Master Proses</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Kelola data master proses (m_proses)</p>
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
                  placeholder="Cari Kode / Nama Proses..."
                  style={{ paddingLeft: '38px' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" onClick={openAddModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Tambah Proses
              </button>
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>Kode Proses</th>
                    <th>Nama Proses</th>
                    <th>Code PR</th>
                    <th>Nama Mesin</th>
                    <th>Pelaksana</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading data...</td></tr>
                  ) : prosesData.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Tidak ada data proses</td></tr>
                  ) : (
                    prosesData.map((row) => (
                      <tr key={row.kd_proses}>
                        <td style={{ fontWeight: '600' }}>{row.kd_proses}</td>
                        <td style={{ fontWeight: '500' }}>{row.nm_proses}</td>
                        <td>{row.codepr || '-'}</td>
                        <td>{row.nm_mesin || '-'}</td>
                        <td>
                          {row.pelaksana === '0' ? 'Internal' : row.pelaksana === '1' ? 'Subcont' : (row.pelaksana || '-')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => openEditModal(row)} title="Edit">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => handleDelete(row.kd_proses, row.nm_proses)} title="Hapus">
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
          <div className="card" style={{ width: '100%', maxWidth: '600px', margin: '20px', animation: 'slideUp 0.3s ease', maxHeight: '90vh', minHeight: '450px', overflowY: 'auto' }}>
            <div className="card-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                  {isEditMode ? 'Edit Proses' : 'Tambah Proses Baru'}
                </h2>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {formError && <div className="alert alert-danger" style={{ marginBottom: '20px' }}>{formError}</div>}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Kode Proses *</label>
                    <input
                      type="text"
                      name="kd_proses"
                      className="form-control"
                      value={isEditMode ? form.kd_proses : '[Auto Generated]'}
                      onChange={handleFormChange}
                      placeholder="Auto"
                      disabled={true}
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Nama Proses *</label>
                    <input
                      type="text"
                      name="nm_proses"
                      className="form-control"
                      value={form.nm_proses}
                      onChange={handleFormChange}
                      placeholder="Contoh: Machining"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Code PR</label>
                    <input
                      type="text"
                      name="codepr"
                      className="form-control"
                      value={form.codepr}
                      onChange={handleFormChange}
                      placeholder="Contoh: C01"
                    />
                  </div>
                  <div style={{ flex: 1, position: 'relative', zIndex: 50 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Kode Mesin</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-control"
                        value={form.kd_mesin || ''}
                        onChange={(e) => {
                          setForm({ ...form, kd_mesin: e.target.value });
                          fetchMachines(e.target.value);
                        }}
                        onFocus={() => { if (form.kd_mesin) fetchMachines(form.kd_mesin); else fetchMachines(''); }}
                        placeholder="Ketik untuk mencari mesin..."
                      />
                      {searchingMachine && (
                        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        </div>
                      )}
                      {machines.length > 0 && (
                        <ul className="dropdown-menu show" style={{ width: '100%', maxHeight: '200px', overflowY: 'auto', position: 'absolute', top: '100%', left: 0, zIndex: 1000, margin: 0, padding: '4px 0', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                          {machines.map((m) => (
                            <li key={m.kdmesin} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }} onClick={() => handleSelectMachine(m)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}>
                              <div style={{ fontWeight: '500' }}>{m.kdmesin}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.nm_mesin}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Pelaksana</label>
                    <select
                      name="pelaksana"
                      className="form-control"
                      value={form.pelaksana || ''}
                      onChange={handleFormChange}
                    >
                      <option value="">-- Pilih --</option>
                      <option value="0">0 - Internal</option>
                      <option value="1">1 - Subcount</option>
                    </select>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '20px' }}>
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
