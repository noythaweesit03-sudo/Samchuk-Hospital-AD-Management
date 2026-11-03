import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { directoryApi, MockDirectoryApi, IDirectoryApi } from '../src/services/directoryApi.ts';

describe('Phase 1 Active Directory Write Operations Lock', () => {
  test('IDirectoryApi interface strictly exposes only read methods', () => {
    const api = new MockDirectoryApi();
    
    // Check that standard read methods exist
    assert.equal(typeof api.getDashboardSummary, 'function');
    assert.equal(typeof api.getUsers, 'function');
    assert.equal(typeof api.getUserById, 'function');
    assert.equal(typeof api.getComputers, 'function');
    assert.equal(typeof api.getComputerById, 'function');
    assert.equal(typeof api.getOuTree, 'function');
    assert.equal(typeof api.getOuById, 'function');
    assert.equal(typeof api.getGroups, 'function');
    assert.equal(typeof api.getGroupById, 'function');
    assert.equal(typeof api.getAuditLogs, 'function');

    // Confirm that NO mutating write methods are attached or exposed
    const unsafeApi = api as any;
    assert.equal(unsafeApi.createUser, undefined, 'createUser must not exist on Phase 1 API');
    assert.equal(unsafeApi.deleteUser, undefined, 'deleteUser must not exist on Phase 1 API');
    assert.equal(unsafeApi.unlockUser, undefined, 'unlockUser must not exist on Phase 1 API');
    assert.equal(unsafeApi.resetPassword, undefined, 'resetPassword must not exist on Phase 1 API');
    assert.equal(unsafeApi.modifyUser, undefined, 'modifyUser must not exist on Phase 1 API');
    assert.equal(unsafeApi.deleteComputer, undefined, 'deleteComputer must not exist on Phase 1 API');
  });

  test('Global directoryApi singleton is an instance of MockDirectoryApi', () => {
    assert.ok(directoryApi instanceof MockDirectoryApi);
  });
});
