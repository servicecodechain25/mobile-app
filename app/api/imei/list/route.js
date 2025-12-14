import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getAllImeis } from '@/lib/db';

// GET - Get all IMEIs for dropdown
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const imeis = await getAllImeis({ limit: 100 });
    return NextResponse.json({ imeis });
  } catch (error) {
    console.error('Error fetching IMEIs:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

