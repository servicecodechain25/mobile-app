'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Register page component with responsive design
 * Modern registration form with gradient background
 */
export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'Failed to register. Please try again.');
        return;
      }

      // Redirect to login on success
      router.push('/login?message=Registration successful! Please login.');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{
        background: '#ffffff',
        padding: '40px',
        maxWidth: '450px',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#111', marginBottom: '8px' }}>
            ✨ Join ProScanner
          </div>
          <p style={{
            color: '#666',
            fontSize: '16px',
            margin: '0'
          }}>
            Create your account to get started
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '8px'
            }}>
              Full Name
            </label>
            <input 
              type="text" 
              placeholder="Enter your full name"
              value={name} 
              onChange={e => setName(e.target.value)} 
              required
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '8px'
            }}>
              Email Address
            </label>
            <input 
              type="email" 
              placeholder="Enter your email"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input 
              type="password" 
              placeholder="Create a password (min 6 characters)"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '8px'
            }}>
              Confirm Password
            </label>
            <input 
              type="password" 
              placeholder="Confirm your password"
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>

          {error && (
            <div style={{
              background: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: loading ? '#ccc' : '#111',
              color: '#fff',
              padding: '16px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            {loading ? '🔄 Creating Account...' : '✨ Create Account'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
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
            Already have an account?
          </p>
          <Link href="/login" style={{
            color: '#667eea',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '16px'
          }}>
            🔐 Sign In
          </Link>
        </div>

        {/* Back to Home */}
        <div style={{
          textAlign: 'center',
          marginTop: '16px'
        }}>
          <Link href="/" style={{
            color: '#999',
            textDecoration: 'none',
            fontSize: '14px'
          }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

