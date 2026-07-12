'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function ProduksiPreparePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('tgl_wo');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  // Modal states
  const [isReqMatrialModalOpen, setIsReqMatrialModalOpen] = useState(false);
  const [isReqSubcontModalOpen, setIsReqSubcontModalOpen] = useState(false);
  const [selectedWo, setSelectedWo] = useState(null);

  // Form states
  const [materialsList, setMaterialsList] = useState([]);
  const [prosesList, setProsesList] = useState([]);
  const [subcontsList, setSubcontsList] = useState([]);
  
  // Req Matrial form
  const [reqMaterials, setReqMaterials] = useState([]);
  const [matrialInput, setMatrialInput] = useState({ kdmatrial: '', qty: '' });
  const [isSubmittingMatrial, setIsSubmittingMatrial] = useState(false);
  // Req Subcont form
  const [reqSubconts, setReqSubconts] = useState([]);
  const [subcontInput, setSubcontInput] = useState({ kdproses: '', qty: '', note: '', subid: '' });
  const [isSubmittingSubcont, setIsSubmittingSubcont] = useState(false);

  // Start Production form
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [startPreviewData, setStartPreviewData] = useState(null);
  const [isSubmittingStart, setIsSubmittingStart] = useState(false);

  const loadFormDependencies = async () => {
    try {
      const [matRes, prosRes, subRes] = await Promise.all([
        api.get('/api/materials?limit=1000'),
        api.get('/api/proses?limit=1000'),
        api.get('/api/subconts?limit=1000')
      ]);
      setMaterialsList(matRes.data || []);
      setProsesList(prosRes.data || []);
      setSubcontsList(subRes.data || []);
    } catch (err) {
      console.error('Failed to load form dependencies', err);
    }
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
    loadFormDependencies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, page, sortBy, sortDir]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (page !== 1) setPage(1);
      else if (!isCheckingAuth) loadData();
    }, 500);
    return () => clearTimeout(delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/api/produksi/prepare?page=${page}&limit=10&search=${encodeURIComponent(search)}&sortBy=${sortBy}&sortDir=${sortDir}`);
      setData(res.data);
      setMeta(res.meta);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data prepare produksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span style={{ color: '#cbd5e1', marginLeft: '4px' }}>⇅</span>;
    return <span style={{ color: '#3b82f6', marginLeft: '4px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID');
  };

  const openReqMatrial = (wo) => {
    setSelectedWo(wo);
    setReqMaterials([]);
    setMatrialInput({ kdmatrial: '', qty: '' });
    setIsReqMatrialModalOpen(true);
  };

  const openReqSubcont = (wo) => {
    setSelectedWo(wo);
    setReqSubconts([]);
    setSubcontInput({ kdproses: '', qty: '', note: '', subid: '' });
    setIsReqSubcontModalOpen(true);
  };

  // --- Handlers for Req Matrial ---
  const handleAddMatrial = () => {
    if (!matrialInput.kdmatrial || !matrialInput.qty) return;
    const material = materialsList.find(m => m.kdmatrial === matrialInput.kdmatrial);
    setReqMaterials([...reqMaterials, { ...matrialInput, nmmatrial: material?.nmmatrial || '' }]);
    setMatrialInput({ kdmatrial: '', qty: '' });
  };
  const handleRemoveMatrial = (index) => {
    setReqMaterials(reqMaterials.filter((_, i) => i !== index));
  };
  const submitReqMatrial = async () => {
    if (reqMaterials.length === 0) return alert('Pilih minimal satu material');
    setIsSubmittingMatrial(true);
    try {
      await api.post('/api/produksi/prepare/reqmat', {
        wono: selectedWo.wo_no,
        materials: reqMaterials
      });
      setIsReqMatrialModalOpen(false);
      loadData();
    } catch (err) {
      alert('Gagal menyimpan Req Matrial');
    } finally {
      setIsSubmittingMatrial(false);
    }
  };

  // --- Handlers for Req Subcont ---
  const handleAddSubcont = () => {
    if (!subcontInput.kdproses || !subcontInput.qty) return;
    const proses = prosesList.find(p => p.kd_proses === subcontInput.kdproses);
    const subcont = subcontsList.find(s => s.id_sub === parseInt(subcontInput.subid));
    setReqSubconts([...reqSubconts, { ...subcontInput, nm_proses: proses?.nm_proses || '', nm_sub: subcont?.nm_sub || '' }]);
    setSubcontInput({ kdproses: '', qty: '', note: '', subid: '' });
  };
  const handleRemoveSubcont = (index) => {
    setReqSubconts(reqSubconts.filter((_, i) => i !== index));
  };
  const submitReqSubcont = async () => {
    if (reqSubconts.length === 0) return alert('Pilih minimal satu proses subcont');
    setIsSubmittingSubcont(true);
    try {
      await api.post('/api/produksi/prepare/reqsub', {
        wono: selectedWo.wo_no,
        itemcode: selectedWo.nodrawing,
        subconts: reqSubconts
      });
      setIsReqSubcontModalOpen(false);
      loadData();
    } catch (err) {
      alert('Gagal menyimpan Req Subcont');
    } finally {
      setIsSubmittingSubcont(false);
    }
  };

  // --- Handlers for Start Production ---
  const handleStartProduction = async (wo_no) => {
    try {
      const res = await api.get(`/api/produksi/prepare/start-preview/${wo_no}`);
      // api.get returns the JSON payload directly: { success: true, data: { wo, routing } }
      setStartPreviewData(res.data);
      setSelectedWo(res.data.wo);
      setIsStartModalOpen(true);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Gagal memuat data start produksi');
    }
  };

  const submitStartProduction = async () => {
    if (!confirm(`Yakin ingin memulai produksi untuk WO ${selectedWo?.wo_no}?`)) return;
    setIsSubmittingStart(true);
    try {
      await api.post('/api/produksi/prepare/start', { wono: selectedWo.wo_no });
      setIsStartModalOpen(false);
      alert('Produksi berhasil dimulai!');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memulai produksi');
    } finally {
      setIsSubmittingStart(false);
    }
  };

  if (isCheckingAuth) return null;

  return (
    <AppLayout user={user} onLogout={() => {
      localStorage.removeItem('satya_token');
      localStorage.removeItem('satya_user');
      router.push('/login');
    }}>
      <div className="container-fluid" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)' }}>Prepare Production</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>List WO New (qty &gt; pengurang)</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>{error}</div>
        )}

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
                    placeholder="Cari NO WO / Customer..."
                    style={{ paddingLeft: '38px' }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <tr>
                    <th onClick={() => handleSort('wo_no')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>NO WO<SortIcon col="wo_no" /></th>
                    <th onClick={() => handleSort('tgl_wo')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>WO Date<SortIcon col="tgl_wo" /></th>
                    <th onClick={() => handleSort('noso')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>NO SO<SortIcon col="noso" /></th>
                    <th onClick={() => handleSort('tglso')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>SO Date<SortIcon col="tglso" /></th>
                    <th onClick={() => handleSort('descrip')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Item<SortIcon col="descrip" /></th>
                    <th onClick={() => handleSort('nm_customer')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Customer<SortIcon col="nm_customer" /></th>
                    <th onClick={() => handleSort('qty')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right', whiteSpace: 'nowrap' }}>Qty<SortIcon col="qty" /></th>
                    <th style={{ textAlign: 'center' }}>Req. Matrial</th>
                    <th style={{ textAlign: 'center' }}>Req. Subcont</th>
                    <th style={{ textAlign: 'center' }}>Process Card</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="10" style={{ textAlign: 'center', padding: '40px' }}>Loading data...</td></tr>
                  ) : data.length === 0 ? (
                    <tr><td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Tidak ada data prepare</td></tr>
                  ) : (
                    data.map((row) => (
                      <tr key={row.wo_no}>
                        <td style={{ fontWeight: '600' }}>{row.wo_no}</td>
                        <td>{formatDate(row.tgl_wo)}</td>
                        <td>{row.noso || '-'}</td>
                        <td>{formatDate(row.tglso)}</td>
                        <td>{row.descrip || '-'}</td>
                        <td>{row.nm_customer || '-'}</td>
                        <td align="right" style={{ fontWeight: 'bold' }}>{row.qty}</td>
                        <td align="center">
                          {row.noreq ? (
                            <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: '12px' }}>{row.noreq}</button>
                          ) : (
                            <button className="btn btn-warning" onClick={() => openReqMatrial(row)} style={{ padding: '4px 8px' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            </button>
                          )}
                        </td>
                        <td align="center">
                          {row.noreq_sub ? (
                            <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: '12px' }}>{row.noreq_sub}</button>
                          ) : (
                            <button className="btn btn-warning" onClick={() => openReqSubcont(row)} style={{ padding: '4px 8px' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            </button>
                          )}
                        </td>
                        <td align="center">
                          {!row.kd_hdproses ? (
                            <button className="btn btn-default" style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', margin: '0 auto', backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #d1d5db' }} onClick={() => handleStartProduction(row.wo_no)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                              Start
                            </button>
                          ) : row.finishon ? (
                            // Selesai - hijau
                            <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', margin: '0 auto', backgroundColor: '#16a34a', color: 'white', border: 'none', cursor: 'pointer' }} onClick={() => window.open(`/produksi/prepare/print/${row.kd_hdproses}`, '_blank')}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                              {row.kd_hdproses}
                            </button>
                          ) : row.starton ? (
                            // Sudah mulai - kuning
                            <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', margin: '0 auto', backgroundColor: '#d97706', color: 'white', border: 'none', cursor: 'pointer' }} onClick={() => window.open(`/produksi/prepare/print/${row.kd_hdproses}`, '_blank')}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                              {row.kd_hdproses}
                            </button>
                          ) : (
                            // Belum mulai - abu (process card ada tapi belum di-start)
                            <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', margin: '0 auto', backgroundColor: '#6b7280', color: 'white', border: 'none', cursor: 'pointer' }} onClick={() => window.open(`/produksi/prepare/print/${row.kd_hdproses}`, '_blank')}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                              {row.kd_hdproses}
                            </button>
                          )}
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

      {/* Modal Req Matrial */}
      {isReqMatrialModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', margin: '20px', animation: 'slideUp 0.3s ease', maxHeight: '90vh', minHeight: '400px', overflowY: 'auto' }}>
            <div className="card-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                  Request Matrial
                </h2>
                <button onClick={() => setIsReqMatrialModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Pilih Material</label>
                    <select className="form-control" value={matrialInput.kdmatrial} onChange={(e) => setMatrialInput({ ...matrialInput, kdmatrial: e.target.value })}>
                      <option value="">-- Pilih Material --</option>
                      {materialsList.map(m => (
                        <option key={m.kdmatrial} value={m.kdmatrial}>{m.nmmatrial}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Qty</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="number" className="form-control" value={matrialInput.qty} onChange={(e) => setMatrialInput({ ...matrialInput, qty: e.target.value })} placeholder="0" />
                      <button className="btn btn-primary" onClick={handleAddMatrial}>Add</button>
                    </div>
                  </div>
                </div>

                <table className="table table-bordered">
                  <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <tr>
                      <th>Material</th>
                      <th>Qty</th>
                      <th style={{ width: '60px', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reqMaterials.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Belum ada material ditambahkan</td></tr>
                    ) : (
                      reqMaterials.map((rm, i) => (
                        <tr key={i}>
                          <td>{rm.nmmatrial}</td>
                          <td>{rm.qty}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn btn-danger" style={{ padding: '2px 8px' }} onClick={() => handleRemoveMatrial(i)}>Del</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '20px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsReqMatrialModalOpen(false)}>Tutup</button>
                <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={submitReqMatrial} disabled={isSubmittingMatrial}>
                  {isSubmittingMatrial ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Req Subcont */}
      {isReqSubcontModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', margin: '20px', animation: 'slideUp 0.3s ease', maxHeight: '90vh', minHeight: '400px', overflowY: 'auto' }}>
            <div className="card-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                  Request Subcont
                </h2>
                <button onClick={() => setIsReqSubcontModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Pilih Proses</label>
                    <select className="form-control" value={subcontInput.kdproses} onChange={(e) => setSubcontInput({ ...subcontInput, kdproses: e.target.value })}>
                      <option value="">-- Pilih Proses --</option>
                      {prosesList.map(p => (
                        <option key={p.kd_proses} value={p.kd_proses}>{p.nm_proses}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Pilih Subcont</label>
                    <select className="form-control" value={subcontInput.subid} onChange={(e) => setSubcontInput({ ...subcontInput, subid: e.target.value })}>
                      <option value="">-- Pilih Subcont --</option>
                      {subcontsList.map(s => (
                        <option key={s.id_sub} value={s.id_sub}>{s.nm_sub}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Catatan (Note)</label>
                    <input type="text" className="form-control" value={subcontInput.note} onChange={(e) => setSubcontInput({ ...subcontInput, note: e.target.value })} placeholder="Catatan opsional..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Qty</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="number" className="form-control" value={subcontInput.qty} onChange={(e) => setSubcontInput({ ...subcontInput, qty: e.target.value })} placeholder="0" />
                      <button className="btn btn-primary" onClick={handleAddSubcont}>Add</button>
                    </div>
                  </div>
                </div>

                <table className="table table-bordered">
                  <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <tr>
                      <th>Proses</th>
                      <th>Subcont</th>
                      <th>Catatan</th>
                      <th>Qty</th>
                      <th style={{ width: '60px', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reqSubconts.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Belum ada subcont ditambahkan</td></tr>
                    ) : (
                      reqSubconts.map((rs, i) => (
                        <tr key={i}>
                          <td>{rs.nm_proses}</td>
                          <td>{rs.nm_sub}</td>
                          <td>{rs.note || '-'}</td>
                          <td>{rs.qty}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn btn-danger" style={{ padding: '2px 8px' }} onClick={() => handleRemoveSubcont(i)}>Del</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '20px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsReqSubcontModalOpen(false)}>Tutup</button>
                <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={submitReqSubcont} disabled={isSubmittingSubcont}>
                  {isSubmittingSubcont ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Start Production */}
      {isStartModalOpen && startPreviewData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', margin: '20px', animation: 'slideUp 0.3s ease', maxHeight: '90vh', minHeight: '400px', overflowY: 'auto' }}>
            <div className="card-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                  Start To Produksi
                </h2>
                <button onClick={() => setIsStartModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div style={{ flex: 1 }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div className="card" style={{ boxShadow: 'none', border: '1px solid var(--bg-secondary)' }}>
                    <div className="card-body" style={{ padding: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '1px solid var(--bg-secondary)' }}>Detail WO</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '14px' }}>
                        <div style={{ color: 'var(--text-muted)' }}>S/O Number</div>
                        <div style={{ fontWeight: '500' }}>{startPreviewData.wo?.noso || '-'}</div>
                        <div style={{ color: 'var(--text-muted)' }}>W/O Number</div>
                        <div style={{ fontWeight: '500' }}>{startPreviewData.wo?.wo_no}</div>
                        <div style={{ color: 'var(--text-muted)' }}>Quantity</div>
                        <div style={{ fontWeight: '500' }}>{startPreviewData.wo?.qty}</div>
                        <div style={{ color: 'var(--text-muted)' }}>Request Date</div>
                        <div style={{ fontWeight: '500' }}>{formatDate(new Date().toISOString())}</div>
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ boxShadow: 'none', border: '1px solid var(--bg-secondary)' }}>
                    <div className="card-body" style={{ padding: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '1px solid var(--bg-secondary)' }}>View Detail Item</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '14px' }}>
                        <div style={{ color: 'var(--text-muted)' }}>Drawing Number</div>
                        <div style={{ fontWeight: '500' }}>{startPreviewData.wo?.nodrawing || '-'}</div>
                        <div style={{ color: 'var(--text-muted)' }}>Customer</div>
                        <div style={{ fontWeight: '500' }}>{startPreviewData.wo?.nm_customer || '-'}</div>
                        <div style={{ color: 'var(--text-muted)' }}>Sales</div>
                        <div style={{ fontWeight: '500' }}>{startPreviewData.wo?.nm_sales || '-'}</div>
                        <div style={{ color: 'var(--text-muted)' }}>Description</div>
                        <div style={{ fontWeight: '500' }}>{startPreviewData.wo?.descrip || '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Daftar Proses (Routing)</h3>
                <table className="table table-bordered">
                  <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <tr>
                      <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                      <th>Process Name</th>
                      <th>Leadtime (Per Pcs)</th>
                      <th>Total Time Est.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {startPreviewData.routing?.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Tidak ada data proses routing untuk item ini</td></tr>
                    ) : (
                      startPreviewData.routing?.map((r, i) => (
                        <tr key={i}>
                          <td style={{ textAlign: 'center' }}>{i + 1}</td>
                          <td>{r.nm_proses || r.kd_proses}</td>
                          <td>{r.time || 0} Menit</td>
                          <td style={{ fontWeight: '500' }}>{(r.time || 0) * (startPreviewData.wo?.qty || 0)} Menit</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '20px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsStartModalOpen(false)}>Batal</button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
                  onClick={submitStartProduction} 
                  disabled={isSubmittingStart || startPreviewData.routing?.length === 0}
                >
                  {isSubmittingStart ? 'Memproses...' : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Mulai Produksi (GO)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  );
}
