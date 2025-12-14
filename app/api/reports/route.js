import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getDbPool, getCompanyUserIds } from '@/lib/db';

// GET - Get reports data
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || null;
    const endDate = searchParams.get('endDate') || null;

    const pool = getDbPool();
    const userId = session.user.role === 'superadmin' ? null : parseInt(session.user.id);
    const userRole = session.user.role;

    // Get company user IDs for filtering
    let userIds = null;
    if (userRole === 'admin') {
      userIds = await getCompanyUserIds(userId);
    } else if (userRole === 'staff') {
      userIds = [userId];
    }

    // Build date filter
    let dateFilter = '';
    let dateParams = [];
    if (startDate || endDate) {
      const conditions = [];
      if (startDate) {
        conditions.push('i.date >= ?');
        dateParams.push(startDate);
      }
      if (endDate) {
        conditions.push('i.date <= ?');
        dateParams.push(endDate);
      }
      dateFilter = `AND ${conditions.join(' AND ')}`;
    }

    // Build user filter for IMEI records
    let imeiUserFilter = '';
    let imeiUserParams = [];
    if (userIds && userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',');
      imeiUserFilter = `AND i.created_by IN (${placeholders})`;
      imeiUserParams = [...userIds];
    } else if (userId && userRole !== 'superadmin') {
      imeiUserFilter = 'AND i.created_by = ?';
      imeiUserParams = [userId];
    }

    // Build user filter for sold records
    let soldUserFilter = '';
    let soldUserParams = [];
    if (userIds && userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',');
      soldUserFilter = `AND s.created_by IN (${placeholders})`;
      soldUserParams = [...userIds];
    } else if (userId && userRole !== 'superadmin') {
      soldUserFilter = 'AND s.created_by = ?';
      soldUserParams = [userId];
    }

    // 1. Sales Trend (Daily sales for last 30 days or date range)
    let salesTrendWhere = ['s.sold_date IS NOT NULL'];
    let salesTrendParams = [];
    
    if (soldUserFilter) {
      salesTrendWhere.push(soldUserFilter.replace('AND ', ''));
      salesTrendParams.push(...soldUserParams);
    }
    
    if (startDate) {
      salesTrendWhere.push('s.sold_date >= ?');
      salesTrendParams.push(startDate);
    }
    if (endDate) {
      salesTrendWhere.push('s.sold_date <= ?');
      salesTrendParams.push(endDate);
    }
    if (!startDate && !endDate) {
      salesTrendWhere.push('s.sold_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
    }

    const salesTrendQuery = `
      SELECT 
        DATE(s.sold_date) as date,
        COUNT(*) as count,
        SUM(s.sold_amount) as total_amount
      FROM sold_records s
      INNER JOIN imei_records i ON s.imei_id = i.id
      WHERE ${salesTrendWhere.join(' AND ')}
      GROUP BY DATE(s.sold_date)
      ORDER BY date ASC
    `;
    const [salesTrendRows] = await pool.execute(salesTrendQuery, salesTrendParams);

    // 2. Brand Distribution
    let brandDistWhere = ['i.brand IS NOT NULL'];
    let brandDistParams = [];
    
    if (imeiUserFilter) {
      brandDistWhere.push(imeiUserFilter.replace('AND ', ''));
      brandDistParams.push(...imeiUserParams);
    }
    
    if (startDate) {
      brandDistWhere.push('i.date >= ?');
      brandDistParams.push(startDate);
    }
    if (endDate) {
      brandDistWhere.push('i.date <= ?');
      brandDistParams.push(endDate);
    }

    const brandDistQuery = `
      SELECT 
        i.brand,
        COUNT(*) as count,
        SUM(i.amount) as total_purchase,
        SUM(s.sold_amount) as total_sold,
        SUM(s.sold_amount) - SUM(i.amount) as profit
      FROM imei_records i
      LEFT JOIN sold_records s ON s.imei_id = i.id AND s.id = (
        SELECT id FROM sold_records WHERE imei_id = i.id ORDER BY created_at DESC LIMIT 1
      )
      WHERE ${brandDistWhere.join(' AND ')}
      GROUP BY i.brand
      ORDER BY count DESC
      LIMIT 10
    `;
    const [brandDistRows] = await pool.execute(brandDistQuery, brandDistParams);

    // 3. Monthly Sales (last 12 months)
    let monthlySalesWhere = ['s.sold_date IS NOT NULL'];
    let monthlySalesParams = [];
    
    if (soldUserFilter) {
      monthlySalesWhere.push(soldUserFilter.replace('AND ', ''));
      monthlySalesParams.push(...soldUserParams);
    }
    
    if (startDate) {
      monthlySalesWhere.push('s.sold_date >= ?');
      monthlySalesParams.push(startDate);
    }
    if (endDate) {
      monthlySalesWhere.push('s.sold_date <= ?');
      monthlySalesParams.push(endDate);
    }
    if (!startDate && !endDate) {
      monthlySalesWhere.push('s.sold_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)');
    }

    const monthlySalesQuery = `
      SELECT 
        DATE_FORMAT(s.sold_date, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(s.sold_amount) as total_amount,
        SUM(s.sold_amount - i.amount) as profit
      FROM sold_records s
      INNER JOIN imei_records i ON s.imei_id = i.id
      WHERE ${monthlySalesWhere.join(' AND ')}
      GROUP BY DATE_FORMAT(s.sold_date, '%Y-%m')
      ORDER BY month ASC
    `;
    const [monthlySalesRows] = await pool.execute(monthlySalesQuery, monthlySalesParams);

    // 4. Top Selling Brands (by quantity)
    let topBrandsWhere = ['i.brand IS NOT NULL'];
    let topBrandsParams = [];
    
    if (soldUserFilter) {
      topBrandsWhere.push(soldUserFilter.replace('AND ', ''));
      topBrandsParams.push(...soldUserParams);
    }
    
    if (startDate) {
      topBrandsWhere.push('s.sold_date >= ?');
      topBrandsParams.push(startDate);
    }
    if (endDate) {
      topBrandsWhere.push('s.sold_date <= ?');
      topBrandsParams.push(endDate);
    }

    const topBrandsQuery = `
      SELECT 
        i.brand,
        COUNT(*) as sold_count,
        SUM(s.sold_amount) as total_revenue
      FROM sold_records s
      INNER JOIN imei_records i ON s.imei_id = i.id
      WHERE ${topBrandsWhere.join(' AND ')}
      GROUP BY i.brand
      ORDER BY sold_count DESC
      LIMIT 10
    `;
    const [topBrandsRows] = await pool.execute(topBrandsQuery, topBrandsParams);

    // 5. Purchase vs Sales Comparison
    let comparisonWhere = ['i.date IS NOT NULL'];
    let comparisonParams = [];
    
    if (imeiUserFilter) {
      comparisonWhere.push(imeiUserFilter.replace('AND ', ''));
      comparisonParams.push(...imeiUserParams);
    }
    
    if (startDate) {
      comparisonWhere.push('i.date >= ?');
      comparisonParams.push(startDate);
    }
    if (endDate) {
      comparisonWhere.push('i.date <= ?');
      comparisonParams.push(endDate);
    }
    if (!startDate && !endDate) {
      comparisonWhere.push('i.date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)');
    }

    const comparisonQuery = `
      SELECT 
        DATE_FORMAT(i.date, '%Y-%m') as month,
        SUM(i.amount) as total_purchase,
        SUM(CASE WHEN s.id IS NOT NULL THEN s.sold_amount ELSE 0 END) as total_sales
      FROM imei_records i
      LEFT JOIN sold_records s ON s.imei_id = i.id AND s.id = (
        SELECT id FROM sold_records WHERE imei_id = i.id ORDER BY created_at DESC LIMIT 1
      )
      WHERE ${comparisonWhere.join(' AND ')}
      GROUP BY DATE_FORMAT(i.date, '%Y-%m')
      ORDER BY month ASC
    `;
    const [comparisonRows] = await pool.execute(comparisonQuery, comparisonParams);

    // 6. Overall Statistics
    let statsWhere = ['1=1'];
    let statsParams = [];
    
    if (imeiUserFilter) {
      statsWhere.push(imeiUserFilter.replace('AND ', ''));
      statsParams.push(...imeiUserParams);
    }
    
    if (startDate) {
      statsWhere.push('i.date >= ?');
      statsParams.push(startDate);
    }
    if (endDate) {
      statsWhere.push('i.date <= ?');
      statsParams.push(endDate);
    }

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT i.id) as total_items,
        COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN i.id END) as sold_items,
        SUM(i.amount) as total_purchase,
        SUM(CASE WHEN s.id IS NOT NULL THEN s.sold_amount ELSE 0 END) as total_sales,
        SUM(CASE WHEN s.id IS NOT NULL THEN (s.sold_amount - i.amount) ELSE 0 END) as total_profit
      FROM imei_records i
      LEFT JOIN sold_records s ON s.imei_id = i.id AND s.id = (
        SELECT id FROM sold_records WHERE imei_id = i.id ORDER BY created_at DESC LIMIT 1
      )
      WHERE ${statsWhere.join(' AND ')}
    `;
    const [statsRows] = await pool.execute(statsQuery, statsParams);

    return NextResponse.json({
      salesTrend: salesTrendRows,
      brandDistribution: brandDistRows,
      monthlySales: monthlySalesRows,
      topBrands: topBrandsRows,
      comparison: comparisonRows,
      statistics: statsRows[0] || {}
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

