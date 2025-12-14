import mysql from 'mysql2/promise';

let pool = null;

function getDbPool() {
  if (!pool) {
    // Support both DB_* and MYSQL_* environment variable naming conventions
    const config = {
      host: process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306', 10),
      user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
      password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
      database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'admin_app',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // Connection timeout (valid option for mysql2)
      connectTimeout: 10000, // 10 seconds
    };

    // Log connection config (without password) for debugging
    console.log('Database connection config:', {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database,
      passwordSet: !!config.password
    });

    pool = mysql.createPool(config);
    
    // Test the connection
    pool.getConnection()
      .then(connection => {
        console.log('Database connected successfully');
        connection.release();
      })
      .catch(err => {
        console.error('Database connection failed:', {
          message: err.message,
          code: err.code,
          errno: err.errno,
          sqlState: err.sqlState
        });
      });
  }
  return pool;
}

export async function findUserByEmail(email) {
  const pool = getDbPool();
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  if (rows?.[0]) {
    const user = rows[0];
    let rawPermissions = user.permissions;
    
    // Debug: Log the raw value from database
    console.log('findUserByEmail - Raw permissions from DB:', {
      email,
      type: typeof rawPermissions,
      value: rawPermissions,
      isBuffer: Buffer.isBuffer(rawPermissions),
      isNull: rawPermissions === null,
      isUndefined: rawPermissions === undefined,
      constructor: rawPermissions?.constructor?.name
    });
    
    let parsedPermissions = null;
    
    // Handle Buffer (mysql2 sometimes returns JSON as Buffer)
    if (Buffer.isBuffer(rawPermissions)) {
      try {
        const bufferString = rawPermissions.toString('utf8');
        parsedPermissions = bufferString && bufferString.trim() ? JSON.parse(bufferString) : null;
        console.log('✓ Parsed from Buffer:', parsedPermissions);
      } catch (e) {
        console.error('✗ Failed to parse permissions from Buffer:', e);
        parsedPermissions = null;
      }
    }
    // If it's a string, parse it (most common case with mysql2)
    // MySQL JSON columns are stored as JSON strings and returned as strings
    else if (typeof rawPermissions === 'string') {
      try {
        const trimmed = rawPermissions.trim();
        if (trimmed === '' || trimmed === 'null' || trimmed === 'NULL') {
          parsedPermissions = null;
          console.log('Permissions string is empty/null');
        } else {
          // Parse the JSON string
          let firstParse = JSON.parse(rawPermissions);
          console.log('First parse result:', firstParse, 'Type:', typeof firstParse);
          
          // Handle legacy double-encoded data (should not happen with new code)
          // If first parse returns a string, it means data was double-encoded
          if (typeof firstParse === 'string') {
            try {
              parsedPermissions = JSON.parse(firstParse);
              console.log('✓ Parsed from double-encoded string (legacy data):', parsedPermissions);
            } catch (e2) {
              console.error('✗ Failed to parse double-encoded string:', e2);
              parsedPermissions = null;
            }
          } else {
            // Normal case: single parse returns object
            parsedPermissions = firstParse;
            console.log('✓ Parsed from string (normal):', parsedPermissions);
          }
        }
      } catch (e) {
        console.error('✗ Failed to parse permissions string:', e);
        console.error('  Raw value:', rawPermissions);
        console.error('  Value length:', rawPermissions?.length);
        parsedPermissions = null;
      }
    }
    // If it's already an object, use it as-is
    else if (rawPermissions && typeof rawPermissions === 'object' && !Array.isArray(rawPermissions)) {
      parsedPermissions = rawPermissions;
      console.log('✓ Permissions already an object:', parsedPermissions);
    }
    // If it's null or undefined
    else if (rawPermissions === null || rawPermissions === undefined) {
      parsedPermissions = null;
      console.log('Permissions is null/undefined');
    }
    // Unknown type
    else {
      console.error('✗ Unknown permissions type:', typeof rawPermissions, rawPermissions);
      parsedPermissions = null;
    }
    
    console.log('findUserByEmail - Final result:', {
      email,
      parsedPermissions,
      parsedType: typeof parsedPermissions
    });
    
    return {
      ...user,
      permissions: parsedPermissions
    };
  }
  return null;
}

