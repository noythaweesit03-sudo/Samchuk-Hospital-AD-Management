/**
 * Samchuk Hospital AD Management - Contract and Integration Tests
 * Phase 1.5: Frontend & Backend Integration Readiness
 * 
 * Verifies HttpDirectoryApi and MockDirectoryApi conformance to API contract:
 * - DTO payload mapping
 * - Query string serialization
 * - X-Correlation-ID injection
 * - Timeout enforcement via AbortController
 * - Error mapping to DirectoryApiError
 * - 404 translation to null for single resource endpoints
 * - Client factory configuration defaults
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  HttpDirectoryApi, 
  MockDirectoryApi, 
  createDirectoryApiClient, 
  DirectoryApiError 
} from '../src/services/directoryApi';
import { AdUser, PagedResult } from '../src/types/ad';

describe('API Contract & Integration Readiness', () => {

  it('Default factory createDirectoryApiClient yields MockDirectoryApi in mock mode', () => {
    const client = createDirectoryApiClient('mock');
    assert.ok(client instanceof MockDirectoryApi, 'Expected instance of MockDirectoryApi');
  });

  it('Factory createDirectoryApiClient("http") yields HttpDirectoryApi instance', () => {
    const client = createDirectoryApiClient('http', 'http://127.0.0.1:5000/api');
    assert.ok(client instanceof HttpDirectoryApi, 'Expected instance of HttpDirectoryApi');
  });

  it('HttpDirectoryApi serializes user query parameters and includes X-Correlation-ID', async () => {
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};

    // Mock global fetch for test harness
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      capturedUrl = input.toString();
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      
      const mockResult: PagedResult<AdUser> = {
        items: [],
        pageNumber: 2,
        pageSize: 5,
        totalCount: 0,
        totalPages: 0,
      };

      return new Response(JSON.stringify(mockResult), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    try {
      const api = new HttpDirectoryApi('http://mock-backend/api', 5000);
      const res = await api.getUsers({
        search: 'somchai',
        status: 'Enabled',
        department: 'IT',
        pageNumber: 2,
        pageSize: 5,
        sortBy: 'displayName',
        sortOrder: 'desc',
      });

      assert.equal(res.pageNumber, 2);
      assert.ok(capturedUrl.includes('/api/users?'), 'URL must target /api/users endpoint');
      assert.ok(capturedUrl.includes('search=somchai'), 'Query string must contain search');
      assert.ok(capturedUrl.includes('status=Enabled'), 'Query string must contain status');
      assert.ok(capturedUrl.includes('department=IT'), 'Query string must contain department');
      assert.ok(capturedUrl.includes('pageNumber=2'), 'Query string must contain pageNumber');
      assert.ok(capturedUrl.includes('pageSize=5'), 'Query string must contain pageSize');
      assert.ok(capturedUrl.includes('sortBy=displayName'), 'Query string must contain sortBy');
      assert.ok(capturedUrl.includes('sortOrder=desc'), 'Query string must contain sortOrder');

      // Verify Headers
      assert.ok(capturedHeaders['X-Correlation-ID'], 'Must include X-Correlation-ID header');
      assert.equal(capturedHeaders['Accept'], 'application/json');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('HttpDirectoryApi translates 404 status on getUserById to null without throwing', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (): Promise<Response> => {
      return new Response(
        JSON.stringify({
          errorCode: 'USER_NOT_FOUND',
          message: 'The requested user was not found',
          requestId: 'test-req-123',
          timestampUtc: new Date().toISOString(),
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const api = new HttpDirectoryApi('http://mock-backend/api');
      const user = await api.getUserById('non-existent-user');
      assert.equal(user, null, 'Expected null when user is not found (404)');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('HttpDirectoryApi parses structured error payloads into DirectoryApiError', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (): Promise<Response> => {
      return new Response(
        JSON.stringify({
          errorCode: 'UNAUTHORIZED_ACCESS',
          message: 'Authentication token is missing or invalid',
          requestId: 'req-corr-999',
          timestampUtc: new Date().toISOString(),
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const api = new HttpDirectoryApi('http://mock-backend/api');
      await assert.rejects(
        async () => {
          await api.getDashboardSummary();
        },
        (err: any) => {
          assert.ok(err instanceof DirectoryApiError, 'Error must be DirectoryApiError');
          assert.equal(err.statusCode, 401);
          assert.equal(err.errorCode, 'UNAUTHORIZED_ACCESS');
          assert.equal(err.requestId, 'req-corr-999');
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('HttpDirectoryApi timeout aborts requests that exceed timeout threshold', async () => {
    const originalFetch = globalThis.fetch;
    
    // Simulate hanging request that only responds after abort signal fires
    globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      return new Promise((_, reject) => {
        if (init?.signal) {
          init.signal.addEventListener('abort', () => {
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            reject(abortError);
          });
        }
      });
    };

    try {
      // Short 50ms timeout for automated test
      const api = new HttpDirectoryApi('http://mock-backend/api', 50);
      await assert.rejects(
        async () => {
          await api.getDashboardSummary();
        },
        (err: any) => {
          assert.ok(err instanceof DirectoryApiError);
          assert.equal(err.statusCode, 408);
          assert.equal(err.errorCode, 'REQUEST_TIMEOUT');
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('Contract parity: MockDirectoryApi implements identical method signatures to IDirectoryApi', async () => {
    const mock = new MockDirectoryApi();
    
    // Ensure all required contract methods exist on mock
    const expectedMethods = [
      'getHealth',
      'getDashboardSummary',
      'getUsers',
      'getUserById',
      'getComputers',
      'getComputerById',
      'getOuTree',
      'getOuById',
      'getGroups',
      'getGroupById',
      'getAuditLogs',
    ];

    for (const methodName of expectedMethods) {
      assert.equal(typeof (mock as any)[methodName], 'function', `Method ${methodName} must be defined`);
    }
  });

  it('getHealth returns healthy status and Phase 1 mock mode indicators', async () => {
    const mock = new MockDirectoryApi();
    const health = await mock.getHealth();
    assert.equal(health.status, 'Healthy');
    assert.equal(health.activeDirectory.liveConnection, false);
    assert.equal(health.architecture, 'Option A: Independent AD Management (Isolated Application Server)');
  });

});
