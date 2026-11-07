/**
 * Samchuk Hospital AD Management - Phase 2A LDAP Filter Escaping & Feature Flag Guard
 *
 * Implements:
 * - RFC 4515 Section 3 LDAP Search Filter Escaping & Injection Prevention
 * - RFC 4514 Distinguished Name (DN) Parsing & Validation (supporting escaped commas \, and \2C)
 * - Active Directory Lockout Policy Status Evaluation (lockoutTime + lockoutDurationMinutes + msDS-User-Account-Control-Computed)
 * - Bounded LDAP Paging & Search Scope Enforcement
 * - AD whenCreated (ASN.1 GeneralizedTime) & objectGUID Stable ID Mapping
 * - Phase 2A Hard-Locked Feature Flag Evaluation
 */

import { AccountStatus } from '../types/ad';

export const MAX_LDAP_SEARCH_INPUT_LENGTH = 128;

/**
 * Windows FileTime epoch offset in milliseconds from Unix epoch (1601-01-01T00:00:00Z to 1970-01-01T00:00:00Z)
 */
const WINDOWS_FILETIME_UNIX_EPOCH_DIFF_MS = 11644473600000n;
const TICKS_PER_MILLISECOND = 10000n;

/**
 * Hard-coded Phase 2A safety lock.
 * Even if a configuration object passes enableLiveReadOnlyConnection = true,
 * Phase 2A strictly blocks live Active Directory connections in code.
 */
export const IS_PHASE_2A_CODE_GATE_LOCKED = true as const;

export interface BoundedLdapPagingPlan {
  requestedPageNumber: number;
  requestedPageSize: number;
  skipCount: number;
  targetFetchCount: number;
  maxEntriesToFetch: number;
  effectiveLdapControlPageSize: number;
}

/**
 * Escapes raw user search input according to RFC 4515 Section 3 to prevent LDAP Injection:
 * \ -> \5c
 * * -> \2a
 * ( -> \28
 * ) -> \29
 * \0 -> \00
 * Control characters -> \xx hex encoding
 */
export function escapeLdapFilterValue(rawInput: string | null | undefined): string {
  if (!rawInput) {
    return '';
  }

  const trimmed = rawInput.trim();
  if (trimmed.length > MAX_LDAP_SEARCH_INPUT_LENGTH) {
    throw new Error(
      `LDAP_INPUT_TOO_LONG: Search input exceeds maximum allowed length of ${MAX_LDAP_SEARCH_INPUT_LENGTH} characters.`
    );
  }

  let escaped = '';
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    const code = trimmed.charCodeAt(i);

    if (ch === '\\') {
      escaped += '\\5c';
    } else if (ch === '*') {
      escaped += '\\2a';
    } else if (ch === '(') {
      escaped += '\\28';
    } else if (ch === ')') {
      escaped += '\\29';
    } else if (code === 0) {
      escaped += '\\00';
    } else if (code < 0x20 || code === 0x7f) {
      escaped += '\\' + code.toString(16).padStart(2, '0');
    } else {
      escaped += ch;
    }
  }

  return escaped;
}

/**
 * Converts a UTC timestamp in milliseconds to a Windows FileTime (100-nanosecond intervals since Jan 1, 1601 UTC).
 */
export function utcMsToWindowsFileTime(utcMs: number): bigint {
  return (BigInt(Math.trunc(utcMs)) + WINDOWS_FILETIME_UNIX_EPOCH_DIFF_MS) * TICKS_PER_MILLISECOND;
}

/**
 * Converts a Windows FileTime (bigint or numeric string) to a UTC Date, or null if 0/never.
 */
export function windowsFileTimeToUtcDate(fileTimeInput: string | number | bigint | null | undefined): Date | null {
  if (fileTimeInput === null || fileTimeInput === undefined || fileTimeInput === '') {
    return null;
  }

  try {
    const ft = typeof fileTimeInput === 'bigint' ? fileTimeInput : BigInt(String(fileTimeInput).trim());
    if (ft <= 0n || ft >= 9223372036854775807n) {
      return null;
    }
    const unixMs = Number(ft / TICKS_PER_MILLISECOND - WINDOWS_FILETIME_UNIX_EPOCH_DIFF_MS);
    if (!Number.isFinite(unixMs)) {
      return null;
    }
    return new Date(unixMs);
  } catch {
    return null;
  }
}

/**
 * Evaluates Active Directory account status accurately according to AD Lockout Policy:
 * 1. UF_ACCOUNTDISABLE (0x0002) takes precedence -> 'Disabled'.
 * 2. If msDS-User-Account-Control-Computed is provided, checks UF_LOCKOUT (0x0010).
 * 3. Otherwise, evaluates lockoutTime against the domain LockoutDurationMinutes window:
 *    - Active Directory does NOT reset lockoutTime to 0 automatically when the lockout duration expires;
 *      relying solely on lockoutTime > 0 falsely reports expired lockouts as 'LockedOut'.
 */
