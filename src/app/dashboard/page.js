'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import styles from './dashboard.module.css';
import api from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('wo'); // 'wo' or 'invoice'

  const [data, setData] = useState({
    summary: {
      totalCustomers: 0,
      totalWos: 0,
      activeWos: 0,
      totalInvoiceAmount: 0,
      totalInvoices: 0
    },
    monthlyData: [],
    topCustomers: [],
    recentWos: [],
    recentInvoices: [],
    availableYears: [new Date().getFullYear()]
  });

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
  }, [router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/dashboard?year=${selectedYear}`);
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedYear]);

  const handleLogout = () => {
    localStorage.removeItem('satya_token');
    localStorage.removeItem('satya_user');
    document.cookie = 'satya_token=; path=/; max-age=0';
    router.push('/login');
  };

  const fmtCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num || 0);
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
  const fmtNum = (n) => (n !== null && n !== undefined ? Number(n).toLocaleString('id-ID') : '0');

  // Chart math
  const maxInvoice = data.monthlyData.length > 0 ? Math.max(...data.monthlyData.map(d => d.invoiceAmount), 1) : 1;
  const maxWo = data.monthlyData.length > 0 ? Math.max(...data.monthlyData.map(d => d.woCount), 1) : 1;
  
  // Top customers progress bars math
  const maxCustAmount = data.topCustomers.length > 0 ? Math.max(...data.topCustomers.map(c => c.amount), 1) : 1;

  return (
    <AppLayout user={user} onLogout={handleLogout}>
      {/* Top Bar */}
      <header className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard Analitik</h1>
          <p className={styles.pageSubtitle}>
            Selamat datang kembali, <strong>{user?.full_name || user?.user_name}</strong>
          </p>
        </div>
        <div className={styles.topbarRight}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tahun Analisis:</span>
            <select
              className={styles.selectYear}
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {data.availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
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
        {/* Summary Stats Grid */}
        <div className={styles.statsGrid}>
          {/* Card 1: Total Customers */}
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
              <span className={styles.statLabel}>Total Pelanggan Aktif</span>
              <span className={styles.statValue}>{loading ? '...' : fmtNum(data.summary.totalCustomers)}</span>
            </div>
          </div>

          {/* Card 2: Work Order Tahun Ini */}
          <div className={`${styles.statCard} ${styles.statGreen}`}>
            <div className={styles.statIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div className={styles.statBody}>
              <span className={styles.statLabel}>Work Order Baru ({selectedYear})</span>
              <span className={styles.statValue}>{loading ? '...' : fmtNum(data.summary.totalWos)}</span>
            </div>
          </div>

          {/* Card 3: Work Order Aktif */}
          <div className={`${styles.statCard} ${styles.statOrange}`}>
            <div className={styles.statIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div className={styles.statBody}>
              <span className={styles.statLabel}>WO Sedang Proses ({selectedYear})</span>
              <span className={styles.statValue}>{loading ? '...' : fmtNum(data.summary.activeWos)}</span>
            </div>
          </div>

          {/* Card 4: Total Pendapatan Invoice */}
          <div className={`${styles.statCard} ${styles.statCyan}`}>
            <div className={styles.statIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className={styles.statBody}>
              <span className={styles.statLabel}>Nilai Invoice ({selectedYear})</span>
              <span className={styles.statValue} style={{ fontSize: '1.4rem' }}>
                {loading ? '...' : fmtCurrency(data.summary.totalInvoiceAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Tren Monthly Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h2 className={styles.chartTitle}>Tren Aktivitas Bulanan & Pendapatan ({selectedYear})</h2>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Visualisasi perbandingan jumlah Work Order dengan total nilai Invoice setiap bulan.
              </p>
            </div>
            <div className={styles.chartLegend}>
              <div className={styles.legendItem}>
                <div className={styles.legendColor} style={{ background: '#2563eb' }}></div>
                <span>Work Order (Banyaknya WO)</span>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendColor} style={{ background: '#10b981' }}></div>
                <span>Invoice (Rupiah)</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '280px', color: 'var(--text-muted)' }}>
              Memuat grafik tren...
            </div>
          ) : data.monthlyData.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '280px', color: 'var(--text-muted)' }}>
              Tidak ada data transaksi di tahun {selectedYear}.
            </div>
          ) : (
            <div className={styles.chartBody}>
              {data.monthlyData.map((d, index) => {
                const heightWo = `${(d.woCount / maxWo) * 80 + 5}%`;
                const heightInv = `${(d.invoiceAmount / maxInvoice) * 80 + 5}%`;

                return (
                  <div key={index} className={styles.chartColumn}>
                    {/* Tooltip */}
                    <div className={styles.chartTooltip}>
                      <strong style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '2px', marginBottom: '2px' }}>
                        {d.monthName} {selectedYear}
                      </strong>
                      <span>📁 WO Baru: <strong>{d.woCount} unit</strong></span>
                      <span>📦 Total Qty WO: <strong>{fmtNum(d.woQty)} pcs</strong></span>
                      <span>💰 Total Invoice: <strong>{fmtCurrency(d.invoiceAmount)}</strong></span>
                    </div>

                    <div className={styles.barGroup}>
                      {/* Bar 1: WO Count (Blue) */}
                      <div className={styles.barValue1} style={{ height: heightWo }} title={`WO: ${d.woCount}`}></div>
                      {/* Bar 2: Invoice Amount (Green) */}
                      <div className={styles.barValue2} style={{ height: heightInv }} title={`Invoice: ${fmtCurrency(d.invoiceAmount)}`}></div>
                    </div>
                    <span className={styles.barLabel}>{d.monthName}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lower Grid: Side-by-Side Panels */}
        <div className={styles.panelGrid}>
          {/* Top Customers Card */}
          <div className="card">
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Top 5 Pelanggan Terbesar ({selectedYear})</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Berdasarkan total nominal invoice yang telah terbit sepanjang tahun.
              </p>
            </div>
            <div className={styles.panelBody} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loading ? (
                <div style={{ color: 'var(--text-muted)' }}>Memuat data pelanggan...</div>
              ) : data.topCustomers.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Belum ada transaksi invoice pada tahun ini.</div>
              ) : (
                data.topCustomers.map((cust, i) => {
                  const widthPct = `${(cust.amount / maxCustAmount) * 100}%`;
                  return (
                    <div key={i} className={styles.custProgressRow}>
                      <div className={styles.custInfo}>
                        <span className={styles.custName}>{cust.name}</span>
                        <span className={styles.custValue}>{fmtCurrency(cust.amount)}</span>
                      </div>
                      <div className={styles.progressBarContainer}>
                        <div className={styles.progressBarFill} style={{ width: widthPct }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Activity Card with Tabs */}
          <div className="card">
            <div className={styles.panelHeader} style={{ paddingBottom: '0' }}>
              <h2 className={styles.panelTitle} style={{ marginBottom: '12px' }}>Aktivitas Transaksi Terbaru</h2>
              <div className={styles.tabContainer}>
                <div 
                  className={`${styles.tabItem} ${activeTab === 'wo' ? styles.tabActive : ''}`} 
                  onClick={() => setActiveTab('wo')}
                >
                  Work Order (Terbaru)
                </div>
                <div 
                  className={`${styles.tabItem} ${activeTab === 'invoice' ? styles.tabActive : ''}`} 
                  onClick={() => setActiveTab('invoice')}
                >
                  Invoice (Terbaru)
                </div>
              </div>
            </div>

            <div className={styles.panelBody} style={{ paddingTop: '8px' }}>
              {loading ? (
                <div style={{ color: 'var(--text-muted)' }}>Memuat aktivitas...</div>
              ) : activeTab === 'wo' ? (
                // WOs List
                data.recentWos.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Belum ada data Work Order.</div>
                ) : (
                  <div className={styles.recentList}>
                    {data.recentWos.map((wo, i) => (
                      <div key={i} className={styles.recentItem}>
                        <div className={styles.recentMain}>
                          <span className={styles.recentTitle}>{wo.wo_no}</span>
                          <span className={styles.recentSub}>{wo.customer_name} — Qty: {fmtNum(wo.qty)} pcs</span>
                        </div>
                        <div className={styles.recentMeta}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fmtDate(wo.tgl_wo)}</span>
                          <span 
                            className={styles.statusIndicator}
                            style={{ 
                              background: wo.sts === 1 ? '#dcfce7' : '#fff7ed',
                              color: wo.sts === 1 ? '#15803d' : '#c2410c'
                            }}
                          >
                            {wo.sts === 1 ? 'Selesai' : 'Sedang Proses'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // Invoices List
                data.recentInvoices.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Belum ada data Invoice.</div>
                ) : (
                  <div className={styles.recentList}>
                    {data.recentInvoices.map((inv, i) => (
                      <div key={i} className={styles.recentItem}>
                        <div className={styles.recentMain}>
                          <span className={styles.recentTitle}>{inv.noinv}</span>
                          <span className={styles.recentSub}>{inv.customer_name}</span>
                        </div>
                        <div className={styles.recentMeta}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fmtDate(inv.tglinv)}</span>
                          <span className={styles.recentAmount} style={{ color: '#059669' }}>
                            {fmtCurrency(inv.totalhrg)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
