import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { updateSoldRecord, deleteSoldRecord, getSoldRecordById, isUserInCompany, getImeiRecordById } from '@/lib/db';
import { ActivityLogger } from '@/lib/activityLogger';

// PUT - Update sold record
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    const { sold_name, sold_amount, sold_date, store } = await request.json();

    // Check if record exists and user has permission
    const record = await getSoldRecordById(id);
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Superadmin can update all
    if (session.user.role === 'superadmin') {
      // Allow
    } else if (session.user.role === 'admin') {
      // Admin can update their own records + records created by their staff
      const userId = parseInt(session.user.id);
      const recordCreatedBy = record.created_by ? parseInt(record.created_by) : null;
      if (recordCreatedBy && !await isUserInCompany(userId, recordCreatedBy)) {
        return NextResponse.json({ error: 'Unauthorized - You can only update your company records' }, { status: 403 });
      }
    } else {
      // Staff can only update their own records
      const userId = parseInt(session.user.id);
      const recordCreatedBy = record.created_by ? parseInt(record.created_by) : null;
      if (recordCreatedBy !== userId) {
        return NextResponse.json({ error: 'Unauthorized - You can only update your own records' }, { status: 403 });
      }
    }

    const oldRecord = { ...record };
    await updateSoldRecord(id, { soldName: sold_name, soldAmount: sold_amount, soldDate: sold_date, store });
    
    // Log activity
    if (session.user.role !== 'superadmin') {
      const userId = parseInt(session.user.id);
      const imeiRecord = await getImeiRecordById(record.imei_id);
      const changes = {
        soldName: oldRecord.sold_name !== sold_name ? { old: oldRecord.sold_name, new: sold_name } : null,
        soldAmount: oldRecord.sold_amount !== sold_amount ? { old: oldRecord.sold_amount, new: sold_amount } : null
      };
      await ActivityLogger.logSoldUpdate(userId, session.user.name, id, imeiRecord?.imei || 'N/A', changes, request);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating sold record:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete sold record
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    
    // Check if record exists and user has permission
    const record = await getSoldRecordById(id);
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Superadmin can delete all
    if (session.user.role === 'superadmin') {
      // Allow
    } else if (session.user.role === 'admin') {
      // Admin can delete their own records + records created by their staff
      const userId = parseInt(session.user.id);
      const recordCreatedBy = record.created_by ? parseInt(record.created_by) : null;
      if (recordCreatedBy && !await isUserInCompany(userId, recordCreatedBy)) {
        return NextResponse.json({ error: 'Unauthorized - You can only delete your company records' }, { status: 403 });
      }
    } else {
      // Staff can only delete their own records
      const userId = parseInt(session.user.id);
      const recordCreatedBy = record.created_by ? parseInt(record.created_by) : null;
      if (recordCreatedBy !== userId) {
        return NextResponse.json({ error: 'Unauthorized - You can only delete your own records' }, { status: 403 });
      }
    }

    const imeiRecord = await getImeiRecordById(record.imei_id);
    await deleteSoldRecord(id);
    
    // Log activity
    if (session.user.role !== 'superadmin') {
      const userId = parseInt(session.user.id);
      await ActivityLogger.logSoldDelete(userId, session.user.name, id, imeiRecord?.imei || 'N/A', request);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sold record:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

