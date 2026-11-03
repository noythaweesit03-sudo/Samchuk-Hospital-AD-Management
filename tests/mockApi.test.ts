import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MockDirectoryApi } from '../src/services/directoryApi.ts';

describe('MockDirectoryApi Operational Contract', () => {
  const api = new MockDirectoryApi();

  test('getDashboardSummary returns valid summary structure and mock status', async () => {
    const summary = await api.getDashboardSummary();
    assert.ok(summary);
    assert.equal(summary.userStats.total, 48);
    assert.equal(summary.userStats.lockedOut, 1);
    assert.equal(summary.computerStats.total, 32);
    assert.equal(summary.serviceStatus.dcStatus, 'Simulated');
    assert.equal(summary.serviceStatus.ldapsPort, 636);
    assert.equal(summary.serviceStatus.tlsCertificate, 'NotConfigured_Phase2');
  });

  test('getUsers returns all 8 synthetic hospital staff records', async () => {
    const result = await api.getUsers();
    assert.equal(result.totalCount, 8);
    assert.equal(result.items.length, 8);
  });

  test('getUsers filters by LockedOut status returns exactly anong.sur', async () => {
    const result = await api.getUsers({ status: 'LockedOut' });
    assert.equal(result.totalCount, 1);
    assert.equal(result.items[0].sAMAccountName, 'anong.sur');
    assert.equal(result.items[0].status, 'LockedOut');
  });

  test('getUsers filters by Disabled status returns exactly pranee.bun', async () => {
    const result = await api.getUsers({ status: 'Disabled' });
    assert.equal(result.totalCount, 1);
    assert.equal(result.items[0].sAMAccountName, 'pranee.bun');
    assert.equal(result.items[0].status, 'Disabled');
  });

  test('getUsers search by Thai name finds Dr. Kittisak', async () => {
    const result = await api.getUsers({ search: 'กิตติศักดิ์' });
    assert.equal(result.totalCount, 1);
    assert.equal(result.items[0].sAMAccountName, 'kittisak.pra');
  });

  test('getUserById with valid ID returns user', async () => {
    const user = await api.getUserById('usr-001');
    assert.ok(user);
    assert.equal(user.sAMAccountName, 'kittisak.pra');
    assert.equal(user.department, 'กลุ่มงานการแพทย์ (Medical Staff)');
  });

  test('getUserById with invalid ID returns null', async () => {
    const user = await api.getUserById('usr-unknown-999');
    assert.equal(user, null);
  });

  test('getComputers returns 6 computers including Windows Server 2025 DC', async () => {
    const result = await api.getComputers();
    assert.equal(result.totalCount, 6);
    const dc = result.items.find(c => c.name === 'SH-DC01');
    assert.ok(dc);
    assert.equal(dc.operatingSystem, 'Windows Server 2025 Standard');
  });

  test('getOuTree returns root OU with 6 child departments', async () => {
    const tree = await api.getOuTree();
    assert.equal(tree.length, 1);
    assert.equal(tree[0].id, 'ou-root-samchuk');
    assert.equal(tree[0].children?.length, 6);
  });

  test('getGroups returns 5 groups including security and distribution', async () => {
    const groups = await api.getGroups();
    assert.equal(groups.length, 5);
    const secGroups = groups.filter(g => g.type === 'Security');
    const distGroups = groups.filter(g => g.type === 'Distribution');
    assert.equal(secGroups.length, 4);
    assert.equal(distGroups.length, 1);
  });

  test('getAuditLogs returns 7 events without sensitive credentials', async () => {
    const logs = await api.getAuditLogs();
    assert.equal(logs.totalCount, 7);
    for (const log of logs.items) {
      assert.ok(log.requestId.startsWith('req-'));
      assert.ok(!log.details.includes('password'));
      assert.ok(!log.details.includes('secret'));
    }
  });
});
