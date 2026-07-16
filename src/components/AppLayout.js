'use client';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const tourStepsConfig = {
  '/home': [
    { element: '.page-title', popover: { title: 'Neutral Home (Beranda)', description: 'Halaman dashboard netral yang bersih dari angka finansial untuk menjaga kerahasiaan operasional perusahaan.', side: 'bottom', align: 'start' } },
    { element: '.page-subtitle', popover: { title: 'Kuantitas & Tren', description: 'Menampilkan performa pengerjaan Work Order (WO) dibandingkan dengan Finished Goods yang diselesaikan.', side: 'bottom', align: 'start' } }
  ],
  '/dashboard': [
    { element: '.page-title', popover: { title: 'Dashboard Analitik', description: 'Panel kontrol finansial utama. Hanya dapat diakses oleh staff dengan hak akses Keuangan atau Manajemen.', side: 'bottom', align: 'start' } },
    { element: 'select', popover: { title: 'Pilih Tahun', description: 'Ganti rentang waktu tahun transaksi berjalan untuk menyaring diagram tren omset.', side: 'bottom', align: 'start' } }
  ],
  '/master/customers': [
    { element: '.page-title', popover: { title: 'Master Pelanggan', description: 'Modul pendaftaran profil perusahaan customer, alamat kirim, serta nama PIC (UP Customer).', side: 'bottom', align: 'start' } },
    { element: '.btn-primary', popover: { title: 'Pendaftaran Baru', description: 'Klik tombol ini untuk memasukkan data customer baru.', side: 'left', align: 'start' } },
    { element: 'table', popover: { title: 'Tabel Pelanggan', description: 'Gunakan kolom aksi untuk mengubah (Edit) atau menghapus data pelanggan.', side: 'top', align: 'start' } }
  ],
  '/master/materials': [
    { element: '.page-title', popover: { title: 'Master Material', description: 'Modul pendataan jenis bahan baku produksi, ukuran dimensi, serta harga standar pembelian.', side: 'bottom', align: 'start' } },
    { element: '.btn-primary', popover: { title: 'Tambah Material', description: 'Tambahkan jenis material baru di sini.', side: 'left', align: 'start' } }
  ],
  '/master/machines': [
    { element: '.page-title', popover: { title: 'Master Mesin', description: 'Kelola aset mesin produksi pabrik seperti mesin Bubut, CNC, Milling, dan Grinding.', side: 'bottom', align: 'start' } }
  ],
  '/master/subconts': [
    { element: '.page-title', popover: { title: 'Master Subcontractor', description: 'Kelola daftar vendor pihak ketiga/mitra subcontractor untuk pengerjaan luar.', side: 'bottom', align: 'start' } }
  ],
  '/master/drawings': [
    { element: '.page-title', popover: { title: 'Master Item (Drawing)', description: 'Kelola database nomor gambar teknik produk (drawing number) beserta spesifikasinya.', side: 'bottom', align: 'start' } }
  ],
  '/master/toolkind': [
    { element: '.page-title', popover: { title: 'Master Toolkind', description: 'Kelola klasifikasi jenis pisau potong, insert, atau perkakas produksi lainnya.', side: 'bottom', align: 'start' } }
  ],
  '/master/sales': [
    { element: '.page-title', popover: { title: 'Master Sales', description: 'Kelola tim sales marketing yang mendampingi masing-masing customer.', side: 'bottom', align: 'start' } }
  ],
  '/master/proses': [
    { element: '.page-title', popover: { title: 'Master Proses', description: 'Definisikan standar urutan kerja pengerjaan barang di lantai produksi.', side: 'bottom', align: 'start' } }
  ],
  '/master/users': [
    { element: '.page-title', popover: { title: 'Master User', description: 'Kelola kredensial login akun staff, password (terenkripsi MD5), serta penugasan departemen kerja.', side: 'bottom', align: 'start' } },
    { element: '.btn-primary', popover: { title: 'Tambah User', description: 'Klik untuk membuat akun staff baru.', side: 'left', align: 'start' } }
  ],
  '/master/roles': [
    { element: '.page-title', popover: { title: 'Pengaturan Hak Akses', description: 'Matriks izin per modul. Hubungkan otorisasi centang (Lihat, Edit, Hapus) untuk setiap role departemen.', side: 'bottom', align: 'start' } },
    { element: 'table', popover: { title: 'Tabel Role', description: 'Pilih role tertentu lalu klik "Atur Hak Akses" untuk membuka matriks izin.', side: 'top', align: 'start' } }
  ],
  '/wo': [
    { element: '.page-title', popover: { title: 'Daftar Work Order', description: 'Pantau seluruh antrean surat perintah kerja (Work Order) beserta target kuantitas pengerjaannya.', side: 'bottom', align: 'start' } },
    { element: '.btn-primary', popover: { title: 'Terbitkan WO Baru', description: 'Klik di sini untuk membuat Work Order baru dan mencetak lembar barcode produksinya.', side: 'left', align: 'start' } }
  ],
  '/wo/add': [
    { element: '.page-title', popover: { title: 'Formulir Work Order', description: 'Lengkapi nomor menggambar (drawing), kuantitas, harga, dan sales pendamping untuk membuat WO.', side: 'bottom', align: 'start' } }
  ],
  '/produksi/prepare': [
    { element: '.page-title', popover: { title: 'Persiapan Produksi (Prepare)', description: 'Pindai barcode pada lembar WO fisik di sini untuk memasukkan produk ke antrean produksi aktif.', side: 'bottom', align: 'start' } },
    { element: 'input[type="text"]', popover: { title: 'Scan Barcode', description: 'Gunakan scanner barcode untuk mendaftarkan dokumen perintah kerja ke mesin.', side: 'bottom', align: 'start' } }
  ],
  '/produksi/fg': [
    { element: '.page-title', popover: { title: 'Finished Goods (FG)', description: 'Lapor barang jadi. Pindai barcode produk yang telah lolos inspeksi akhir QC untuk menambahkan stok produk siap kirim.', side: 'bottom', align: 'start' } }
  ],
  '/produksi/ng': [
    { element: '.page-title', popover: { title: 'Not Good (NG) / Cacat', description: 'Laporkan produk gagal beserta analisis kualitas 5W1H dan estimasi kerugian material & proses.', side: 'bottom', align: 'start' } }
  ],
  '/delivery/customer': [
    { element: '.page-title', popover: { title: 'Pengiriman Customer', description: 'Cetak surat jalan pengiriman produk jadi ke customer, serta kirim sinkronisasi data ke software Accurate.', side: 'bottom', align: 'start' } }
  ],
  '/delivery/subcont': [
    { element: '.page-title', popover: { title: 'Pengiriman Subcon', description: 'Monitor pengiriman barang setengah jadi ke pihak subcontractor luar untuk pengerjaan lanjutan.', side: 'bottom', align: 'start' } }
  ],
  '/invoice': [
    { element: '.page-title', popover: { title: 'Modul Penagihan (Invoice)', description: 'Cetak faktur invoice dengan PPN 11% berdasarkan Surat Jalan terkirim, serta lakukan sinkron piutang ke Accurate.', side: 'bottom', align: 'start' } }
  ]
};

