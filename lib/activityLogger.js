/**
 * Activity Logger Utility
 * Helper functions to log user activities
 */

import { createActivityLog } from './db';

/**
 * Get client IP address from request headers
 */
export function getClientIP(request) {
  const forwarded = request?.headers?.get('x-forwarded-for');
  const realIP = request?.headers?.get('x-real-ip');
  return forwarded?.split(',')[0]?.trim() || realIP || null;
}

/**
 * Log an activity
 */
export async function logActivity({ 
  userId, 
  userName, 
  action, 
  entityType, 
  entityId, 
  description, 
  metadata = null,
  request = null 
}) {
  const ipAddress = request ? getClientIP(request) : null;
  
  await createActivityLog({
    userId,
    userName,
    action,
    entityType,
    entityId,
    description,
    metadata,
    ipAddress
  });
}

/**
 * Common activity logging functions
 */
export const ActivityLogger = {
  async logIMEICreate(userId, userName, imeiId, imei, request) {
    await logActivity({
      userId,
      userName,
      action: 'create',
      entityType: 'imei',
      entityId: imeiId,
      description: `Created IMEI record: ${imei}`,
      request
    });
  },

  async logIMEIUpdate(userId, userName, imeiId, imei, changes, request) {
    await logActivity({
      userId,
      userName,
      action: 'update',
      entityType: 'imei',
      entityId: imeiId,
      description: `Updated IMEI record: ${imei}`,
      metadata: { changes },
      request
    });
  },

  async logIMEIDelete(userId, userName, imeiId, imei, request) {
    await logActivity({
      userId,
      userName,
      action: 'delete',
      entityType: 'imei',
      entityId: imeiId,
      description: `Deleted IMEI record: ${imei}`,
      request
    });
  },

  async logSoldCreate(userId, userName, soldId, imei, buyerName, request) {
    await logActivity({
      userId,
      userName,
      action: 'create',
      entityType: 'sold',
      entityId: soldId,
      description: `Marked IMEI ${imei} as sold to ${buyerName}`,
      request
    });
  },

  async logSoldUpdate(userId, userName, soldId, imei, changes, request) {
    await logActivity({
      userId,
      userName,
      action: 'update',
      entityType: 'sold',
      entityId: soldId,
      description: `Updated sold record for IMEI: ${imei}`,
      metadata: { changes },
      request
    });
  },

  async logSoldDelete(userId, userName, soldId, imei, request) {
    await logActivity({
      userId,
      userName,
      action: 'delete',
      entityType: 'sold',
      entityId: soldId,
      description: `Deleted sold record for IMEI: ${imei}`,
      request
    });
  },

  async logBrandCreate(userId, userName, brandId, brandName, request) {
    await logActivity({
      userId,
      userName,
      action: 'create',
      entityType: 'brand',
      entityId: brandId,
      description: `Created brand: ${brandName}`,
      request
    });
  },

  async logBrandUpdate(userId, userName, brandId, brandName, request) {
    await logActivity({
      userId,
      userName,
      action: 'update',
      entityType: 'brand',
      entityId: brandId,
      description: `Updated brand: ${brandName}`,
      request
    });
  },

  async logBrandDelete(userId, userName, brandId, brandName, request) {
    await logActivity({
      userId,
      userName,
      action: 'delete',
      entityType: 'brand',
      entityId: brandId,
      description: `Deleted brand: ${brandName}`,
      request
    });
  },

  async logStaffCreate(userId, userName, staffId, staffName, request) {
    await logActivity({
      userId,
      userName,
      action: 'create',
      entityType: 'staff',
      entityId: staffId,
      description: `Created staff member: ${staffName}`,
      request
    });
  },

  async logStaffUpdate(userId, userName, staffId, staffName, request) {
    await logActivity({
      userId,
      userName,
      action: 'update',
      entityType: 'staff',
      entityId: staffId,
      description: `Updated staff member: ${staffName}`,
      request
    });
  },

  async logStaffDelete(userId, userName, staffId, staffName, request) {
    await logActivity({
      userId,
      userName,
      action: 'delete',
      entityType: 'staff',
      entityId: staffId,
      description: `Deleted staff member: ${staffName}`,
      request
    });
  },

  async logAdminCreate(userId, userName, adminId, adminName, request) {
    await logActivity({
      userId,
      userName,
      action: 'create',
      entityType: 'admin',
      entityId: adminId,
      description: `Created admin/company: ${adminName}`,
      request
    });
  },

  async logAdminUpdate(userId, userName, adminId, adminName, request) {
    await logActivity({
      userId,
      userName,
      action: 'update',
      entityType: 'admin',
      entityId: adminId,
      description: `Updated admin/company: ${adminName}`,
      request
    });
  },

  async logAdminDelete(userId, userName, adminId, adminName, request) {
    await logActivity({
      userId,
      userName,
      action: 'delete',
      entityType: 'admin',
      entityId: adminId,
      description: `Deleted admin/company: ${adminName}`,
      request
    });
  },

  async logLogin(userId, userName, request) {
    await logActivity({
      userId,
      userName,
      action: 'login',
      entityType: 'auth',
      entityId: null,
      description: `User logged in`,
      request
    });
  },

  async logProfileUpdate(userId, userName, changes, request) {
    await logActivity({
      userId,
      userName,
      action: 'update',
      entityType: 'profile',
      entityId: userId,
      description: `Updated profile`,
      metadata: { changes },
      request
    });
  }
};

