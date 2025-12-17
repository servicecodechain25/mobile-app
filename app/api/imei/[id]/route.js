import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { updateImeiRecord, deleteImeiRecord, getImeiRecordById, isUserInCompany, getSoldRecordByImeiId } from '@/lib/db';
import { ActivityLogger } from '@/lib/activityLogger';

// GET - Get single IMEI record
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    const record = await getImeiRecordById(id);
    
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Check permissions
    if (session.user.role === 'superadmin') {
      // Allow
    } else if (session.user.role === 'admin') {
      const userId = parseInt(session.user.id);
      const recordCreatedBy = record.created_by ? parseInt(record.created_by) : null;
      if (recordCreatedBy && !await isUserInCompany(userId, recordCreatedBy)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else {
      const userId = parseInt(session.user.id);
      const recordCreatedBy = record.created_by ? parseInt(record.created_by) : null;
      if (recordCreatedBy !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Get sold record if exists
    const soldRecord = await getSoldRecordByImeiId(id);
    const recordWithSold = {
      ...record,
      sold_name: soldRecord?.sold_name || null,
      sold_amount: soldRecord?.sold_amount || null,
      sold_date: soldRecord?.sold_date || null,
      store: soldRecord?.store || null
    };

    return NextResponse.json({ record: recordWithSold });
  } catch (error) {
    console.error('Error fetching IMEI record:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - Update IMEI record
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    const { purchase, amount, date, brand, model, color, ram, storage } = await request.json();

    // Check if record exists and user has permission
    const record = await getImeiRecordById(id);
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
    await updateImeiRecord(id, { purchase, amount, date, brand, model, color, ram, storage });
    
    // Log activity
    if (session.user.role !== 'superadmin') {
      const userId = parseInt(session.user.id);
      const changes = {
        purchase: oldRecord.purchase !== purchase ? { old: oldRecord.purchase, new: purchase } : null,
        amount: oldRecord.amount !== amount ? { old: oldRecord.amount, new: amount } : null,
        brand: oldRecord.brand !== brand ? { old: oldRecord.brand, new: brand } : null,
        model: oldRecord.model !== model ? { old: oldRecord.model, new: model } : null
      };
      await ActivityLogger.logIMEIUpdate(userId, session.user.name, id, record.imei, changes, request);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating IMEI record:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete IMEI record
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    
    // Check if record exists and user has permission
    const record = await getImeiRecordById(id);
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

    const imeiValue = record.imei;
    await deleteImeiRecord(id);
    
    // Log activity
    if (session.user.role !== 'superadmin') {
      const userId = parseInt(session.user.id);
      await ActivityLogger.logIMEIDelete(userId, session.user.name, id, imeiValue, request);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting IMEI record:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

