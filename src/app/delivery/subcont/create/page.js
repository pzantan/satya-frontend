'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function CreateSubcontDeliveryPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [subconts, setSubconts] = useState([]);
  const [selectedSubcontId, setSelectedSubcontId] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequests, setSelectedRequests] = useState([]); // Array of idtrans
  const [loadingSubconts, setLoadingSubconts] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [subSearch, setSubSearch] = useState('');
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);

  // Form Fields
  const [form, setForm] = useState({
    deldate: new Date().toISOString().slice(0, 10),
    nosj: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('satya_token');
    const userData = localStorage.getItem('satya_user');
    if (!token) {
      router.push('/login');
      return;
    }
    if (userData) setUser(JSON.parse(userData));
    setIsCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    if (!isCheckingAuth) {
      fetchSubconts();
    }
  }, [isCheckingAuth]);

  useEffect(() => {
    if (!isSubDropdownOpen) return;
    const handleClose = () => setIsSubDropdownOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isSubDropdownOpen]);

  useEffect(() => {
    if (selectedSubcontId) {
      fetchPendingRequests(selectedSubcontId);
    } else {
      setPendingRequests([]);
      setSelectedRequests([]);
    }
  }, [selectedSubcontId]);

  const fetchSubconts = async () => {
    try {
      setLoadingSubconts(true);
      const res = await api.get('/api/subconts?limit=1000');
      setSubconts(res.data || []);
    } catch (err) {
      alert('Gagal memuat data subkontraktor');
    } finally {
      setLoadingSubconts(false);
    }
  };

  const fetchPendingRequests = async (subId) => {
    try {
      setLoadingRequests(true);
      const res = await api.get(`/api/delivery/subcont/pending/${subId}`);
      setPendingRequests(res.data || []);
      setSelectedRequests([]);
    } catch (err) {
      alert('Gagal memuat daftar request subcont ready kirim');
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleCheckboxChange = (idtrans) => {
    setSelectedRequests(prev => 
      prev.includes(idtrans) 
        ? prev.filter(c => c !== idtrans) 
        : [...prev, idtrans]
    );
  };

  const handleSelectAllChange = (e) => {
    if (e.target.checked) {
      setSelectedRequests(pendingRequests.map(item => item.idtrans));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubcontId) return alert('Pilih Subkontraktor Terlebih Dahulu!');
    if (selectedRequests.length === 0) return alert('Pilih minimal satu item pekerjaan untuk dikirim!');

    setIsSubmitting(true);
    try {
      const itemsToSubmit = pendingRequests
        .filter(item => selectedRequests.includes(item.idtrans))
        .map(item => ({
          idtrans: item.idtrans
        }));

      await api.post('/api/delivery/subcont', {
        subcont_id: selectedSubcontId,
        deldate: form.deldate,
        nosj: form.nosj,
        items: itemsToSubmit
      });

      alert('Surat Jalan pengiriman subkontraktor berhasil diterbitkan!');
      router.push('/delivery/subcont');
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan pengiriman subkontraktor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSubconts = subconts.filter(s => 
    s.nm_sub?.toLowerCase().includes(subSearch.toLowerCase())
  );
  
  const selectedSubcontName = subconts.find(s => s.id_sub.toString() === selectedSubcontId.toString())?.nm_sub || '';

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
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)' }}>Buat Surat Jalan Subcont</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Kirim Pekerjaan atau Material ke Supplier Subkontraktor</p>
          </div>
          <button className="btn btn-default" onClick={() => router.push('/delivery/subcont')}>
            Batal
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
            
            {/* Left Side Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card">
                <div className="card-header" style={{ fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', padding: '14px 18px' }}>
                  Informasi Pengiriman
                </div>
                <div className="card-body" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group" style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Subkontraktor / Supplier <span style={{ color: 'red' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ketik untuk mencari supplier..."
                        value={isSubDropdownOpen ? subSearch : selectedSubcontName}
                        onChange={(e) => {
                          setSubSearch(e.target.value);
                          if (!isSubDropdownOpen) setIsSubDropdownOpen(true);
                        }}
                        onFocus={() => {
                          setSubSearch('');
                          setIsSubDropdownOpen(true);
                        }}
                        style={{ paddingRight: '30px' }}
                        disabled={loadingSubconts}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '11px' }}>▼</span>
                    </div>

                    {isSubDropdownOpen && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        zIndex: 1000,
                        maxHeight: '220px',
                        overflowY: 'auto',
                        marginTop: '4px'
                      }}>
                        {filteredSubconts.length === 0 ? (
                          <div style={{ padding: '10px 14px', color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>
                            Tidak ada supplier ditemukan
                          </div>
                        ) : (
                          filteredSubconts.map(s => (
                            <div 
                              key={s.id_sub}
                              onClick={() => {
                                setSelectedSubcontId(s.id_sub.toString());
                                setSubSearch('');
                                setIsSubDropdownOpen(false);
                              }}
                              style={{
                                padding: '10px 14px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#334155',
                                backgroundColor: selectedSubcontId.toString() === s.id_sub.toString() ? '#f1f5f9' : 'transparent',
                                borderBottom: '1px solid #f1f5f9'
                              }}
                            >
                              {s.nm_sub}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Tanggal Kirim <span style={{ color: 'red' }}>*</span></label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={form.deldate} 
                      onChange={(e) => setForm({ ...form, deldate: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>No SJ Accurate</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Masukkan No SJ Accurate..."
                      value={form.nosj} 
                      onChange={(e) => setForm({ ...form, nosj: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px', fontWeight: '600', backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }} disabled={isSubmitting || selectedRequests.length === 0}>
                {isSubmitting ? 'Menyimpan...' : `Kirim ${selectedRequests.length} Pekerjaan Selected`}
              </button>
            </div>

            {/* Right Side: Select Request Items */}
            <div className="card">
              <div className="card-header" style={{ fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Pilih Permintaan Subcont (Material/Pekerjaan)</span>
                {pendingRequests.length > 0 && (
                  <label style={{ margin: 0, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedRequests.length === pendingRequests.length} 
                      onChange={handleSelectAllChange} 
                    />
                    Pilih Semua
                  </label>
                )}
              </div>
              <div className="card-body" style={{ padding: '18px' }}>
                {!selectedSubcontId ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    Silakan pilih subkontraktor terlebih dahulu untuk menampilkan daftar pekerjaan ready kirim.
                  </div>
                ) : loadingRequests ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    Memuat barang/pekerjaan ready kirim...
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Tidak ada transaksi/pekerjaan subkontraktor yang siap dikirim untuk vendor ini.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th style={{ width: '40px', textAlign: 'center' }}>Pilih</th>
                          <th>Req Sub No</th>
                          <th>No WO</th>
                          <th>Proses</th>
                          <th>Item / Drawing</th>
                          <th style={{ textAlign: 'right' }}>Qty</th>
                          <th style={{ textAlign: 'right' }}>Estimasi Harga</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingRequests.map((item) => (
                          <tr key={item.idtrans} style={{ cursor: 'pointer' }} onClick={() => handleCheckboxChange(item.idtrans)}>
                            <td align="center" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={selectedRequests.includes(item.idtrans)} 
                                onChange={() => handleCheckboxChange(item.idtrans)} 
                              />
                            </td>
                            <td style={{ fontWeight: '500', color: '#8b5cf6' }}>{item.noreq_sub}</td>
                            <td style={{ fontWeight: '500' }}>{item.wo_no}</td>
                            <td>{item.kdproses}</td>
                            <td>
                              <strong style={{ display: 'block', fontSize: '13px' }}>{item.nodrawing}</strong>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.descrip || '-'}</span>
                            </td>
                            <td align="right" style={{ fontWeight: 'bold' }}>{item.qty} PCS</td>
                            <td align="right" style={{ color: '#2563eb' }}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.harga)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>
        </form>
      </div>
    </AppLayout>
  );
}
