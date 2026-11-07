/**
 * Samchuk Hospital AD Management - API Contract and Service Abstraction
 * Phase 1.5: Frontend & Backend Integration Readiness
 * 
 * Defines IDirectoryApi interface, MockDirectoryApi (Phase 1 default),
 * and HttpDirectoryApi with Correlation ID, Timeout, and Error Handling.
 */

import { 
  AdUser, 
  AdComputer, 
  AdOrganizationalUnit, 
  AdGroup, 
  AuditLogEntry, 
  DashboardSummary, 
  PagedResult,
  ConnectionReadinessReport
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

export class DirectoryApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode: string = 'DIRECTORY_API_ERROR',
    public requestId: string = ''
  ) {
    super(message);
    this.name = 'DirectoryApiError';
  }
}

export interface HealthStatus {
  status: 'Healthy' | 'Degraded' | 'Unhealthy';
  system: string;
  environment: string;
  mode: string;
  activeDirectory: {
    liveConnection: boolean;
    writeOperations: string;
    provider: string;
  };
  architecture: string;
  timestampUtc: string;
}

export interface IDirectoryApi {
  getHealth(): Promise<HealthStatus>;
  getConnectionReadiness(): Promise<ConnectionReadinessReport>;
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
 * Strictly simulated read-only operations using synthetic in-memory data for Phase 1 & 1.5.
 * Guaranteed no connection to Windows Server 2025 Domain Controller or real hospital network.
 */
export class MockDirectoryApi implements IDirectoryApi {
  private users: AdUser[] = [...MOCK_USERS];
  private computers: AdComputer[] = [...MOCK_COMPUTERS];
  private ous: AdOrganizationalUnit[] = [...MOCK_OUS];
  private groups: AdGroup[] = [...MOCK_GROUPS];
  private auditLogs: AuditLogEntry[] = [...MOCK_AUDIT_LOGS];

  async getHealth(): Promise<HealthStatus> {
    await this.simulateLatency();
    return {
      status: 'Healthy',
      system: 'Samchuk Hospital Active Directory Management API',
      environment: 'Development',
      mode: 'Phase 2A — Offline LDAPS Adapter & Mock Mode',
      activeDirectory: {
        liveConnection: false,
        writeOperations: 'Disabled (Phase 4 Planned)',
        provider: 'In-Memory Synthetic Mock Provider (Phase 2A Hard-Locked)'
      },
      architecture: 'Option A: Independent AD Management (Isolated Application Server)',
      timestampUtc: new Date().toISOString()
    };
  }

