import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getImeiByImei, getSoldRecordByImeiId, isUserInCompany } from '@/lib/db';

// GET - Check if IMEI exists
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imei = searchParams.get('imei');

    if (!imei || !imei.trim()) {
      return NextResponse.json({ error: 'IMEI is required' }, { status: 400 });
    }

    const record = await getImeiByImei(imei.trim());
    
    if (!record) {
      return NextResponse.json({ exists: false });
    }

    // Check if user has permission to access this record
    // Superadmin can access all
    if (session.user.role === 'superadmin') {
      // Allow access
    } else if (session.user.role === 'admin') {
      // Admin can access their own records + records created by their staff
      const userId = parseInt(session.user.id);
      const recordCreatedBy = record.created_by ? parseInt(record.created_by) : null;
      
      if (recordCreatedBy && !await isUserInCompany(userId, recordCreatedBy)) {
        return NextResponse.json({ 
          exists: true, 
          record: null,
          accessDenied: true,
          message: 'This IMEI belongs to another company'
        });
      }
    } else {
      // Staff can only access their own records
      const userId = parseInt(session.user.id);
      const recordCreatedBy = record.created_by ? parseInt(record.created_by) : null;
      if (recordCreatedBy !== userId) {
        return NextResponse.json({ 
          exists: true, 
          record: null,
          accessDenied: true,
          message: 'This IMEI belongs to another user'
        });
      }
    }

    // Check if already sold
    const soldRecord = await getSoldRecordByImeiId(record.id);
    
    return NextResponse.json({ 
      exists: true, 
      record: record,
      alreadySold: !!soldRecord,
      soldRecord: soldRecord
    });
  } catch (error) {
    console.error('Error checking IMEI:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

