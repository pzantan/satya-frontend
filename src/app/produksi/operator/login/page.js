'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function OperatorLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ user_name: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('satya_token');
    if (token) {
      router.push('/produksi/operator');
    }
  }, [router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use the special endpoint for 1-year token
      const res = await api.post('/api/auth/operator-login', form);
      
      localStorage.setItem('satya_token', res.token);
      localStorage.setItem('satya_user', JSON.stringify(res.user));
      document.cookie = `satya_token=${res.token}; path=/; max-age=31536000`; // 1 year cookie just in case

      router.push('/produksi/operator');
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa username dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Terminal Produksi</h1>
          <p style={{ color: '#64748b', marginTop: '8px' }}>Login khusus sesi operator (1 Tahun)</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: '#fef2f2', color: '#ef4444', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', border: '1px solid #fca5a5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>Username</label>
            <input 
              type="text" 
              name="user_name"
              value={form.user_name}
              onChange={handleChange}
              required
              autoFocus
              style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>Password</label>
            <input 
              type="password" 
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', padding: '14px', background: '#3b82f6', color: 'white', 
              border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Memproses...' : 'Login Terminal'}
          </button>
        </form>
      </div>
    </div>
  );
}
