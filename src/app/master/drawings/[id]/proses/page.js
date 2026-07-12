'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function MasterItemProsesPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [user, setUser] = useState(null);

  const [item, setItem] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [masterProses, setMasterProses] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form State
  const initialForm = { kd_proses: '', time: '' };
  const [form, setForm] = useState(initialForm);
  const [formLoading, setFormLoading] = useState(false);

  // Drag and Drop State
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('satya_token');
    const userData = localStorage.getItem('satya_user');
    if (!token) { router.push('/login'); return; }
    if (userData) setUser(JSON.parse(userData));
    
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load Item details
      const itemRes = await api.get(`/api/drawings/${id}`);
      setItem(itemRes.data || itemRes);

      // Load Master Proses
      const masterRes = await api.get('/api/proses');
      setMasterProses(masterRes.data || []);

      // Load Proses List for this item
      const prosesRes = await api.get(`/api/drawings/${id}/proses`);
      setProcesses(prosesRes);

      setError('');
    } catch (err) {
      setError(err.message || 'Gagal memuat data proses.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('satya_token');
    localStorage.removeItem('satya_user');
    router.push('/login');
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.kd_proses) { alert('Silakan pilih proses terlebih dahulu.'); return; }
    
    // Auto-determine next urutanke
    const nextUrutan = processes.length > 0 ? Math.max(...processes.map(p => p.urutanke || 0)) + 1 : 1;
    
    setFormLoading(true);
    try {
      await api.post(`/api/drawings/${id}/proses`, { ...form, urutanke: nextUrutan });
      setForm(initialForm);
      // Reload process list
      const prosesRes = await api.get(`/api/drawings/${id}/proses`);
      setProcesses(prosesRes);
    } catch (err) {
      alert(err.message || 'Gagal menyimpan proses.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (idproses, nm_proses) => {
    if (!confirm(`Yakin ingin menghapus proses "${nm_proses}"?`)) return;
    try {
      await api.delete(`/api/drawings/${id}/proses/${idproses}`);
      // Reload process list
      const prosesRes = await api.get(`/api/drawings/${id}/proses`);
      setProcesses(prosesRes);
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault(); // allow drop
    if (draggedIdx === null) return;
    if (draggedIdx === index) return;
    
    // Reorder locally while dragging for visual feedback
    const newProcesses = [...processes];
    const draggedItem = newProcesses[draggedIdx];
    newProcesses.splice(draggedIdx, 1);
    newProcesses.splice(index, 0, draggedItem);
    
    setDraggedIdx(index);
    setProcesses(newProcesses);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (draggedIdx === null) return;
    setDraggedIdx(null);
    saveOrder();
  };
  
  const saveOrder = async () => {
    setIsSavingOrder(true);
    // Prepare new ordered items starting from urutanke = 1
    const newOrderData = processes.map((p, index) => ({
      idproses: p.idproses,
      urutanke: index + 1
    }));
    try {
      await api.put(`/api/drawings/${id}/proses/reorder`, { orderedItems: newOrderData });
      // Update local urutanke visually to match logic
      setProcesses(processes.map((p, i) => ({ ...p, urutanke: i + 1 })));
    } catch (err) {
      alert('Gagal menyimpan urutan baru: ' + err.message);
    } finally {
      setIsSavingOrder(false);
    }
  };


  return (
    <AppLayout user={user} onLogout={handleLogout}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Proses List</h1>
          <p className="page-subtitle">Kelola urutan proses produksi untuk item ini.</p>
        </div>
        <button className="btn btn-outline" onClick={() => router.push('/master/drawings')}>
          Kembali
        </button>
      </header>

      <div className="page-content">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <span className="spinner" />
            <p style={{ marginTop: '14px' }}>Memuat data...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '20px' }}>
            
            {/* Kiri: Detail Item */}
            <div className="card" style={{ alignSelf: 'start' }}>
              <div className="card-body">
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-main)' }}>
                  Detail Item
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No. Item:</span> 
                    <strong style={{ display: 'block' }}>{item?.nodrawing}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Customer:</span> 
                    <strong style={{ display: 'block' }}>{item?.customer_name || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Deskripsi:</span> 
                    <strong style={{ display: 'block' }}>{item?.descrip || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Dimensi:</span> 
                    <strong style={{ display: 'block' }}>{item?.dimensi || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Toolkind:</span> 
                    <strong style={{ display: 'block' }}>{item?.toolkind || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Price:</span> 
                    <strong style={{ display: 'block' }}>{item?.price ? 'Rp ' + item.price.toLocaleString('id-ID') : '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Lead Time:</span> 
                    <strong style={{ display: 'block' }}>{item?.leadtime ? item.leadtime + ' Hari' : '-'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Kanan: Form Tambah & Daftar Proses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Form Tambah Proses */}
              <div className="card">
                <div className="card-body">
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-main)' }}>
                    Tambah Proses Baru
                  </h3>
                  <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    
                    <div className="form-group" style={{ flex: '2', minWidth: '200px', marginBottom: 0 }}>
                      <label className="form-label">Proses <span style={{ color: 'var(--danger)' }}>*</span></label>
                      <select 
                        name="kd_proses" 
                        className="form-control" 
                        value={form.kd_proses} 
                        onChange={handleFormChange}
                        required
                      >
                        <option value="">-- Pilih Proses --</option>
                        {masterProses.map(p => (
                          <option key={p.kd_proses} value={p.kd_proses}>{p.nm_proses}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ flex: '1', minWidth: '120px', marginBottom: 0 }}>
                      <label className="form-label">Lead Time (Menit)</label>
                      <input 
                        type="number" 
                        name="time" 
                        className="form-control" 
                        value={form.time} 
                        onChange={handleFormChange}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={formLoading} style={{ height: '42px', padding: '0 24px' }}>
                      {formLoading ? 'Menyimpan...' : 'Tambahkan'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Daftar Proses */}
              <div className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>
                      Daftar Urutan Proses
                    </h3>
                    {isSavingOrder && <span style={{ fontSize: '13px', color: 'var(--primary)' }}>Menyimpan urutan...</span>}
                  </div>
                  
                  <div className="table-responsive">
                    <table className="table" style={{ userSelect: 'none' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}></th>
                          <th style={{ width: '80px', textAlign: 'center' }}>Urutan</th>
                          <th>Nama Proses</th>
                          <th>Lead Time</th>
                          <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processes.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                              Belum ada proses yang ditambahkan.
                            </td>
                          </tr>
                        ) : (
                          processes.map((p, index) => (
                            <tr 
                              key={p.idproses}
                              draggable
                              onDragStart={(e) => handleDragStart(e, index)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDrop={handleDrop}
                              style={{ 
                                cursor: 'grab', 
                                opacity: draggedIdx === index ? 0.5 : 1,
                                background: draggedIdx === index ? 'var(--bg-secondary)' : 'transparent',
                                transition: 'background 0.2s, opacity 0.2s'
                              }}
                            >
                              <td style={{ color: 'var(--text-muted)', textAlign: 'center', cursor: 'grab' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{p.urutanke}</td>
                              <td>{p.nm_proses}</td>
                              <td>{p.time ? p.time + ' Menit' : '-'}</td>
                              <td style={{ textAlign: 'center' }}>
                                <button 
                                  className="btn btn-outline btn-sm" 
                                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '4px 8px' }}
                                  onClick={() => handleDelete(p.idproses, p.nm_proses)}
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
                  <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Tahan dan geser (drag & drop) pada baris tabel untuk mengubah urutan proses. Urutan akan tersimpan otomatis.
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
