import { NextResponse } from 'next/server';
import { createUser, findUserByEmail } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await createUser({ 
      name, 
      email, 
      passwordHash, 
      role: 'admin',
      permissions: null,
      createdBy: null
    });
    return NextResponse.json({ id: userId, name, email }, { status: 201 });
  } catch (err) {
    console.error('Registration error:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage,
      stack: err.stack
    });
    // Return more specific error messages
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    return NextResponse.json({ 
      error: err.message || 'Server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}

