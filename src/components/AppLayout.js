'use client';
import { useState } from 'react';
import Sidebar from './Sidebar';

export default function AppLayout({ children, user, onLogout }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
    </div>
  );
}
