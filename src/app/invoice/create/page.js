'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function CreateInvoicePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [pendingItems, setPendingItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]); // Array of notrans
  const [itemPrices, setItemPrices] = useState({}); // maps notrans -> price
  const [itemQtys, setItemQtys] = useState({}); // maps notrans -> qty
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [custSearch, setCustSearch] = useState('');
  const [isCustDropdownOpen, setIsCustDropdownOpen] = useState(false);

  // Form Fields
  const [form, setForm] = useState({
    invdate: new Date().toISOString().slice(0, 10),
    noaccurate: ''
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
    if (!isCustDropdownOpen) return;
    const handleClose = () => setIsCustDropdownOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isCustDropdownOpen]);

  useEffect(() => {
    if (!isCheckingAuth) {
      fetchCustomers();
    }
  }, [isCheckingAuth]);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchPendingItems(selectedCustomerId);
    } else {
      setPendingItems([]);
      setSelectedItemIds([]);
    }
  }, [selectedCustomerId]);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const res = await api.get('/api/customers?limit=1000');
      setCustomers(res.data || []);
    } catch (err) {
      alert('Gagal memuat data pelanggan');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchPendingItems = async (custId) => {
    try {
      setLoadingItems(true);
      const res = await api.get(`/api/invoice/pending/${custId}`);
      const items = res.data || [];
      setPendingItems(items);
      setSelectedItemIds([]);
      
      // Initialize price and qty map
      const priceMap = {};
      const qtyMap = {};
      items.forEach(item => {
        priceMap[item.notrans] = item.price || 0;
        qtyMap[item.notrans] = item.qty || 0; // Default to delivered quantity
      });
      setItemPrices(priceMap);
      setItemQtys(qtyMap);
    } catch (err) {
      alert('Gagal memuat daftar item pengiriman ready tagih');
    } finally {
      setLoadingItems(false);
    }
  };

  const handleCheckboxChange = (notrans) => {
    setSelectedItemIds(prev => 
      prev.includes(notrans) 
        ? prev.filter(id => id !== notrans) 
        : [...prev, notrans]
    );
  };

  const handleSelectAllChange = (e) => {
    if (e.target.checked) {
      setSelectedItemIds(pendingItems.map(item => item.notrans));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handlePriceChange = (notrans, val) => {
    setItemPrices(prev => ({
      ...prev,
      [notrans]: parseInt(val) || 0
    }));
  };

  const handleQtyChange = (notrans, originalQty, val) => {
    const enteredQty = parseInt(val) || 0;
    if (enteredQty > originalQty) {
      alert(`Kuantitas tagih tidak boleh melebihi kuantitas kirim (${originalQty} PCS)`);
      return;
    }
    setItemQtys(prev => ({
      ...prev,
      [notrans]: enteredQty
    }));
  };

  // Calculate live total
  const calculateTotal = () => {
    return selectedItemIds.reduce((sum, notrans) => {
      const price = itemPrices[notrans] || 0;
      const qty = itemQtys[notrans] || 0;
      return sum + (price * qty);
    }, 0);
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) return alert('Pilih Pelanggan Terlebih Dahulu!');
    if (selectedItemIds.length === 0) return alert('Pilih minimal satu item pengiriman untuk ditagih!');

    // Check qty validations
    for (const notrans of selectedItemIds) {
      const item = pendingItems.find(i => i.notrans === notrans);
      const qtyToInvoice = itemQtys[notrans] || 0;
      if (qtyToInvoice <= 0) {
        return alert(`Kuantitas tagih untuk Surat Jalan ${item.nodel} (Item: ${item.nodrawing}) harus lebih besar dari 0!`);
      }
    }

    setIsSubmitting(true);
    try {
      const itemsToSubmit = pendingItems
        .filter(item => selectedItemIds.includes(item.notrans))
        .map(item => ({
          notrans: item.notrans,
          wonumber: item.wo_no,
          qty: itemQtys[item.notrans],
          price: itemPrices[item.notrans],
          nodrawing: item.nodrawing
        }));

      await api.post('/api/invoice', {
        customer_id: selectedCustomerId,
        invdate: form.invdate,
        noaccurate: form.noaccurate,
        total_hrg: calculateTotal(),
        items: itemsToSubmit
      });

      alert('Invoice berhasil diterbitkan!');
      router.push('/invoice');
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan invoice');
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
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)' }}>Buat Invoice Baru</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Pilih Pelanggan dan Item Pengiriman yang siap ditagih</p>
          </div>
          <button className="btn btn-default" onClick={() => router.push('/invoice')}>
            Batal
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
            
            {/* Left Side Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card">
                <div className="card-header" style={{ fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', padding: '14px 18px' }}>
                  Informasi Invoice
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
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Tanggal Invoice <span style={{ color: 'red' }}>*</span></label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={form.invdate} 
                      onChange={(e) => setForm({ ...form, invdate: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>No Invoice Accurate</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Masukkan No Invoice Accurate..."
                      value={form.noaccurate} 
                      onChange={(e) => setForm({ ...form, noaccurate: e.target.value })} 
                    />
                  </div>
                  
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Total Tagihan:</span>
                      <strong style={{ color: '#10b981', fontSize: '20px' }}>{formatCurrency(calculateTotal())}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px', fontWeight: '600', backgroundColor: '#10b981', borderColor: '#10b981' }} disabled={isSubmitting || selectedItemIds.length === 0}>
                {isSubmitting ? 'Menyimpan...' : `Simpan Invoice (${selectedItemIds.length} Item)`}
              </button>
            </div>

            {/* Right Side: Select Delivery items */}
            <div className="card">
              <div className="card-header" style={{ fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Pilih Item Surat Jalan untuk Ditagih</span>
                {pendingItems.length > 0 && (
                  <label style={{ margin: 0, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedItemIds.length === pendingItems.length} 
                      onChange={handleSelectAllChange} 
                    />
                    Pilih Semua
                  </label>
                )}
              </div>
              <div className="card-body" style={{ padding: '18px' }}>
                {!selectedCustomerId ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    Silakan pilih pelanggan terlebih dahulu untuk menampilkan daftar barang siap tagih.
                  </div>
                ) : loadingItems ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    Memuat barang siap tagih...
                  </div>
                ) : pendingItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Tidak ada surat jalan pengiriman yang siap ditagih untuk pelanggan ini.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th style={{ width: '40px', textAlign: 'center' }}>Pilih</th>
                          <th>No SJ</th>
                          <th>No WO</th>
                          <th>No SO</th>
                          <th>Drawing Item</th>
                          <th style={{ width: '130px', textAlign: 'right' }}>Qty Tagih</th>
                          <th style={{ width: '160px', textAlign: 'right' }}>Harga Satuan</th>
                          <th style={{ width: '160px', textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingItems.map((item) => {
                          const isSelected = selectedItemIds.includes(item.notrans);
                          const currentQty = itemQtys[item.notrans] || 0;
                          const currentPrice = itemPrices[item.notrans] || 0;
                          const subtotal = currentQty * currentPrice;

                          return (
                            <tr key={item.notrans} style={{ cursor: 'pointer', backgroundColor: isSelected ? '#f0fdf4' : '' }} onClick={() => handleCheckboxChange(item.notrans)}>
                              <td align="center" onClick={(e) => e.stopPropagation()}>
                                <input 
                                  type="checkbox" 
                                  checked={isSelected} 
                                  onChange={() => handleCheckboxChange(item.notrans)} 
                                />
                              </td>
                              <td style={{ fontWeight: '500', color: '#3b82f6' }}>{item.nodel}</td>
                              <td style={{ fontWeight: '500' }}>{item.wo_no}</td>
                              <td>{item.noso || '-'}</td>
                              <td>
                                <strong style={{ display: 'block', fontSize: '13px' }}>{item.nodrawing}</strong>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.descrip || '-'}</span>
                              </td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <input 
                                    type="number" 
                                    className="form-control" 
                                    style={{ padding: '4px 8px', height: '32px', textAlign: 'right', fontWeight: 'bold' }} 
                                    value={currentQty} 
                                    onChange={(e) => handleQtyChange(item.notrans, item.qty, e.target.value)} 
                                    min="1"
                                    max={item.qty}
                                    disabled={!isSelected}
                                  />
                                  <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>/ {item.qty} PCS</span>
                                </div>
                              </td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '12px', color: '#64748b' }}>Rp</span>
                                  <input 
                                    type="number" 
                                    className="form-control" 
                                    style={{ padding: '4px 8px', height: '32px', textAlign: 'right' }} 
                                    value={currentPrice} 
                                    onChange={(e) => handlePriceChange(item.notrans, e.target.value)} 
                                    min="0"
                                    disabled={!isSelected}
                                  />
                                </div>
                              </td>
                              <td align="right" style={{ fontWeight: 'bold', color: isSelected ? '#16a34a' : 'var(--text-main)' }}>
                                {formatCurrency(subtotal)}
                              </td>
                            </tr>
                          );
                        })}
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
