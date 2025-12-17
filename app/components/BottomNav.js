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
      background: isDark ? '#000000' : '#ffffff', 
      borderTop: isDark ? '1px solid #374151' : '1px solid #e5e7eb', 
      display: 'flex', 
      justifyContent: 'space-around', 
      alignItems: 'center',
      padding: '6px 0', 
      zIndex: 1100,
      boxShadow: isDark ? '0 -2px 8px rgba(0,0,0,0.3)' : '0 -1px 4px rgba(0,0,0,0.1)',
      height: '60px'
    }}>
      {hasPermission('dashboard') && (
        <BottomItem href="/dashboard" active={path === '/dashboard' || path.startsWith('/dashboard')} label="Home">
          <Icon.Home width={22} height={22} />
        </BottomItem>
      )}
      {hasPermission('brands') && (
        <BottomItem href="/brands" active={path === '/brands' || path.startsWith('/brands')} label="Brands">
          <Icon.Edit width={22} height={22} />
        </BottomItem>
      )}
      {hasPermission('stock') && (
        <BottomItem href="/stock" active={path === '/stock' || path.startsWith('/stock')} label="Stock">
          <Icon.Box width={22} height={22} />
        </BottomItem>
      )}
      {hasPermission('staff') && (
        <BottomItem href="/staff" active={path === '/staff' || path.startsWith('/staff')} label="Staff">
          <Icon.Menu width={22} height={22} />
        </BottomItem>
      )}
      {role === 'superadmin' && (
        <BottomItem href="/admin" active={path === '/admin' || path.startsWith('/admin')} label="Admin">
          <Icon.Menu width={22} height={22} />
        </BottomItem>
      )}
    </nav>
  );
}

function BottomItem({ href, active, label, children }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // Monochromatic colors - no blue/purple
  const activeColor = isDark ? '#ffffff' : '#111827';
  const inactiveColor = isDark ? '#6b7280' : '#9ca3af';
  
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
        gap: '2px',
        padding: '4px 8px',
        borderRadius: '12px',
        background: 'transparent',
        fontWeight: active ? '600' : '400',
        fontSize: '10px',
        minWidth: '50px',
        flex: 1
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: active ? activeColor : inactiveColor
      }}>
        {children}
      </div>
      <div style={{ 
        fontSize: '10px', 
        fontWeight: active ? '600' : '400',
        lineHeight: 1.2,
        textAlign: 'center',
        color: active ? activeColor : inactiveColor,
        marginTop: '2px'
      }}>
        {label}
      </div>
    </Link>
  );
}