  async getConnectionReadiness(): Promise<ConnectionReadinessReport> {
    await this.simulateLatency();
    return {
      phase: 'Phase 2A — Offline LDAPS Adapter & Readiness Preparation',
      architecture: 'Option A: Independent AD Management (Isolated Application Server)',
      overallStatus: 'Simulated / Not Tested (Live AD Connection Strictly Disabled in Phase 2A)',
      isLiveAdConnectionActive: false,
      isPhase2ACodeGateLocked: true,
      disclaimer:
        'โหมดเตรียมความพร้อม Phase 2A: ผลลัพธ์ทั้งหมดเป็นสถานะจำลอง (Simulated) หรือยังไม่ได้ทดสอบจริง (Not Tested / Not Configured) ห้ามถือเป็นผลการเชื่อมต่อ Domain Controller จริง',
      generatedAtUtc: new Date().toISOString(),
      configuration: {
        domainControllerFqdn: '__PLACEHOLDER_DC_FQDN__',
        ldapsPort: 636,
        useSsl: true,
        searchBase: 'OU=PLACEHOLDER_ORG_UNIT,DC=placeholder,DC=example',
        readOnlyServiceAccount: '__PLACEHOLDER_READONLY_SERVICE_ACCOUNT__',
        servicePasswordStatus: '[REDACTED_NEVER_LOGGED]',
        connectionTimeoutSeconds: 10,
        ldapPageSize: 100,
        featureFlagConfiguredValue: false,
        phase2ACodeGateLocked: true,
        effectiveLiveConnectionEnabled: false,
        requireValidCertificateChain: true,
        requireHostnameMatch: true,
        allowWildcardCertificates: false,
        rootCaThumbprintPlaceholder: '__PLACEHOLDER_HOSPITAL_ROOT_CA_THUMBPRINT__',
      },
      checks: [
        {
          id: 'dns-resolution',
          name: 'DNS Resolution',
          nameThai: '1. การแปลงชื่อโดเมน (DNS Resolution)',
          status: 'NotConfigured',
          isLiveTested: false,
          target: '__PLACEHOLDER_DC_FQDN__',
          summary:
            '[Not Configured / Not Tested] ยังเป็นค่า Placeholder สำหรับ Phase 2A ยังไม่ได้ระบุ FQDN ของ Domain Controller จริง',
          remediationOrNextStep:
            'ระบุ Domain Controller FQDN จริง และตรวจสอบ DNS Forward/Reverse Lookup บน Application Server ก่อนเริ่ม Phase 2B',
        },
        {
          id: 'tcp-636-reachability',
          name: 'TCP 636 Reachability',
          nameThai: '2. การเข้าถึงพอร์ตเครือข่าย LDAPS (TCP 636 Reachability)',
          status: 'NotTested',
          isLiveTested: false,
          target: '__PLACEHOLDER_DC_FQDN__:636',
          summary:
            '[Not Tested] ปิดการเปิด TCP Socket จริงใน Phase 2A ตามข้อกำหนดความปลอดภัย (Zero Live Network Connection)',
          remediationOrNextStep:
            'ประสานทีมเครือข่ายเปิด Firewall เฉพาะ TCP 636 จาก IP ของ Application Server ไปยัง Domain Controller ก่อนเริ่ม Phase 2B',
        },
        {
          id: 'tls-certificate-validation',
          name: 'TLS Certificate Validation',
          nameThai: '3. การตรวจสอบใบรับรองความปลอดภัย (TLS Certificate & SAN Validation)',
          status: 'Simulated',
          isLiveTested: false,
          target: 'RequireChain=true, RequireSAN=true, AllowWildcard=false',
          summary:
            '[Simulated — Offline Logic Verified] ลอจิกตรวจสอบ X509Chain และ SAN/Hostname (MatchesHostname) พร้อมใช้งานแล้ว แต่ยังไม่ได้ทำ TLS Handshake กับ DC จริง (Not Tested)',
          remediationOrNextStep:
            'ติดตั้งใบรับรอง Enterprise Root CA ของโรงพยาบาลสามชุกใน Trusted Root Certification Authorities บน Application Server',
        },
        {
          id: 'ldaps-bind-readiness',
          name: 'LDAPS Bind Readiness',
          nameThai: '4. ความพร้อมในการยืนยันตัวตน LDAPS Bind (LDAPS Bind Readiness)',
          status: 'NotTested',
          isLiveTested: false,
          target: 'AuthType.Negotiate over TLS (Timeout: 10s, PageSize: 100)',
          summary:
            '[Not Tested] อะแดปเตอร์ LdapsReadService เตรียมคำสั่ง Bind แบบ Read-Only พร้อม Timeout และ CancellationToken แล้ว แต่ถูกล็อกด้วย Phase 2A Code Gate',
          remediationOrNextStep:
            'รอการอนุมัติ Security Gate เพื่อทดสอบ LDAPS Bind ในสภาพแวดล้อม Test/Staging ใน Phase 2B',
        },
        {
          id: 'search-base-validation',
          name: 'Search Base Validation',
          nameThai: '5. การตรวจสอบโครงสร้าง Search Base DN (Search Base Validation)',
          status: 'NotConfigured',
          isLiveTested: false,
          target: 'OU=PLACEHOLDER_ORG_UNIT,DC=placeholder,DC=example',
          summary:
            '[Not Configured] Search Base ยังเป็นค่า Placeholder สำหรับ Phase 2A ยังไม่ได้ระบุ Distinguished Name ของ OU จริง',
          remediationOrNextStep:
            'กำหนด Distinguished Name ของ Root OU จริงของโรงพยาบาลสามชุกผ่าน Environment Variable หรือ Secret Store ใน Phase 2B',
        },
        {
          id: 'service-account-permission-readiness',
          name: 'Service Account Permission Readiness',
          nameThai: '6. ความพร้อมของบัญชีบริการอ่านข้อมูลอย่างเดียว (Service Account Permission Readiness)',
          status: 'NotConfigured',
          isLiveTested: false,
          target: '__PLACEHOLDER_READONLY_SERVICE_ACCOUNT__ (Password: [REDACTED_NEVER_LOGGED])',
          summary:
            '[Not Configured / Not Tested] บัญชีบริการยังเป็นค่า Placeholder (__PLACEHOLDER_READONLY_SERVICE_ACCOUNT__)',
          remediationOrNextStep:
            'สร้างบัญชีบริการเฉพาะทางที่มีสิทธิ์ Read-Only เท่านั้น (ห้ามอยู่ในกลุ่ม Domain Admins หรือ Account Operators)',
        },
      ],
    };
  }

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
      if (q.length > 0) {
        filtered = filtered.filter(u => 
          u.displayName.toLowerCase().includes(q) ||
          u.sAMAccountName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q) ||
          u.employeeId.toLowerCase().includes(q)
        );
      }
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

