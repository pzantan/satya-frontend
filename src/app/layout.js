import './globals.css';

export const metadata = {
  title: 'Satya Teknik Indonesia',
  description: 'Sistem Manajemen Produksi - PT. Satya Teknik Indonesia',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
