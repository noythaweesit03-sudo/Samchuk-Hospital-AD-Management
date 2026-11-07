using System.Text;
using SamchukHospital.AdManagement.Application.Common.Interfaces;

namespace SamchukHospital.AdManagement.Infrastructure.Directory;

/// <summary>
/// RFC 4515 LDAP Search Filter Escaping and RFC 4514 Distinguished Name (DN) Parser & Validator.
/// Prevents LDAP Injection and properly parses Distinguished Names with escaped commas (\, or \2C).
/// </summary>
public static class LdapFilterSanitizer
{
    public const int MaxSearchInputLength = 128;

    private static readonly HashSet<char> AllowedRdnEscapedSpecialChars = new()
    {
        ',', '+', '"', '\\', '<', '>', ';', '=', ' ', '#'
    };

    /// <summary>
    /// Escapes a raw assertion value according to RFC 4515 Section 3:
    /// \ -> \5c
    /// * -> \2a
    /// ( -> \28
    /// ) -> \29
    /// NUL (\0) -> \00
    /// Control characters (< 0x20 or == 0x7F) -> \XX hex encoding
    /// </summary>
    public static string EscapeFilterValue(string? rawInput)
    {
        if (string.IsNullOrEmpty(rawInput))
        {
            return string.Empty;
        }

        var trimmed = rawInput.Trim();
        if (trimmed.Length > MaxSearchInputLength)
        {
            throw new ArgumentException(
                $"Search input exceeds maximum allowed length of {MaxSearchInputLength} characters.",
                nameof(rawInput));
        }

        var sb = new StringBuilder(trimmed.Length * 2);
        foreach (var ch in trimmed)
        {
            switch (ch)
            {
                case '\\':
                    sb.Append("\\5c");
                    break;
                case '*':
                    sb.Append("\\2a");
                    break;
                case '(':
                    sb.Append("\\28");
                    break;
                case ')':
                    sb.Append("\\29");
                    break;
                case '\0':
                    sb.Append("\\00");
                    break;
                default:
                    if (char.IsControl(ch))
                    {
                        sb.AppendFormat("\\{0:x2}", (int)ch);
                    }
                    else
                    {
                        sb.Append(ch);
                    }
                    break;
            }
        }

        return sb.ToString();
    }

    /// <summary>
    /// Converts a Guid into an RFC 4515 binary octet string filter representation (e.g. \a1\b2\c3...)
    /// for querying Active Directory objectGUID directly.
    /// </summary>
    public static string FormatGuidAsLdapOctetFilter(Guid guid)
    {
        var bytes = guid.ToByteArray();
        var sb = new StringBuilder(bytes.Length * 3);
        foreach (var b in bytes)
        {
            sb.AppendFormat("\\{0:x2}", b);
        }
        return sb.ToString();
    }

    /// <summary>
    /// Parses a Distinguished Name (DN) according to RFC 4514 into individual RDN components,
    /// properly honoring escaped commas (\, or \2C) and escape sequences without naive Split(',').
    /// Returns false if syntax is malformed (e.g. trailing backslash, empty RDN, invalid escape).
    /// </summary>
    public static bool TryParseDistinguishedNameRdns(
        string? dn,
        out List<string> rdns,
        out string errorMessage)
    {
        rdns = new List<string>();
        errorMessage = string.Empty;

        if (string.IsNullOrWhiteSpace(dn))
        {
            errorMessage = "Distinguished Name is empty.";
            return false;
        }

        if (dn.Contains('\0'))
        {
            errorMessage = "Distinguished Name contains forbidden null byte.";
            return false;
        }

        var trimmedDn = dn.Trim();
        var currentRdn = new StringBuilder();

        for (var i = 0; i < trimmedDn.Length; i++)
        {
            var ch = trimmedDn[i];
            if (ch == '\\')
            {
                if (i + 1 >= trimmedDn.Length)
                {
                    errorMessage = "Distinguished Name ends with an incomplete trailing escape character '\\'.";
                    return false;
                }

                var next = trimmedDn[i + 1];
                if (AllowedRdnEscapedSpecialChars.Contains(next))
                {
                    currentRdn.Append('\\').Append(next);
                    i++;
                    continue;
                }

                // Check for 2-digit hex escape \XX (RFC 4514)
                if (i + 2 < trimmedDn.Length && IsHexDigit(next) && IsHexDigit(trimmedDn[i + 2]))
                {
                    currentRdn.Append('\\').Append(next).Append(trimmedDn[i + 2]);
                    i += 2;
                    continue;
                }

                errorMessage = $"Distinguished Name contains invalid escape sequence '\\{next}'.";
                return false;
            }

            if (ch == ',')
            {
                var rdnCandidate = currentRdn.ToString().Trim();
                if (string.IsNullOrEmpty(rdnCandidate))
                {
                    errorMessage = "Distinguished Name contains an empty RDN component (consecutive or leading comma).";
                    return false;
                }

                rdns.Add(rdnCandidate);
                currentRdn.Clear();
            }
            else
            {
                currentRdn.Append(ch);
            }
        }

        var lastRdn = currentRdn.ToString().Trim();
        if (string.IsNullOrEmpty(lastRdn))
        {
            errorMessage = "Distinguished Name ends with a trailing unescaped comma.";
            return false;
        }

        rdns.Add(lastRdn);

        foreach (var rdn in rdns)
        {
            if (!ValidateSingleRdnComponent(rdn, out errorMessage))
            {
                return false;
            }
        }

        return true;
    }

