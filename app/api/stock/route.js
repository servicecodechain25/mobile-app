import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getStockStatistics } from '@/lib/db';

// GET - Get stock statistics
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.role === 'superadmin' ? null : parseInt(session.user.id);
    const userRole = session.user.role;

    const statistics = await getStockStatistics({ userId, userRole });

    return NextResponse.json(statistics);
  } catch (error) {
    console.error('Error fetching stock statistics:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

