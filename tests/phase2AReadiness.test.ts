/**
 * Samchuk Hospital AD Management - Phase 2A Readiness & Security Unit Tests
 *
 * Covers:
 * 1. RFC 4515 LDAP Filter Escaping & Injection Prevention
 * 2. AD Lockout Policy Evaluation (lockoutTime + lockoutDurationMinutes + msDS-User-Account-Control-Computed)
 * 3. Bounded LDAP Paging & Search Base Scope Enforcement
 * 4. AD whenCreated (ASN.1 GeneralizedTime) & objectGUID Stable ID Mapping
 * 5. RFC 4514 Distinguished Name Validation (including escaped commas \, and \2C)
 * 6. Feature Flag Disabled & Phase 2A Code Gate Lock
 * 7. Connection Diagnostics Contract (6 checks, strictly Simulated / NotTested / NotConfigured)
 * 8. RBAC Consistency between Diagnostics API and Settings View + Production Demo Auth Rejection
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeLdapFilterValue,
  buildSafeUserLdapFilter,
  validateDistinguishedNameSyntax,
  isDnScopedWithinSearchBase,
  evaluatePhase2ALiveConnectionGate,
  evaluateAdAccountLockoutStatus,
  calculateBoundedLdapPagingPlan,
  buildBoundedLdapPagedResult,
  parseAdWhenCreatedToIso,
  formatObjectGuidBytes,
  utcMsToWindowsFileTime,
  MAX_LDAP_SEARCH_INPUT_LENGTH,
  IS_PHASE_2A_CODE_GATE_LOCKED,
  LOCKOUT_DURATION_SIMULATED_DISCLAIMER,
} from '../src/utils/ldapEscaping';
import {
  hasDiagnosticsAccess,
  hasPageAccess,
  getAllowedRolesForPage,
  isDemoAuthPermittedInEnvironment,
} from '../src/utils/rbac';
import { MockDirectoryApi, HttpDirectoryApi, DirectoryApiError } from '../src/services/directoryApi';
import { UserRole } from '../src/types/ad';

describe('Phase 2A LDAPS Readiness, Filter Escaping & Diagnostics Tests', () => {
  it('RFC 4515 LDAP filter escaping neutralizes wildcard and parenthesis injection payloads', () => {
    const injectionPayload = 'somchai*)(|(objectClass=*))\\test\0';
    const escaped = escapeLdapFilterValue(injectionPayload);

    assert.equal(escaped.includes('*'), false, 'Raw asterisk must be escaped');
    assert.equal(escaped.includes('('), false, 'Raw open parenthesis must be escaped');
    assert.equal(escaped.includes(')'), false, 'Raw close parenthesis must be escaped');
    assert.ok(escaped.includes('\\2a'), 'Asterisk must be encoded as \\2a');
    assert.ok(escaped.includes('\\28'), 'Open parenthesis must be encoded as \\28');
    assert.ok(escaped.includes('\\29'), 'Close parenthesis must be encoded as \\29');
    assert.ok(escaped.includes('\\5c'), 'Backslash must be encoded as \\5c');
    assert.ok(escaped.includes('\\00'), 'Null character must be encoded as \\00');
  });

  it('LDAP search input exceeding maximum length throws validation error', () => {
    const oversized = 'x'.repeat(MAX_LDAP_SEARCH_INPUT_LENGTH + 1);
    assert.throws(
      () => escapeLdapFilterValue(oversized),
      /LDAP_INPUT_TOO_LONG/,
      'Oversized search query must be rejected'
    );
  });

  it('AD Lockout Policy evaluator does not rely on lockoutTime > 0 alone and respects lockoutDurationMinutes', () => {
    const referenceUtcMs = Date.UTC(2026, 10, 1, 12, 0, 0);

    // 1. Normal enabled account (UAC 512, lockoutTime 0)
    assert.equal(
      evaluateAdAccountLockoutStatus({
        userAccountControl: 512,
        lockoutTime: 0n,
        lockoutDurationMinutes: 30,
        referenceUtcMs,
      }),
      'Enabled'
    );

    // 2. Disabled account (UAC 514 = 512 + 2) takes precedence even if lockoutTime > 0
    const activeLockoutFileTime = utcMsToWindowsFileTime(referenceUtcMs - 10 * 60_000);
    assert.equal(
      evaluateAdAccountLockoutStatus({
        userAccountControl: 514,
        lockoutTime: activeLockoutFileTime,
        lockoutDurationMinutes: 30,
        referenceUtcMs,
      }),
      'Disabled'
    );

    // 3. Active lockout within 30-minute policy window (locked out 10 minutes ago) -> 'LockedOut'
    assert.equal(
      evaluateAdAccountLockoutStatus({
        userAccountControl: 512,
        lockoutTime: activeLockoutFileTime,
        lockoutDurationMinutes: 30,
        referenceUtcMs,
      }),
      'LockedOut'
    );

    // 4. Expired lockout after 30-minute policy window (locked out 45 minutes ago, AD still has lockoutTime > 0) -> 'Enabled'
    const expiredLockoutFileTime = utcMsToWindowsFileTime(referenceUtcMs - 45 * 60_000);
    assert.equal(
      evaluateAdAccountLockoutStatus({
        userAccountControl: 512,
        lockoutTime: expiredLockoutFileTime,
        lockoutDurationMinutes: 30,
        referenceUtcMs,
      }),
      'Enabled',
      'Expired lockoutTime (> 0) outside policy window must be evaluated as Enabled, not LockedOut'
    );

    // 5. Authoritative msDS-User-Account-Control-Computed UF_LOCKOUT (0x0010 = 16)
    assert.equal(
      evaluateAdAccountLockoutStatus({
        userAccountControl: 512,
        lockoutTime: expiredLockoutFileTime,
        lockoutDurationMinutes: 30,
        computedUac: 16,
        referenceUtcMs,
      }),
      'LockedOut'
    );
  });

  it('buildSafeUserLdapFilter constructs escaped, read-only user search filter with lockout policy window threshold', () => {
    const referenceUtcMs = Date.UTC(2026, 10, 1, 12, 0, 0);
    const expectedThreshold = utcMsToWindowsFileTime(referenceUtcMs - 30 * 60_000).toString();

    const filter = buildSafeUserLdapFilter(
      {
        search: 'kittisak*(admin)',
        department: 'Medical',
        status: 'LockedOut',
      },
      30,
      referenceUtcMs
    );

    assert.ok(filter.includes('(objectCategory=person)(objectClass=user)(!(objectClass=computer))'));
    assert.ok(filter.includes('kittisak\\2a\\28admin\\29'));
    assert.ok(filter.includes('(department=*Medical*)'));
    assert.ok(
      filter.includes(`(lockoutTime>=${expectedThreshold})`),
      'LockedOut LDAP filter must use active lockout window threshold instead of naive lockoutTime>=1'
    );
  });

  it('Bounded LDAP paging calculator and BuildBoundedPagedResult distinguish exact TotalCount from capped window count', () => {
    const plan = calculateBoundedLdapPagingPlan({
      requestedPageNumber: 2,
      requestedPageSize: 25,
      configuredLdapPageSize: 100,
      maxResultWindowLimit: 500,
    });

    assert.equal(plan.requestedPageNumber, 2);
    assert.equal(plan.requestedPageSize, 25);
    assert.equal(plan.skipCount, 25);
    assert.equal(plan.targetFetchCount, 50);
    assert.equal(plan.maxEntriesToFetch, 500);
    assert.equal(plan.effectiveLdapControlPageSize, 50);

    // Requesting a page beyond maxResultWindowLimit must throw LDAP_PAGING_WINDOW_EXCEEDED
    assert.throws(
      () =>
        calculateBoundedLdapPagingPlan({
          requestedPageNumber: 30,
          requestedPageSize: 25,
          configuredLdapPageSize: 100,
          maxResultWindowLimit: 500,
        }),
      /LDAP_PAGING_WINDOW_EXCEEDED/,
      'Paging beyond bounded result window must be rejected'
    );

    // Case 1: Entries within MaxResultWindowLimit (hasMoreEntriesBeyondWindow = false) -> isTotalCountExact = true
    const windowWithinLimit = Array.from({ length: 60 }, (_, idx) => `User-${idx + 1}`);
    const exactPage = buildBoundedLdapPagedResult(windowWithinLimit, plan, false);
    assert.equal(exactPage.items.length, 25);
    assert.equal(exactPage.items[0], 'User-26');
    assert.equal(exactPage.totalCount, 60);
    assert.equal(exactPage.isTotalCountExact, true);
    assert.equal(exactPage.isResultWindowCapped, false);
    assert.equal(exactPage.totalCountNote, null);

    // Case 2: Entries exceed MaxResultWindowLimit (hasMoreEntriesBeyondWindow = true) -> isTotalCountExact = false
    const cappedWindow = Array.from({ length: 500 }, (_, idx) => `User-${idx + 1}`);
    const cappedPage = buildBoundedLdapPagedResult(cappedWindow, plan, true);
    assert.equal(cappedPage.items.length, 25);
    assert.equal(cappedPage.totalCount, 500);
    assert.equal(cappedPage.isTotalCountExact, false, 'Capped window count must not be claimed as exact total');
    assert.equal(cappedPage.isResultWindowCapped, true);
    assert.equal(cappedPage.resultWindowLimit, 500);
    assert.ok(cappedPage.totalCountNote?.includes('MaxResultWindowLimit'));
  });

  it('whenCreated parser and objectGUID formatter map real AD attributes instead of current time or unstable names', () => {
    // ASN.1 GeneralizedTime format used by Active Directory whenCreated
    const iso = parseAdWhenCreatedToIso('20240310020000.0Z');
    assert.equal(iso, '2024-03-10T02:00:00.000Z');

    // Invalid or empty whenCreated returns null (never falls back to Date.now())
    assert.equal(parseAdWhenCreatedToIso(''), null);
    assert.equal(parseAdWhenCreatedToIso('NOT_A_DATE'), null);

    // 16-byte little-endian objectGUID -> canonical UUID string
    const guidBytes = new Uint8Array([
      0xd4, 0xc3, 0xb2, 0xa1, 0xf6, 0xe5, 0x5b, 0x4a, 0x8c, 0x9d, 0x0e, 0x1f, 0x2a, 0x3b, 0x4c, 0x5d,
    ]);
    const formattedGuid = formatObjectGuidBytes(guidBytes, 'fallback-id');
    assert.equal(formattedGuid, 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d');
  });

  it('Distinguished Name validator supports RFC 4514 escaped commas (\\, and \\2C) and validates Search Base scope', () => {
    const emptyCheck = validateDistinguishedNameSyntax('');
    assert.equal(emptyCheck.isValidSyntax, false);

    const placeholderCheck = validateDistinguishedNameSyntax(
      'OU=PLACEHOLDER_ORG_UNIT,DC=placeholder,DC=example'
    );
    assert.equal(placeholderCheck.isValidSyntax, false);
    assert.equal(placeholderCheck.isPlaceholder, true);

    const invalidPrefix = validateDistinguishedNameSyntax('BAD=Hospital,DC=example,DC=org');
    assert.equal(invalidPrefix.isValidSyntax, false);

    const validDn = validateDistinguishedNameSyntax('OU=HospitalStaff,DC=example,DC=org');
    assert.equal(validDn.isValidSyntax, true);
    assert.equal(validDn.isPlaceholder, false);

    // Escaped comma (\,) inside OU or CN must be valid
    const escapedCommaDn = 'CN=Somchai\\, MD,OU=Medicine\\, Internal,OU=HospitalStaff,DC=example,DC=org';
    const escapedCheck = validateDistinguishedNameSyntax(escapedCommaDn);
    assert.equal(escapedCheck.isValidSyntax, true, escapedCheck.message);

    // Hex-escaped comma (\2C) inside OU must be valid
    const hexEscapedCommaDn = 'OU=Ward\\2C Emergency,OU=HospitalStaff,DC=example,DC=org';
    const hexCheck = validateDistinguishedNameSyntax(hexEscapedCommaDn);
    assert.equal(hexCheck.isValidSyntax, true, hexCheck.message);

    // Scope validation within Search Base
    assert.equal(isDnScopedWithinSearchBase(escapedCommaDn, 'OU=HospitalStaff,DC=example,DC=org'), true);
    assert.equal(
      isDnScopedWithinSearchBase('CN=External,OU=OtherUnit,DC=example,DC=org', 'OU=HospitalStaff,DC=example,DC=org'),
      false
    );
  });

  it('Feature Flag is disabled by default and cannot bypass Phase 2A Code Gate via configuration alone', () => {
    assert.equal(IS_PHASE_2A_CODE_GATE_LOCKED, true);

    const defaultEval = evaluatePhase2ALiveConnectionGate();
    assert.equal(defaultEval.configuredFlag, false);
    assert.equal(defaultEval.phase2ACodeGateLocked, true);
    assert.equal(defaultEval.effectiveLiveConnectionAllowed, false);

    // Even if config attempts to pass true, Phase 2A hard lock keeps live connection disabled
    const forcedConfigEval = evaluatePhase2ALiveConnectionGate(true);
    assert.equal(forcedConfigEval.configuredFlag, true);
    assert.equal(forcedConfigEval.phase2ACodeGateLocked, true);
    assert.equal(
      forcedConfigEval.effectiveLiveConnectionAllowed,
      false,
      'Phase 2A must block live AD connection even if config flag is true'
    );
  });

  it('MockDirectoryApi.getConnectionReadiness returns all 6 required checks as Simulated/NotTested/NotConfigured and labels LockoutDuration as test default', async () => {
    const api = new MockDirectoryApi();
    const report = await api.getConnectionReadiness();

    assert.equal(report.isLiveAdConnectionActive, false);
    assert.equal(report.isPhase2ACodeGateLocked, true);
    assert.equal(report.configuration.effectiveLiveConnectionEnabled, false);
    assert.equal(report.configuration.servicePasswordStatus, '[REDACTED_NEVER_LOGGED]');
    assert.equal(report.configuration.maxResultWindowLimit, 1000);
    assert.equal(report.configuration.lockoutDurationMinutes, 30);
    assert.equal(report.configuration.lockoutDurationPolicyStatus, LOCKOUT_DURATION_SIMULATED_DISCLAIMER);
    assert.ok(report.configuration.lockoutDurationPolicyStatus.includes('SimulatedTestDefault_NotHospitalPolicy'));
    assert.equal(report.checks.length, 6);

    const expectedIds = [
      'dns-resolution',
      'tcp-636-reachability',
      'tls-certificate-validation',
      'ldaps-bind-readiness',
      'search-base-validation',
      'service-account-permission-readiness',
    ];

    assert.deepEqual(
      report.checks.map((c) => c.id),
      expectedIds
    );

    const allowedStatuses = new Set(['Simulated', 'NotTested', 'NotConfigured']);
    for (const check of report.checks) {
      assert.equal(check.isLiveTested, false, `Check ${check.id} must not claim live testing`);
      assert.ok(
        allowedStatuses.has(check.status),
        `Check ${check.id} status '${check.status}' must be Simulated, NotTested, or NotConfigured`
      );
    }
  });

  it('RBAC for Diagnostics API and Settings View are strictly aligned and Demo Auth is rejected in Production', async () => {
    const allRoles: UserRole[] = [
      'Viewer',
      'Helpdesk',
      'ADOperator',
      'SecurityAuditor',
      'SystemAdministrator',
    ];

    const settingsAllowed = getAllowedRolesForPage('settings');
    assert.deepEqual(settingsAllowed, ['ADOperator', 'SecurityAuditor', 'SystemAdministrator']);

    for (const role of allRoles) {
      assert.equal(
        hasDiagnosticsAccess(role),
        hasPageAccess(role, 'settings'),
        `Diagnostics access for ${role} must match Settings page access`
      );
    }

    const api = new MockDirectoryApi();
    // Viewer and Helpdesk must be denied with 403 Forbidden
    for (const deniedRole of ['Viewer', 'Helpdesk'] as UserRole[]) {
      await assert.rejects(
        async () => api.getConnectionReadiness(deniedRole),
        (err: unknown) =>
          err instanceof DirectoryApiError &&
          err.statusCode === 403 &&
          err.errorCode === 'FORBIDDEN_DIAGNOSTICS_ROLE'
      );
    }

    // ADOperator, SecurityAuditor, and SystemAdministrator must be permitted
    for (const allowedRole of ['ADOperator', 'SecurityAuditor', 'SystemAdministrator'] as UserRole[]) {
      const report = await api.getConnectionReadiness(allowedRole);
      assert.equal(report.checks.length, 6);
    }

    // Demo Authentication environment guard must reject Production/Staging and allow only Development/Test
    assert.equal(isDemoAuthPermittedInEnvironment('Production'), false);
    assert.equal(isDemoAuthPermittedInEnvironment('Staging'), false);
    assert.equal(isDemoAuthPermittedInEnvironment('UAT'), false);
    assert.equal(isDemoAuthPermittedInEnvironment(''), false);
    assert.equal(isDemoAuthPermittedInEnvironment(null), false);
    assert.equal(isDemoAuthPermittedInEnvironment('Development'), true);
    assert.equal(isDemoAuthPermittedInEnvironment('Test'), true);
  });

  it('HttpDirectoryApi.getConnectionReadiness calls /api/diagnostics/connection-readiness with correlation header', async () => {
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};

    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      const mockReport = await new MockDirectoryApi().getConnectionReadiness();
      return new Response(JSON.stringify(mockReport), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    try {
      const httpApi = new HttpDirectoryApi('http://localhost:5000/api', 5000);
      const report = await httpApi.getConnectionReadiness('SystemAdministrator');

      assert.equal(capturedUrl, 'http://localhost:5000/api/diagnostics/connection-readiness');
      assert.ok(capturedHeaders['X-Correlation-ID']?.startsWith('req-'));
      assert.equal(report.isLiveAdConnectionActive, false);
      assert.equal(report.checks.length, 6);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

