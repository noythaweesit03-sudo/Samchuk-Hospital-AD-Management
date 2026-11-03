/**
 * Samchuk Hospital AD Management - API Contract and Service Abstraction
 * Defines IDirectoryApi interface, MockDirectoryApi (Phase 1), and reserved HttpDirectoryApi (Phase 2).
 */

import { 
  AdUser, 
  AdComputer, 
  AdOrganizationalUnit, 
  AdGroup, 
  AuditLogEntry, 
  DashboardSummary, 
  PagedResult 
} from '../types/ad';
import { 
  MOCK_USERS, 
  MOCK_COMPUTERS, 
  MOCK_OUS, 
  MOCK_GROUPS, 
  MOCK_AUDIT_LOGS, 
  MOCK_DASHBOARD_SUMMARY 
} from '../mocks/mockData';

export interface UserFilterOptions {
  search?: string;
  status?: string;
  department?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: 'displayName' | 'sAMAccountName' | 'department' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface ComputerFilterOptions {
  search?: string;
  operatingSystem?: string;
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface GroupFilterOptions {
  search?: string;
  scope?: string;
  type?: string;
}

export interface AuditFilterOptions {
  action?: string;
  actor?: string;
  result?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface IDirectoryApi {
  getDashboardSummary(): Promise<DashboardSummary>;
  getUsers(options?: UserFilterOptions): Promise<PagedResult<AdUser>>;
  getUserById(id: string): Promise<AdUser | null>;
  getComputers(options?: ComputerFilterOptions): Promise<PagedResult<AdComputer>>;
  getComputerById(id: string): Promise<AdComputer | null>;
  getOuTree(): Promise<AdOrganizationalUnit[]>;
  getOuById(id: string): Promise<AdOrganizationalUnit | null>;
  getGroups(options?: GroupFilterOptions): Promise<AdGroup[]>;
  getGroupById(id: string): Promise<AdGroup | null>;
  getAuditLogs(options?: AuditFilterOptions): Promise<PagedResult<AuditLogEntry>>;
}

/**
 * MockDirectoryApi:
 * Strictly simulated read-only operations using synthetic in-memory data for Phase 1.
 * Guaranteed no connection to Windows Server 2025 Domain Controller or real hospital network.
 */
export class MockDirectoryApi implements IDirectoryApi {
  private users: AdUser[] = [...MOCK_USERS];
  private computers: AdComputer[] = [...MOCK_COMPUTERS];
  private ous: AdOrganizationalUnit[] = [...MOCK_OUS];
  private groups: AdGroup[] = [...MOCK_GROUPS];
  private auditLogs: AuditLogEntry[] = [...MOCK_AUDIT_LOGS];

  async getDashboardSummary(): Promise<DashboardSummary> {
    await this.simulateLatency();
    return {
      ...MOCK_DASHBOARD_SUMMARY,
      serviceStatus: {
        ...MOCK_DASHBOARD_SUMMARY.serviceStatus,
        lastRefreshedUtc: new Date().toISOString(),
      },
    };
  }

  async getUsers(options?: UserFilterOptions): Promise<PagedResult<AdUser>> {
    await this.simulateLatency();
    let filtered = [...this.users];

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      filtered = filtered.filter(u => 
        u.displayName.toLowerCase().includes(q) ||
        u.sAMAccountName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.employeeId.toLowerCase().includes(q)
      );
    }

    if (options?.status && options.status !== 'All') {
      filtered = filtered.filter(u => u.status === options.status);
    }

    if (options?.department && options.department !== 'All') {
      filtered = filtered.filter(u => u.department.includes(options.department!));
    }

    // Sort
    const sortBy = options?.sortBy || 'displayName';
    const sortOrder = options?.sortOrder || 'asc';
    filtered.sort((a, b) => {
      const valA = (a[sortBy] || '').toString().toLowerCase();
      const valB = (b[sortBy] || '').toString().toLowerCase();
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    const pageNumber = options?.pageNumber || 1;
    const pageSize = options?.pageSize || 10;
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const startIndex = (pageNumber - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      totalCount,
      pageNumber,
      pageSize,
      totalPages,
    };
  }

  async getUserById(id: string): Promise<AdUser | null> {
    await this.simulateLatency();
    return this.users.find(u => u.id === id || u.sAMAccountName === id) || null;
  }

  async getComputers(options?: ComputerFilterOptions): Promise<PagedResult<AdComputer>> {
    await this.simulateLatency();
    let filtered = [...this.computers];

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.dnsHostName.toLowerCase().includes(q) ||
        c.departmentTag.toLowerCase().includes(q)
      );
    }

    if (options?.operatingSystem && options.operatingSystem !== 'All') {
      filtered = filtered.filter(c => c.operatingSystem.includes(options.operatingSystem!));
    }

    if (options?.status && options.status !== 'All') {
      filtered = filtered.filter(c => c.status === options.status);
    }

    const pageNumber = options?.pageNumber || 1;
    const pageSize = options?.pageSize || 10;
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const startIndex = (pageNumber - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      totalCount,
      pageNumber,
      pageSize,
      totalPages,
    };
  }

  async getComputerById(id: string): Promise<AdComputer | null> {
    await this.simulateLatency();
    return this.computers.find(c => c.id === id || c.name === id) || null;
  }

  async getOuTree(): Promise<AdOrganizationalUnit[]> {
    await this.simulateLatency();
    return this.ous;
  }

  async getOuById(id: string): Promise<AdOrganizationalUnit | null> {
    await this.simulateLatency();
    const findInTree = (nodes: AdOrganizationalUnit[]): AdOrganizationalUnit | null => {
      for (const node of nodes) {
        if (node.id === id || node.distinguishedName === id) return node;
        if (node.children) {
          const match = findInTree(node.children);
          if (match) return match;
        }
      }
      return null;
    };
    return findInTree(this.ous);
  }

  async getGroups(options?: GroupFilterOptions): Promise<AdGroup[]> {
    await this.simulateLatency();
    let filtered = [...this.groups];

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      filtered = filtered.filter(g => 
        g.displayName.toLowerCase().includes(q) ||
        g.sAMAccountName.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
      );
    }

    if (options?.scope && options.scope !== 'All') {
      filtered = filtered.filter(g => g.scope === options.scope);
    }

    if (options?.type && options.type !== 'All') {
      filtered = filtered.filter(g => g.type === options.type);
    }

    return filtered;
  }

  async getGroupById(id: string): Promise<AdGroup | null> {
    await this.simulateLatency();
    return this.groups.find(g => g.id === id || g.sAMAccountName === id) || null;
  }

  async getAuditLogs(options?: AuditFilterOptions): Promise<PagedResult<AuditLogEntry>> {
    await this.simulateLatency();
    let filtered = [...this.auditLogs];

    if (options?.action && options.action !== 'All') {
      filtered = filtered.filter(l => l.action === options.action);
    }

    if (options?.actor && options.actor.trim() !== '') {
      const q = options.actor.toLowerCase().trim();
      filtered = filtered.filter(l => l.actor.toLowerCase().includes(q));
    }

    if (options?.result && options.result !== 'All') {
      filtered = filtered.filter(l => l.result === options.result);
    }

    const pageNumber = options?.pageNumber || 1;
    const pageSize = options?.pageSize || 10;
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const startIndex = (pageNumber - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      totalCount,
      pageNumber,
      pageSize,
      totalPages,
    };
  }

  private simulateLatency(): Promise<void> {
    // Subtle realistic latency between 100ms - 200ms
    return new Promise(resolve => setTimeout(resolve, 120));
  }
}

/**
 * HttpDirectoryApi:
 * Reserved for Phase 2 when ASP.NET Core Web API is compiled and deployed on the Application Server.
 * Communicates with backend endpoints (/api/users, /api/computers, etc.) via reverse proxy.
 */
export class HttpDirectoryApi implements IDirectoryApi {
  constructor(private baseUrl: string = '/api') {}

  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${this.baseUrl}/dashboard/summary`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async getUsers(options?: UserFilterOptions): Promise<PagedResult<AdUser>> {
    const params = new URLSearchParams();
    if (options?.search) params.append('search', options.search);
    if (options?.status) params.append('status', options.status);
    if (options?.department) params.append('department', options.department);
    if (options?.pageNumber) params.append('pageNumber', options.pageNumber.toString());
    if (options?.pageSize) params.append('pageSize', options.pageSize.toString());
    const res = await fetch(`${this.baseUrl}/users?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async getUserById(id: string): Promise<AdUser | null> {
    const res = await fetch(`${this.baseUrl}/users/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async getComputers(options?: ComputerFilterOptions): Promise<PagedResult<AdComputer>> {
    const params = new URLSearchParams();
    if (options?.search) params.append('search', options.search);
    if (options?.operatingSystem) params.append('operatingSystem', options.operatingSystem);
    if (options?.status) params.append('status', options.status);
    if (options?.pageNumber) params.append('pageNumber', options.pageNumber.toString());
    if (options?.pageSize) params.append('pageSize', options.pageSize.toString());
    const res = await fetch(`${this.baseUrl}/computers?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async getComputerById(id: string): Promise<AdComputer | null> {
    const res = await fetch(`${this.baseUrl}/computers/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async getOuTree(): Promise<AdOrganizationalUnit[]> {
    const res = await fetch(`${this.baseUrl}/ous/tree`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async getOuById(id: string): Promise<AdOrganizationalUnit | null> {
    const res = await fetch(`${this.baseUrl}/ous/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async getGroups(options?: GroupFilterOptions): Promise<AdGroup[]> {
    const params = new URLSearchParams();
    if (options?.search) params.append('search', options.search);
    if (options?.scope) params.append('scope', options.scope);
    if (options?.type) params.append('type', options.type);
    const res = await fetch(`${this.baseUrl}/groups?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async getGroupById(id: string): Promise<AdGroup | null> {
    const res = await fetch(`${this.baseUrl}/groups/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async getAuditLogs(options?: AuditFilterOptions): Promise<PagedResult<AuditLogEntry>> {
    const params = new URLSearchParams();
    if (options?.action) params.append('action', options.action);
    if (options?.actor) params.append('actor', options.actor);
    if (options?.result) params.append('result', options.result);
    if (options?.pageNumber) params.append('pageNumber', options.pageNumber.toString());
    if (options?.pageSize) params.append('pageSize', options.pageSize.toString());
    const res = await fetch(`${this.baseUrl}/audit?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }
}

// Default singleton instance for Phase 1
export const directoryApi: IDirectoryApi = new MockDirectoryApi();
