import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { listUsers, countUsers, createUser, listUsersByCreator, countUsersByCreator } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET - List staff (admin can see staff they created, superadmin sees all)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'superadmin' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const search = searchParams.get('q') || '';

    let staff, total;
    
    if (session.user.role === 'superadmin') {
      // Superadmin sees all staff
      [staff, total] = await Promise.all([
        listUsers({ page, pageSize, search, role: 'staff' }),
        countUsers({ search, role: 'staff' })
      ]);
    } else {
      // Admin sees only staff they created - filter at database level
      const userId = parseInt(session.user.id);
      
      // Use optimized database-level filtering
      [staff, total] = await Promise.all([
        listUsersByCreator({ page, pageSize, search, role: 'staff', createdBy: userId }),
        countUsersByCreator({ search, role: 'staff', createdBy: userId })
      ]);
    }

    return NextResponse.json({ staff, total });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create staff (admin can create staff)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'superadmin' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, password, permissions } = await request.json();
    
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = session.user.role === 'superadmin' ? null : parseInt(session.user.id);
    
    const staffId = await createUser({
      name,
      email,
      passwordHash,
      role: 'staff',
      permissions: permissions || {},
      createdBy: userId
    });

    return NextResponse.json({ id: staffId }, { status: 201 });
  } catch (error) {
    console.error('Error creating staff:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

