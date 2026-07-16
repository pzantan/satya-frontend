'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

const moduleLabels = {
  'dashboard': { label: 'Dashboard Analitik', desc: 'Visualisasi grafik omset & invoice' },
  'customers': { label: 'Master Pelanggan', desc: 'Kelola data customer & alamat' },
  'materials': { label: 'Master Material', desc: 'Kelola data bahan baku & harga' },
  'machines': { label: 'Master Mesin', desc: 'Kelola data aset mesin produksi' },
  'subconts': { label: 'Master Subcontractor', desc: 'Kelola data vendor subcon' },
  'drawings': { label: 'Master Item (Drawing)', desc: 'Kelola item spesifikasi teknik' },
  'toolkind': { label: 'Master Toolkind', desc: 'Kelola jenis alat potong/tools' },
  'sales': { label: 'Master Sales', desc: 'Kelola tim marketing/sales' },
  'proses': { label: 'Master Proses', desc: 'Definisi urutan kerja produksi' },
  'wo': { label: 'Transaksi Work Order (WO)', desc: 'Penerbitan surat perintah kerja' },
  'produksi-prepare': { label: 'Produksi: Prepare', desc: 'Persiapan antrean kerja & print barcode' },
  'produksi-fg': { label: 'Produksi: Finished Goods', desc: 'Pencatatan produk selesai' },
  'produksi-ng': { label: 'Produksi: Not Good (NG)', desc: 'Analisis kegagalan & barang reject' },
  'delivery-customer': { label: 'Pengiriman: Customer', desc: 'Surat jalan & pengiriman ke customer' },
  'delivery-subcont': { label: 'Pengiriman: Subcont', desc: 'Kirim barang proses ke subkontraktor' },
  'invoice': { label: 'Keuangan: Invoice', desc: 'Cetak tagihan & data keuangan piutang' }
};

