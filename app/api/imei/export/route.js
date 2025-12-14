import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { listImeiRecords, countImeiRecords } from '@/lib/db';

// GET - Export IMEI records to CSV
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const userId = session.user.role === 'superadmin' ? null : parseInt(session.user.id);
    const userRole = session.user.role;

    // Get all records (no pagination for export)
    const records = await listImeiRecords({ 
      page: 1, 
      pageSize: 10000, 
      search, 
      userId, 
      userRole 
    });

    // Convert to CSV
    const headers = [
      'IMEI',
      'Purchase Name',
      'Purchase Amount',
      'Purchase Date',
      'Brand',
      'Model',
      'Color',
      'RAM',
      'Storage',
      'Sold Name',
      'Sold Amount',
      'Sold Date',
      'Store',
      'Profit',
      'Created At'
    ];

    const csvRows = [
      headers.join(',')
    ];

    records.forEach(record => {
      const purchaseAmount = parseFloat(record.amount) || 0;
      const soldAmount = parseFloat(record.sold_amount) || 0;
      const profit = soldAmount > 0 ? soldAmount - purchaseAmount : '';
      
      const row = [
        `"${record.imei || ''}"`,
        `"${record.purchase || ''}"`,
        purchaseAmount || '',
        record.date ? new Date(record.date).toLocaleDateString('en-IN') : '',
        `"${record.brand || ''}"`,
        `"${record.model || ''}"`,
        `"${record.color || ''}"`,
        `"${record.ram || ''}"`,
        `"${record.storage || ''}"`,
        `"${record.sold_name || ''}"`,
        soldAmount || '',
        record.sold_date ? new Date(record.sold_date).toLocaleDateString('en-IN') : '',
        `"${record.store || ''}"`,
        profit !== '' ? profit : '',
        record.created_at ? new Date(record.created_at).toLocaleDateString('en-IN') : ''
      ];
      csvRows.push(row.join(','));
    });

    const csv = csvRows.join('\n');
    const filename = `imei-records-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Error exporting IMEI records:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

