'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function WorkOrderDetailPage() {
  const { id } = useParams();
  const [wo, setWo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) loadDetail();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/wo/${encodeURIComponent(id)}`);
      setWo(res);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data Work Order');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (val) => (val !== null && val !== undefined ? val : '-');
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('id-ID') : '-');
  const fmtNum = (n) => (n !== null && n !== undefined ? Number(n).toLocaleString('id-ID') : '0');

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          Memuat data...
        </div>
      </AppLayout>
    );
  }

  if (error || !wo) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#ef4444' }}>
          {error || 'Data tidak ditemukan'}
        </div>
      </AppLayout>
    );
  }

  const drawing = wo.drawing_details;

  return (
    <AppLayout>
      <div className="container-fluid" style={{ padding: '24px', maxWidth: '1400px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <Link href="/wo" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', padding: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
              Detail Work Order
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace', fontSize: '14px' }}>{wo.wo_no}</p>
          </div>
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => window.open(`${API_BASE}/api/wo/${encodeURIComponent(wo.wo_no)}/pdf`, '_blank')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
            Cetak PDF
          </button>
        </div>

        {/* Main Content: Left info + Right PDF */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          
          {/* Left Column: WO Info + Drawing Info */}
          <div style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* WO Details Card */}
            <div className="card">
              <div className="card-body">
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Informasi Work Order
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <tbody>
                    {[
                      { label: 'No. WO',           value: <strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{wo.wo_no}</strong> },
                      { label: 'Tanggal WO',        value: fmtDate(wo.tgl_wo) },
                      { label: 'No. SO',            value: fmt(wo.noso) },
                      { label: 'Tanggal SO',        value: fmtDate(wo.tglso) },
                      { label: 'Quantity',          value: <strong>{fmtNum(wo.qty)} pcs</strong> },
                      { label: 'Target Delivery',   value: fmtDate(wo.estimasidel) },
                      { label: 'Status',            value: wo.sts === 0
                          ? <span className="badge" style={{ background: '#f59e0b', color: '#fff' }}>Proses</span>
                          : <span className="badge" style={{ background: '#10b981', color: '#fff' }}>Selesai</span> },
                    ].map(({ label, value }) => (
                      <tr key={label} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '8px 12px 8px 0', color: 'var(--text-muted)', fontWeight: '500', width: '45%' }}>{label}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Drawing Details Card */}
            {drawing ? (
              <div className="card">
                <div className="card-body">
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    Detail Drawing
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <tbody>
                      {[
                        { label: 'Drawing Number', value: <strong style={{ color: 'var(--primary)' }}>{drawing.nodrawing}</strong> },
                        { label: 'Customer',       value: drawing.customer_name },
                        { label: 'Sales',          value: drawing.sales_name },
                        { label: 'Price',          value: `Rp ${fmtNum(drawing.price)}` },
                        { label: 'Coating Price',  value: `Rp ${fmtNum(drawing.coatingprice)}` },
                        { label: 'Description',    value: fmt(drawing.descrip) },
                        { label: 'Dimensi',        value: fmt(drawing.dimensi) },
                      ].map(({ label, value }) => (
                        <tr key={label} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 12px 8px 0', color: 'var(--text-muted)', fontWeight: '500', width: '45%' }}>{label}</td>
                          <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600' }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-body" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  Data drawing tidak ditemukan
                </div>
              </div>
            )}
          </div>

          {/* Right Column: PDF Preview */}
          <div className="card" style={{ flex: 1, position: 'sticky', top: '24px', height: 'calc(100vh - 140px)' }}>
            <div className="card-body" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', flexShrink: 0 }}>
                Preview Drawing PDF
              </h3>

              {drawing && drawing.linkpict ? (
                <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', minHeight: 0 }}>
                  <iframe
                    src={`${API_BASE}/api/drawings/${drawing.id_drawing}/preview?type=drawing`}
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    title="Drawing PDF Preview"
                  />
                </div>
              ) : (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg-secondary)', borderRadius: '8px', border: '2px dashed var(--border-color)',
                  color: 'var(--text-muted)', gap: '12px'
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>File PDF Tidak Tersedia</div>
                    <div style={{ fontSize: '13px' }}>Drawing ini belum memiliki file PDF yang terupload</div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