export function evaluateAdAccountLockoutStatus(params: {
  userAccountControl: number;
  lockoutTime?: string | number | bigint | null;
  lockoutDurationMinutes?: number;
  computedUac?: number | null;
  referenceUtcMs?: number;
}): AccountStatus {
  const {
    userAccountControl,
    lockoutTime = 0n,
    lockoutDurationMinutes = 30,
    computedUac = null,
    referenceUtcMs = Date.now(),
  } = params;

  // UF_ACCOUNTDISABLE = 0x0002 (2)
  if ((userAccountControl & 0x0002) !== 0) {
    return 'Disabled';
  }

  // Authoritative computed attribute (msDS-User-Account-Control-Computed) UF_LOCKOUT = 0x0010 (16)
  if (computedUac !== null && computedUac !== undefined) {
    if ((computedUac & 0x0010) !== 0) {
      return 'LockedOut';
    }
    return 'Enabled';
  }

  if ((userAccountControl & 0x0010) !== 0) {
    return 'LockedOut';
  }

  let ft = 0n;
  try {
    ft = typeof lockoutTime === 'bigint' ? lockoutTime : BigInt(String(lockoutTime ?? '0').trim() || '0');
  } catch {
    ft = 0n;
  }

  if (ft <= 0n || ft >= 9223372036854775807n) {
    return 'Enabled';
  }

  // If lockoutDurationMinutes <= 0, policy requires manual administrator unlock
  if (lockoutDurationMinutes <= 0) {
    return 'LockedOut';
  }

  const lockoutDate = windowsFileTimeToUtcDate(ft);
  if (!lockoutDate) {
    return 'Enabled';
  }

  const lockoutExpiresAtMs = lockoutDate.getTime() + lockoutDurationMinutes * 60_000;
  return referenceUtcMs < lockoutExpiresAtMs ? 'LockedOut' : 'Enabled';
}

/**
 * Builds a safe RFC 4515 LDAP user search filter from filter criteria,
 * incorporating the Active Directory Lockout Policy window for LockedOut / Enabled status queries.
 */
export function buildSafeUserLdapFilter(
  options?: {
    search?: string;
    department?: string;
    status?: string;
  },
  lockoutDurationMinutes: number = 30,
  referenceUtcMs: number = Date.now()
): string {
  const clauses: string[] = [
    '(objectCategory=person)',
    '(objectClass=user)',
    '(!(objectClass=computer))',
  ];

  if (options?.search && options.search.trim().length > 0) {
    const escaped = escapeLdapFilterValue(options.search);
    clauses.push(
      `(|(sAMAccountName=*${escaped}*)(displayName=*${escaped}*)(mail=*${escaped}*)(department=*${escaped}*)(employeeID=*${escaped}*))`
    );
  }

  if (options?.department && options.department !== 'All' && options.department.trim().length > 0) {
    const escapedDept = escapeLdapFilterValue(options.department);
    clauses.push(`(department=*${escapedDept}*)`);
  }

  const minActiveLockoutFileTime =
    lockoutDurationMinutes > 0
      ? utcMsToWindowsFileTime(referenceUtcMs - lockoutDurationMinutes * 60_000)
      : 1n;

  if (options?.status && options.status !== 'All') {
    if (options.status === 'Disabled') {
      clauses.push('(userAccountControl:1.2.840.113556.1.4.803:=2)');
    } else if (options.status === 'LockedOut') {
      clauses.push(`(!(userAccountControl:1.2.840.113556.1.4.803:=2))(lockoutTime>=${minActiveLockoutFileTime.toString()})`);
    } else if (options.status === 'Enabled') {
      clauses.push('(!(userAccountControl:1.2.840.113556.1.4.803:=2))');
      clauses.push(`(|(!(lockoutTime=*))(lockoutTime=0)(lockoutTime<=${(minActiveLockoutFileTime - 1n).toString()}))`);
    }
  }

  return `(&${clauses.join('')})`;
}

/**
 * Calculates a bounded LDAP paging plan so that paged queries never fetch unbounded
 * result sets while still using RFC 2696 PageResultRequestControl.
 */
