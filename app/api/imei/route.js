import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { listImeiRecords, countImeiRecords, createImeiRecord } from '@/lib/db';
import { ActivityLogger } from '@/lib/activityLogger';

// GET - List IMEI records
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

    // Advanced filters
    const brand = searchParams.get('brand') || null;
    const status = searchParams.get('status') || null; // 'available', 'sold', 'all'
    const purchaseDateFrom = searchParams.get('purchaseDateFrom') || null;
    const purchaseDateTo = searchParams.get('purchaseDateTo') || null;
    const soldDateFrom = searchParams.get('soldDateFrom') || null;
    const soldDateTo = searchParams.get('soldDateTo') || null;
    const purchaseAmountMin = searchParams.get('purchaseAmountMin') || null;
    const purchaseAmountMax = searchParams.get('purchaseAmountMax') || null;
    const soldAmountMin = searchParams.get('soldAmountMin') || null;
    const soldAmountMax = searchParams.get('soldAmountMax') || null;
    const color = searchParams.get('color') || null;
    const ram = searchParams.get('ram') || null;
    const storage = searchParams.get('storage') || null;
    const purchaseName = searchParams.get('purchaseName') || null;

    const userId = session.user.role === 'superadmin' ? null : parseInt(session.user.id);
    const userRole = session.user.role;

    const filterParams = {
      page,
      pageSize,
      search,
      userId,
      userRole,
      brand,
      status,
      purchaseDateFrom,
      purchaseDateTo,
      soldDateFrom,
      soldDateTo,
      purchaseAmountMin: purchaseAmountMin ? parseFloat(purchaseAmountMin) : null,
      purchaseAmountMax: purchaseAmountMax ? parseFloat(purchaseAmountMax) : null,
      soldAmountMin: soldAmountMin ? parseFloat(soldAmountMin) : null,
      soldAmountMax: soldAmountMax ? parseFloat(soldAmountMax) : null,
      color,
      ram,
      storage,
      purchaseName
    };

    const [records, total] = await Promise.all([
      listImeiRecords(filterParams),
      countImeiRecords(filterParams)
    ]);

    return NextResponse.json({ records, total });
  } catch (error) {
    console.error('Error fetching IMEI records:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create IMEI record
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imei, purchase, amount, date, brand, model, color, ram, storage } = await request.json();
    
    if (!imei || !imei.trim()) {
      return NextResponse.json({ error: 'IMEI number is required' }, { status: 400 });
    }

    const userId = session.user.role === 'superadmin' ? null : parseInt(session.user.id);
    
    const recordId = await createImeiRecord({
      imei: imei.trim(),
      purchase: purchase?.trim() || null,
      amount: amount ? parseFloat(amount) : null,
      date: date || null,
      brand: brand || null,
      model: model?.trim() || null,
      color: color || null,
      ram: ram || null,
      storage: storage || null,
      createdBy: userId
    });

    if (recordId === null) {
      return NextResponse.json({ error: 'IMEI already exists' }, { status: 409 });
    }

    // Log activity
    if (userId) {
      await ActivityLogger.logIMEICreate(
        userId,
        session.user.name,
        recordId,
        imei.trim(),
        request
      );
    }

    return NextResponse.json({ id: recordId, imei: imei.trim() }, { status: 201 });
  } catch (error) {
    console.error('Error creating IMEI record:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'IMEI already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

