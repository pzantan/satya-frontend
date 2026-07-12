'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function OperatorLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for operator token specifically if needed, or generic satya_token
    const token = localStorage.getItem('satya_token');
    const userData = localStorage.getItem('satya_user');
    
    // Only redirect to login if we are NOT on the login page
    if (!token && !pathname.includes('/login')) {
      router.push('/produksi/operator/login');
      return;
    }
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('satya_token');
    localStorage.removeItem('satya_user');
    router.push('/produksi/operator/login');
  };

  // If on login page, render without header
  if (pathname.includes('/login')) {
    return <div className="operator-app-main">{children}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Navigation Bar */}
      <header style={{ 
        height: '60px', 
        background: '#1e293b', 
        color: 'white',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '32px', height: '32px', 
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', 
            borderRadius: '8px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '18px'
          }}>
            O
          </div>
          <span style={{ fontWeight: '700', fontSize: '1.2rem', letterSpacing: '0.5px' }}>Terminal Operator</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {user && (
            <div style={{ fontSize: '14px' }}>
              <span style={{ color: '#94a3b8' }}>Login sebagai: </span>
              <strong style={{ color: '#38bdf8' }}>{user.full_name || user.user_name}</strong>
            </div>
          )}
          <button 
            onClick={handleLogout}
            style={{
              background: 'transparent', border: '1px solid #ef4444', color: '#ef4444',
              padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {children}
      </main>
    </div>
  );
}
