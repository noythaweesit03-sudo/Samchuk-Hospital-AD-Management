/**
 * Samchuk Hospital AD Management - Core Type Definitions
 * Phase 1: Mock and Typed Contracts
 */

export type UserRole = 
  | 'Viewer' 
  | 'Helpdesk' 
  | 'ADOperator' 
  | 'SecurityAuditor' 
  | 'SystemAdministrator';

export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
  sessionExpiry: string;
}

export type AccountStatus = 'Enabled' | 'Disabled' | 'LockedOut';

export interface AdUser {
  id: string; // Opaque ID (e.g., GUID string)
  sAMAccountName: string;
  userPrincipalName: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  title: string;
  office: string;
  telephoneNumber: string;
  employeeId: string;
  distinguishedName: string;
  ouPath: string;
  status: AccountStatus;
  userAccountControl: number;
  uacFlags: string[];
  passwordLastSet: string;
  passwordExpires?: string;
  badPasswordCount: number;
  lastLogonTimestamp?: string; // Explicitly noted as approximate
  createdDate: string;
  memberOf: string[]; // Group names
}

export interface AdComputer {
  id: string;
  name: string;
  dnsHostName: string;
  operatingSystem: string;
  operatingSystemVersion: string;
  distinguishedName: string;
  ouPath: string;
  status: 'Enabled' | 'Disabled';
  lastLogonTimestamp?: string; // Explicitly approximate
  ipAddressSimulated?: string;
  bitLockerConfigured: boolean;
  departmentTag: string;
  createdDate: string;
}

export interface AdOrganizationalUnit {
  id: string;
  name: string;
  distinguishedName: string;
  parentDn?: string;
  description: string;
  protectedFromAccidentalDeletion: boolean;
  userCount: number;
  computerCount: number;
  subOuCount: number;
  children?: AdOrganizationalUnit[];
}

export type GroupScope = 'DomainLocal' | 'Global' | 'Universal';
export type GroupType = 'Security' | 'Distribution';

export interface AdGroup {
  id: string;
  sAMAccountName: string;
  displayName: string;
  distinguishedName: string;
  scope: GroupScope;
  type: GroupType;
  description: string;
  ouPath: string;
  mailAddress?: string;
  memberCount: number;
  members: {
    id: string;
    sAMAccountName: string;
    displayName: string;
    type: 'User' | 'Group' | 'Computer';
    department?: string;
  }[];
  nestedGroups: string[];
}

export type AuditAction = 
  | 'AUTH_LOGIN' 
  | 'AUTH_LOGOUT' 
  | 'USER_LIST_VIEW' 
  | 'USER_DETAILS_VIEW' 
  | 'COMPUTER_LIST_VIEW' 
  | 'OU_TREE_VIEW' 
  | 'GROUP_DETAILS_VIEW' 
  | 'AUDIT_EXPORT_ATTEMPT'
  | 'SETTINGS_VIEW'
  | 'MUTATION_BLOCKED_PHASE1';

export interface AuditLogEntry {
  id: string;
  requestId: string;
  timestampUtc: string;
  actor: string;
  actorRole: UserRole;
  action: AuditAction;
  targetObject: string;
  targetType: 'User' | 'Computer' | 'OU' | 'Group' | 'System' | 'Auth';
  result: 'Success' | 'Denied' | 'SimulatedBlocked';
  clientIp: string;
  details: string;
}

export interface DashboardSummary {
  userStats: {
    total: number;
    enabled: number;
    disabled: number;
    lockedOut: number;
  };
  computerStats: {
    total: number;
    workstations: number;
    servers: number;
    enabled: number;
  };
  groupStats: {
    total: number;
    security: number;
    distribution: number;
  };
  ouStats: {
    totalOus: number;
  };
  serviceStatus: {
    domainController: string;
    dcAddressMock: string;
    dcStatus: 'Simulated' | 'Disconnected' | 'Connected';
    ldapsPort: number;
    tlsCertificate: 'NotConfigured_Phase2' | 'Valid' | 'Invalid';
    auditDatabase: 'InMemoryMock' | 'Connected';
    lastRefreshedUtc: string;
  };
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
