import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { updateUser, deleteUser, getUserById } from '@/lib/db';

// PUT - Update staff
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'superadmin' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    const { name, email, permissions } = await request.json();
    
    if (!name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if admin can edit this staff (only if they created them)
    if (session.user.role === 'admin') {
      const staff = await getUserById(id);
      if (!staff || staff.created_by !== parseInt(session.user.id)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    await updateUser(id, { name, email, permissions });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete staff
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'superadmin' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    
    // Check if admin can delete this staff (only if they created them)
    if (session.user.role === 'admin') {
      const staff = await getUserById(id);
      if (!staff || staff.created_by !== parseInt(session.user.id)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    await deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

