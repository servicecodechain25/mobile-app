import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { listUsers, countUsers, createUser, deleteUser, updateUser } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET - List admins (superadmin only)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const search = searchParams.get('q') || '';

    const [admins, total] = await Promise.all([
      listUsers({ page, pageSize, search, role: 'admin' }),
      countUsers({ search, role: 'admin' })
    ]);

    return NextResponse.json({ admins, total });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create admin (superadmin only)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, password, permissions } = await request.json();
    
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Don't stringify here - createUser will handle JSON.stringify
    // Pass permissions as object, not string
    
    const userId = await createUser({
      name,
      email,
      passwordHash,
      role: 'admin',
      permissions: permissions || null, // Pass as object, createUser will stringify
      createdBy: parseInt(session.user.id)
    });

    return NextResponse.json({ id: userId, name, email }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

