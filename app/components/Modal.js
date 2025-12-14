'use client';

/**
 * Reusable modal component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether modal is open
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {Function} props.onClose - Close handler
 * @param {boolean} props.fullscreen - Whether modal is fullscreen
 */
export function Modal({ open, title, children, onClose, fullscreen = false }) {
  if (!open) return null;
  
  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0,0,0,0.6)', 
      display: 'grid', 
      placeItems: 'center', 
      zIndex: 3000,
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div 
        className="card" 
        style={{ 
          background: '#ffffff', 
          width: fullscreen ? '100%' : '90%', 
          maxWidth: fullscreen ? '100%' : 500, 
          borderRadius: fullscreen ? 0 : 12, 
          padding: '20px', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          border: 'none',
          animation: 'slideUp 0.3s ease'
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#111827',
            margin: 0
          }}>
            {title}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#6b7280'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#f3f4f6';
            }}
          >
            ×
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/**
 * Confirmation dialog component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether dialog is open
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Confirmation message
 * @param {string} props.confirmText - Confirm button text
 * @param {string} props.cancelText - Cancel button text
 * @param {Function} props.onConfirm - Confirm handler
 * @param {Function} props.onCancel - Cancel handler
 */
export function ConfirmDialog({ 
  open, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel 
}) {
  if (!open) return null;
  
  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0,0,0,0.6)', 
      display: 'grid', 
      placeItems: 'center', 
      zIndex: 3000,
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div 
        className="card" 
        style={{ 
          background: '#ffffff', 
          width: '95%', 
          maxWidth: 420, 
          borderRadius: 20, 
          padding: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.3s ease'
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '700', 
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            {title}
          </h2>
        </div>
        <div style={{ 
          marginBottom: 24,
          fontSize: '15px',
          color: '#6b7280',
          lineHeight: '1.5'
        }}>
          {message}
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 12, 
          justifyContent: 'flex-end' 
        }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              background: '#ffffff',
              color: '#6b7280',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f3f4f6';
              e.target.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#ffffff';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#ffffff',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}