    private static bool ValidateSingleRdnComponent(string rdn, out string errorMessage)
    {
        errorMessage = string.Empty;

        // Find the first unescaped '=' separating AttributeType and AttributeValue
        var equalsIndex = -1;
        for (var i = 0; i < rdn.Length; i++)
        {
            if (rdn[i] == '\\')
            {
                i++; // skip escaped character
                continue;
            }

            if (rdn[i] == '=')
            {
                equalsIndex = i;
                break;
            }
        }

        if (equalsIndex <= 0 || equalsIndex >= rdn.Length - 1)
        {
            errorMessage = $"RDN component '{rdn}' must follow 'AttributeType=AttributeValue' syntax.";
            return false;
        }

        var attrType = rdn[..equalsIndex].Trim();
        var attrValue = rdn[(equalsIndex + 1)..].Trim();

        if (!attrType.Equals("OU", StringComparison.OrdinalIgnoreCase) &&
            !attrType.Equals("DC", StringComparison.OrdinalIgnoreCase) &&
            !attrType.Equals("CN", StringComparison.OrdinalIgnoreCase))
        {
            errorMessage = $"Invalid RDN attribute type '{attrType}' in '{rdn}'. Expected OU, DC, or CN.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(attrValue))
        {
            errorMessage = $"RDN component '{rdn}' has an empty attribute value.";
            return false;
        }

        // Verify no unescaped forbidden characters (=, ", <, >, ;) exist inside the attribute value
        for (var i = 0; i < attrValue.Length; i++)
        {
            var ch = attrValue[i];
            if (ch == '\\')
            {
                i++; // skip escaped char
                continue;
            }

            if (ch is '"' or '<' or '>' or ';' or '=')
            {
                errorMessage = $"RDN value in '{rdn}' contains unescaped special character '{ch}'.";
                return false;
            }
        }

        return true;
    }

    private static bool IsHexDigit(char c) =>
        (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');

    /// <summary>
    /// Validates whether a Distinguished Name (DN) string is structurally safe for SearchBase usage
    /// according to RFC 4514 (supporting escaped commas) and is not a Phase 2A placeholder.
    /// </summary>
    public static bool IsStructurallyValidDistinguishedName(string? dn, out string validationMessage)
    {
        if (!TryParseDistinguishedNameRdns(dn, out var rdns, out validationMessage))
        {
            return false;
        }

        if (dn!.Contains("PLACEHOLDER", StringComparison.OrdinalIgnoreCase) ||
            dn.Contains("TBD", StringComparison.OrdinalIgnoreCase))
        {
            validationMessage = "Search Base is currently set to a Phase 2A placeholder and has not been configured with the live hospital OU.";
            return false;
        }

        if (rdns.Count < 2)
        {
            validationMessage = "Search Base must contain at least two RDN components (e.g., OU=...,DC=...,DC=...).";
            return false;
        }

        if (!rdns[^1].StartsWith("DC=", StringComparison.OrdinalIgnoreCase))
        {
            validationMessage = "Search Base must terminate with a Domain Component (DC=...).";
            return false;
        }

        validationMessage = "Distinguished Name syntax is valid RFC 4514 (Not Tested against live DC).";
        return true;
    }

    /// <summary>
    /// Verifies that a target search DN is within (equal to or a child of) the configured root SearchBase DN.
    /// Compares parsed RFC 4514 RDN sequences from right (root) to left.
    /// </summary>
    public static bool IsDnScopedWithinSearchBase(string? targetDn, string? allowedRootSearchBaseDn)
    {
        if (!TryParseDistinguishedNameRdns(targetDn, out var targetRdns, out _) ||
            !TryParseDistinguishedNameRdns(allowedRootSearchBaseDn, out var baseRdns, out _))
        {
            return false;
        }

        if (targetRdns.Count < baseRdns.Count)
        {
            return false;
        }

        var offset = targetRdns.Count - baseRdns.Count;
        for (var i = 0; i < baseRdns.Count; i++)
        {
            if (!string.Equals(targetRdns[offset + i], baseRdns[i], StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
        }

        return true;
    }

    /// <summary>
    /// Builds a safe, read-only LDAP search filter for Active Directory User queries.
    /// Evaluates LockedOut status using the Active Directory Lockout Policy window (lockoutDurationMinutes)
    /// or msDS-User-Account-Control-Computed rather than naive lockoutTime >= 1 alone.
    /// </summary>
    public static string BuildUserSearchFilter(
        UserFilterQuery query,
        int lockoutDurationMinutes = 30,
        DateTime? referenceUtc = null)
    {
        var clauses = new List<string>
        {
            "(objectCategory=person)",
            "(objectClass=user)",
            "(!(objectClass=computer))"
        };

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var escaped = EscapeFilterValue(query.Search);
            clauses.Add($"(|(sAMAccountName=*{escaped}*)(displayName=*{escaped}*)(mail=*{escaped}*)(department=*{escaped}*)(employeeID=*{escaped}*))");
        }

        if (!string.IsNullOrWhiteSpace(query.Department) && !string.Equals(query.Department, "All", StringComparison.OrdinalIgnoreCase))
        {
            var escapedDept = EscapeFilterValue(query.Department);
            clauses.Add($"(department=*{escapedDept}*)");
        }

        if (!string.IsNullOrWhiteSpace(query.Status) && !string.Equals(query.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            var now = referenceUtc ?? DateTime.UtcNow;
            var minActiveLockoutFileTime = lockoutDurationMinutes > 0
                ? now.AddMinutes(-lockoutDurationMinutes).ToFileTimeUtc()
                : 1L;

            switch (query.Status.Trim())
            {
                case "Disabled":
                    clauses.Add("(userAccountControl:1.2.840.113556.1.4.803:=2)");
                    break;
                case "LockedOut":
                    // Exclude disabled accounts and require lockoutTime within the active AD lockout policy window
                    clauses.Add("(!(userAccountControl:1.2.840.113556.1.4.803:=2))");
                    clauses.Add($"(lockoutTime>={minActiveLockoutFileTime})");
                    break;
                case "Enabled":
                    clauses.Add("(!(userAccountControl:1.2.840.113556.1.4.803:=2))");
                    clauses.Add($"(|(!(lockoutTime=*))(lockoutTime=0)(lockoutTime<={minActiveLockoutFileTime - 1}))");
                    break;
            }
        }

        return $"(&{string.Concat(clauses)})";
    }

    /// <summary>
    /// Builds a safe, read-only LDAP search filter for Active Directory Computer queries.
    /// </summary>
    public static string BuildComputerSearchFilter(ComputerFilterQuery query)
    {
        var clauses = new List<string>
        {
            "(objectCategory=computer)",
            "(objectClass=computer)"
        };

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var escaped = EscapeFilterValue(query.Search);
            clauses.Add($"(|(cn=*{escaped}*)(dNSHostName=*{escaped}*)(description=*{escaped}*))");
        }

        if (!string.IsNullOrWhiteSpace(query.OperatingSystem) && !string.Equals(query.OperatingSystem, "All", StringComparison.OrdinalIgnoreCase))
        {
            var escapedOs = EscapeFilterValue(query.OperatingSystem);
            clauses.Add($"(operatingSystem=*{escapedOs}*)");
        }

        if (!string.IsNullOrWhiteSpace(query.Status) && !string.Equals(query.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            if (string.Equals(query.Status, "Disabled", StringComparison.OrdinalIgnoreCase))
            {
                clauses.Add("(userAccountControl:1.2.840.113556.1.4.803:=2)");
            }
            else if (string.Equals(query.Status, "Enabled", StringComparison.OrdinalIgnoreCase))
            {
                clauses.Add("(!(userAccountControl:1.2.840.113556.1.4.803:=2))");
            }
        }

        return $"(&{string.Concat(clauses)})";
    }

    /// <summary>
    /// Builds a safe, read-only LDAP search filter for Active Directory Group queries.
    /// </summary>
    public static string BuildGroupSearchFilter(GroupFilterQuery query)
    {
        var clauses = new List<string>
        {
            "(objectCategory=group)",
            "(objectClass=group)"
        };

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var escaped = EscapeFilterValue(query.Search);
            clauses.Add($"(|(sAMAccountName=*{escaped}*)(displayName=*{escaped}*)(description=*{escaped}*))");
        }

        return $"(&{string.Concat(clauses)})";
    }

    /// <summary>
    /// Builds an identifier filter that supports looking up by either objectGUID (when id is a GUID)
    /// or by the primary account/object name attribute (e.g. sAMAccountName or cn).
    /// </summary>
    public static string BuildIdentifierOrAccountFilter(string objectCategoryAndClassClause, string nameAttribute, string rawId)
    {
        if (Guid.TryParse(rawId?.Trim(), out var guid))
        {
            var octetGuid = FormatGuidAsLdapOctetFilter(guid);
            var escapedId = EscapeFilterValue(rawId);
            return $"(&{objectCategoryAndClassClause}(|(objectGUID={octetGuid})({nameAttribute}={escapedId})))";
        }

        var escapedName = EscapeFilterValue(rawId);
        return $"(&{objectCategoryAndClassClause}({nameAttribute}={escapedName}))";
    }
}
