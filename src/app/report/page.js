'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function ReportPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Active Report Tab: 'oc' (Order Customer), 'general', 'invoice', 'coating', 'coating_list', 'fg'
  const [activeReport, setActiveReport] = useState('oc');

  // Filter States
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [bulan, setBulan] = useState((new Date().getMonth() + 1).toString());
  const [date1, setDate1] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [date2, setDate2] = useState(new Date().toISOString().split('T')[0]);
  const [selCust, setSelCust] = useState('');
  const [selSales, setSelSales] = useState('');

  // Dropdown lists
  const [customerList, setCustomerList] = useState([]);
  const [salesList, setSalesList] = useState([]);

  // Data States
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Drill-down Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('satya_token');
    const userData = localStorage.getItem('satya_user');
    if (!token) {
      router.push('/login');
      return;
    }
    if (userData) setUser(JSON.parse(userData));
    setIsCheckingAuth(false);

    // Fetch lists
    fetchDropdowns();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch report data when active report tab or query is changed
  useEffect(() => {
    if (!isCheckingAuth) {
      loadReport();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReport]);

  const fetchDropdowns = async () => {
    try {
      const custRes = await api.get('/api/customers?limit=200');
      setCustomerList(custRes.data || []);
      const salesRes = await api.get('/api/sales');
      setSalesList(salesRes.data || []);
    } catch (err) {
      console.error('Error fetching filter dropdowns:', err);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    setReportData([]);
    try {
      let endpoint = '';
      if (activeReport === 'oc') {
        endpoint = `/api/report/order-customer?tahun=${tahun}`;
      } else if (activeReport === 'general') {
        endpoint = `/api/report/general?date1=${date1}&date2=${date2}&customerId=${selCust}&salesId=${selSales}`;
      } else if (activeReport === 'invoice') {
        endpoint = `/api/report/invoice?tahun=${tahun}&bulan=${bulan}&customerId=${selCust}&salesId=${selSales}`;
      } else if (activeReport === 'coating') {
        endpoint = `/api/report/coating?tahun=${tahun}&bulan=${bulan}&customerId=${selCust}`;
      } else if (activeReport === 'coating_list') {
        endpoint = `/api/report/coating-list?date1=${date1}&date2=${date2}`;
      } else if (activeReport === 'fg') {
        endpoint = `/api/report/fg?date1=${date1}&date2=${date2}`;
      }

      const res = await api.get(endpoint);
      setReportData(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  // Drill down functions
  const openOcDetail = async (custId, custName, blnIdx) => {
    setModalTitle(`Detail Order - ${custName} (${blnIdx}/${tahun})`);
    setModalData([]);
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const res = await api.get(`/api/report/order-customer/detail?tahun=${tahun}&bulan=${blnIdx}&customerId=${custId}`);
      setModalData(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Gagal memuat rincian data order');
    } finally {
      setModalLoading(false);
    }
  };

  const openGeneralDetail = async (custId, custName) => {
    setModalTitle(`Detail Summary - ${custName} (${date1} s/d ${date2})`);
    setModalData([]);
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const res = await api.get(`/api/report/general/detail?date1=${date1}&date2=${date2}&customerId=${custId}`);
      setModalData(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Gagal memuat rincian summary general');
    } finally {
      setModalLoading(false);
    }
  };

  // Helper formatter
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (isCheckingAuth) return null;

  return (
    <AppLayout user={user} onLogout={() => {
      localStorage.removeItem('satya_token');
      localStorage.removeItem('satya_user');
      router.push('/login');
    }}>
      <div className="container-fluid" style={{ padding: '24px' }}>
        
        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-main)' }}>
            ERP Reports
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Kelola analisis transaksi, matriks order, dan barang jadi</p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '24px' }}>
          <button className={`btn ${activeReport === 'oc' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveReport('oc')}>Order Customer Matrix</button>
          <button className={`btn ${activeReport === 'general' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveReport('general')}>General Summary</button>
          <button className={`btn ${activeReport === 'invoice' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveReport('invoice')}>Invoice Report</button>
          <button className={`btn ${activeReport === 'coating' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveReport('coating')}>Coating Summary</button>
          <button className={`btn ${activeReport === 'coating_list' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveReport('coating_list')}>Coating List</button>
          <button className={`btn ${activeReport === 'fg' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveReport('fg')}>Finished Goods (FG)</button>
        </div>

        {/* Filter Card */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0' }}>Filter Laporan</h3>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              
              {/* Year Select (for monthly reports) */}
              {(activeReport === 'oc' || activeReport === 'invoice' || activeReport === 'coating') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500' }}>Tahun</label>
                  <select className="form-control" value={tahun} onChange={(e) => setTahun(e.target.value)}>
                    {Array.from({ length: 15 }, (_, i) => 2016 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Month Select (for invoice/coating) */}
              {(activeReport === 'invoice' || activeReport === 'coating') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500' }}>Bulan</label>
                  <select className="form-control" value={bulan} onChange={(e) => setBulan(e.target.value)}>
                    {[
                      { v: '1', n: 'Jan' }, { v: '2', n: 'Feb' }, { v: '3', n: 'Mar' },
                      { v: '4', n: 'Apr' }, { v: '5', n: 'May' }, { v: '6', n: 'Jun' },
                      { v: '7', n: 'Jul' }, { v: '8', n: 'Aug' }, { v: '9', n: 'Sep' },
                      { v: '10', n: 'Oct' }, { v: '11', n: 'Nov' }, { v: '12', n: 'Des' }
                    ].map(m => (
                      <option key={m.v} value={m.v}>{m.n}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date From & To (for date range reports) */}
              {(activeReport === 'general' || activeReport === 'coating_list' || activeReport === 'fg') && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '150px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '500' }}>Dari Tanggal</label>
                    <input type="date" className="form-control" value={date1} onChange={(e) => setDate1(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '150px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '500' }}>Sampai Tanggal</label>
                    <input type="date" className="form-control" value={date2} onChange={(e) => setDate2(e.target.value)} />
                  </div>
                </>
              )}

              {/* Customer Filter */}
              {(activeReport === 'general' || activeReport === 'invoice' || activeReport === 'coating') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '220px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500' }}>Customer</label>
                  <select className="form-control" value={selCust} onChange={(e) => setSelCust(e.target.value)}>
                    <option value="">Semua Customer</option>
                    {customerList.map(c => (
                      <option key={c.id_customer} value={c.id_customer}>{c.nm_customer}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sales Filter */}
              {(activeReport === 'general' || activeReport === 'invoice') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '180px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500' }}>Sales</label>
                  <select className="form-control" value={selSales} onChange={(e) => setSelSales(e.target.value)}>
                    <option value="">Semua Sales</option>
                    {salesList.map(s => (
                      <option key={s.id_sales} value={s.id_sales}>{s.nm_sales}</option>
                    ))}
                  </select>
                </div>
              )}

              <button className="btn btn-primary" onClick={loadReport} disabled={loading} style={{ height: '38px', minWidth: '100px' }}>
                {loading ? 'Loading...' : 'Terapkan Filter'}
              </button>
            </div>
          </div>
        </div>

        {/* Report Content Table */}
        <div className="card">
          <div className="card-body">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Sedang memuat data laporan...</div>
            ) : reportData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Tidak ada data laporan ditemukan untuk kriteria filter saat ini.</div>
            ) : (
              <div className="table-responsive">
                
                {/* 1. RENDER MATRIX ORDER CUSTOMER */}
                {activeReport === 'oc' && (() => {
                  const activeOcData = reportData.filter(row => row.total > 0);
                  if (activeOcData.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                        Tidak ada customer dengan data order untuk tahun ini.
                      </div>
                    );
                  }
                  return (
                    <div style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                      <table className="table table-bordered table-hover" style={{ fontSize: '13px', margin: 0, borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 30 }}>
                          <tr style={{ backgroundColor: '#f8fafc' }}>
                            <th style={{ 
                              position: 'sticky', 
                              top: 0, 
                              left: 0, 
                              backgroundColor: '#f8fafc', 
                              zIndex: 40, 
                              borderRight: '2px solid #cbd5e1',
                              borderBottom: '2px solid #cbd5e1'
                            }}>
                              Nama Customer
                            </th>
                            {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map(m => (
                              <th key={m} style={{ 
                                position: 'sticky', 
                                top: 0, 
                                backgroundColor: '#f8fafc', 
                                zIndex: 30, 
                                textAlign: 'right', 
                                minWidth: '95px',
                                borderBottom: '2px solid #cbd5e1'
                              }}>
                                {m}
                              </th>
                            ))}
                            <th style={{ 
                              position: 'sticky', 
                              top: 0, 
                              backgroundColor: '#f8fafc', 
                              zIndex: 30, 
                              textAlign: 'right', 
                              minWidth: '110px', 
                              fontWeight: 'bold',
                              borderBottom: '2px solid #cbd5e1'
                            }}>
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeOcData.map((row) => (
                            <tr key={row.id_customer}>
                              <td style={{ 
                                position: 'sticky', 
                                left: 0, 
                                backgroundColor: '#fff', 
                                zIndex: 20, 
                                borderRight: '2px solid #cbd5e1',
                                fontWeight: '600'
                              }}>
                                {row.nm_customer}
                              </td>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                                const val = row[`bln${m}`] || 0;
                                return (
                                  <td key={m} align="right">
                                    {val > 0 ? (
                                      <span 
                                        onClick={() => openOcDetail(row.id_customer, row.nm_customer, m)}
                                        style={{ color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline', fontWeight: '500' }}
                                      >
                                        {formatCurrency(val)}
                                      </span>
                                    ) : '-'}
                                  </td>
                                );
                              })}
                              <td align="right" style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>{formatCurrency(row.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 30 }}>
                          <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>
                            <td style={{ 
                              position: 'sticky', 
                              bottom: 0, 
                              left: 0, 
                              backgroundColor: '#f1f5f9', 
                              zIndex: 40, 
                              borderRight: '2px solid #cbd5e1',
                              borderTop: '2px solid #cbd5e1'
                            }}>
                              Grand Total
                            </td>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                              const mTotal = activeOcData.reduce((acc, row) => acc + (row[`bln${m}`] || 0), 0);
                              return (
                                <td key={m} align="right" style={{ borderTop: '2px solid #cbd5e1', backgroundColor: '#f1f5f9' }}>
                                  {formatCurrency(mTotal)}
                                </td>
                              );
                            })}
                            <td align="right" style={{ borderTop: '2px solid #cbd5e1', backgroundColor: '#f1f5f9' }}>
                              {formatCurrency(activeOcData.reduce((acc, row) => acc + row.total, 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  );
                })()}

                {/* 2. RENDER GENERAL REPORT SUMMARY */}
                {activeReport === 'general' && (
                  <table className="table table-bordered table-hover" style={{ fontSize: '13px' }}>
                    <thead style={{ backgroundColor: '#f8fafc' }}>
                      <tr>
                        <th>Sales / Customer</th>
                        <th style={{ textAlign: 'right' }}>Total WO</th>
                        <th style={{ textAlign: 'right' }}>Balance WO</th>
                        <th style={{ textAlign: 'right' }}>Invoice</th>
                        <th style={{ textAlign: 'right' }}>Terkirim Belum Inv</th>
                        <th style={{ textAlign: 'right' }}>Delivered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((salesGroup) => (
                        <Fragment key={`sales-general-${salesGroup.id_sales}`}>
                          {/* Sales Header Row */}
                          <tr key={`sales-${salesGroup.id_sales}`} style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>
                            <td>👤 Sales: {salesGroup.nm_sales}</td>
                            <td align="right">{formatCurrency(salesGroup.jumlah)}</td>
                            <td align="right">{formatCurrency(salesGroup.balance)}</td>
                            <td align="right">{formatCurrency(salesGroup.jumlah_inv)}</td>
                            <td align="right">{formatCurrency(salesGroup.delbeluminv)}</td>
                            <td align="right">{formatCurrency(salesGroup.delev)}</td>
                          </tr>
                          {/* Customers under Sales Row */}
                          {salesGroup.customers.map((cust) => (
                            <tr key={`cust-${salesGroup.id_sales}-${cust.id_customer}`}>
                              <td style={{ paddingLeft: '24px' }}>
                                <span 
                                  onClick={() => openGeneralDetail(cust.id_customer, cust.nm_customer)}
                                  style={{ color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                  🏢 {cust.nm_customer}
                                </span>
                              </td>
                              <td align="right">{formatCurrency(cust.jumlah)}</td>
                              <td align="right">{formatCurrency(cust.balance)}</td>
                              <td align="right">{formatCurrency(cust.jumlah_inv)}</td>
                              <td align="right">{formatCurrency(cust.delbeluminv)}</td>
                              <td align="right">{formatCurrency(cust.delev)}</td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                    <tfoot style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
                      <tr>
                        <td>Grand Total</td>
                        <td align="right">{formatCurrency(reportData.reduce((acc, sg) => acc + sg.jumlah, 0))}</td>
                        <td align="right">{formatCurrency(reportData.reduce((acc, sg) => acc + sg.balance, 0))}</td>
                        <td align="right">{formatCurrency(reportData.reduce((acc, sg) => acc + sg.jumlah_inv, 0))}</td>
                        <td align="right">{formatCurrency(reportData.reduce((acc, sg) => acc + sg.delbeluminv, 0))}</td>
                        <td align="right">{formatCurrency(reportData.reduce((acc, sg) => acc + sg.delev, 0))}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}

                {/* 3. RENDER INVOICE REPORT */}
                {activeReport === 'invoice' && (
                  <table className="table table-bordered table-hover" style={{ fontSize: '13px' }}>
                    <thead style={{ backgroundColor: '#f8fafc' }}>
                      <tr>
                        <th>Sales / Customer</th>
                        <th style={{ textAlign: 'right', width: '250px' }}>Total Tagihan Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((salesGroup) => (
                        <Fragment key={`sales-invoice-${salesGroup.id_sales}`}>
                          <tr key={`sales-${salesGroup.id_sales}`} style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>
                            <td>👤 Sales: {salesGroup.nm_sales}</td>
                            <td align="right">{formatCurrency(salesGroup.total)}</td>
                          </tr>
                          {salesGroup.customers.map((cust, cIdx) => (
                            <tr key={`cust-${salesGroup.id_sales}-${cust.id_customer || cIdx}`}>
                              <td style={{ paddingLeft: '24px' }}>🏢 {cust.nm_customer}</td>
                              <td align="right">{formatCurrency(cust.jumlah)}</td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                    <tfoot style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
                      <tr>
                        <td>Grand Total</td>
                        <td align="right">{formatCurrency(reportData.reduce((acc, sg) => acc + sg.total, 0))}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}

                {/* 4. RENDER COATING SUMMARY */}
                {activeReport === 'coating' && (
                  <table className="table table-bordered table-hover" style={{ fontSize: '13px' }}>
                    <thead style={{ backgroundColor: '#f8fafc' }}>
                      <tr>
                        <th>Nama Customer</th>
                        <th style={{ textAlign: 'right' }}>Total Qty WO</th>
                        <th style={{ textAlign: 'right' }}>Estimasi Biaya Coating</th>
                        <th style={{ textAlign: 'right' }}>Total Nilai WO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((row, idx) => (
                        <tr key={row.id_customer || idx}>
                          <td><strong>{row.nm_customer}</strong></td>
                          <td align="right">{row.qtytot ? row.qtytot.toLocaleString() : '0'} Pcs</td>
                          <td align="right" style={{ color: '#ef4444', fontWeight: '600' }}>{formatCurrency(row.jumlah)}</td>
                          <td align="right">{formatCurrency(row.jumlah2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>
                      <tr>
                        <td>Grand Total</td>
                        <td align="right">{reportData.reduce((acc, row) => acc + (row.qtytot || 0), 0).toLocaleString()} Pcs</td>
                        <td align="right" style={{ color: '#ef4444' }}>{formatCurrency(reportData.reduce((acc, row) => acc + (row.jumlah || 0), 0))}</td>
                        <td align="right">{formatCurrency(reportData.reduce((acc, row) => acc + (row.jumlah2 || 0), 0))}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}

                {/* 5. RENDER COATING LIST */}
                {activeReport === 'coating_list' && (
                  <table className="table table-bordered table-hover" style={{ fontSize: '13px' }}>
                    <thead style={{ backgroundColor: '#f8fafc' }}>
                      <tr>
                        <th>Tanggal</th>
                        <th>Kode Coating</th>
                        <th>No WO</th>
                        <th>Customer</th>
                        <th>Nama Coating (Drawing)</th>
                        <th style={{ textAlign: 'right' }}>Qty</th>
                        <th>Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((row, idx) => (
                        <tr key={row.trcode || idx}>
                          <td>{row.trdate ? new Date(row.trdate).toLocaleDateString() : '-'}</td>
                          <td><code>{row.trcode}</code></td>
                          <td><strong>{row.nowo}</strong></td>
                          <td>{row.nm_customer}</td>
                          <td>{row.coatingname || row.nodrawing}</td>
                          <td align="right">{row.qtycoat ? row.qtycoat.toLocaleString() : '0'} pcs</td>
                          <td>{row.nm_sales}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 6. RENDER FINISHED GOODS REPORT */}
                {activeReport === 'fg' && (
                  <table className="table table-bordered table-hover" style={{ fontSize: '13px' }}>
                    <thead style={{ backgroundColor: '#f8fafc' }}>
                      <tr>
                        <th>Tanggal</th>
                        <th>Kode FG</th>
                        <th>No WO</th>
                        <th>Customer</th>
                        <th>Nama Drawing / Item</th>
                        <th style={{ textAlign: 'right' }}>Qty</th>
                        <th>Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((row, idx) => (
                        <tr key={row.fgcode || idx}>
                          <td>{row.fgdate ? new Date(row.fgdate).toLocaleDateString() : '-'}</td>
                          <td><code>{row.fgcode}</code></td>
                          <td><strong>{row.nowo}</strong></td>
                          <td>{row.nm_customer}</td>
                          <td>{row.descrip || row.nodrawing}</td>
                          <td align="right">{row.permen ? row.permen.toLocaleString() : '0'} pcs</td>
                          <td>{row.nm_sales}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drill-down Detail Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '1000px', margin: '20px', animation: 'slideUp 0.3s ease', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-body" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{modalTitle}</h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Memuat detail laporan...</div>
              ) : modalData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Tidak ada data rincian ditemukan.</div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                  
                  {/* DETAIL VIEW FOR ORDER CUSTOMER */}
                  {activeReport === 'oc' && (
                    <table className="table table-bordered table-striped" style={{ fontSize: '12px' }}>
                      <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                        <tr>
                          <th>No WO</th>
                          <th>Tgl WO</th>
                          <th>No SO</th>
                          <th>Tgl SO</th>
                          <th>Item / Drawing</th>
                          <th>Deskripsi Drawing</th>
                          <th style={{ textAlign: 'right' }}>Qty</th>
                          <th style={{ textAlign: 'right' }}>Harga Satuan</th>
                          <th style={{ textAlign: 'right' }}>Subtotal</th>
                          <th>Sales</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalData.map((row) => {
                          const subtotal = (row.qty || 0) * (row.hrg || 0);
                          return (
                            <tr key={row.wo_no}>
                              <td><strong>{row.wo_no}</strong></td>
                              <td>{row.tgl_wo ? new Date(row.tgl_wo).toLocaleDateString() : '-'}</td>
                              <td>{row.noso || '-'}</td>
                              <td>{row.tglso ? new Date(row.tglso).toLocaleDateString() : '-'}</td>
                              <td>{row.nodrawing}</td>
                              <td>{row.descrip}</td>
                              <td align="right">{row.qty ? row.qty.toLocaleString() : '0'} pcs</td>
                              <td align="right">{formatCurrency(row.hrg)}</td>
                              <td align="right" style={{ fontWeight: '500' }}>{formatCurrency(subtotal)}</td>
                              <td>{row.nm_sales}</td>
                              <td>
                                {row.sts === 0 ? <span className="badge" style={{ background: '#f59e0b', color: '#fff' }}>Proses</span> : <span className="badge" style={{ background: '#10b981', color: '#fff' }}>Selesai</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold', position: 'sticky', bottom: 0 }}>
                        <tr>
                          <td colSpan="6">Total</td>
                          <td align="right">{modalData.reduce((acc, row) => acc + (row.qty || 0), 0).toLocaleString()} pcs</td>
                          <td></td>
                          <td align="right">{formatCurrency(modalData.reduce((acc, row) => acc + ((row.qty || 0) * (row.hrg || 0)), 0))}</td>
                          <td colSpan="2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  )}

                  {/* DETAIL VIEW FOR GENERAL SUMMARY */}
                  {activeReport === 'general' && (
                    <table className="table table-bordered table-striped" style={{ fontSize: '12px' }}>
                      <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                        <tr>
                          <th>No WO</th>
                          <th>Tgl WO</th>
                          <th>No SO</th>
                          <th>Tgl SO</th>
                          <th>Item / Drawing</th>
                          <th>Deskripsi Drawing</th>
                          <th style={{ textAlign: 'right' }}>Qty Order</th>
                          <th style={{ textAlign: 'right' }}>Harga</th>
                          <th style={{ textAlign: 'right' }}>Terkirim (Qty)</th>
                          <th style={{ textAlign: 'right' }}>Invoice (Qty)</th>
                          <th style={{ textAlign: 'right' }}>Belum Inv (Qty)</th>
                          <th style={{ textAlign: 'right' }}>Balance (Qty)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalData.map((row) => (
                          <tr key={row.wo_no}>
                            <td><strong>{row.wo_no}</strong></td>
                            <td>{row.tgl_wo ? new Date(row.tgl_wo).toLocaleDateString() : '-'}</td>
                            <td>{row.noso || '-'}</td>
                            <td>{row.tglso ? new Date(row.tglso).toLocaleDateString() : '-'}</td>
                            <td>{row.nodrawing}</td>
                            <td>{row.descrip}</td>
                            <td align="right">{row.qty ? row.qty.toLocaleString() : '0'} pcs</td>
                            <td align="right">{formatCurrency(row.price)}</td>
                            <td align="right" style={{ color: '#10b981', fontWeight: '500' }}>{row.qtydel ? parseFloat(row.qtydel).toLocaleString() : '0'}</td>
                            <td align="right" style={{ color: '#4f46e5', fontWeight: '500' }}>{row.qty_inv ? row.qty_inv.toLocaleString() : '0'}</td>
                            <td align="right" style={{ color: '#f59e0b', fontWeight: '500' }}>{row.qtyblum ? parseFloat(row.qtyblum).toLocaleString() : '0'}</td>
                            <td align="right" style={{ fontWeight: '600' }}>{(row.qty - row.qtydel).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold', position: 'sticky', bottom: 0 }}>
                        <tr>
                          <td colSpan="6">Total</td>
                          <td align="right">{modalData.reduce((acc, row) => acc + (row.qty || 0), 0).toLocaleString()} pcs</td>
                          <td></td>
                          <td align="right" style={{ color: '#10b981' }}>{modalData.reduce((acc, row) => acc + (parseFloat(row.qtydel) || 0), 0).toLocaleString()}</td>
                          <td align="right" style={{ color: '#4f46e5' }}>{modalData.reduce((acc, row) => acc + (row.qty_inv || 0), 0).toLocaleString()}</td>
                          <td align="right" style={{ color: '#f59e0b' }}>{modalData.reduce((acc, row) => acc + (parseFloat(row.qtyblum) || 0), 0).toLocaleString()}</td>
                          <td align="right">{modalData.reduce((acc, row) => acc + (row.qty - row.qtydel), 0).toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}

                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '16px' }}>
                <button type="button" className="btn btn-default" style={{ border: '1px solid #d1d5db' }} onClick={() => setIsModalOpen(false)}>
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  );
}