export async function createUser({ 
  name, 
  email, 
  passwordHash, 
  role = 'admin', 
  permissions = null, 
  createdBy = null 
}) {
  const pool = getDbPool();
  
  // Store permissions as JSON string in database
  // Always stringify once - expect permissions to be an object (or null)
  // This ensures consistent storage format: single JSON encoding
  const permissionsJson = (permissions !== null && permissions !== undefined) 
    ? JSON.stringify(permissions) 
    : null;
  
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password, role, permissions, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
    [name, email, passwordHash, role, permissionsJson, createdBy]
  );
  return result.insertId;
}

export async function listUsers({ page = 1, pageSize = 20, search = '', role = null } = {}) {
  const pool = getDbPool();
  const offset = (page - 1) * pageSize;
  let where = [];
  let params = [];
  
  if (search) {
    where.push('(name LIKE ? OR email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (role) {
    where.push('role = ?');
    params.push(role);
  }
  
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, permissions, created_by, created_at FROM users ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  
  return rows.map(row => ({
    ...row,
    permissions: row.permissions ? JSON.parse(row.permissions) : null,
    created_by: row.created_by ? parseInt(row.created_by) : null
  }));
}

export async function countUsers({ search = '', role = null } = {}) {
  const pool = getDbPool();
  let where = [];
  let params = [];
  
  if (search) {
    where.push('(name LIKE ? OR email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (role) {
    where.push('role = ?');
    params.push(role);
  }
  
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.execute(`SELECT COUNT(*) as count FROM users ${whereSql}`, params);
  return rows[0].count;
}

export async function getUserById(id) {
  const pool = getDbPool();
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, permissions, created_by, created_at FROM users WHERE id = ?',
    [id]
  );
  if (rows[0]) {
    return {
      ...rows[0],
      permissions: rows[0].permissions ? JSON.parse(rows[0].permissions) : null
    };
  }
  return null;
}

export async function updateUser(id, { name, email, permissions }) {
  const pool = getDbPool();
  
  // Store permissions as JSON string in database
  // Always stringify once - expect permissions to be an object (or null)
  // This ensures consistent storage format: single JSON encoding
  const permissionsJson = (permissions !== null && permissions !== undefined) 
    ? JSON.stringify(permissions) 
    : null;
  
  await pool.execute(
    'UPDATE users SET name = ?, email = ?, permissions = ? WHERE id = ?',
    [name, email, permissionsJson, id]
  );
}

export async function updateUserPassword(id, passwordHash) {
  const pool = getDbPool();
  await pool.execute(
    'UPDATE users SET password = ? WHERE id = ?',
    [passwordHash, id]
  );
}

export async function updateUserProfile(id, { name, email, passwordHash }) {
  const pool = getDbPool();
  const updates = [];
  const params = [];
  
  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    params.push(email);
  }
  if (passwordHash !== undefined) {
    updates.push('password = ?');
    params.push(passwordHash);
  }
  
  if (updates.length === 0) return;
  
  params.push(id);
  await pool.execute(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
}

export async function deleteUser(id) {
  const pool = getDbPool();
  await pool.execute('DELETE FROM users WHERE id = ?', [id]);
}

// Helper function to check if a user belongs to an admin's company (admin or their staff)
export async function isUserInCompany(adminId, targetUserId) {
  const pool = getDbPool();
  // Check if target user is the admin themselves
  if (parseInt(adminId) === parseInt(targetUserId)) {
    return true;
  }
  // Check if target user is staff created by this admin
  const [rows] = await pool.execute(
    'SELECT id FROM users WHERE id = ? AND created_by = ? AND role = ?',
    [targetUserId, adminId, 'staff']
  );
  return rows.length > 0;
}

// Get all user IDs in a company (admin + their staff)
export async function getCompanyUserIds(adminId) {
  const pool = getDbPool();
  const [rows] = await pool.execute(
    'SELECT id FROM users WHERE (id = ? OR (created_by = ? AND role = ?))',
    [adminId, adminId, 'staff']
  );
  return rows.map(row => parseInt(row.id));
}

export async function listUsersByCreator({ page = 1, pageSize = 20, search = '', role = null, createdBy = null } = {}) {
  const pool = getDbPool();
  const offset = (page - 1) * pageSize;
  let where = [];
  let params = [];
  
  if (search) {
    where.push('(name LIKE ? OR email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (role) {
    where.push('role = ?');
    params.push(role);
  }
  
  if (createdBy !== null && createdBy !== undefined) {
    where.push('created_by = ?');
    params.push(createdBy);
  }
  
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, permissions, created_by, created_at FROM users ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  
  // Parse permissions JSON strings
  return rows.map(row => ({
    ...row,
    permissions: row.permissions ? JSON.parse(row.permissions) : null,
    created_by: row.created_by ? parseInt(row.created_by) : null
  }));
}

export async function countUsersByCreator({ search = '', role = null, createdBy = null } = {}) {
  const pool = getDbPool();
  let where = [];
  let params = [];
  
  if (search) {
    where.push('(name LIKE ? OR email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (role) {
    where.push('role = ?');
    params.push(role);
  }
  
  if (createdBy !== null && createdBy !== undefined) {
    where.push('created_by = ?');
    params.push(createdBy);
  }
  
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.execute(`SELECT COUNT(*) as count FROM users ${whereSql}`, params);
  return rows[0].count;
}

// IMEI Records helpers
export async function createImeiRecord({ imei, purchase, amount, date, brand, model, color, ram, storage, createdBy = null }) {
  const pool = getDbPool();
  try {
    const [result] = await pool.execute(
      'INSERT INTO imei_records (imei, purchase, amount, date, brand, model, color, ram, storage, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [imei, purchase || null, amount || null, date || null, brand || null, model || null, color || null, ram || null, storage || null, createdBy]
    );
    return result.insertId;
  } catch (e) {
    if (e && (e.code === 'ER_DUP_ENTRY' || String(e.message || '').includes('Duplicate'))) {
      return null;
    }
    throw e;
  }
}

export async function getImeiByImei(imei) {
  const pool = getDbPool();
  const [rows] = await pool.execute(
    'SELECT i.*, u.name as created_by_name FROM imei_records i LEFT JOIN users u ON i.created_by = u.id WHERE i.imei = ? LIMIT 1',
    [imei]
  );
  if (rows[0]) {
    return {
      ...rows[0],
      created_by: rows[0].created_by ? parseInt(rows[0].created_by) : null
    };
  }
  return null;
}

export async function getImeiRecordById(id) {
  const pool = getDbPool();
  const [rows] = await pool.execute(
    'SELECT i.*, u.name as created_by_name FROM imei_records i LEFT JOIN users u ON i.created_by = u.id WHERE i.id = ? LIMIT 1',
    [id]
  );
  if (rows[0]) {
    return {
      ...rows[0],
      created_by: rows[0].created_by ? parseInt(rows[0].created_by) : null
    };
  }
  return null;
}

export async function getSoldRecordById(id) {
  const pool = getDbPool();
  const [rows] = await pool.execute(
    'SELECT s.*, u.name as created_by_name FROM sold_records s LEFT JOIN users u ON s.created_by = u.id WHERE s.id = ? LIMIT 1',
    [id]
  );
  if (rows[0]) {
    return {
      ...rows[0],
      created_by: rows[0].created_by ? parseInt(rows[0].created_by) : null
    };
  }
  return null;
}

export async function listImeiRecords({ 
  page = 1, 
  pageSize = 20, 
  search = '', 
  userId = null, 
  userRole = null,
  // Advanced filters
  brand = null,
  status = null, // 'available', 'sold', 'all'
  purchaseDateFrom = null,
  purchaseDateTo = null,
  soldDateFrom = null,
  soldDateTo = null,
  purchaseAmountMin = null,
  purchaseAmountMax = null,
  soldAmountMin = null,
  soldAmountMax = null,
  color = null,
  ram = null,
  storage = null,
  purchaseName = null
} = {}) {
  const pool = getDbPool();
  const offset = (page - 1) * pageSize;
  let where = [];
  let params = [];
  
  // Basic search
  if (search) {
    where.push('(i.imei LIKE ? OR i.purchase LIKE ? OR i.brand LIKE ? OR i.model LIKE ? OR i.color LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  // Advanced filters
  if (brand) {
    where.push('i.brand = ?');
    params.push(brand);
  }
  
  if (color) {
    where.push('i.color = ?');
    params.push(color);
  }
  
  if (ram) {
    where.push('i.ram = ?');
    params.push(ram);
  }
  
  if (storage) {
    where.push('i.storage = ?');
    params.push(storage);
  }
  
  if (purchaseName) {
    where.push('i.purchase LIKE ?');
    params.push(`%${purchaseName}%`);
  }
  
  if (purchaseDateFrom) {
    where.push('i.date >= ?');
    params.push(purchaseDateFrom);
  }
  
  if (purchaseDateTo) {
    where.push('i.date <= ?');
    params.push(purchaseDateTo);
  }
  
  if (purchaseAmountMin !== null && purchaseAmountMin !== undefined) {
    where.push('i.amount >= ?');
    params.push(parseFloat(purchaseAmountMin));
  }
  
  if (purchaseAmountMax !== null && purchaseAmountMax !== undefined) {
    where.push('i.amount <= ?');
    params.push(parseFloat(purchaseAmountMax));
  }
  
  if (soldDateFrom) {
    where.push('s.sold_date >= ?');
    params.push(soldDateFrom);
  }
  
  if (soldDateTo) {
    where.push('s.sold_date <= ?');
    params.push(soldDateTo);
  }
  
  if (soldAmountMin !== null && soldAmountMin !== undefined) {
    where.push('s.sold_amount >= ?');
    params.push(parseFloat(soldAmountMin));
  }
  
  if (soldAmountMax !== null && soldAmountMax !== undefined) {
    where.push('s.sold_amount <= ?');
    params.push(parseFloat(soldAmountMax));
  }
  
  // Status filter (available/sold)
  if (status === 'available') {
    where.push('s.id IS NULL');
  } else if (status === 'sold') {
    where.push('s.id IS NOT NULL');
  }
  
  // User/Company filtering
  if (userRole === 'superadmin') {
    // Superadmin sees all - no additional filter
  } else if (userRole === 'admin' && userId) {
    // Admin sees their own data + data created by their staff
    const [staffRows] = await pool.execute(
      'SELECT id FROM users WHERE created_by = ? AND role = ?',
      [userId, 'staff']
    );
    const staffIds = staffRows.map(row => row.id);
    const allUserIds = [userId, ...staffIds];
    if (allUserIds.length > 0) {
      const placeholders = allUserIds.map(() => '?').join(',');
      where.push(`i.created_by IN (${placeholders})`);
      params.push(...allUserIds);
    }
  } else if (userId) {
    // Staff sees only their own records
    where.push('i.created_by = ?');
    params.push(userId);
  }
  
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT i.*, u.name as created_by_name, 
            s.sold_name, s.sold_amount, s.sold_date, s.store
     FROM imei_records i 
     LEFT JOIN users u ON i.created_by = u.id 
     LEFT JOIN sold_records s ON s.imei_id = i.id AND s.id = (
       SELECT id FROM sold_records WHERE imei_id = i.id ORDER BY created_at DESC LIMIT 1
     )
     ${whereSql} 
     ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  return rows;
}

export async function countImeiRecords({ 
  search = '', 
  userId = null, 
  userRole = null,
  // Advanced filters (same as listImeiRecords)
  brand = null,
  status = null,
  purchaseDateFrom = null,
  purchaseDateTo = null,
  soldDateFrom = null,
  soldDateTo = null,
  purchaseAmountMin = null,
  purchaseAmountMax = null,
  soldAmountMin = null,
  soldAmountMax = null,
  color = null,
  ram = null,
  storage = null,
  purchaseName = null
} = {}) {
  const pool = getDbPool();
  let where = [];
  let params = [];
  
  // Basic search
  if (search) {
    where.push('(i.imei LIKE ? OR i.purchase LIKE ? OR i.brand LIKE ? OR i.model LIKE ? OR i.color LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  // Advanced filters (same logic as listImeiRecords)
  if (brand) {
    where.push('i.brand = ?');
    params.push(brand);
  }
  
  if (color) {
    where.push('i.color = ?');
    params.push(color);
  }
  
  if (ram) {
    where.push('i.ram = ?');
    params.push(ram);
  }
  
  if (storage) {
    where.push('i.storage = ?');
    params.push(storage);
  }
  
  if (purchaseName) {
    where.push('i.purchase LIKE ?');
    params.push(`%${purchaseName}%`);
  }
  
  if (purchaseDateFrom) {
    where.push('i.date >= ?');
    params.push(purchaseDateFrom);
  }
  
  if (purchaseDateTo) {
    where.push('i.date <= ?');
    params.push(purchaseDateTo);
  }
  
  if (purchaseAmountMin !== null && purchaseAmountMin !== undefined) {
    where.push('i.amount >= ?');
    params.push(parseFloat(purchaseAmountMin));
  }
  
  if (purchaseAmountMax !== null && purchaseAmountMax !== undefined) {
    where.push('i.amount <= ?');
    params.push(parseFloat(purchaseAmountMax));
  }
  
  if (soldDateFrom) {
    where.push('s.sold_date >= ?');
    params.push(soldDateFrom);
  }
  
  if (soldDateTo) {
    where.push('s.sold_date <= ?');
    params.push(soldDateTo);
  }
  
  if (soldAmountMin !== null && soldAmountMin !== undefined) {
    where.push('s.sold_amount >= ?');
    params.push(parseFloat(soldAmountMin));
  }
  
  if (soldAmountMax !== null && soldAmountMax !== undefined) {
    where.push('s.sold_amount <= ?');
    params.push(parseFloat(soldAmountMax));
  }
  
  // Status filter
  if (status === 'available') {
    where.push('s.id IS NULL');
  } else if (status === 'sold') {
    where.push('s.id IS NOT NULL');
  }
  
  // User/Company filtering
  if (userRole === 'superadmin') {
    // No additional filter
  } else if (userRole === 'admin' && userId) {
    const [staffRows] = await pool.execute(
      'SELECT id FROM users WHERE created_by = ? AND role = ?',
      [userId, 'staff']
    );
    const staffIds = staffRows.map(row => row.id);
    const allUserIds = [userId, ...staffIds];
    if (allUserIds.length > 0) {
      const placeholders = allUserIds.map(() => '?').join(',');
      where.push(`i.created_by IN (${placeholders})`);
      params.push(...allUserIds);
    }
  } else if (userId) {
    where.push('i.created_by = ?');
    params.push(userId);
  }
  
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  // Need to join with sold_records for status filter
  const joinSql = (status === 'available' || status === 'sold') 
    ? 'LEFT JOIN sold_records s ON s.imei_id = i.id AND s.id = (SELECT id FROM sold_records WHERE imei_id = i.id ORDER BY created_at DESC LIMIT 1)'
    : '';
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count FROM imei_records i ${joinSql} ${whereSql}`, 
    params
  );
  return rows[0].count;
}

export async function updateImeiRecord(id, { purchase, amount, date, brand, model, color, ram, storage }) {
  const pool = getDbPool();
  await pool.execute(
    'UPDATE imei_records SET purchase = ?, amount = ?, date = ?, brand = ?, model = ?, color = ?, ram = ?, storage = ? WHERE id = ?',
    [purchase || null, amount || null, date || null, brand || null, model || null, color || null, ram || null, storage || null, id]
  );
}

export async function deleteImeiRecord(id) {
  const pool = getDbPool();
  await pool.execute('DELETE FROM imei_records WHERE id = ?', [id]);
}

export async function getAllImeis({ limit = 100 } = {}) {
  const pool = getDbPool();
  const [rows] = await pool.execute(
    'SELECT DISTINCT imei FROM imei_records ORDER BY imei DESC LIMIT ?',
    [limit]
  );
  return rows.map(row => row.imei);
}

// Sold Records helpers
export async function createSoldRecord({ imeiId, soldName, soldAmount, soldDate, store, createdBy = null }) {
  const pool = getDbPool();
  try {
    const [result] = await pool.execute(
      'INSERT INTO sold_records (imei_id, sold_name, sold_amount, sold_date, store, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [imeiId, soldName?.trim() || null, soldAmount ? parseFloat(soldAmount) : null, soldDate || null, store?.trim() || null, createdBy]
    );
    return result.insertId;
  } catch (e) {
    console.error('Error creating sold record:', e);
    throw e;
  }
}

export async function getSoldRecordByImeiId(imeiId) {
  const pool = getDbPool();
  const [rows] = await pool.execute(
    'SELECT s.*, u.name as created_by_name FROM sold_records s LEFT JOIN users u ON s.created_by = u.id WHERE s.imei_id = ? ORDER BY s.created_at DESC LIMIT 1',
    [imeiId]
  );
  return rows[0] || null;
}

export async function listSoldRecords({ page = 1, pageSize = 20, search = '', userId = null, userRole = null } = {}) {
  const pool = getDbPool();
  const offset = (page - 1) * pageSize;
  let where = [];
  let params = [];
  
  if (search) {
    where.push('(i.imei LIKE ? OR s.sold_name LIKE ? OR s.store LIKE ? OR i.brand LIKE ? OR i.model LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  // Superadmin sees all
  if (userRole === 'superadmin') {
    // No additional filter
  } else if (userRole === 'admin' && userId) {
    // Admin sees their own data + data created by their staff
    const [staffRows] = await pool.execute(
      'SELECT id FROM users WHERE created_by = ? AND role = ?',
      [userId, 'staff']
    );
    const staffIds = staffRows.map(row => row.id);
    const allUserIds = [userId, ...staffIds];
    if (allUserIds.length > 0) {
      const placeholders = allUserIds.map(() => '?').join(',');
      where.push(`s.created_by IN (${placeholders})`);
      params.push(...allUserIds);
    }
  } else if (userId) {
    // Staff sees only their own records
    where.push('s.created_by = ?');
    params.push(userId);
  }
  
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT s.*, i.imei, i.brand, i.model, i.color, i.ram, i.storage, i.purchase, i.amount as purchase_amount, i.date as purchase_date, u.name as created_by_name 
     FROM sold_records s 
     INNER JOIN imei_records i ON s.imei_id = i.id
     LEFT JOIN users u ON s.created_by = u.id 
     ${whereSql} 
     ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  return rows;
}

export async function countSoldRecords({ search = '', userId = null, userRole = null } = {}) {
  const pool = getDbPool();
  let where = [];
  let params = [];
  
  if (search) {
    where.push('(i.imei LIKE ? OR s.sold_name LIKE ? OR s.store LIKE ? OR i.brand LIKE ? OR i.model LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  // Superadmin sees all
  if (userRole === 'superadmin') {
    // No additional filter
  } else if (userRole === 'admin' && userId) {
    // Admin sees their own data + data created by their staff
    const [staffRows] = await pool.execute(
      'SELECT id FROM users WHERE created_by = ? AND role = ?',
      [userId, 'staff']
    );
    const staffIds = staffRows.map(row => row.id);
    const allUserIds = [userId, ...staffIds];
    if (allUserIds.length > 0) {
      const placeholders = allUserIds.map(() => '?').join(',');
      where.push(`s.created_by IN (${placeholders})`);
      params.push(...allUserIds);
    }
  } else if (userId) {
    // Staff sees only their own records
    where.push('s.created_by = ?');
    params.push(userId);
  }
  
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count FROM sold_records s INNER JOIN imei_records i ON s.imei_id = i.id ${whereSql}`, 
    params
  );
  return rows[0].count;
}

export async function updateSoldRecord(id, { soldName, soldAmount, soldDate, store }) {
  const pool = getDbPool();
  await pool.execute(
    'UPDATE sold_records SET sold_name = ?, sold_amount = ?, sold_date = ?, store = ? WHERE id = ?',
    [soldName?.trim() || null, soldAmount ? parseFloat(soldAmount) : null, soldDate || null, store?.trim() || null, id]
  );
}

export async function deleteSoldRecord(id) {
  const pool = getDbPool();
  await pool.execute('DELETE FROM sold_records WHERE id = ?', [id]);
}

// Brands helpers
export async function listBrands({ page = 1, pageSize = 100, search = '', activeOnly = true } = {}) {
  const pool = getDbPool();
  const offset = (page - 1) * pageSize;
  let where = [];
  let params = [];
  
  if (search) {
    where.push('name LIKE ?');
    params.push(`%${search}%`);
  }
  
  if (activeOnly) {
    where.push('is_active = 1');
  }
  
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT * FROM brands ${whereSql} ORDER BY name ASC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  return rows;
}

export async function countBrands({ search = '', activeOnly = true } = {}) {
  const pool = getDbPool();
  let where = [];
  let params = [];
  
  if (search) {
    where.push('name LIKE ?');
    params.push(`%${search}%`);
  }
  
  if (activeOnly) {
    where.push('is_active = 1');
  }
  
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.execute(`SELECT COUNT(*) as count FROM brands ${whereSql}`, params);
  return rows && rows.length ? rows[0].count : 0;
}

export async function getAllActiveBrands() {
  const pool = getDbPool();
  const [rows] = await pool.execute('SELECT * FROM brands WHERE is_active = 1 ORDER BY name ASC');
  return rows;
}

export async function createBrand({ name, isActive = true, createdBy = null }) {
  const pool = getDbPool();
  const [result] = await pool.execute(
    'INSERT INTO brands (name, is_active, created_by, created_at) VALUES (?, ?, ?, NOW())',
    [name.trim(), isActive ? 1 : 0, createdBy]
  );
  return result.insertId;
}

export async function updateBrand(id, { name, isActive }) {
  const pool = getDbPool();
  await pool.execute('UPDATE brands SET name = ?, is_active = ? WHERE id = ?', [name.trim(), isActive ? 1 : 0, id]);
}

export async function deleteBrand(id) {
  const pool = getDbPool();
  await pool.execute('DELETE FROM brands WHERE id = ?', [id]);
}

// Stock Statistics helpers
export async function getStockStatistics({ userId = null, userRole = null } = {}) {
  const pool = getDbPool();
  let where = [];
  let params = [];
  
  // Superadmin sees all
  if (userRole === 'superadmin') {
    // No additional filter
  } else if (userRole === 'admin' && userId) {
    // Admin sees their own data + data created by their staff
    const [staffRows] = await pool.execute(
      'SELECT id FROM users WHERE created_by = ? AND role = ?',
      [userId, 'staff']
    );
    const staffIds = staffRows.map(row => row.id);
    const allUserIds = [userId, ...staffIds];
    if (allUserIds.length > 0) {
      const placeholders = allUserIds.map(() => '?').join(',');
      where.push(`i.created_by IN (${placeholders})`);
      params.push(...allUserIds);
    }
  } else if (userId) {
    // Staff sees only their own records
    where.push('i.created_by = ?');
    params.push(userId);
  }
  
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  
  // Get total IMEI records count
  const [totalRows] = await pool.execute(
    `SELECT COUNT(*) as count FROM imei_records i ${whereSql}`,
    params
  );
  const totalCount = totalRows[0].count;
  
  // Get available stock (IMEI records without sold records)
  const availableWhere = [...where];
  availableWhere.push('s.id IS NULL');
  const availableWhereSql = `WHERE ${availableWhere.join(' AND ')}`;
  const [availableRows] = await pool.execute(
    `SELECT COUNT(*) as count 
     FROM imei_records i 
     LEFT JOIN sold_records s ON s.imei_id = i.id 
     ${availableWhereSql}`,
    params
  );
  const availableCount = availableRows[0].count;
  
  // Get sold count (IMEI records with sold records)
  const soldWhere = [...where];
  const soldWhereSql = soldWhere.length ? `WHERE ${soldWhere.join(' AND ')}` : '';
  const [soldRows] = await pool.execute(
    `SELECT COUNT(DISTINCT s.imei_id) as count 
     FROM sold_records s 
     INNER JOIN imei_records i ON s.imei_id = i.id 
     ${soldWhereSql}`,
    params
  );
  const soldCount = soldRows[0].count;
  
  // Get total purchase amount
  const [purchaseRows] = await pool.execute(
    `SELECT COALESCE(SUM(i.amount), 0) as total 
     FROM imei_records i 
     ${whereSql}`,
    params
  );
  const totalPurchaseAmount = parseFloat(purchaseRows[0].total) || 0;
  
  // Get total sold amount - filter by created_by for sold records
  let soldAmountWhere = [];
  let soldAmountParams = [];
  if (userRole === 'superadmin') {
    // No filter
  } else if (userRole === 'admin' && userId) {
    // Admin sees their own data + data created by their staff
    const [staffRows] = await pool.execute(
      'SELECT id FROM users WHERE created_by = ? AND role = ?',
      [userId, 'staff']
    );
    const staffIds = staffRows.map(row => row.id);
    const allUserIds = [userId, ...staffIds];
    if (allUserIds.length > 0) {
      const placeholders = allUserIds.map(() => '?').join(',');
      soldAmountWhere.push(`s.created_by IN (${placeholders})`);
      soldAmountParams.push(...allUserIds);
    }
  } else if (userId) {
    // Staff sees only their own records
    soldAmountWhere.push('s.created_by = ?');
    soldAmountParams.push(userId);
  }
  const soldAmountWhereSql = soldAmountWhere.length ? `WHERE ${soldAmountWhere.join(' AND ')}` : '';
  const [soldAmountRows] = await pool.execute(
    `SELECT COALESCE(SUM(s.sold_amount), 0) as total 
     FROM sold_records s 
     INNER JOIN imei_records i ON s.imei_id = i.id 
     ${soldAmountWhereSql}`,
    soldAmountParams
  );
  const totalSoldAmount = parseFloat(soldAmountRows[0].total) || 0;
  
  // Calculate profit
  const profit = totalSoldAmount - totalPurchaseAmount;
  
  return {
    totalCount,
    availableCount,
    soldCount,
    totalPurchaseAmount,
    totalSoldAmount,
    profit
  };
}

// Activity Logs helpers
export async function createActivityLog({ userId, userName, action, entityType, entityId, description, metadata = null, ipAddress = null }) {
  const pool = getDbPool();
  try {
    const metadataJson = metadata ? JSON.stringify(metadata) : null;
    await pool.execute(
      'INSERT INTO activity_logs (user_id, user_name, action, entity_type, entity_id, description, metadata, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [userId, userName || null, action, entityType || null, entityId || null, description || null, metadataJson, ipAddress || null]
    );
  } catch (error) {
    console.error('Error creating activity log:', error);
    // Don't throw - logging should not break the main flow
  }
}

export async function listActivityLogs({ page = 1, pageSize = 50, userId = null, userIds = null, action = null, entityType = null, startDate = null, endDate = null } = {}) {
  const pool = getDbPool();
  const offset = (page - 1) * pageSize;
  let where = [];
  let params = [];
  
  // Support both single userId and array of userIds
  if (userIds && Array.isArray(userIds) && userIds.length > 0) {
    const placeholders = userIds.map(() => '?').join(',');
    where.push(`user_id IN (${placeholders})`);
    params.push(...userIds);
  } else if (userId) {
    where.push('user_id = ?');
    params.push(userId);
  }
  
  if (action) {
    where.push('action = ?');
    params.push(action);
  }
  
  if (entityType) {
    where.push('entity_type = ?');
    params.push(entityType);
  }
  
  if (startDate) {
    where.push('created_at >= ?');
    params.push(startDate);
  }
  
  if (endDate) {
    where.push('created_at <= ?');
    params.push(endDate);
  }
  
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT * FROM activity_logs ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  
  return rows.map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    user_id: row.user_id ? parseInt(row.user_id) : null,
    entity_id: row.entity_id ? parseInt(row.entity_id) : null
  }));
}

export async function countActivityLogs({ userId = null, userIds = null, action = null, entityType = null, startDate = null, endDate = null } = {}) {
  const pool = getDbPool();
  let where = [];
  let params = [];
  
  // Support both single userId and array of userIds
  if (userIds && Array.isArray(userIds) && userIds.length > 0) {
    const placeholders = userIds.map(() => '?').join(',');
    where.push(`user_id IN (${placeholders})`);
    params.push(...userIds);
  } else if (userId) {
    where.push('user_id = ?');
    params.push(userId);
  }
  
  if (action) {
    where.push('action = ?');
    params.push(action);
  }
  
  if (entityType) {
    where.push('entity_type = ?');
    params.push(entityType);
  }
  
  if (startDate) {
    where.push('created_at >= ?');
    params.push(startDate);
  }
  
  if (endDate) {
    where.push('created_at <= ?');
    params.push(endDate);
  }
  
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.execute(`SELECT COUNT(*) as count FROM activity_logs ${whereSql}`, params);
  return rows[0].count;
}
