import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { deleteUser, updateUser, findUserByEmail } from '@/lib/db';

// PUT - Update admin (superadmin only)
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    const { name, email, permissions } = await request.json();
    
    if (!name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if email is already taken by another user
    const existingUser = await findUserByEmail(email);
    if (existingUser && existingUser.id !== id) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    await updateUser(id, { name, email, permissions });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete admin (superadmin only)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    
    // Prevent deleting yourself
    if (parseInt(session.user.id) === id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    await deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

