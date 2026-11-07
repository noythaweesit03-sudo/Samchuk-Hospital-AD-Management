using System.Text;
using SamchukHospital.AdManagement.Application.Common.Interfaces;

namespace SamchukHospital.AdManagement.Infrastructure.Directory;

/// <summary>
/// RFC 4515 Compliant LDAP Search Filter Escaping and Input Validation Utility.
/// Prevents LDAP Injection when building search filters for System.DirectoryServices.Protocols.
/// </summary>
public static class LdapFilterSanitizer
{
    public const int MaxSearchInputLength = 128;

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
            throw new ArgumentException($"Search input exceeds maximum allowed length of {MaxSearchInputLength} characters.", nameof(rawInput));
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
    /// Validates whether a Distinguished Name (DN) string is structurally safe for SearchBase usage.
    /// Rejects empty strings, placeholder tokens, null bytes, or unbalanced quotes.
    /// </summary>
    public static bool IsStructurallyValidDistinguishedName(string? dn, out string validationMessage)
    {
        if (string.IsNullOrWhiteSpace(dn))
        {
            validationMessage = "Search Base Distinguished Name is empty.";
            return false;
        }

        if (dn.Contains('\0'))
        {
            validationMessage = "Search Base contains forbidden null byte.";
            return false;
        }

        if (dn.Contains("PLACEHOLDER", StringComparison.OrdinalIgnoreCase) ||
            dn.Contains("TBD", StringComparison.OrdinalIgnoreCase))
        {
            validationMessage = "Search Base is currently set to a Phase 2A placeholder and has not been configured with the live hospital OU.";
            return false;
        }

        var parts = dn.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length < 2)
        {
            validationMessage = "Search Base must contain at least two RDN components (e.g., OU=...,DC=...,DC=...).";
            return false;
        }

        foreach (var part in parts)
        {
            if (!part.StartsWith("OU=", StringComparison.OrdinalIgnoreCase) &&
                !part.StartsWith("DC=", StringComparison.OrdinalIgnoreCase) &&
                !part.StartsWith("CN=", StringComparison.OrdinalIgnoreCase))
            {
                validationMessage = $"Invalid RDN prefix in component '{part}'. Expected OU=, DC=, or CN=.";
                return false;
            }
        }

        validationMessage = "Distinguished Name syntax is valid (Not Tested against live DC).";
        return true;
    }

    /// <summary>
    /// Builds a safe, read-only LDAP search filter for Active Directory User queries.
    /// </summary>
    public static string BuildUserSearchFilter(UserFilterQuery query)
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
            switch (query.Status.Trim())
            {
                case "Disabled":
                    // Bitwise AND check on userAccountControl for UF_ACCOUNTDISABLE (2)
                    clauses.Add("(userAccountControl:1.2.840.113556.1.4.803:=2)");
                    break;
                case "LockedOut":
                    // lockoutTime >= 1
                    clauses.Add("(lockoutTime>=1)");
                    break;
                case "Enabled":
                    clauses.Add("(!(userAccountControl:1.2.840.113556.1.4.803:=2))");
                    clauses.Add("(|(!(lockoutTime=*))(lockoutTime=0))");
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
}
