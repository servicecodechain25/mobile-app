# Scanner App

A comprehensive barcode/QR code scanning application built with Next.js, featuring role-based access control, real-time scanning, and analytics dashboard.

## 🚀 Features

### Core Functionality
- **Real-time Barcode/QR Scanning** - Live camera scanning with ZXing library
- **Role-Based Access Control** - Superadmin and Admin roles with granular permissions
- **Seller Management** - CRUD operations for seller information
- **Scan Management** - Track and manage scanned codes with status updates
- **Analytics Dashboard** - Comprehensive reporting and charts
- **Responsive Design** - Mobile-first UI with desktop optimization

### Advanced Features
- **Permission-Based Navigation** - Menu items shown based on user permissions
- **Bulk Operations** - Bulk status updates and CSV export
- **Real-time Notifications** - Toast notifications for user feedback
- **Data Filtering** - Advanced filtering by date, status, seller, and search
- **Mobile Scanner** - Floating Action Button for quick scanning
- **Admin Management** - Superadmin can create and manage admin users

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React, JavaScript (JSX)
- **Authentication**: NextAuth.js with JWT
- **Database**: MySQL with raw queries (no ORM)
- **Styling**: CSS-in-JS with responsive design
- **Scanner**: ZXing library for barcode/QR detection

### Database Schema
- **Users**: Role-based access with permissions
- **Sellers**: Seller information management
- **Scans**: Barcode/QR scan data with status tracking

## 📋 Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

## 🛠️ Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd scanner_app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
# Create database and run schema
mysql -u root -p < schema.sql
```

### 4. Environment Configuration
Create `.env.local` file:
```env
# Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=scanner_app
MYSQL_SSL=false

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Optional: SSL for production
MYSQL_SSL=true
```

### 5. Create Superadmin User
```sql
-- Run this SQL to create the first superadmin
INSERT INTO `users` (`name`, `email`, `password`, `role`, `created_at`) VALUES
('Super Admin', 'superadmin@example.com', '$2a$10$Uo1Uq8eYVtY6l1I50L4O9uHaTn9S5nK5H8mD1pD0H0wT5n3iGQk2a', 'superadmin', NOW());
-- Password: superadmin123
```

### 6. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 👥 User Roles & Permissions

### Superadmin
- **Full Access**: All features and data
- **Admin Management**: Create, view, and delete admin users
- **Permission Assignment**: Set menu permissions for admin users
- **Data Visibility**: See all data across all admins

### Admin
- **Limited Access**: Based on assigned permissions
- **Menu Permissions**: Dashboard, Sellers, Scans, Analytics
- **Data Isolation**: Only see their own created data
- **No Admin Management**: Cannot create other users

### Permission System
```javascript
// Example admin permissions
{
  dashboard: true,    // Access to dashboard
  sellers: true,      // Access to sellers management
  scans: true,        // Access to scans management
  analytics: false    // No access to analytics
}
```

## 📱 Usage Guide

### For Superadmin
1. **Login** with superadmin credentials
2. **Create Admin Users** via Admin Management page
3. **Set Permissions** for each admin user
4. **Monitor Activity** across all admins

### For Admin Users
1. **Login** with admin credentials
2. **Access Permitted Pages** based on assigned permissions
3. **Create Sellers** (if sellers permission granted)
4. **Scan Codes** using mobile scanner
5. **Manage Scans** with status updates

### Scanning Process
1. **Open Scanner** via FAB button or Scans page
2. **Select Seller** from dropdown
3. **Start Scanning** - point camera at barcode/QR
4. **Auto-Save** - scan automatically saves on detection
5. **Navigate to Scans** - view and manage scanned data

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Users
- `GET /api/admin` - List admin users (superadmin only)
- `POST /api/admin` - Create admin user (superadmin only)
- `DELETE /api/admin/[id]` - Delete admin user (superadmin only)

### Sellers
- `GET /api/sellers` - List sellers with filtering
- `POST /api/sellers` - Create seller
- `PUT /api/sellers/[id]` - Update seller
- `DELETE /api/sellers/[id]` - Delete seller

### Scans
- `GET /api/scans` - List scans with filtering
- `POST /api/scans` - Create scan
- `PUT /api/scans/[id]` - Update scan status
- `DELETE /api/scans/[id]` - Delete scan
- `GET /api/scans/export` - Export scans to CSV
- `POST /api/scans/bulk` - Bulk status update

### Analytics
- `GET /api/analytics` - Get analytics data

## 🎨 UI Components

### Core Components
- **AppShell** - Main layout with navigation
- **Modal** - Reusable modal dialogs
- **ConfirmDialog** - Confirmation dialogs
- **BottomNav** - Mobile navigation
- **ToastProvider** - Notification system

### Icons
- Custom SVG icon set for consistent UI
- Responsive icon sizing
- Accessible icon implementation

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  email VARCHAR(191) UNIQUE NOT NULL,
  password VARCHAR(191) NOT NULL,
  role ENUM('superadmin', 'admin') DEFAULT 'admin',
  permissions JSON NULL,
  created_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Sellers Table
```sql
CREATE TABLE sellers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Scans Table
```sql
CREATE TABLE scans (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id INT UNSIGNED NULL,
  code VARCHAR(191) UNIQUE NOT NULL,
  status VARCHAR(32) DEFAULT 'process',
  created_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔒 Security Features

- **Password Hashing** - bcryptjs for secure password storage
- **JWT Authentication** - Secure session management
- **Role-Based Access** - Granular permission system
- **Input Validation** - Server-side validation for all inputs
- **SQL Injection Protection** - Parameterized queries
- **XSS Protection** - Sanitized user inputs

## 📱 Mobile Features

- **Responsive Design** - Mobile-first approach
- **Touch-Friendly UI** - Optimized for touch devices
- **Camera Integration** - Native camera access for scanning
- **Offline Capability** - Basic offline functionality
- **Progressive Web App** - PWA-ready architecture

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
```env
# Production database
MYSQL_HOST=your-production-host
MYSQL_USER=your-production-user
MYSQL_PASSWORD=your-production-password
MYSQL_DATABASE=scanner_app
MYSQL_SSL=true

# Production NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret
```

### Database Migration
```bash
# Run schema on production database
mysql -u production_user -p production_database < schema.sql
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check MySQL service is running
   - Verify connection credentials
   - Ensure database exists

2. **Scanner Not Working**
   - Check camera permissions
   - Ensure HTTPS in production
   - Verify ZXing library installation

3. **Authentication Issues**
   - Check NEXTAUTH_SECRET is set
   - Verify NEXTAUTH_URL matches domain
   - Clear browser cache and cookies

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev
```

## 📈 Performance Optimization

- **Database Indexing** - Optimized queries with proper indexes
- **Connection Pooling** - MySQL connection pooling
- **Image Optimization** - Optimized scanner camera settings
- **Code Splitting** - Dynamic imports for better performance
- **Caching** - Strategic caching for better response times

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Scanner App** - Built with ❤️ using Next.js and MySQL
