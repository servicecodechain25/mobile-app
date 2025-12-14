'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Modal } from '@/app/components/Modal';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/contexts/ThemeContext';

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setName(data.user.name || '');
        setEmail(data.user.email || '');
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Validate password if changing
      if (showPasswordForm && newPassword) {
        if (newPassword.length < 6) {
          setError('New password must be at least 6 characters');
          setSubmitting(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setError('New passwords do not match');
          setSubmitting(false);
          return;
        }
      }

      const updateData = {
        name: name.trim(),
        email: email.trim()
      };

      if (showPasswordForm && newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Profile updated successfully');
        // Update session if name or email changed
        if (name !== user.name || email !== user.email) {
          await updateSession();
        }
        // Reset password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
        // Reload profile
        await fetchProfile();
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>Loading profile...</div>
      </div>
    );
  }

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#1f2937' : '#fff';
  const textColor = isDark ? '#f9fafb' : '#000';
  const mutedColor = isDark ? '#9ca3af' : '#666';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const inputBg = isDark ? '#111827' : '#fff';
  const cardBg = isDark ? '#1f2937' : '#fff';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        padding: '20px 0'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: `1px solid ${borderColor}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '600', color: textColor, margin: '0 0 8px 0' }}>
                Company Profile
              </h1>
              <p style={{ fontSize: '14px', color: mutedColor, margin: '0' }}>
                Manage your company information and account settings
              </p>
            </div>
            {/* Theme Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: mutedColor, fontWeight: '500' }}>Theme</label>
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: isDark ? '#374151' : '#f3f4f6',
                  color: textColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? '#4b5563' : '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? '#374151' : '#f3f4f6';
                }}
              >
                {isDark ? (
                  <>
                    <span>🌙</span>
                    <span>Dark Mode</span>
                  </>
                ) : (
                  <>
                    <span>☀️</span>
                    <span>Light Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div style={{
            background: isDark ? '#7f1d1d' : '#fee',
            color: isDark ? '#fca5a5' : '#c33',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            border: isDark ? '1px solid #991b1b' : 'none'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: isDark ? '#14532d' : '#efe',
            color: isDark ? '#86efac' : '#3c3',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            border: isDark ? '1px solid #166534' : 'none'
          }}>
            {success}
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Company Name */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: textColor,
              marginBottom: '8px'
            }}>
              Company Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${borderColor}`,
                borderRadius: '8px',
                fontSize: '15px',
                boxSizing: 'border-box',
                background: inputBg,
                color: textColor,
                transition: 'all 0.2s ease'
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: textColor,
              marginBottom: '8px'
            }}>
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${borderColor}`,
                borderRadius: '8px',
                fontSize: '15px',
                boxSizing: 'border-box',
                background: inputBg,
                color: textColor,
                transition: 'all 0.2s ease'
              }}
            />
          </div>

          {/* Role Display (Read-only) */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: textColor,
              marginBottom: '8px'
            }}>
              Role
            </label>
            <div style={{
              width: '100%',
              padding: '12px 16px',
              border: `2px solid ${borderColor}`,
              borderRadius: '8px',
              fontSize: '15px',
              background: isDark ? '#111827' : '#f5f5f5',
              color: mutedColor,
              textTransform: 'capitalize'
            }}>
              {user?.role || 'N/A'}
            </div>
          </div>

          {/* Password Change Section */}
          <div style={{
            marginTop: '8px',
            paddingTop: '20px',
            borderTop: `1px solid ${borderColor}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: textColor, margin: '0 0 4px 0' }}>
                  Change Password
                </h3>
                <p style={{ fontSize: '13px', color: mutedColor, margin: '0' }}>
                  Update your account password
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(!showPasswordForm);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                style={{
                  padding: '8px 16px',
                  background: showPasswordForm ? (isDark ? '#374151' : '#f5f5f5') : (isDark ? '#f9fafb' : '#000'),
                  color: showPasswordForm ? textColor : (isDark ? '#000' : '#fff'),
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {showPasswordForm && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: textColor,
                    marginBottom: '8px'
                  }}>
                    Current Password *
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required={showPasswordForm && newPassword}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${borderColor}`,
                      borderRadius: '8px',
                      fontSize: '15px',
                      boxSizing: 'border-box',
                      background: inputBg,
                      color: textColor,
                      transition: 'all 0.2s ease'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: textColor,
                    marginBottom: '8px'
                  }}>
                    New Password *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required={showPasswordForm}
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${borderColor}`,
                      borderRadius: '8px',
                      fontSize: '15px',
                      boxSizing: 'border-box',
                      background: inputBg,
                      color: textColor,
                      transition: 'all 0.2s ease'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: mutedColor, margin: '4px 0 0 0' }}>
                    Must be at least 6 characters
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: textColor,
                    marginBottom: '8px'
                  }}>
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required={showPasswordForm && newPassword}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${borderColor}`,
                      borderRadius: '8px',
                      fontSize: '15px',
                      boxSizing: 'border-box',
                      background: inputBg,
                      color: textColor,
                      transition: 'all 0.2s ease'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding: '12px 24px',
                background: isDark ? '#374151' : '#f5f5f5',
                color: textColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? '#4b5563' : '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark ? '#374151' : '#f5f5f5';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px 24px',
                background: submitting ? (isDark ? '#4b5563' : '#ccc') : (isDark ? '#f9fafb' : '#000'),
                color: submitting ? mutedColor : (isDark ? '#000' : '#fff'),
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

