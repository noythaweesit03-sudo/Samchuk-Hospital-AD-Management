/**
 * Samchuk Hospital AD Management - Centralized Demo RBAC Definitions
 * 
 * IMPORTANT: This represents Demo Role-Based Access Control simulation for Phase 1.
 * It is NOT production authentication. Production authentication and server-side RBAC
 * will be enforced in Phase 2/3 via enterprise identity mechanisms.
 */

import { UserRole } from '../types/ad';

export interface PagePermissionConfig {
  id: string;
  title: string;
  subTitle: string;
  allowedRoles: UserRole[];
  description: string;
}

export const PAGE_PERMISSIONS: Record<string, PagePermissionConfig> = {
  dashboard: {
    id: 'dashboard',
    title: 'แดชบอร์ดภาพรวม',
    subTitle: 'Dashboard Summary',
    allowedRoles: ['Viewer', 'Helpdesk', 'ADOperator', 'SecurityAuditor', 'SystemAdministrator'],
    description: 'ภาพรวมระบบและสถานะการจำลองบริการ',
  },
  users: {
    id: 'users',
    title: 'ผู้ใช้งานในระบบ',
    subTitle: 'Users & Accounts',
    allowedRoles: ['Viewer', 'Helpdesk', 'ADOperator', 'SecurityAuditor', 'SystemAdministrator'],
    description: 'สืบค้นและดูรายละเอียดผู้ใช้งาน',
  },
  computers: {
    id: 'computers',
    title: 'เครื่องคอมพิวเตอร์',
    subTitle: 'Computers & Servers',
    allowedRoles: ['Viewer', 'Helpdesk', 'ADOperator', 'SecurityAuditor', 'SystemAdministrator'],
    description: 'รายการอุปกรณ์ลูกข่ายและเซิร์ฟเวอร์',
  },
  ous: {
    id: 'ous',
    title: 'โครงสร้างหน่วยงาน',
    subTitle: 'Organizational Units',
    allowedRoles: ['Viewer', 'Helpdesk', 'ADOperator', 'SecurityAuditor', 'SystemAdministrator'],
    description: 'ผังลำดับชั้น Organizational Units (OUs)',
  },
  groups: {
    id: 'groups',
    title: 'กลุ่มสิทธิ์ความปลอดภัย',
    subTitle: 'Security & Distribution Groups',
    allowedRoles: ['Viewer', 'Helpdesk', 'ADOperator', 'SecurityAuditor', 'SystemAdministrator'],
    description: 'กลุ่มสิทธิ์ความปลอดภัยและกลุ่มกระจายอีเมล',
  },
  audit: {
    id: 'audit',
    title: 'บันทึกการตรวจสอบ',
    subTitle: 'Audit Trails (Read-Only)',
    allowedRoles: ['SecurityAuditor', 'SystemAdministrator'],
    description: 'ประวัติเหตุการณ์ความปลอดภัยและ Request ID (จำกัดเฉพาะ Auditor และ Admin)',
  },
  settings: {
    id: 'settings',
    title: 'การเชื่อมต่อ & สถาปัตยกรรม',
    subTitle: 'Architecture & TBD Gates',
    allowedRoles: ['ADOperator', 'SecurityAuditor', 'SystemAdministrator'],
    description: 'ข้อมูลสถาปัตยกรรม แผนผังเครือข่าย และรายการ TBD Checklist',
  },
};

/**
 * Check if a given role is allowed to access a specific page.
 */
export function hasPageAccess(role: UserRole | undefined | null, pageId: string): boolean {
  if (!role) return false;
  const config = PAGE_PERMISSIONS[pageId];
  if (!config) return false;
  return config.allowedRoles.includes(role);
}

/**
 * Get human-readable list of allowed roles for a page.
 */
export function getAllowedRolesForPage(pageId: string): UserRole[] {
  return PAGE_PERMISSIONS[pageId]?.allowedRoles || [];
}

/**
 * Verifies whether a role is permitted to access Connection Readiness Diagnostics
 * and Settings / Architecture views.
 * Matches backend AuthorizationPolicies.ADOperatorOrAbove and DiagnosticsController.IsRolePermittedForDiagnostics:
 * Allowed: ADOperator, SecurityAuditor, SystemAdministrator
 * Denied: Viewer, Helpdesk
 */
export function hasDiagnosticsAccess(role: UserRole | undefined | null): boolean {
  return hasPageAccess(role, 'settings');
}

/**
 * Verifies whether Demo Authentication is permitted in the target runtime environment.
 * Mirrors backend DemoAuthenticationHandler.IsEnvironmentPermittedForDemoAuth:
 * Strictly restricted to Development and Test; rejected in Production, Staging, UAT, etc.
 */
export function isDemoAuthPermittedInEnvironment(environmentName: string | null | undefined): boolean {
  if (!environmentName || environmentName.trim().length === 0) {
    return false;
  }
  const normalized = environmentName.trim().toLowerCase();
  return normalized === 'development' || normalized === 'test';
}