export default function RolesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [rolesList, setRolesList] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null); // null means show list of roles
  const [permissionsMatrix, setPermissionsMatrix] = useState([]);
  const [savingMatrix, setSavingMatrix] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('satya_token');
    const userData = localStorage.getItem('satya_user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      const u = JSON.parse(userData);
      setUser(u);
      // Only Admin role ('1') can access roles configuration
      if (u.role !== '1') {
        router.push('/home');
      }
    }
  }, [router]);

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const rolesData = await api.get('/api/roles');
      setRolesList(rolesData);
    } catch (err) {
      console.error('Failed to load roles:', err);
      setError('Gagal memuat daftar role.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === '1') {
      loadInitialData();
    }
  }, [user]);

  // Load permissions matrix when a role is selected
  const handleSelectRole = async (role) => {
    setLoading(true);
    setSelectedRole(role);
    try {
      const matrix = await api.get(`/api/roles/${role.id_role}/permissions`);
      setPermissionsMatrix(matrix);
    } catch (err) {
      console.error('Failed to load permissions matrix:', err);
      alert('Gagal memuat matriks hak akses.');
      setSelectedRole(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('satya_token');
    localStorage.removeItem('satya_user');
    document.cookie = 'satya_token=; path=/; max-age=0';
    router.push('/login');
  };

  // Edit matrix checkbox state locally
  const handleCheckboxChange = (module_name, field, val) => {
    setPermissionsMatrix(prev => 
      prev.map(perm => 
        perm.module_name === module_name 
          ? { ...perm, [field]: val }
          : perm
      )
    );
  };

  // Save permission matrix to backend
  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSavingMatrix(true);
    try {
      await api.put(`/api/roles/${selectedRole.id_role}/permissions`, {
        permissions: permissionsMatrix
      });
      alert('Matriks hak akses berhasil disimpan!');
      setSelectedRole(null);
      loadInitialData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan matriks hak akses.');
    } finally {
      setSavingMatrix(false);
    }
  };

  return (
    <AppLayout user={user} onLogout={handleLogout}>
      <header style={{ padding: '20px 32px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <h1 className="page-title">Master Hak Akses (Role)</h1>
        <p className="page-subtitle">Kelola dan atur kewenangan akses modul berdasarkan departemen kerja.</p>
      </header>

      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {error && (
          <div className="alert alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <div className="card">
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span className="spinner" style={{ borderColor: 'var(--text-muted)', borderTopColor: 'var(--primary)', width: '24px', height: '24px' }} />
                <p style={{ marginTop: '14px' }}>Memuat data hak akses...</p>
              </div>
            ) : !selectedRole ? (
              // View 1: List of Roles
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Daftar Departemen & Role Kerja</h3>
                </div>

                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>ID Role</th>
                        <th>Nama Role</th>
                        <th>Deskripsi</th>
                        <th style={{ width: '180px', textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rolesList.map((role) => (
                        <tr key={role.id_role}>
                          <td>{role.id_role}</td>
                          <td style={{ fontWeight: '600' }}>{role.role_name}</td>
                          <td>{role.description || '-'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn btn-outline btn-sm"
                              onClick={() => handleSelectRole(role)}
                            >
                              Atur Hak Akses
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              // View 2: Permission Matrix Grid for selected Role
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={() => setSelectedRole(null)}
                      style={{ marginBottom: '12px' }}
                    >
                      ← Kembali ke Daftar Role
                    </button>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                      Konfigurasi Izin: <u style={{ color: 'var(--primary)' }}>{selectedRole.role_name}</u>
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {selectedRole.id_role === 1 
                        ? 'Administrator memiliki bypass akses penuh untuk seluruh modul.' 
                        : `Tentukan modul mana saja yang dapat diakses oleh ${selectedRole.role_name}.`
                      }
                    </p>
                  </div>
                  {selectedRole.id_role !== 1 && (
                    <button 
                      onClick={handleSavePermissions}
                      className="btn btn-primary"
                      disabled={savingMatrix}
                    >
                      {savingMatrix ? 'Menyimpan...' : '💾 Simpan Perubahan Matriks'}
                    </button>
                  )}
                </div>

                <div className="table-wrapper" style={{ marginTop: '12px' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Modul Sistem</th>
                        <th style={{ width: '140px', textAlign: 'center' }}>Lihat (View)</th>
                        <th style={{ width: '140px', textAlign: 'center' }}>Input/Edit (Write)</th>
                        <th style={{ width: '140px', textAlign: 'center' }}>Hapus (Delete)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {permissionsMatrix.map((perm, idx) => {
                        const info = moduleLabels[perm.module_name] || { label: perm.module_name, desc: 'Modul sistem' };
                        const isAdminBypass = selectedRole.id_role === 1;

                        return (
                          <tr key={idx}>
                            <td>
                              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{info.label}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{info.desc}</div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <input 
                                type="checkbox"
                                style={{ width: '18px', height: '18px', cursor: isAdminBypass ? 'default' : 'pointer', accentColor: 'var(--primary)' }}
                                checked={isAdminBypass || perm.can_view}
                                disabled={isAdminBypass}
                                onChange={(e) => handleCheckboxChange(perm.module_name, 'can_view', e.target.checked)}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <input 
                                type="checkbox"
                                style={{ width: '18px', height: '18px', cursor: isAdminBypass ? 'default' : 'pointer', accentColor: 'var(--primary)' }}
                                checked={isAdminBypass || perm.can_write}
                                disabled={isAdminBypass}
                                onChange={(e) => handleCheckboxChange(perm.module_name, 'can_write', e.target.checked)}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <input 
                                type="checkbox"
                                style={{ width: '18px', height: '18px', cursor: isAdminBypass ? 'default' : 'pointer', accentColor: 'var(--primary)' }}
                                checked={isAdminBypass || perm.can_delete}
                                disabled={isAdminBypass}
                                onChange={(e) => handleCheckboxChange(perm.module_name, 'can_delete', e.target.checked)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {selectedRole.id_role !== 1 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      onClick={() => setSelectedRole(null)}
                      disabled={savingMatrix}
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleSavePermissions}
                      className="btn btn-primary"
                      disabled={savingMatrix}
                    >
                      {savingMatrix ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
