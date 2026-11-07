/**
 * Samchuk Hospital AD Management - Phase 2A LDAP Filter Escaping & Feature Flag Guard
 *
 * Implements RFC 4515 Section 3 LDAP Search Filter Escaping, Search Input Validation,
 * Distinguished Name Syntax Checking, and Phase 2A Hard-Locked Feature Flag Evaluation.
 */

export const MAX_LDAP_SEARCH_INPUT_LENGTH = 128;

/**
 * Hard-coded Phase 2A safety lock.
 * Even if a configuration object passes enableLiveReadOnlyConnection = true,
 * Phase 2A strictly blocks live Active Directory connections in code.
 */
export const IS_PHASE_2A_CODE_GATE_LOCKED = true as const;

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
 * Builds a safe RFC 4515 LDAP user search filter from filter criteria.
 */
export function buildSafeUserLdapFilter(options?: {
  search?: string;
  department?: string;
  status?: string;
}): string {
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

  if (options?.status && options.status !== 'All') {
    if (options.status === 'Disabled') {
      clauses.push('(userAccountControl:1.2.840.113556.1.4.803:=2)');
    } else if (options.status === 'LockedOut') {
      clauses.push('(lockoutTime>=1)');
    } else if (options.status === 'Enabled') {
      clauses.push('(!(userAccountControl:1.2.840.113556.1.4.803:=2))');
      clauses.push('(|(!(lockoutTime=*))(lockoutTime=0))');
    }
  }

  return `(&${clauses.join('')})`;
}

/**
 * Validates whether a Distinguished Name (DN) is configured or still a Phase 2A placeholder.
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

  const parts = dn
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return {
      isValidSyntax: false,
      isPlaceholder: false,
      message: 'Search Base must contain at least two RDN components (e.g. OU=...,DC=...,DC=...).',
    };
  }

  for (const part of parts) {
    if (!/^(OU|DC|CN)=.+/i.test(part)) {
      return {
        isValidSyntax: false,
        isPlaceholder: false,
        message: `Invalid RDN component '${part}'. Expected OU=, DC=, or CN=.`,
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
