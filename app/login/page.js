'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Login page component with responsive design
 * Modern login form with gradient background
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        setError('Invalid credentials. Please check your email and password.');
        return;
      }
      
      // Get user session to determine redirect
      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();
      
      // Check if there's a callbackUrl from middleware redirect
      const callbackUrl = searchParams.get('callbackUrl');
      
      // Determine redirect based on role and permissions (same logic as AppShell)
      let redirectPath = '/dashboard';
      if (sessionData?.user) {
        const role = sessionData.user.role;
        const permissions = sessionData.user.permissions || {};
        const hasPermission = (key) => permissions[key] === true;
        
        // Superadmin always goes to Admin Management
        if (role === 'superadmin') {
          redirectPath = '/admin';
        } else {
          // If callbackUrl exists, check if user has permission for that page
          if (callbackUrl) {
            // Extract path from callbackUrl (handle both relative and absolute URLs)
            let callbackPath = callbackUrl;
            try {
              // Try to parse as URL if it's absolute
              if (callbackUrl.startsWith('http://') || callbackUrl.startsWith('https://')) {
                const urlObj = new URL(callbackUrl);
                callbackPath = urlObj.pathname;
              } else {
                // Remove query params if present
                callbackPath = callbackUrl.split('?')[0];
              }
            } catch (e) {
              // If parsing fails, just use the callbackUrl as-is
              callbackPath = callbackUrl.split('?')[0];
            }
            
            // Check if user has permission for the callback page
            if (callbackPath === '/dashboard' && hasPermission('dashboard')) {
              redirectPath = '/dashboard';
            } else if (callbackPath === '/brands' && hasPermission('brands')) {
              redirectPath = '/brands';
            } else if (callbackPath === '/stock' && hasPermission('stock')) {
              redirectPath = '/stock';
            } else if (callbackPath === '/reports' && hasPermission('reports')) {
              redirectPath = '/reports';
            } else if (callbackPath === '/activity' && hasPermission('activity')) {
              redirectPath = '/activity';
            } else if (callbackPath === '/profile' && hasPermission('profile')) {
              redirectPath = '/profile';
            } else if (callbackPath === '/staff' && hasPermission('staff')) {
              redirectPath = '/staff';
            } else if (callbackPath === '/admin' && role === 'superadmin') {
              redirectPath = '/admin';
            } else {
              // User doesn't have permission for callbackUrl, use first available page
              if (hasPermission('dashboard')) redirectPath = '/dashboard';
              else if (hasPermission('brands')) redirectPath = '/brands';
              else if (hasPermission('stock')) redirectPath = '/stock';
              else if (hasPermission('reports')) redirectPath = '/reports';
              else if (hasPermission('activity')) redirectPath = '/activity';
              else if (hasPermission('profile')) redirectPath = '/profile';
              else if (hasPermission('staff')) redirectPath = '/staff';
            }
          } else {
            // No callbackUrl, use first available page based on permissions
            if (hasPermission('dashboard')) redirectPath = '/dashboard';
            else if (hasPermission('brands')) redirectPath = '/brands';
            else if (hasPermission('stock')) redirectPath = '/stock';
            else if (hasPermission('reports')) redirectPath = '/reports';
            else if (hasPermission('activity')) redirectPath = '/activity';
            else if (hasPermission('profile')) redirectPath = '/profile';
            else if (hasPermission('staff')) redirectPath = '/staff';
          }
        }
      }
      
      // Use replace instead of push to avoid callbackUrl in history
      router.replace(redirectPath);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px',
      position: 'relative'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        padding: '48px',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '32px',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
          }}>
            📱
          </div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#111827', 
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em'
          }}>
            Welcome Back
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '15px',
            margin: '0',
            fontWeight: '500'
          }}>
            Sign in to continue to IMEI Manager
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '24px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Email Address
            </label>
            <input 
              type="email" 
              placeholder="name@example.com"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '15px',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                background: '#ffffff',
                color: '#111827'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Password
            </label>
            <input 
              type="password" 
              placeholder="Enter your password"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '15px',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                background: '#ffffff',
                color: '#111827'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              textAlign: 'center',
              border: '1px solid #fecaca',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: loading 
                ? '#9ca3af' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              padding: '14px 24px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)',
              marginTop: '8px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        {/* <div style={{
          textAlign: 'center',
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #eee'
        }}>
          <p style={{
            color: '#666',
            fontSize: '14px',
            margin: '0 0 8px 0'
          }}>
            Don't have an account?
          </p>
          <Link href="/register" style={{
            color: '#667eea',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '16px'
          }}>
            ✨ Create Account
          </Link>
        </div> */}

        {/* Back to Home */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <Link href="/" style={{
            color: '#6b7280',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.color = '#667eea'}
          onMouseLeave={(e) => e.target.style.color = '#6b7280'}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ color: '#fff', fontSize: '16px' }}>Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