    const pageNumber = Math.max(options?.pageNumber || 1, 1);
    const pageSize = Math.max(options?.pageSize || 10, 1);
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
      if (q.length > 0) {
        filtered = filtered.filter(c => 
          c.name.toLowerCase().includes(q) ||
          c.dnsHostName.toLowerCase().includes(q) ||
          c.departmentTag.toLowerCase().includes(q)
        );
      }
    }

    if (options?.operatingSystem && options.operatingSystem !== 'All') {
      filtered = filtered.filter(c => c.operatingSystem.includes(options.operatingSystem!));
    }

    if (options?.status && options.status !== 'All') {
      filtered = filtered.filter(c => c.status === options.status);
    }

    const pageNumber = Math.max(options?.pageNumber || 1, 1);
    const pageSize = Math.max(options?.pageSize || 10, 1);
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
      if (q.length > 0) {
        filtered = filtered.filter(g => 
          g.displayName.toLowerCase().includes(q) ||
          g.sAMAccountName.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q)
        );
      }
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

    const pageNumber = Math.max(options?.pageNumber || 1, 1);
    const pageSize = Math.max(options?.pageSize || 10, 1);
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
 * Production-ready HTTP client communicating with ASP.NET Core Web API (/api/*).
 * Includes timeout cancellation, correlation ID injection, and structured error handling.
 */
export class HttpDirectoryApi implements IDirectoryApi {
  constructor(
    private baseUrl: string = '/api',
    private timeoutMs: number = 10000
  ) {}

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const correlationId = 'req-' + Math.random().toString(36).substring(2, 10);

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'X-Correlation-ID': correlationId,
      ...(options.headers as Record<string, string> || {}),
    };

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!res.ok) {
        let errorMsg = `HTTP Error ${res.status}`;
        let errorCode = 'SERVER_ERROR';
        let reqId = correlationId;

        try {
          const errorBody = await res.json();
          if (errorBody.message) errorMsg = errorBody.message;
          else if (errorBody.error) errorMsg = errorBody.error;
          
          if (errorBody.errorCode) errorCode = errorBody.errorCode;
          else if (errorBody.code) errorCode = errorBody.code;

          if (errorBody.requestId) reqId = errorBody.requestId;
        } catch {
          // Fall back to HTTP status text
          errorMsg = res.statusText || errorMsg;
        }

        throw new DirectoryApiError(errorMsg, res.status, errorCode, reqId);
      }

      return res;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new DirectoryApiError(
          `Request timeout after ${this.timeoutMs}ms`,
          408,
          'REQUEST_TIMEOUT',
          correlationId
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async getHealth(): Promise<HealthStatus> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/health`);
    return res.json();
  }

  async getConnectionReadiness(): Promise<ConnectionReadinessReport> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/diagnostics/connection-readiness`);
    return res.json();
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/dashboard/summary`);
    return res.json();
  }

  async getUsers(options?: UserFilterOptions): Promise<PagedResult<AdUser>> {
    const params = new URLSearchParams();
    if (options?.search) params.append('search', options.search);
    if (options?.status) params.append('status', options.status);
    if (options?.department) params.append('department', options.department);
    if (options?.pageNumber) params.append('pageNumber', options.pageNumber.toString());
    if (options?.pageSize) params.append('pageSize', options.pageSize.toString());
    if (options?.sortBy) params.append('sortBy', options.sortBy);
    if (options?.sortOrder) params.append('sortOrder', options.sortOrder);

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/users?${queryString}` : `${this.baseUrl}/users`;
    const res = await this.fetchWithTimeout(url);
    return res.json();
  }

  async getUserById(id: string): Promise<AdUser | null> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/users/${encodeURIComponent(id)}`);
      return await res.json();
    } catch (err: any) {
      if (err instanceof DirectoryApiError && err.statusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async getComputers(options?: ComputerFilterOptions): Promise<PagedResult<AdComputer>> {
    const params = new URLSearchParams();
    if (options?.search) params.append('search', options.search);
    if (options?.operatingSystem) params.append('operatingSystem', options.operatingSystem);
    if (options?.status) params.append('status', options.status);
    if (options?.pageNumber) params.append('pageNumber', options.pageNumber.toString());
    if (options?.pageSize) params.append('pageSize', options.pageSize.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/computers?${queryString}` : `${this.baseUrl}/computers`;
    const res = await this.fetchWithTimeout(url);
    return res.json();
  }

  async getComputerById(id: string): Promise<AdComputer | null> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/computers/${encodeURIComponent(id)}`);
      return await res.json();
    } catch (err: any) {
      if (err instanceof DirectoryApiError && err.statusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async getOuTree(): Promise<AdOrganizationalUnit[]> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/ous/tree`);
    return res.json();
  }

  async getOuById(id: string): Promise<AdOrganizationalUnit | null> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/ous/${encodeURIComponent(id)}`);
      return await res.json();
    } catch (err: any) {
      if (err instanceof DirectoryApiError && err.statusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async getGroups(options?: GroupFilterOptions): Promise<AdGroup[]> {
    const params = new URLSearchParams();
    if (options?.search) params.append('search', options.search);
    if (options?.scope) params.append('scope', options.scope);
    if (options?.type) params.append('type', options.type);

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/groups?${queryString}` : `${this.baseUrl}/groups`;
    const res = await this.fetchWithTimeout(url);
    return res.json();
  }

  async getGroupById(id: string): Promise<AdGroup | null> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/groups/${encodeURIComponent(id)}`);
      return await res.json();
    } catch (err: any) {
      if (err instanceof DirectoryApiError && err.statusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async getAuditLogs(options?: AuditFilterOptions): Promise<PagedResult<AuditLogEntry>> {
    const params = new URLSearchParams();
    if (options?.action) params.append('action', options.action);
    if (options?.actor) params.append('actor', options.actor);
    if (options?.result) params.append('result', options.result);
    if (options?.pageNumber) params.append('pageNumber', options.pageNumber.toString());
    if (options?.pageSize) params.append('pageSize', options.pageSize.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/audit?${queryString}` : `${this.baseUrl}/audit`;
    const res = await this.fetchWithTimeout(url);
    return res.json();
  }
}

/**
 * Factory for API Client Layer (Phase 1.5):
 * Controlled via configuration. Default is strictly 'mock' mode.
 */
export type ApiClientMode = 'mock' | 'http';

export function createDirectoryApiClient(mode?: ApiClientMode, baseUrl?: string): IDirectoryApi {
  // STRICT DEFAULT: Always use 'mock' unless explicitly configured as 'http'
  const isEnvHttp = typeof import.meta !== 'undefined' && 
                    import.meta.env && 
                    import.meta.env.VITE_API_CLIENT_MODE === 'http';
  const resolvedMode = mode || (isEnvHttp ? 'http' : 'mock');

  if (resolvedMode === 'http') {
    const url = baseUrl || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AD_API_URL) || '/api';
    return new HttpDirectoryApi(url);
  }

  return new MockDirectoryApi();
}

// Default singleton instance (Strictly Mock mode in Phase 1 & 1.5)
export const directoryApi: IDirectoryApi = createDirectoryApiClient('mock');
