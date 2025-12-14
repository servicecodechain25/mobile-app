import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getUserById, updateUserProfile } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET - Get current user profile
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const user = await getUserById(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't return password hash
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { name, email, currentPassword, newPassword } = await request.json();

    // Get current user to verify password if changing password
    const currentUser = await getUserById(userId);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData = {};
    
    if (name !== undefined && name.trim()) {
      updateData.name = name.trim();
    }
    
    if (email !== undefined && email.trim()) {
      updateData.email = email.trim();
    }
    
    // If password change is requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
      }
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      
      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);
      updateData.passwordHash = passwordHash;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await updateUserProfile(userId, updateData);

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

