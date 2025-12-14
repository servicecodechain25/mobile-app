import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { listSoldRecords, countSoldRecords, createSoldRecord, getImeiRecordById, isUserInCompany } from '@/lib/db';
import { ActivityLogger } from '@/lib/activityLogger';

// GET - List sold records
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const search = searchParams.get('q') || '';

    const userId = session.user.role === 'superadmin' ? null : parseInt(session.user.id);
    const userRole = session.user.role;

    const [records, total] = await Promise.all([
      listSoldRecords({ page, pageSize, search, userId, userRole }),
      countSoldRecords({ search, userId, userRole })
    ]);

    return NextResponse.json({ records, total });
  } catch (error) {
    console.error('Error fetching sold records:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create sold record
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imei_id, sold_name, sold_amount, sold_date, store } = await request.json();
    
    if (!imei_id) {
      return NextResponse.json({ error: 'IMEI ID is required' }, { status: 400 });
    }

    // Check if IMEI record exists and user has permission
    const imeiRecord = await getImeiRecordById(parseInt(imei_id));
    if (!imeiRecord) {
      return NextResponse.json({ error: 'IMEI record not found' }, { status: 404 });
    }

    // Superadmin can mark any IMEI as sold
    if (session.user.role === 'superadmin') {
      // Allow
    } else if (session.user.role === 'admin') {
      // Admin can mark their own IMEI + IMEI created by their staff as sold
      const userId = parseInt(session.user.id);
      const recordCreatedBy = imeiRecord.created_by ? parseInt(imeiRecord.created_by) : null;
      if (recordCreatedBy && !await isUserInCompany(userId, recordCreatedBy)) {
        return NextResponse.json({ error: 'Unauthorized - You can only mark your company IMEI records as sold' }, { status: 403 });
      }
    } else {
      // Staff can only mark their own IMEI as sold
      const userId = parseInt(session.user.id);
      const recordCreatedBy = imeiRecord.created_by ? parseInt(imeiRecord.created_by) : null;
      if (recordCreatedBy !== userId) {
        return NextResponse.json({ error: 'Unauthorized - You can only mark your own IMEI records as sold' }, { status: 403 });
      }
    }

    const userId = session.user.role === 'superadmin' ? null : parseInt(session.user.id);
    
    const recordId = await createSoldRecord({
      imeiId: parseInt(imei_id),
      soldName: sold_name,
      soldAmount: sold_amount,
      soldDate: sold_date,
      store: store,
      createdBy: userId
    });

    // Log activity
    if (userId) {
      await ActivityLogger.logSoldCreate(
        userId,
        session.user.name,
        recordId,
        imeiRecord.imei,
        sold_name || 'Unknown',
        request
      );
    }

    return NextResponse.json({ id: recordId }, { status: 201 });
  } catch (error) {
    console.error('Error creating sold record:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

