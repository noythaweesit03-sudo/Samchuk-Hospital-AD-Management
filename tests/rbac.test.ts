import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hasPageAccess, getAllowedRolesForPage, PAGE_PERMISSIONS } from '../src/utils/rbac.ts';
import { UserRole } from '../src/types/ad.ts';

describe('Demo RBAC Permission Matrix Validation', () => {
  const allRoles: UserRole[] = [
    'Viewer',
    'Helpdesk',
    'ADOperator',
    'SecurityAuditor',
    'SystemAdministrator',
  ];

  test('Dashboard should be accessible to all 5 roles', () => {
    for (const role of allRoles) {
      assert.equal(hasPageAccess(role, 'dashboard'), true, `Role ${role} should access dashboard`);
    }
  });

  test('Users directory should be accessible to all 5 roles', () => {
    for (const role of allRoles) {
      assert.equal(hasPageAccess(role, 'users'), true, `Role ${role} should access users`);
    }
  });

  test('Computers list should be accessible to all 5 roles', () => {
    for (const role of allRoles) {
      assert.equal(hasPageAccess(role, 'computers'), true, `Role ${role} should access computers`);
    }
  });

  test('OUs tree should be accessible to all 5 roles', () => {
    for (const role of allRoles) {
      assert.equal(hasPageAccess(role, 'ous'), true, `Role ${role} should access ous`);
    }
  });

  test('Groups list should be accessible to all 5 roles', () => {
    for (const role of allRoles) {
      assert.equal(hasPageAccess(role, 'groups'), true, `Role ${role} should access groups`);
    }
  });

  test('Audit Logs must be restricted: denied for Viewer, Helpdesk, ADOperator', () => {
    assert.equal(hasPageAccess('Viewer', 'audit'), false);
    assert.equal(hasPageAccess('Helpdesk', 'audit'), false);
    assert.equal(hasPageAccess('ADOperator', 'audit'), false);
  });

  test('Audit Logs must be allowed for SecurityAuditor and SystemAdministrator', () => {
    assert.equal(hasPageAccess('SecurityAuditor', 'audit'), true);
    assert.equal(hasPageAccess('SystemAdministrator', 'audit'), true);
  });

  test('Settings must be restricted: denied for Viewer and Helpdesk', () => {
    assert.equal(hasPageAccess('Viewer', 'settings'), false);
    assert.equal(hasPageAccess('Helpdesk', 'settings'), false);
  });

  test('Settings must be allowed for ADOperator, SecurityAuditor, and SystemAdministrator', () => {
    assert.equal(hasPageAccess('ADOperator', 'settings'), true);
    assert.equal(hasPageAccess('SecurityAuditor', 'settings'), true);
    assert.equal(hasPageAccess('SystemAdministrator', 'settings'), true);
  });

  test('Null or undefined role must be denied for any page', () => {
    assert.equal(hasPageAccess(null, 'dashboard'), false);
    assert.equal(hasPageAccess(undefined, 'dashboard'), false);
    assert.equal(hasPageAccess(null, 'audit'), false);
  });

  test('getAllowedRolesForPage returns exact configured roles', () => {
    const auditRoles = getAllowedRolesForPage('audit');
    assert.deepEqual(auditRoles, ['SecurityAuditor', 'SystemAdministrator']);
  });
});
