'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function PrintSubcontDeliveryPage() {
  const params = useParams();
  const router = useRouter();
  const { nodel } = params;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('satya_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodel, router]);

  const loadData = async () => {
    try {
      const res = await api.get(`/api/delivery/subcont/${encodeURIComponent(nodel)}`);
      setData(res.data);
      // Picu dialog cetak secara otomatis setelah data termuat
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data cetak surat jalan subcont.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat data Surat Jalan Subcont...</div>;
  }

  if (error || !data) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'red', fontFamily: 'sans-serif' }}>{error || 'Data tidak ditemukan'}</div>;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white; margin: 0; padding: 0; }
          .print-container { box-shadow: none !important; margin: 0 !important; width: 100% !important; padding: 0 !important; }
        }
        body { background: #f1f5f9; font-family: 'Inter', sans-serif; color: #334155; }
        .print-container {
          max-width: 800px;
          margin: 40px auto;
          background: white;
          padding: 40px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        .header-layout { display: flex; justify-content: space-between; margin-bottom: 24px; border-bottom: 2px solid #334155; padding-bottom: 16px; }
        .company-info h1 { margin: 0 0 4px 0; font-size: 20px; font-weight: bold; color: #1e3a8a; letter-spacing: 0.5px; }
        .company-info p { margin: 0; font-size: 11px; color: #64748b; line-height: 1.4; }
        
        .doc-title { text-align: center; font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 20px 0; letter-spacing: 1px; color: #1e293b; text-decoration: underline; }
        
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
        .info-table td { padding: 4px 8px; vertical-align: top; }
        
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
        .items-table th, .items-table td { border: 1px solid #94a3b8; padding: 8px 10px; text-align: left; }
        .items-table th { background: #f8fafc; font-weight: bold; color: #1e293b; text-transform: uppercase; font-size: 11px; }
        
        .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding: 0 30px; font-size: 13px; }
        .signature-box { text-align: center; width: 200px; }
        .signature-space { height: 70px; }
      `}} />

      <div className="no-print" style={{ textAlign: 'center', padding: '16px', background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <button 
          onClick={handlePrint}
          style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
        >
          Cetak Surat Jalan (Ctrl+P)
        </button>
        <button 
          onClick={() => window.close()}
          style={{ padding: '8px 16px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginLeft: '10px' }}
        >
          Tutup Halaman
        </button>
      </div>

      <div className="print-container">
        <div className="header-layout">
          <div className="company-info">
            <h1>PT. SATYA TEKNIK INDONESIA</h1>
            <p>Kawasan Industri Delta Silicon 2</p>
            <p>Jl. Waru Delta Niaga Blok B9 Cikarang, Cibatu, Cikarang Sel.</p>
            <p>Kabupaten Bekasi, Jawa Barat 17550</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div>Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</div>
            <div>Oleh: {data.user_create || 'Admin'}</div>
          </div>
        </div>

        <div className="doc-title">Surat Jalan Pengiriman Subcont</div>
        
        <table className="info-table">
          <tbody>
            <tr>
              <td style={{ width: '130px', fontWeight: '600' }}>No. Surat Jalan</td>
              <td style={{ width: '10px' }}>:</td>
              <td style={{ fontWeight: 'bold', color: '#1e3a8a' }}>{data.nodel}</td>
              
              <td style={{ width: '130px', fontWeight: '600' }}>Subkontraktor</td>
              <td style={{ width: '10px' }}>:</td>
              <td style={{ fontWeight: 'bold' }}>{data.nm_sub || '-'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: '600' }}>Tanggal Kirim</td>
              <td>:</td>
              <td>{formatDate(data.tgldel)}</td>
              
              <td style={{ fontWeight: '600' }}>Alamat Kirim</td>
              <td>:</td>
              <td>{data.alamat || '-'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: '600' }}>No. SJ Accurate</td>
              <td>:</td>
              <td style={{ fontFamily: 'monospace', fontSize: '14px' }}>{data.no_accurate || '-'}</td>
              
              <td colSpan="3"></td>
            </tr>
          </tbody>
        </table>

        <table className="items-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>No</th>
              <th style={{ width: '120px' }}>Req No</th>
              <th style={{ width: '100px' }}>No WO</th>
              <th>Item / Drawing / Spesifikasi</th>
              <th style={{ width: '120px' }}>Proses Pekerjaan</th>
              <th style={{ width: '70px', textAlign: 'right' }}>Qty</th>
              <th style={{ width: '120px' }}>Note</th>
            </tr>
          </thead>
          <tbody>
            {data.items && data.items.length > 0 ? (
              data.items.map((item, idx) => (
                <tr key={item.idtrans || idx}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ fontWeight: '500', color: '#1e3a8a' }}>{item.noreq_sub}</td>
                  <td>{item.wonum}</td>
                  <td>
                    <strong style={{ display: 'block' }}>{item.item}</strong>
                    {item.descrip && <span style={{ color: '#64748b', fontSize: '10px' }}>{item.descrip}</span>}
                  </td>
                  <td>{item.kdproses}</td>
                  <td align="right" style={{ fontWeight: 'bold' }}>{item.qty} PCS</td>
                  <td>{item.note || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Detail item pengiriman kosong</td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className="signatures">
          <div className="signature-box">
            <p>Penerima,</p>
            <p style={{ fontSize: '10px', color: '#64748b' }}>(Vendor Subkontraktor)</p>
            <div className="signature-space"></div>
            <p style={{ fontWeight: '600' }}>( .................................... )</p>
          </div>
          <div className="signature-box">
            <p>Hormat Kami,</p>
            <p style={{ fontSize: '10px', color: '#64748b' }}>(PT. Satya Teknik Indonesia)</p>
            <div className="signature-space"></div>
            <p style={{ fontWeight: '600' }}>( .................................... )</p>
          </div>
        </div>
      </div>
    </>
  );
}
