import Link from 'next/link';

/**
 * Homepage component with responsive design
 * Landing page for Admin App
 */
export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      padding: '40px',
      maxWidth: '800px',
      width: '100%',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      textAlign: 'center'
    }}>
      {/* Header Section */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#111', marginBottom: '16px', lineHeight: '1.2' }}>
          👥 Admin App
        </div>
        <p style={{
          fontSize: '20px',
          color: '#666',
          margin: '0 0 24px 0',
          lineHeight: '1.5'
        }}>
          Simple admin management system with role-based access control
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
          <span style={{ background: '#f3f4f6', color: '#374151', padding: '6px 12px', borderRadius: '16px', fontSize: '14px', fontWeight: '500', border: '1px solid #e5e7eb' }}>
            🔐 Role-Based Access
          </span>
          <span style={{ background: '#f3f4f6', color: '#374151', padding: '6px 12px', borderRadius: '16px', fontSize: '14px', fontWeight: '500', border: '1px solid #e5e7eb' }}>
            👥 User Management
          </span>
          {/* <span style={{ background: '#f3f4f6', color: '#374151', padding: '6px 12px', borderRadius: '16px', fontSize: '14px', fontWeight: '500', border: '1px solid #e5e7eb' }}>
            📱 Mobile Optimized
          </span> */}
        </div>
      </div>

      {/* Features Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        <FeatureCard
          icon="👥"
          title="User Management"
          description="Superadmin can create and manage admin users with custom permissions"
        />
        <FeatureCard
          icon="🔐"
          title="Secure Authentication"
          description="Password hashing and JWT-based session management"
        />
        {/* <FeatureCard
          icon="📱"
          title="Responsive Design"
          description="Mobile-first design optimized for all devices"
        /> */}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <Link href="/login" style={{ background: '#111', color: '#fff', padding: '14px 28px', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: 16, display: 'inline-block', minWidth: 140 }}>
          Login
        </Link>
        {/* <Link href="/register" style={{
          background: 'white',
          color: '#667eea',
          padding: '14px 28px',
          borderRadius: '10px',
          textDecoration: 'none',
          fontWeight: '600',
          fontSize: '16px',
          border: '2px solid #667eea',
          transition: 'all 0.3s ease',
          display: 'inline-block',
          minWidth: '140px'
        }}>
          ✨ Register
        </Link> */}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '40px',
        paddingTop: '24px',
        borderTop: '1px solid #eee',
        color: '#666',
        fontSize: '14px'
      }}>
        <p style={{ margin: '0 0 8px 0' }}>
         Designed & Developed by <a href="https://buildcodechain.com" target="_blank" rel="noopener noreferrer">BuildCodeChain</a>
        </p>
        <p style={{ margin: '0', fontSize: '12px' }}>
          © {new Date().getFullYear()} Admin App. All rights reserved.
        </p>
      </div>
    </div>
  </div>
  );
}

/**
 * Feature card component
 * @param {Object} props - Component props
 * @param {string} props.icon - Feature icon
 * @param {string} props.title - Feature title
 * @param {string} props.description - Feature description
 */
function FeatureCard({ icon, title, description }) {
  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      border: '1px solid #f0f0f0',
      transition: 'all 0.3s ease',
      textAlign: 'left'
    }}>
      <div style={{
        fontSize: '32px',
        marginBottom: '12px'
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        margin: '0 0 8px 0',
        color: '#333'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '14px',
        color: '#666',
        margin: '0',
        lineHeight: '1.5'
      }}>
        {description}
      </p>
    </div>
  );
}


