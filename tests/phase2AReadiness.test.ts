/**
 * Samchuk Hospital AD Management - Phase 2A Readiness & Security Unit Tests
 *
 * Covers:
 * 1. RFC 4515 LDAP Filter Escaping & Injection Prevention
 * 2. Search Input Length & Distinguished Name Validation
 * 3. Feature Flag Disabled & Phase 2A Code Gate Lock
 * 4. Connection Diagnostics Contract (6 checks, strictly Simulated / NotTested / NotConfigured)
 * 5. Secret / Password Redaction in Diagnostics Configuration
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeLdapFilterValue,
  buildSafeUserLdapFilter,
  validateDistinguishedNameSyntax,
  evaluatePhase2ALiveConnectionGate,
  MAX_LDAP_SEARCH_INPUT_LENGTH,
  IS_PHASE_2A_CODE_GATE_LOCKED,
} from '../src/utils/ldapEscaping';
import { MockDirectoryApi, HttpDirectoryApi } from '../src/services/directoryApi';

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

  it('buildSafeUserLdapFilter constructs escaped, read-only user search filter', () => {
    const filter = buildSafeUserLdapFilter({
      search: 'kittisak*(admin)',
      department: 'Medical',
      status: 'LockedOut',
    });

    assert.ok(filter.includes('(objectCategory=person)(objectClass=user)(!(objectClass=computer))'));
    assert.ok(filter.includes('kittisak\\2a\\28admin\\29'));
    assert.ok(filter.includes('(department=*Medical*)'));
    assert.ok(filter.includes('(lockoutTime>=1)'));
  });

  it('Distinguished Name validator identifies Phase 2A placeholders and invalid syntax', () => {
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

  it('MockDirectoryApi.getConnectionReadiness returns all 6 required checks as Simulated/NotTested/NotConfigured', async () => {
    const api = new MockDirectoryApi();
    const report = await api.getConnectionReadiness();

    assert.equal(report.isLiveAdConnectionActive, false);
    assert.equal(report.isPhase2ACodeGateLocked, true);
    assert.equal(report.configuration.effectiveLiveConnectionEnabled, false);
    assert.equal(report.configuration.servicePasswordStatus, '[REDACTED_NEVER_LOGGED]');
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
      const report = await httpApi.getConnectionReadiness();

      assert.equal(capturedUrl, 'http://localhost:5000/api/diagnostics/connection-readiness');
      assert.ok(capturedHeaders['X-Correlation-ID']?.startsWith('req-'));
      assert.equal(report.isLiveAdConnectionActive, false);
      assert.equal(report.checks.length, 6);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
