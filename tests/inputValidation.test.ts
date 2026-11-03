import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MockDirectoryApi } from '../src/services/directoryApi.ts';

describe('Input Validation & Boundary Handling', () => {
  const api = new MockDirectoryApi();

  test('Whitespace in search query is trimmed properly', async () => {
    const resNormal = await api.getUsers({ search: 'somchai' });
    const resPadded = await api.getUsers({ search: '   somchai   ' });
    assert.equal(resNormal.totalCount, resPadded.totalCount);
    assert.equal(resNormal.items[0]?.id, resPadded.items[0]?.id);
  });

  test('Case-insensitivity on search query', async () => {
    const resUpper = await api.getUsers({ search: 'SOMCHAI' });
    const resLower = await api.getUsers({ search: 'somchai' });
    assert.equal(resUpper.totalCount, 1);
    assert.equal(resLower.totalCount, 1);
  });

  test('Unknown status filter returns 0 items without throwing', async () => {
    const res = await api.getUsers({ status: 'NonExistentStatus' });
    assert.equal(res.totalCount, 0);
    assert.equal(res.items.length, 0);
  });

  test('Unknown department filter returns 0 items without throwing', async () => {
    const res = await api.getUsers({ department: 'NonExistentDept' });
    assert.equal(res.totalCount, 0);
    assert.equal(res.items.length, 0);
  });

  test('Empty string search query returns all users gracefully', async () => {
    const res = await api.getUsers({ search: '' });
    assert.equal(res.totalCount, 8);
    assert.equal(res.items.length, 8);
  });

  test('Computer query handles empty search and filters gracefully', async () => {
    const res = await api.getComputers({ search: '   ', operatingSystem: 'All', status: 'All' });
    assert.equal(res.totalCount, 6);
    assert.equal(res.items.length, 6);
  });
});
