import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getUserById, listUsersByCreator, countUsersByCreator, listImeiRecords, countImeiRecords, listSoldRecords, countSoldRecords, getStockStatistics } from '@/lib/db';

// GET - Get company details (staff, IMEI, sold, stock) for a specific admin
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = parseInt(params.id, 10);
    
    // Get admin details
    const admin = await getUserById(adminId);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Get staff count
    const staffCount = await countUsersByCreator({ role: 'staff', createdBy: adminId });
    
    // Get IMEI records count
    const imeiCount = await countImeiRecords({ userId: adminId, userRole: 'admin' });
    
    // Get sold records count
    const soldCount = await countSoldRecords({ userId: adminId, userRole: 'admin' });
    
    // Get stock statistics
    const stockStats = await getStockStatistics({ userId: adminId, userRole: 'admin' });

    // Get recent staff (first 5)
    const recentStaff = await listUsersByCreator({ page: 1, pageSize: 5, role: 'staff', createdBy: adminId });

    // Get recent IMEI records (first 5)
    const recentImei = await listImeiRecords({ page: 1, pageSize: 5, userId: adminId, userRole: 'admin' });

    // Get recent sold records (first 5)
    const recentSold = await listSoldRecords({ page: 1, pageSize: 5, userId: adminId, userRole: 'admin' });

    return NextResponse.json({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        permissions: admin.permissions,
        created_at: admin.created_at
      },
      stats: {
        staffCount,
        imeiCount,
        soldCount,
        stockStats
      },
      recent: {
        staff: recentStaff,
        imei: recentImei,
        sold: recentSold
      }
    });
  } catch (error) {
    console.error('Error fetching company details:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

