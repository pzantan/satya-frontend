'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import styles from './roles.module.css';
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
  'wo': { label: 'Work Order (WO)', desc: 'Penerbitan surat perintah kerja' },
  'produksi-prepare': { label: 'Prepare Production', desc: 'Persiapan antrean kerja & print barcode' },
  'produksi-fg': { label: 'Finished Goods', desc: 'Pencatatan produk selesai' },
  'produksi-ng': { label: 'Not Good (NG)', desc: 'Analisis kegagalan & barang reject' },
  'delivery-customer': { label: 'Delivery Customer', desc: 'Surat jalan & pengiriman ke customer' },
  'delivery-subcont': { label: 'Delivery Subcont', desc: 'Kirim barang proses ke subkontraktor' },
  'invoice': { label: 'Invoice', desc: 'Cetak tagihan & data keuangan piutang' }
};

export default function RolesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'roles'
  const [loading, setLoading] = useState(true);

  // Data states
  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissionsMatrix, setPermissionsMatrix] = useState([]);
  const [savingMatrix, setSavingMatrix] = useState(false);

  // Modal states
  const [userModal, setUserModal] = useState({ open: false, user: null, roleId: '' });
  const [roleModal, setRoleModal] = useState({ open: false, role_name: '', description: '' });

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
    try {
      const [usersData, rolesData] = await Promise.all([
        api.get('/api/roles/users'),
        api.get('/api/roles')
      ]);
      setUsersList(usersData);
      setRolesList(rolesData);
      
      if (rolesData.length > 0) {
        setSelectedRole(rolesData[0]);
      }
    } catch (err) {
      console.error('Failed to load roles and users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === '1') {
      loadInitialData();
    }
  }, [user]);

  // Load permissions whenever selectedRole changes
  useEffect(() => {
    if (selectedRole) {
      const fetchPermissions = async () => {
        try {
          const matrix = await api.get(`/api/roles/${selectedRole.id_role}/permissions`);
          setPermissionsMatrix(matrix);
        } catch (err) {
          console.error('Failed to load permissions matrix:', err);
        }
      };
      fetchPermissions();
    }
  }, [selectedRole]);

  const handleLogout = () => {
    localStorage.removeItem('satya_token');
    localStorage.removeItem('satya_user');
    document.cookie = 'satya_token=; path=/; max-age=0';
    router.push('/login');
  };

  // User role assignment
  const handleOpenUserModal = (targetUser) => {
    setUserModal({
      open: true,
      user: targetUser,
      roleId: targetUser.role || ''
    });
  };

  const handleSaveUserRole = async () => {
    try {
      await api.put(`/api/roles/users/${userModal.user.id}`, { role: userModal.roleId });
      setUserModal({ open: false, user: null, roleId: '' });
      loadInitialData();
    } catch (err) {
      alert(err.message || 'Gagal mengubah role user');
    }
  };

  // Add new Role
  const handleCreateRole = async () => {
    if (!roleModal.role_name) return;
    try {
      const newRole = await api.post('/api/roles', {
        role_name: roleModal.role_name,
        description: roleModal.description
      });
      setRoleModal({ open: false, role_name: '', description: '' });
      const rolesData = await api.get('/api/roles');
      setRolesList(rolesData);
      setSelectedRole(newRole);
    } catch (err) {
      alert(err.message || 'Gagal membuat role');
    }
  };

  // Delete Role
  const handleDeleteRole = async (id_role, e) => {
    e.stopPropagation();
    if (id_role === 1) return;
    if (!confirm('Apakah Anda yakin ingin menghapus role ini beserta seluruh matriks izinnya?')) return;

    try {
      await api.delete(`/api/roles/${id_role}`);
      const rolesData = await api.get('/api/roles');
      setRolesList(rolesData);
      if (rolesData.length > 0) {
        setSelectedRole(rolesData[0]);
      } else {
        setSelectedRole(null);
        setPermissionsMatrix([]);
      }
    } catch (err) {
      alert(err.message || 'Gagal menghapus role');
    }
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
    } catch (err) {
      alert(err.message || 'Gagal menyimpan matriks hak akses');
    } finally {
      setSavingMatrix(false);
    }
  };

  return (
    <AppLayout user={user} onLogout={handleLogout}>
      {/* Top Bar */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Pengaturan Hak Akses & Matriks Modul</h1>
          <p className={styles.subtitle}>Kelola departemen pengguna beserta kewenangan izin menu/modul</p>
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('users')}
        >
          📂 Manajemen User (Pengguna)
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'roles' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          🛡️ Matriks Role & Hak Akses
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Memuat data...</div>
      ) : activeTab === 'users' ? (
        // Users Table Tab
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama Pengguna</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role Aktif</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name}</td>
                  <td><code>{u.user_name}</code></td>
                  <td>{u.email_addres}</td>
                  <td>
                    <span className={`${styles.badge} ${u.role === '1' ? styles.badgeAdmin : ''}`}>
                      {u.role_name}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => handleOpenUserModal(u)}
                      className={styles.actionBtn}
                      style={{ borderColor: 'var(--primary-color, #2563eb)', color: 'var(--primary-color, #2563eb)' }}
                    >
                      Ubah Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Role Permission Matrix Tab
        <div className={styles.matrixGrid}>
          {/* Roles list */}
          <div className={styles.roleList}>
            <button 
              onClick={() => setRoleModal({ open: true, role_name: '', description: '' })}
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '8px' }}
            >
              ＋ Tambah Role Baru
            </button>
            {rolesList.map((r, i) => (
              <div 
                key={i} 
                className={`${styles.roleItem} ${selectedRole?.id_role === r.id_role ? styles.roleActive : ''}`}
                onClick={() => setSelectedRole(r)}
              >
                <span className={styles.roleItemName}>{r.role_name}</span>
                <span className={styles.roleItemDesc}>{r.description || 'Tidak ada deskripsi.'}</span>
                
                {r.id_role !== 1 && (
                  <button 
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteRole(r.id_role, e)}
                    title="Hapus Role"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Matrix table panel */}
          {selectedRole ? (
            <div className={styles.card}>
              <div className={styles.matrixHeader}>
                <div>
                  <h3 className={styles.matrixTitle}>Konfigurasi Akses: <u>{selectedRole.role_name}</u></h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Izin berlakukan untuk seluruh pengguna dengan role ini. {selectedRole.id_role === 1 && 'Administrator memiliki bypass akses penuh.'}
                  </p>
                </div>
                <div className={styles.matrixActions}>
                  {selectedRole.id_role !== 1 && (
                    <button 
                      onClick={handleSavePermissions}
                      className="btn btn-primary"
                      disabled={savingMatrix}
                    >
                      {savingMatrix ? 'Menyimpan...' : '💾 Simpan Matriks Hak Akses'}
                    </button>
                  )}
                </div>
              </div>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nama Modul</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Lihat (View)</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Input/Edit (Write)</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Hapus (Delete)</th>
                  </tr>
                </thead>
                <tbody>
                  {permissionsMatrix.map((perm, idx) => {
                    const info = moduleLabels[perm.module_name] || { label: perm.module_name, desc: 'Modul aplikasi' };
                    const isAdminBypass = selectedRole.id_role === 1;

                    return (
                      <tr key={idx}>
                        <td>
                          <span className={styles.moduleLabel}>{info.label}</span>
                          <span className={styles.moduleKey}>{info.desc}</span>
                        </td>
                        <td className={styles.checkboxCell}>
                          <input 
                            type="checkbox"
                            className={styles.customCheckbox}
                            checked={isAdminBypass || perm.can_view}
                            disabled={isAdminBypass}
                            onChange={(e) => handleCheckboxChange(perm.module_name, 'can_view', e.target.checked)}
                          />
                        </td>
                        <td className={styles.checkboxCell}>
                          <input 
                            type="checkbox"
                            className={styles.customCheckbox}
                            checked={isAdminBypass || perm.can_write}
                            disabled={isAdminBypass}
                            onChange={(e) => handleCheckboxChange(perm.module_name, 'can_write', e.target.checked)}
                          />
                        </td>
                        <td className={styles.checkboxCell}>
                          <input 
                            type="checkbox"
                            className={styles.customCheckbox}
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
          ) : (
            <div style={{ color: 'var(--text-muted)', background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
              Pilih atau buat role di samping kiri untuk mengkonfigurasi hak akses modul.
            </div>
          )}
        </div>
      )}

      {/* User Role edit modal */}
      {userModal.open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Ubah Departemen / Role User</h3>
              <button onClick={() => setUserModal({ open: false, user: null, roleId: '' })} className={styles.closeBtn}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Pilih Role Baru untuk <strong>{userModal.user.full_name}</strong>:</label>
                <select 
                  className="form-control"
                  value={userModal.roleId}
                  onChange={(e) => setUserModal(prev => ({ ...prev, roleId: e.target.value }))}
                >
                  <option value="">-- Tanpa Role (Akses Terkunci) --</option>
                  {rolesList.map(r => (
                    <option key={r.id_role} value={r.id_role}>{r.role_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                onClick={() => setUserModal({ open: false, user: null, roleId: '' })} 
                className={styles.actionBtn}
              >
                Batal
              </button>
              <button onClick={handleSaveUserRole} className="btn btn-primary">
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {roleModal.open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Tambah Role Baru</h3>
              <button onClick={() => setRoleModal({ open: false, role_name: '', description: '' })} className={styles.closeBtn}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className="form-group">
                <label className="form-label">Nama Role:</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Contoh: PPIC Staff, Operator Bubut"
                  value={roleModal.role_name}
                  onChange={(e) => setRoleModal(prev => ({ ...prev, role_name: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Deskripsi:</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Keterangan kewenangan..."
                  value={roleModal.description}
                  onChange={(e) => setRoleModal(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                onClick={() => setRoleModal({ open: false, role_name: '', description: '' })} 
                className={styles.actionBtn}
              >
                Batal
              </button>
              <button 
                onClick={handleCreateRole} 
                className="btn btn-primary"
                disabled={!roleModal.role_name}
              >
                Tambah Role
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
