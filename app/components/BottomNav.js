'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Icon } from '@/app/components/Icons';
import { useTheme } from '@/app/contexts/ThemeContext';

export default function BottomNav() {
  const path = usePathname();
  const { data: session } = useSession();
  const { theme } = useTheme();
  
  // Ensure permissions is always an object
  let permissions = session?.user?.permissions;
  if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) {
    permissions = {};
  }
  const role = session?.user?.role;
  const hasPermission = (key) => {
    if (role === 'superadmin') return true;
    return permissions && typeof permissions === 'object' && permissions[key] === true;
  };
  
  const isDark = theme === 'dark';
  const cardBg = isDark ? '#1f2937' : '#fff';
  const borderColor = isDark ? '#374151' : '#ddd';
  const activeBg = isDark ? '#374151' : '#f5f5f5';
  const hoverBg = isDark ? '#4b5563' : '#fafafa';
  const activeColor = isDark ? '#f9fafb' : '#000';
  const inactiveColor = isDark ? '#9ca3af' : '#666';
  
  return (
    <nav className="bottomnav" style={{ 
      position: 'fixed', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      background: isDark ? '#1f2937' : '#ffffff', 
      borderTop: isDark ? '1px solid #374151' : '1px solid #e5e7eb', 
      display: 'flex', 
      justifyContent: 'space-around', 
      alignItems: 'center',
      padding: '8px 4px', 
      zIndex: 1100,
      boxShadow: isDark ? '0 -2px 8px rgba(0,0,0,0.2)' : '0 -2px 8px rgba(0,0,0,0.08)',
      height: '72px',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)',
      background: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)'
    }}>
      {hasPermission('dashboard') && (
        <BottomItem href="/dashboard" active={path === '/dashboard' || path.startsWith('/dashboard')} label="Scan">
          <Icon.Bulk width={20} height={20} />
        </BottomItem>
      )}
      {hasPermission('brands') && (
        <BottomItem href="/brands" active={path === '/brands' || path.startsWith('/brands')} label="Brands">
          <Icon.Edit width={20} height={20} />
        </BottomItem>
      )}
      {hasPermission('stock') && (
        <BottomItem href="/stock" active={path === '/stock' || path.startsWith('/stock')} label="Stock">
          <Icon.Box width={20} height={20} />
        </BottomItem>
      )}
      {hasPermission('staff') && (
        <BottomItem href="/staff" active={path === '/staff' || path.startsWith('/staff')} label="Staff">
          <Icon.Menu width={20} height={20} />
        </BottomItem>
      )}
      {role === 'superadmin' && (
        <BottomItem href="/admin" active={path === '/admin' || path.startsWith('/admin')} label="Admin">
          <Icon.Menu width={20} height={20} />
        </BottomItem>
      )}
    </nav>
  );
}

function BottomItem({ href, active, label, children }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // Active state: solid background with high contrast
  const activeBg = isDark ? '#667eea' : '#667eea';
  const activeColor = '#ffffff';
  // Inactive state: more muted
  const inactiveColor = isDark ? '#6b7280' : '#9ca3af';
  const hoverBg = isDark ? '#4b5563' : '#f3f4f6';
  
  return (
    <Link 
      href={href} 
      className={active ? 'active' : ''} 
      style={{ 
        textDecoration: 'none', 
        color: active ? activeColor : inactiveColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '10px 16px',
        borderRadius: '8px',
        background: active ? activeBg : 'transparent',
        transition: 'all 0.2s ease',
        fontWeight: active ? '600' : '400',
        fontSize: '11px',
        minWidth: '60px',
        opacity: active ? 1 : 0.6
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = hoverBg;
          e.currentTarget.style.opacity = '0.8';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.opacity = '0.6';
        }
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: active ? activeColor : inactiveColor,
        opacity: active ? 1 : 0.7
      }}>
        {children}
      </div>
      <div style={{ 
        fontSize: '11px', 
        fontWeight: active ? '600' : '400',
        lineHeight: 1.2,
        textAlign: 'center',
        color: active ? activeColor : inactiveColor,
        opacity: active ? 1 : 0.7
      }}>
        {label}
      </div>
    </Link>
  );
}
