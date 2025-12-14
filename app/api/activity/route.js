import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { listActivityLogs, countActivityLogs, getCompanyUserIds } from '@/lib/db';

// GET - List activity logs
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const action = searchParams.get('action') || null;
    const entityType = searchParams.get('entityType') || null;
    const startDate = searchParams.get('startDate') || null;
    const endDate = searchParams.get('endDate') || null;

    // Filter by user/company based on role
    let userIds = null;
    if (session.user.role === 'admin') {
      // Admin sees logs from their company (their own + their staff's logs)
      userIds = await getCompanyUserIds(parseInt(session.user.id));
    } else if (session.user.role === 'staff') {
      // Staff sees only their own logs
      userIds = [parseInt(session.user.id)];
    }
    // Superadmin sees all (userIds remains null)
    
    const [logs, total] = await Promise.all([
      listActivityLogs({ 
        page, 
        pageSize, 
        userId: userIds && userIds.length === 1 ? userIds[0] : null,
        userIds: userIds && userIds.length > 1 ? userIds : null,
        action, 
        entityType, 
        startDate, 
        endDate 
      }),
      countActivityLogs({ 
        userId: userIds && userIds.length === 1 ? userIds[0] : null,
        userIds: userIds && userIds.length > 1 ? userIds : null,
        action, 
        entityType, 
        startDate, 
        endDate 
      })
    ]);

    return NextResponse.json({ logs, total });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

