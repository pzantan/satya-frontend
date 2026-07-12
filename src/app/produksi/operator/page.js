'use client';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import OperatorLayout from './layout';

export default function OperatorPage() {
  const [wono, setWono] = useState('');
  const [loadedKodeProduksi, setLoadedKodeProduksi] = useState('');
  const [data, setData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [qtyOk, setQtyOk] = useState(0);
  const [qtyNg, setQtyNg] = useState(0);

  const inputRef = useRef(null);

  // Auto focus input on mount and whenever user clicks outside
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
    
    const handleGlobalClick = () => {
      // only refocus if no other input is focused
      if (document.activeElement.tagName !== 'INPUT') {
        if (inputRef.current) inputRef.current.focus();
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const fetchWOData = async (woNumber) => {
    if (!woNumber) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/produksi/operator/${encodeURIComponent(woNumber)}`);
      setData(res.data);
      setLoadedKodeProduksi(woNumber);
      setWono(''); // Clear the scan input
      
      // Auto fill qty OK based on remaining
      if (res.data?.activeProcess && res.data.activeProcess.statuson === '1') {
        const p = res.data.activeProcess;
        const target = res.data.wo.qty || 0;
        const done = (p.fg_item || 0) + (p.ng_item || 0);
        setQtyOk(target - done);
        setQtyNg(0);
      }
      
    } catch (err) {
      setError(err.message || 'Gagal memuat data WO');
      setData(null);
    } finally {
      setLoading(false);
      // Refocus after state updates
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (wono.trim()) {
      fetchWOData(wono.trim());
    }
  };

  const handleStartProcess = async () => {
    if (!data?.activeProcess || !loadedKodeProduksi) return;
    setActionLoading(true);
    try {
      await api.post(`/api/produksi/operator/${encodeURIComponent(loadedKodeProduksi)}/start`, {
        id_trproses: data.activeProcess.id_trproses
      });
      // Refresh data
      fetchWOData(loadedKodeProduksi);
    } catch (err) {
      alert(err.message || 'Gagal memulai proses');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopProcess = async (e) => {
    if (e) e.preventDefault();
    if (!data?.activeProcess || !data?.activeDetail || !loadedKodeProduksi) return;
    
    const maxQty = data.wo.qty - ((data.activeProcess.fg_item||0) + (data.activeProcess.ng_item||0));
    const totalInput = parseInt(qtyOk) + parseInt(qtyNg);
    
    if (totalInput > maxQty) {
      if (!confirm(`Total Qty OK + NG (${totalInput}) melebihi sisa target (${maxQty}). Tetap lanjutkan?`)) {
        return;
      }
    }
    
    setActionLoading(true);
    try {
      await api.post(`/api/produksi/operator/${encodeURIComponent(loadedKodeProduksi)}/stop`, {
        id_trproses: data.activeProcess.id_trproses,
        id_detail: data.activeDetail.ids,
        qty_ok: qtyOk,
        qty_ng: qtyNg
      });
      // Refresh data
      fetchWOData(loadedKodeProduksi);
    } catch (err) {
      alert(err.message || 'Gagal menghentikan proses');
    } finally {
      setActionLoading(false);
    }
  };


  return (
    <>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Scanner Input */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#1e293b' }}>Scan Barcode / Input Kode Produksi</h2>
          <form onSubmit={handleScanSubmit} style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <input 
              ref={inputRef}
              type="text" 
              value={wono}
              onChange={(e) => setWono(e.target.value)}
              placeholder="Kode Produksi..."
              style={{ width: '400px', padding: '15px', fontSize: '20px', borderRadius: '8px', border: '2px solid #3b82f6', outline: 'none', textAlign: 'center' }}
            />
            <button type="submit" style={{ padding: '15px 30px', fontSize: '18px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Cari
            </button>
          </form>
          {error && <div style={{ color: '#ef4444', marginTop: '15px', fontWeight: 'bold' }}>{error}</div>}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Memuat data...</h2>
          </div>
        )}

        {/* WO Details & Active Action */}
        {!loading && data && data.wo && (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            
            {/* Left Col: Actions & WO Info */}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Action Card (Moved UP) */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>Panel Kendali Operator</h3>
                
                {!data.activeProcess ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#22c55e', fontWeight: 'bold', fontSize: '20px' }}>
                    ✨ Semua Routing Proses Telah Selesai ✨
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '5px' }}>Proses Aktif:</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
                        {data.activeProcess.ke}. {data.activeProcess.nm_proses || data.activeProcess.kdproses}
                      </div>
                      <div style={{ color: '#64748b' }}>Mesin: {data.activeProcess.nm_mesin || 'MANUAL'}</div>
                      <div style={{ marginTop: '10px', display: 'flex', gap: '15px', fontSize: '15px' }}>
                        <div>Target: <strong>{data.wo.qty} Pcs</strong></div>
                        <div>Selesai (OK): <strong style={{color:'#22c55e'}}>{data.activeProcess.fg_item}</strong></div>
                        <div>NG: <strong style={{color:'#ef4444'}}>{data.activeProcess.ng_item}</strong></div>
                      </div>
                    </div>

                    {data.activeProcess.statuson === '0' || data.activeProcess.statuspouse === '1' ? (
                      // Belum mulai atau di-pause
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '15px', fontSize: '16px', color: '#f59e0b', fontWeight: 'bold' }}>
                          Status: {data.activeProcess.statuspouse === '1' ? 'JEDA (PAUSED)' : 'MENUNGGU DIMULAI'}
                        </div>
                        <button 
                          onClick={handleStartProcess}
                          disabled={actionLoading}
                          style={{ width: '100%', padding: '20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '24px', fontWeight: 'bold', cursor: 'pointer', opacity: actionLoading ? 0.7 : 1 }}
                        >
                          {actionLoading ? 'Memproses...' : '▶ MULAI (START)'}
                        </button>
                      </div>
                    ) : (
                      // Sedang berjalan
                      <form onSubmit={handleStopProcess}>
                        <div style={{ marginBottom: '20px', padding: '15px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', textAlign: 'center' }}>
                          <span style={{ fontSize: '18px', color: '#16a34a', fontWeight: 'bold' }}>Sedang Berjalan (Waktu Tercatat)</span>
                          <div style={{ fontSize: '14px', marginTop: '5px', color: '#15803d' }}>
                            Mulai sejak: {data.activeDetail ? new Date(data.activeDetail.ston).toLocaleString('id-ID') : '-'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Qty OK (Good)</label>
                            <input 
                              type="number" 
                              min="0"
                              value={qtyOk}
                              onChange={e => setQtyOk(e.target.value)}
                              required
                              style={{ width: '100%', padding: '15px', fontSize: '24px', borderRadius: '8px', border: '2px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Qty NG (Reject)</label>
                            <input 
                              type="number" 
                              min="0"
                              value={qtyNg}
                              onChange={e => setQtyNg(e.target.value)}
                              required
                              style={{ width: '100%', padding: '15px', fontSize: '24px', borderRadius: '8px', border: '2px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        <button 
                          type="submit"
                          disabled={actionLoading}
                          style={{ width: '100%', padding: '20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', opacity: actionLoading ? 0.7 : 1 }}
                        >
                          {actionLoading ? 'Memproses...' : '■ BERHENTI (STOP / PAUSE)'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Info Card (Moved DOWN) */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>Detail Work Order</h3>
                <div style={{ fontSize: '16px', lineHeight: '1.8' }}>
                  <div><strong>No W/O:</strong> {data.wo.wo_no}</div>
                  <div><strong>Drawing:</strong> {data.wo.nodrawing}</div>
                  <div><strong>Customer:</strong> {data.wo.nm_customer || '-'}</div>
                  <div><strong>Target Qty:</strong> <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '18px' }}>{data.wo.qty} Pcs</span></div>
                  <div><strong>Kode Produksi:</strong> {data.header?.kd_hdproses}</div>
                  <div>
                    <strong>Status Total:</strong>{' '}
                    {data.header?.finishon ? <span style={{ color: '#22c55e', fontWeight: 'bold' }}>SELESAI</span> : <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>BERJALAN</span>}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Col: Timeline Routing */}
            <div style={{ flex: '1', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>Routing Proses</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {data.routing && data.routing.map((r, idx) => {
                  let bg = '#f1f5f9';
                  let border = '1px solid #cbd5e1';
                  let icon = '⏳';
                  
                  if (r.statuson === '2') {
                    bg = '#f0fdf4';
                    border = '1px solid #bbf7d0';
                    icon = '✅';
                  } else if (r.statuson === '1' && r.statuspouse === '0') {
                    bg = '#eff6ff';
                    border = '2px solid #3b82f6';
                    icon = '🔄';
                  } else if (r.statuspouse === '1') {
                    bg = '#fffbeb';
                    border = '1px solid #fde68a';
                    icon = '⏸️';
                  }
                  
                  return (
                    <div key={r.id_trproses} style={{ padding: '15px', background: bg, border, borderRadius: '8px', display: 'flex', gap: '15px' }}>
                      <div style={{ fontSize: '24px' }}>{icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{r.ke}. {r.nm_proses || r.kdproses}</div>
                        <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Mesin: {r.nm_mesin || '-'}</div>
                        {r.statuson !== '0' && (
                          <div style={{ fontSize: '13px', marginTop: '6px', background: 'rgba(255,255,255,0.6)', display: 'inline-block', padding: '2px 8px', borderRadius: '4px' }}>
                            OK: {r.fg_item||0} | NG: {r.ng_item||0} | Waktu: {r.timereal||0} mnt
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
        )}

      </div>
    </>
  );
}
