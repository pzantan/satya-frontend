'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function ReceiptNgPage() {
  const router = useRouter();
  const { id } = useParams(); // ngcode

  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Form states
  const [ngDetail, setNgDetail] = useState(null);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [form, setForm] = useState({
    userng: '',
    note: '',
    cpro: '',
    cmat: '',
    coth: '',
    why1: '',
    why2: '',
    why3: '',
    why4: '',
    why5: '',
    what: '',
    where: '',
    when: '',
    how: '',
    who: ''
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
    if (!isCheckingAuth && id) {
      fetchDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckingAuth, id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch NG details & users
      const [detailRes, usersRes] = await Promise.all([
        api.get(`/api/produksi/ng/${id}`),
        api.get('/api/produksi/ng/users')
      ]);

      if (detailRes.data) {
        setNgDetail(detailRes.data);
        // Pre-fill form values if already exist (though typically pending userng is empty)
        setForm(prev => ({
          ...prev,
          userng: detailRes.data.userng || '',
          note: detailRes.data.note || '',
          cpro: detailRes.data.costprocess !== null ? detailRes.data.costprocess.toString() : '',
          cmat: detailRes.data.costmaterial !== null ? detailRes.data.costmaterial.toString() : '',
          coth: detailRes.data.costother !== null ? detailRes.data.costother.toString() : '',
          why1: detailRes.data.why1 || '',
          why2: detailRes.data.why2 || '',
          why3: detailRes.data.why3 || '',
          why4: detailRes.data.why4 || '',
          why5: detailRes.data.why5 || '',
          what: detailRes.data.what || '',
          where: detailRes.data.where1 || '',
          when: detailRes.data.when1 || '',
          how: detailRes.data.how || '',
          who: detailRes.data.who || ''
        }));
      }
      
      if (usersRes.data) {
        setUserList(usersRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat detail laporan NG atau daftar user.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userng) {
      return alert('Pilih User Terlebih Dahulu!');
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/produksi/ng/receipt', {
        ngcode: id,
        userng: form.userng,
        note: form.note,
        costprocess: form.cpro,
        costmaterial: form.cmat,
        costother: form.coth,
        why1: form.why1,
        why2: form.why2,
        why3: form.why3,
        why4: form.why4,
        why5: form.why5,
        what: form.what,
        where1: form.where,
        when1: form.when,
        how: form.how,
        who: form.who,
        wono: ngDetail.nowo,
        qtyng: ngDetail.qtyng
      });

      alert('Receipt NG Berhasil Diproses! Work Order perbaikan baru telah dibuat.');
      router.push('/produksi/ng');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Gagal memproses Receipt NG.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAuth || loading) {
    return (
      <AppLayout user={user}>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {loading ? 'Memuat detail data...' : 'Memeriksa otorisasi...'}
        </div>
      </AppLayout>
    );
  }

  if (error || !ngDetail) {
    return (
      <AppLayout user={user}>
        <div className="container-fluid" style={{ padding: '24px' }}>
          <div className="alert alert-danger">{error || 'Data tidak ditemukan.'}</div>
          <button className="btn btn-default" onClick={() => router.push('/produksi/ng')}>Kembali ke Daftar</button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user} onLogout={() => {
      localStorage.removeItem('satya_token');
      localStorage.removeItem('satya_user');
      router.push('/login');
    }}>
      <div className="container-fluid" style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#dc2626' }}>Receipt & Analysis NG: {id}</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Proses Laporan NG dan Buat WO Perbaikan</p>
          </div>
          <button className="btn btn-default" onClick={() => router.push('/produksi/ng')}>
            Kembali
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            
            {/* Left Side: WO Details & Cost Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Detail WO */}
              <div className="card">
                <div className="card-header" style={{ fontWeight: 'bold', fontSize: '16px', borderBottom: '1px solid #e2e8f0', padding: '16px 20px' }}>
                  Detail WO & NG
                </div>
                <div className="card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text-main)' }}>S/O Number</label>
                    <input type="text" className="form-control" readOnly value={ngDetail.noso || '-'} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text-main)' }}>W/O Number</label>
                    <input type="text" className="form-control" readOnly value={ngDetail.nowo} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text-main)' }}>Quantity NG</label>
                    <input type="text" className="form-control" readOnly value={ngDetail.qtyng} style={{ backgroundColor: 'var(--bg-secondary)', color: '#dc2626', fontWeight: 'bold' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text-main)' }}>User/Operator Pelapor <span style={{ color: 'red' }}>*</span></label>
                    <select 
                      name="userng" 
                      className="form-control" 
                      value={form.userng}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">-- Pilih Operator --</option>
                      {userList.map((usr) => (
                        <option key={usr.user_name} value={usr.user_name}>
                          {usr.first_name || ''} {usr.last_name || ''} ({usr.user_name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Note & Estimate Loss */}
              <div className="card">
                <div className="card-header" style={{ fontWeight: 'bold', fontSize: '16px', borderBottom: '1px solid #e2e8f0', padding: '16px 20px' }}>
                  Note & Estimate Loss
                </div>
                <div className="card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text-main)' }}>Process Loss (Estimasi Kerugian Proses)</label>
                    <input 
                      type="number" 
                      name="cpro" 
                      placeholder="Rp. -" 
                      className="form-control" 
                      value={form.cpro}
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text-main)' }}>Material Loss (Estimasi Kerugian Material)</label>
                    <input 
                      type="number" 
                      name="cmat" 
                      placeholder="Rp. -" 
                      className="form-control" 
                      value={form.cmat}
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text-main)' }}>Others Loss (Estimasi Kerugian Lain-lain)</label>
                    <input 
                      type="number" 
                      name="coth" 
                      placeholder="Rp. -" 
                      className="form-control" 
                      value={form.coth}
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: 'var(--text-main)' }}>NG Note (Catatan Tambahan)</label>
                    <textarea 
                      name="note" 
                      rows="3" 
                      className="form-control" 
                      value={form.note}
                      onChange={handleInputChange}
                      placeholder="Tuliskan keterangan detail barang rusak di sini..."
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Side: Analysis & Corrective Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Item Details View Only */}
              <div className="card">
                <div className="card-header" style={{ fontWeight: 'bold', fontSize: '16px', borderBottom: '1px solid #e2e8f0', padding: '16px 20px' }}>
                  Detail Item & Customer
                </div>
                <div className="card-body" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Drawing Number</span>
                      <span style={{ fontWeight: '500' }}>{ngDetail.nodrawing}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Customer</span>
                      <span style={{ fontWeight: '500' }}>{ngDetail.nm_customer || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Sales</span>
                      <span style={{ fontWeight: '500' }}>{ngDetail.nm_sales || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Description</span>
                      <span style={{ fontWeight: '500' }}>{ngDetail.descrip || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis of NG */}
              <div className="card">
                <div className="card-header" style={{ fontWeight: 'bold', fontSize: '16px', borderBottom: '1px solid #e2e8f0', padding: '16px 20px' }}>
                  Analysis of NG (5 Whys)
                </div>
                <div className="card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Why 1 / Kenapa?</label>
                    <input type="text" name="why1" className="form-control" value={form.why1} onChange={handleInputChange} placeholder="Penyebab tingkat pertama" />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Why 2 / Kenapa?</label>
                    <input type="text" name="why2" className="form-control" value={form.why2} onChange={handleInputChange} placeholder="Penyebab tingkat kedua" />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Why 3 / Kenapa?</label>
                    <input type="text" name="why3" className="form-control" value={form.why3} onChange={handleInputChange} placeholder="Penyebab tingkat ketiga" />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Why 4 / Kenapa?</label>
                    <input type="text" name="why4" className="form-control" value={form.why4} onChange={handleInputChange} placeholder="Penyebab tingkat keempat" />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Why 5 / Kenapa?</label>
                    <input type="text" name="why5" className="form-control" value={form.why5} onChange={handleInputChange} placeholder="Penyebab tingkat kelima (Root Cause)" />
                  </div>
                </div>
              </div>

              {/* Corrective Actions */}
              <div className="card">
                <div className="card-header" style={{ fontWeight: 'bold', fontSize: '16px', borderBottom: '1px solid #e2e8f0', padding: '16px 20px' }}>
                  Corrective Action (Tindakan Perbaikan)
                </div>
                <div className="card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>What (Tindakan apa yang diambil)?</label>
                    <input type="text" name="what" className="form-control" value={form.what} onChange={handleInputChange} placeholder="What" />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Where (Di mana dilakukan)?</label>
                    <input type="text" name="where" className="form-control" value={form.where} onChange={handleInputChange} placeholder="Where" />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>When (Kapan dilaksanakan)?</label>
                    <input type="text" name="when" className="form-control" value={form.when} onChange={handleInputChange} placeholder="When" />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>How (Bagaimana caranya)?</label>
                    <input type="text" name="how" className="form-control" value={form.how} onChange={handleInputChange} placeholder="How" />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Who (Siapa penanggung jawab)?</label>
                    <input type="text" name="who" className="form-control" value={form.who} onChange={handleInputChange} placeholder="Who" />
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <button type="button" className="btn btn-default" onClick={() => router.push('/produksi/ng')} disabled={isSubmitting}>
              Batal
            </button>
            <button type="submit" className="btn btn-danger" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              {isSubmitting ? 'Menyimpan...' : 'Proses & Buat WO Perbaikan'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
