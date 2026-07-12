'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import styles from './dashboard.module.css';
import api from '@/lib/api';

// ... (keep the statCards array outside, or it's fine we can just replace the imports and the return)


const statCards = [
  {
    id: 'stat-customers',
    label: 'Total Pelanggan',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    color: 'blue',
    endpoint: '/api/customers',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ customers: '...' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('satya_token');
    const userData = localStorage.getItem('satya_user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Load dashboard stats
    const loadStats = async () => {
      try {
        const res = await api.get('/api/customers');
        setStats((prev) => ({ ...prev, customers: res.data?.length ?? 0 }));
      } catch {
        setStats((prev) => ({ ...prev, customers: '-' }));
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('satya_token');
    localStorage.removeItem('satya_user');
    document.cookie = 'satya_token=; path=/; max-age=0';
    router.push('/login');
  };

  return (
    <AppLayout user={user} onLogout={handleLogout}>
      {/* Top Bar */}
      <header className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Selamat datang, <strong>{user?.full_name || user?.user_name}</strong>
          </p>
        </div>
        <div className={styles.topbarRight}>
          <div className={styles.dateChip}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </header>

      <div className={styles.content}>
        {/* Stat Cards */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statBlue}`}>
            <div className={styles.statIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className={styles.statBody}>
              <span className={styles.statLabel}>Total Pelanggan</span>
              <span className={styles.statValue}>{loading ? '...' : stats.customers}</span>
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.statGreen}`}>
            <div className={styles.statIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div className={styles.statBody}>
              <span className={styles.statLabel}>Work Order</span>
              <span className={styles.statValue}>—</span>
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.statOrange}`}>
            <div className={styles.statIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div className={styles.statBody}>
              <span className={styles.statLabel}>Produksi Aktif</span>
              <span className={styles.statValue}>—</span>
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.statCyan}`}>
            <div className={styles.statIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13" rx="2"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div className={styles.statBody}>
              <span className={styles.statLabel}>Pengiriman</span>
              <span className={styles.statValue}>—</span>
            </div>
          </div>
        </div>

        {/* Info Panels */}
        <div className={styles.panelGrid}>
          <div className={`card ${styles.panel}`}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Selamat Datang di Sistem Baru</h2>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.welcomeContent}>
                <div className={styles.welcomeIcon}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h3>Satya Teknik Indonesia</h3>
                <p>Aplikasi telah berhasil dimigrasikan dari CodeIgniter ke Next.js + Express. Backend API tersedia di <code>http://localhost:5000</code> dengan dokumentasi lengkap di <a href="http://localhost:5000/api-docs" target="_blank" rel="noreferrer">Swagger UI</a>.</p>
                <div className={styles.techStack}>
                  <span className={styles.techBadge} style={{ background: '#dbeafe', color: '#1d4ed8' }}>Next.js 15</span>
                  <span className={styles.techBadge} style={{ background: '#dcfce7', color: '#15803d' }}>Express.js</span>
                  <span className={styles.techBadge} style={{ background: '#fce7f3', color: '#9d174d' }}>Prisma ORM</span>
                  <span className={styles.techBadge} style={{ background: '#fef9c3', color: '#92400e' }}>MySQL</span>
                  <span className={styles.techBadge} style={{ background: '#ede9fe', color: '#5b21b6' }}>JWT Auth</span>
                  <span className={styles.techBadge} style={{ background: '#ffedd5', color: '#c2410c' }}>Swagger UI</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`card ${styles.panel}`}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Modul Tersedia</h2>
            </div>
            <div className={styles.moduleList}>
              {[
                { label: 'Master Pelanggan', href: '/master/customers', ready: true },
                { label: 'Master Material', href: '/master/materials', ready: true },
                { label: 'Master Mesin', href: '/master/machines', ready: false },
                { label: 'Work Order (WO)', href: '/wo', ready: false },
                { label: 'Produksi', href: '/produksi', ready: false },
                { label: 'Finished Goods (FG)', href: '/fg', ready: false },
                { label: 'Pengiriman', href: '/delivery', ready: false },
                { label: 'Invoice', href: '/invoice', ready: false },
              ].map((mod) => (
                <a key={mod.href} href={mod.ready ? mod.href : '#'} className={`${styles.moduleItem} ${!mod.ready ? styles.moduleDisabled : ''}`}>
                  <span className={styles.moduleLabel}>{mod.label}</span>
                  <span className={mod.ready ? `badge badge-success` : `badge badge-warning`}>
                    {mod.ready ? 'Aktif' : 'Coming Soon'}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