export function calculateBoundedLdapPagingPlan(params: {
  requestedPageNumber: number;
  requestedPageSize: number;
  configuredLdapPageSize?: number;
  maxResultWindowLimit?: number;
}): BoundedLdapPagingPlan {
  const safePageNumber = Math.max(Math.trunc(params.requestedPageNumber || 1), 1);
  const safePageSize = Math.min(Math.max(Math.trunc(params.requestedPageSize || 25), 1), 100);
  const safeLdapPageSize = Math.min(Math.max(Math.trunc(params.configuredLdapPageSize || 100), 10), 500);
  const safeWindowLimit = Math.min(Math.max(Math.trunc(params.maxResultWindowLimit || 1000), 10), 2000);

  const skipCount = (safePageNumber - 1) * safePageSize;
  if (skipCount >= safeWindowLimit) {
    throw new Error(
      `LDAP_PAGING_WINDOW_EXCEEDED: Requested page offset (${skipCount}) exceeds maximum bounded LDAP result window (${safeWindowLimit}).`
    );
  }

  const targetFetchCount = Math.min(skipCount + safePageSize, safeWindowLimit);
  const effectiveLdapControlPageSize = Math.max(Math.min(safeLdapPageSize, targetFetchCount), 1);

  return {
    requestedPageNumber: safePageNumber,
    requestedPageSize: safePageSize,
    skipCount,
    targetFetchCount,
    maxEntriesToFetch: safeWindowLimit,
    effectiveLdapControlPageSize,
  };
}

/**
 * Parses Active Directory whenCreated attribute (ASN.1 GeneralizedTime 'yyyyMMddHHmmss.0Z' or ISO 8601)
 * into a canonical UTC ISO 8601 string. Returns null if empty/invalid (never falls back to current time).
 */
export function parseAdWhenCreatedToIso(rawValue: string | null | undefined): string | null {
  if (!rawValue || rawValue.trim().length === 0) {
    return null;
  }

  const trimmed = rawValue.trim();

  // Match ASN.1 GeneralizedTime: YYYYMMDDHHMMSS(.0)?Z
  const generalizedMatch = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\.\d+)?Z$/i.exec(trimmed);
  if (generalizedMatch) {
    const [, year, month, day, hour, minute, second] = generalizedMatch;
    const utcMs = Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );
    const dt = new Date(utcMs);
    if (!Number.isNaN(dt.getTime())) {
      return dt.toISOString();
    }
  }

  const parsedMs = Date.parse(trimmed);
  if (!Number.isNaN(parsedMs)) {
    return new Date(parsedMs).toISOString();
  }

  return null;
}

/**
 * Converts a 16-byte little-endian Active Directory objectGUID into a canonical UUID string.
 */
export function formatObjectGuidBytes(bytes: Uint8Array | number[] | null | undefined, fallbackId: string = ''): string {
  if (!bytes || bytes.length !== 16) {
    return fallbackId;
  }

  const hex = Array.from(bytes, (b) => (b & 0xff).toString(16).padStart(2, '0'));
  // AD stores first 3 groups in little-endian order
  const d1 = `${hex[3]}${hex[2]}${hex[1]}${hex[0]}`;
  const d2 = `${hex[5]}${hex[4]}`;
  const d3 = `${hex[7]}${hex[6]}`;
  const d4 = `${hex[8]}${hex[9]}`;
  const d5 = `${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`;
  return `${d1}-${d2}-${d3}-${d4}-${d5}`.toLowerCase();
}

/**
 * Splits a Distinguished Name (DN) into Relative Distinguished Name (RDN) tokens according to RFC 4514,
 * respecting escaped commas (\, and \2C) and escaped backslashes (\\).
 */
export function parseDistinguishedNameRdns(dn: string): { valid: boolean; rdns: string[]; error?: string } {
  const rdns: string[] = [];
  if (!dn || dn.trim().length === 0) {
    return { valid: false, rdns, error: 'Distinguished Name is empty.' };
  }

  let current = '';
  for (let i = 0; i < dn.length; i++) {
    const ch = dn[i];
    if (ch === '\\') {
      if (i + 1 >= dn.length) {
        return { valid: false, rdns: [], error: 'Distinguished Name ends with a dangling escape character.' };
      }

      const next = dn[i + 1];
      if (/[0-9a-fA-F]/.test(next)) {
        if (i + 2 >= dn.length || !/[0-9a-fA-F]/.test(dn[i + 2])) {
          return { valid: false, rdns: [], error: 'Distinguished Name contains an incomplete hex escape sequence.' };
        }
        current += ch + next + dn[i + 2];
        i += 2;
      } else {
        current += ch + next;
        i += 1;
      }
    } else if (ch === ',') {
      const token = current.trim();
      if (token.length === 0) {
        return { valid: false, rdns: [], error: 'Distinguished Name contains an empty RDN component.' };
      }
      rdns.push(token);
      current = '';
    } else {
      current += ch;
    }
  }

  const finalToken = current.trim();
  if (finalToken.length === 0) {
    return { valid: false, rdns: [], error: 'Distinguished Name has a trailing comma or empty RDN component.' };
  }
  rdns.push(finalToken);

  return { valid: true, rdns };
}