export default function AppLayout({ children, user, onLogout }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const startTour = () => {
    const path = window.location.pathname;
    // Fallback to general tour steps if no route match
    const steps = tourStepsConfig[path] || [
      { element: '.app-main', popover: { title: 'Panduan Modul', description: 'Gunakan menu navigasi di panel kiri untuk mengelola transaksi produksi, master data, dan penagihan.', side: 'bottom', align: 'start' } }
    ];

    const driverObj = driver({
      showProgress: true,
      animate: true,
      nextBtnText: 'Lanjut →',
      prevBtnText: '← Kembali',
      doneBtnText: 'Selesai',
      steps: steps.map(step => ({
        ...step,
        popover: {
          ...step.popover,
          title: step.popover.title,
          description: step.popover.description
        }
      }))
    });

    driverObj.drive();
  };

  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #2563eb, #06b6d4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>Satya Teknik</span>
        </div>
        <button className="mobile-menu-btn" onClick={() => setIsMobileOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </header>

      {/* Sidebar overlay for mobile */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'open' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar Container */}
      <div className={`sidebar-container ${isMobileOpen ? 'open' : ''}`}>
        <Sidebar user={user} onLogout={onLogout} onMobileClose={() => setIsMobileOpen(false)} />
      </div>

      {/* Main Content */}
      <main className="app-main">
        {children}
      </main>

      {/* Floating Help Tour Button */}
      <button 
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary, #2563eb), #1d4ed8)',
          color: 'white',
          border: 'none',
          boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4), 0 4px 6px -2px rgba(37, 99, 235, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          transform: isHovered ? 'scale(1.1) translateY(-2px)' : 'scale(1) translateY(0)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={startTour}
        title="Mulai Panduan Halaman Ini"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </button>
    </div>
  );
}
