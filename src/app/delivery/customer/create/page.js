'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function CreateCustomerDeliveryPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [pendingFgs, setPendingFgs] = useState([]);
  const [selectedFgs, setSelectedFgs] = useState([]); // Array of fgcode
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingFgs, setLoadingFgs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [custSearch, setCustSearch] = useState('');
  const [isCustDropdownOpen, setIsCustDropdownOpen] = useState(false);

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
      fetchCustomers();
    }
  }, [isCheckingAuth]);

  useEffect(() => {
    if (!isCustDropdownOpen) return;
    const handleClose = () => setIsCustDropdownOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isCustDropdownOpen]);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchPendingFgs(selectedCustomerId);
    } else {
      setPendingFgs([]);
      setSelectedFgs([]);
    }
  }, [selectedCustomerId]);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const res = await api.get('/api/customers?limit=1000');
      // The API might return paging data
      setCustomers(res.data || []);
    } catch (err) {
      alert('Gagal memuat data pelanggan');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchPendingFgs = async (custId) => {
    try {
      setLoadingFgs(true);
      const res = await api.get(`/api/delivery/customer/pending/${custId}`);
      setPendingFgs(res.data || []);
      setSelectedFgs([]);
    } catch (err) {
      alert('Gagal memuat daftar barang ready kirim');
    } finally {
      setLoadingFgs(false);
    }
  };

  const handleCheckboxChange = (fgcode) => {
    setSelectedFgs(prev => 
      prev.includes(fgcode) 
        ? prev.filter(c => c !== fgcode) 
        : [...prev, fgcode]
    );
  };

  const handleSelectAllChange = (e) => {
    if (e.target.checked) {
      setSelectedFgs(pendingFgs.map(item => item.fgcode));
    } else {
      setSelectedFgs([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) return alert('Pilih Pelanggan Terlebih Dahulu!');
    if (selectedFgs.length === 0) return alert('Pilih minimal satu item barang untuk dikirim!');

    setIsSubmitting(true);
    try {
      const itemsToSubmit = pendingFgs
        .filter(item => selectedFgs.includes(item.fgcode))
        .map(item => ({
          fgcode: item.fgcode,
          qty: item.qty,
          nodrawing: item.nodrawing
        }));

      await api.post('/api/delivery/customer', {
        customer_id: selectedCustomerId,
        deldate: form.deldate,
        nosj: form.nosj,
        items: itemsToSubmit
      });

      alert('Surat Jalan pengiriman pelanggan berhasil diterbitkan!');
      router.push('/delivery/customer');
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan pengiriman');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.nm_customer?.toLowerCase().includes(custSearch.toLowerCase())
  );
  
  const selectedCustomerName = customers.find(c => c.id_customer.toString() === selectedCustomerId.toString())?.nm_customer || '';

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
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)' }}>Buat Surat Jalan Pengiriman</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Pilih Pelanggan dan Item Finish Goods yang akan dikirim</p>
          </div>
          <button className="btn btn-default" onClick={() => router.push('/delivery/customer')}>
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
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Customer / Pelanggan <span style={{ color: 'red' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ketik untuk mencari customer..."
                        value={isCustDropdownOpen ? custSearch : selectedCustomerName}
                        onChange={(e) => {
                          setCustSearch(e.target.value);
                          if (!isCustDropdownOpen) setIsCustDropdownOpen(true);
                        }}
                        onFocus={() => {
                          setCustSearch('');
                          setIsCustDropdownOpen(true);
                        }}
                        style={{ paddingRight: '30px' }}
                        disabled={loadingCustomers}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '11px' }}>▼</span>
                    </div>

                    {isCustDropdownOpen && (
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
                        {filteredCustomers.length === 0 ? (
                          <div style={{ padding: '10px 14px', color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>
                            Tidak ada customer ditemukan
                          </div>
                        ) : (
                          filteredCustomers.map(c => (
                            <div 
                              key={c.id_customer}
                              onClick={() => {
                                setSelectedCustomerId(c.id_customer.toString());
                                setCustSearch('');
                                setIsCustDropdownOpen(false);
                              }}
                              style={{
                                padding: '10px 14px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#334155',
                                backgroundColor: selectedCustomerId.toString() === c.id_customer.toString() ? '#f1f5f9' : 'transparent',
                                borderBottom: '1px solid #f1f5f9'
                              }}
                            >
                              {c.nm_customer}
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

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px', fontWeight: '600' }} disabled={isSubmitting || selectedFgs.length === 0}>
                {isSubmitting ? 'Menyimpan...' : `Kirim ${selectedFgs.length} Item Selected`}
              </button>
            </div>

            {/* Right Side: Select FG Items */}
            <div className="card">
              <div className="card-header" style={{ fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Pilih Barang Jadi (Finish Goods)</span>
                {pendingFgs.length > 0 && (
                  <label style={{ margin: 0, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedFgs.length === pendingFgs.length} 
                      onChange={handleSelectAllChange} 
                    />
                    Pilih Semua
                  </label>
                )}
              </div>
              <div className="card-body" style={{ padding: '18px' }}>
                {!selectedCustomerId ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    Silakan pilih pelanggan terlebih dahulu untuk menampilkan daftar barang siap kirim.
                  </div>
                ) : loadingFgs ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    Memuat barang siap kirim...
                  </div>
                ) : pendingFgs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Tidak ada barang jadi (Finished Goods) yang siap dikirim untuk pelanggan ini.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th style={{ width: '40px', textSort: 'center' }}>Pilih</th>
                          <th>FG Code</th>
                          <th>Date</th>
                          <th>No WO</th>
                          <th>No SO</th>
                          <th>Drawing Item</th>
                          <th style={{ textAlign: 'right' }}>Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingFgs.map((item) => (
                          <tr key={item.fgcode} style={{ cursor: 'pointer' }} onClick={() => handleCheckboxChange(item.fgcode)}>
                            <td align="center" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={selectedFgs.includes(item.fgcode)} 
                                onChange={() => handleCheckboxChange(item.fgcode)} 
                              />
                            </td>
                            <td style={{ fontWeight: '500', color: '#16a34a' }}>{item.fgcode}</td>
                            <td>{new Date(item.fgdate).toLocaleDateString('id-ID')}</td>
                            <td style={{ fontWeight: '500' }}>{item.wo_no}</td>
                            <td>{item.noso || '-'}</td>
                            <td>
                              <strong style={{ display: 'block', fontSize: '13px' }}>{item.nodrawing}</strong>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.descrip}</span>
                            </td>
                            <td align="right" style={{ fontWeight: 'bold' }}>{item.qty} PCS</td>
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