/**
 * Validates whether a single RDN component (e.g. OU=Medicine\, Internal) has valid RFC 4514 syntax.
 */
function isValidRdnComponent(rdn: string): boolean {
  let eqIndex = -1;
  for (let i = 0; i < rdn.length; i++) {
    if (rdn[i] === '\\') {
      i++;
      continue;
    }
    if (rdn[i] === '=') {
      eqIndex = i;
      break;
    }
  }

  if (eqIndex <= 0 || eqIndex >= rdn.length - 1) {
    return false;
  }

  const attrType = rdn.slice(0, eqIndex).trim().toUpperCase();
  const attrValue = rdn.slice(eqIndex + 1).trim();

  if (!['OU', 'DC', 'CN', 'O', 'L', 'ST', 'C', 'UID'].includes(attrType)) {
    return false;
  }

  if (attrValue.length === 0) {
    return false;
  }

  // Ensure any unescaped comma or equals inside attrValue is rejected
  for (let i = 0; i < attrValue.length; i++) {
    const ch = attrValue[i];
    if (ch === '\\') {
      if (i + 1 >= attrValue.length) return false;
      i++;
      continue;
    }
    if (ch === ',') {
      return false;
    }
  }

  return true;
}

/**
 * Validates whether a Distinguished Name (DN) is configured or still a Phase 2A placeholder,
 * properly supporting RFC 4514 escaped commas (\, and \2C).
 */
export function validateDistinguishedNameSyntax(dn: string | null | undefined): {
  isValidSyntax: boolean;
  isPlaceholder: boolean;
  message: string;
} {
  if (!dn || dn.trim().length === 0) {
    return {
      isValidSyntax: false,
      isPlaceholder: false,
      message: 'Search Base Distinguished Name is empty.',
    };
  }

  if (dn.includes('\0')) {
    return {
      isValidSyntax: false,
      isPlaceholder: false,
      message: 'Search Base contains forbidden null character.',
    };
  }

  if (/PLACEHOLDER|TBD/i.test(dn)) {
    return {
      isValidSyntax: false,
      isPlaceholder: true,
      message: 'Search Base is currently set to a Phase 2A safe placeholder (Not Configured).',
    };
  }

  const parsed = parseDistinguishedNameRdns(dn);
  if (!parsed.valid) {
    return {
      isValidSyntax: false,
      isPlaceholder: false,
      message: parsed.error || 'Distinguished Name failed RFC 4514 RDN parsing.',
    };
  }

  if (parsed.rdns.length < 2) {
    return {
      isValidSyntax: false,
      isPlaceholder: false,
      message: 'Search Base must contain at least two RDN components (e.g. OU=...,DC=...,DC=...).',
    };
  }

  for (const rdn of parsed.rdns) {
    if (!isValidRdnComponent(rdn)) {
      return {
        isValidSyntax: false,
        isPlaceholder: false,
        message: `Invalid RDN component '${rdn}'. Expected valid RFC 4514 attribute=value syntax.`,
      };
    }
  }

  return {
    isValidSyntax: true,
    isPlaceholder: false,
    message: 'Distinguished Name syntax is valid (Not Tested against live Domain Controller).',
  };
}

/**
 * Verifies that a target Distinguished Name is scoped within or equal to the configured Search Base DN.
 */
export function isDnScopedWithinSearchBase(targetDn: string, searchBaseDn: string): boolean {
  const targetParsed = parseDistinguishedNameRdns(targetDn);
  const baseParsed = parseDistinguishedNameRdns(searchBaseDn);

  if (!targetParsed.valid || !baseParsed.valid || targetParsed.rdns.length < baseParsed.rdns.length) {
    return false;
  }

  const offset = targetParsed.rdns.length - baseParsed.rdns.length;
  for (let i = 0; i < baseParsed.rdns.length; i++) {
    if (targetParsed.rdns[offset + i].toLowerCase() !== baseParsed.rdns[i].toLowerCase()) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluates effective live connection state in Phase 2A.
 * Even if configFlagEnableLive is true, Phase 2A code gate forces effective state to false.
 */
export function evaluatePhase2ALiveConnectionGate(configFlagEnableLive: boolean = false): {
  configuredFlag: boolean;
  phase2ACodeGateLocked: boolean;
  effectiveLiveConnectionAllowed: boolean;
} {
  return {
    configuredFlag: Boolean(configFlagEnableLive),
    phase2ACodeGateLocked: IS_PHASE_2A_CODE_GATE_LOCKED,
    effectiveLiveConnectionAllowed: !IS_PHASE_2A_CODE_GATE_LOCKED && Boolean(configFlagEnableLive),
  };
}

