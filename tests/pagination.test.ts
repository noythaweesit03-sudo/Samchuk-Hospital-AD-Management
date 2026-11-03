import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MockDirectoryApi } from '../src/services/directoryApi.ts';

describe('Pagination and Filtering Calculations', () => {
  const api = new MockDirectoryApi();

  test('Page size 3 on 8 users yields 3 pages total', async () => {
    const page1 = await api.getUsers({ pageNumber: 1, pageSize: 3 });
    assert.equal(page1.items.length, 3);
    assert.equal(page1.totalCount, 8);
    assert.equal(page1.totalPages, 3);
    assert.equal(page1.pageNumber, 1);

    const page2 = await api.getUsers({ pageNumber: 2, pageSize: 3 });
    assert.equal(page2.items.length, 3);
    assert.equal(page2.pageNumber, 2);

    const page3 = await api.getUsers({ pageNumber: 3, pageSize: 3 });
    assert.equal(page3.items.length, 2);
    assert.equal(page3.pageNumber, 3);
  });

  test('Requesting page number beyond totalPages returns empty items', async () => {
    const outOfBounds = await api.getUsers({ pageNumber: 10, pageSize: 3 });
    assert.equal(outOfBounds.items.length, 0);
    assert.equal(outOfBounds.totalCount, 8);
    assert.equal(outOfBounds.totalPages, 3);
  });

  test('Sorting by sAMAccountName ascending orders alphabetically', async () => {
    const sorted = await api.getUsers({ sortBy: 'sAMAccountName', sortOrder: 'asc' });
    const accounts = sorted.items.map(u => u.sAMAccountName);
    const expected = [...accounts].sort();
    assert.deepEqual(accounts, expected);
  });

  test('Sorting by sAMAccountName descending orders in reverse', async () => {
    const sorted = await api.getUsers({ sortBy: 'sAMAccountName', sortOrder: 'desc' });
    const accounts = sorted.items.map(u => u.sAMAccountName);
    const expected = [...accounts].sort().reverse();
    assert.deepEqual(accounts, expected);
  });
});

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
});
