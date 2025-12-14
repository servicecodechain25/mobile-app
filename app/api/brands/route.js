import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { listBrands, countBrands, createBrand, getAllActiveBrands } from '@/lib/db';

// GET - List brands or get all active brands
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    
    if (all) {
      // Return all active brands for dropdown
      const brands = await getAllActiveBrands();
      return NextResponse.json({ brands });
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);
    const search = searchParams.get('q') || '';
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const [brands, total] = await Promise.all([
      listBrands({ page, pageSize, search, activeOnly }),
      countBrands({ search, activeOnly })
    ]);

    return NextResponse.json({ brands, total });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create brand
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, isActive = true } = await request.json();
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    const userId = session.user.role === 'superadmin' ? null : parseInt(session.user.id);
    
    const brandId = await createBrand({
      name: name.trim(),
      isActive,
      createdBy: userId
    });

    if (brandId === null) {
      return NextResponse.json({ error: 'Brand already exists' }, { status: 409 });
    }

    return NextResponse.json({ id: brandId, name: name.trim() }, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Brand already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

