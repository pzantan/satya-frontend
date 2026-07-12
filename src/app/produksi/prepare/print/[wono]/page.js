'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function PrintProcessCardPage() {
  const params = useParams();
  const router = useRouter();
  const { wono } = params;

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
  }, [wono, router]);

  const loadData = async () => {
    try {
      const res = await api.get(`/api/produksi/prepare/print/${encodeURIComponent(wono)}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data cetak.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat data Process Card...</div>;
  }

  if (error || !data) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'red', fontFamily: 'sans-serif' }}>{error || 'Data tidak ditemukan'}</div>;
  }

  const { wo, header, routing } = data;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white; margin: 0; padding: 0; }
          .print-container { box-shadow: none !important; margin: 0 !important; width: 100% !important; padding: 0 !important; }
        }
        body { background: #f1f5f9; font-family: 'Inter', sans-serif; }
        .print-container {
          max-width: 800px;
          margin: 40px auto;
          background: white;
          padding: 40px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header-table, .routing-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
        .header-table td { padding: 6px; }
        .routing-table th, .routing-table td { border: 1px solid #000; padding: 8px; text-align: left; }
        .routing-table th { background: #f1f5f9; font-weight: bold; }
        .title { text-align: center; margin-bottom: 30px; font-size: 24px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; }
      `}} />

      <div className="no-print" style={{ textAlign: 'center', padding: '20px', background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0 }}>
        <button 
          onClick={handlePrint}
          style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
        >
          Cetak Process Card (Ctrl+P)
        </button>
        <button 
          onClick={() => window.close()}
          style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginLeft: '10px' }}
        >
          Tutup
        </button>
      </div>

      <div className="print-container">
        <div className="title">Process Card</div>
        
        <table className="header-table">
          <tbody>
            <tr>
              <td style={{ width: '150px', fontWeight: 'bold', verticalAlign: 'top' }}>NO W/O</td>
              <td style={{ width: '10px', verticalAlign: 'top' }}>:</td>
              <td style={{ verticalAlign: 'top' }}>
                {wo.wo_no}
                <br/>
                {header?.kd_hdproses && (
                  <img src={`http://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(header.kd_hdproses)}&scale=3&height=10&includetext`} alt="barcode" style={{ marginTop: '5px' }} />
                )}
              </td>
              <td style={{ width: '150px', fontWeight: 'bold', verticalAlign: 'top' }}>KODE PRODUKSI</td>
              <td style={{ width: '10px', verticalAlign: 'top' }}>:</td>
              <td style={{ verticalAlign: 'top' }}>{header?.kd_hdproses || '-'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold' }}>TANGGAL W/O</td>
              <td>:</td>
              <td>{wo.tgl_wo ? new Date(wo.tgl_wo).toLocaleDateString('id-ID') : '-'}</td>
              <td style={{ fontWeight: 'bold' }}>ITEM NO / DRAWING</td>
              <td>:</td>
              <td>{wo.nodrawing || '-'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold' }}>CUSTOMER</td>
              <td>:</td>
              <td>{wo.nm_customer || '-'}</td>
              <td style={{ fontWeight: 'bold' }}>QUANTITY</td>
              <td>:</td>
              <td>{wo.qty} PCS</td>
            </tr>
          </tbody>
        </table>

        <h3 style={{ fontSize: '16px', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '10px' }}>Daftar Proses (Routing)</h3>
        <table className="routing-table">
          <thead>
            <tr>
              <th style={{ width: '50px', textAlign: 'center' }}>No</th>
              <th>Nama Proses</th>
              <th>Mesin</th>
              <th>Waktu Standar</th>
              <th>Total Waktu (Est)</th>
            </tr>
          </thead>
          <tbody>
            {routing && routing.length > 0 ? (
              routing.map((r, idx) => (
                <tr key={r.id_trproses}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td>{r.nm_proses || r.kdproses}</td>
                  <td>{r.nm_mesin || r.kdmesin || 'MANUAL / SUBCONT'}</td>
                  <td>{r.time_peritem || 0} Menit / Pcs</td>
                  <td>{r.time_es || 0} Menit</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Routing proses belum tersedia</td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', padding: '0 40px' }}>
          <div style={{ textAlign: 'center' }}>
            <p>Dibuat Oleh,</p>
            <br /><br /><br />
            <p style={{ textDecoration: 'underline' }}>{header?.user || 'PPIC'}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p>Mengetahui,</p>
            <br /><br /><br />
            <p style={{ textDecoration: 'underline' }}>( ................................. )</p>
          </div>
        </div>
      </div>
    </>
  );
}
