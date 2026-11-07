using System.DirectoryServices.Protocols;
using System.Globalization;
using System.Net;
using System.Security.Cryptography.X509Certificates;
using Microsoft.Extensions.Options;
using SamchukHospital.AdManagement.Application.Common.Interfaces;
using SamchukHospital.AdManagement.Domain.Entities;

namespace SamchukHospital.AdManagement.Infrastructure.Directory;

/// <summary>
/// Phase 2A Read-Only Active Directory LDAPS Adapter for Windows Server 2025 AD DS.
/// 
/// ARCHITECTURAL BOUNDARY (OPTION A — PHASE 2A):
/// - Implements complete read-only LDAP query construction, RFC 4515 filter escaping,
///   LDAP paging (PageResultRequestControl), timeout enforcement, cancellation support,
///   UAC status decoding, and lastLogonTimestamp conversion.
/// - STRICTLY HARD-LOCKED IN PHASE 2A: Live network connections cannot be enabled via
///   configuration alone (ActiveDirectoryOptions.IsPhase2ACodeGateLocked == true).
/// - Zero write operations exist in this adapter.
/// </summary>
public class LdapsReadService : IDirectoryReadService
{
    /// <summary>
    /// Explicit accuracy note for Active Directory lastLogonTimestamp attribute.
    /// </summary>
    public const string LastLogonAccuracyLimitationNote =
        "Active Directory lastLogonTimestamp is replicated across Domain Controllers on a 9–14 day window (msDS-LogonTimeSyncInterval) and is an approximate historical indicator, NOT a real-time online status.";

    private static readonly string[] UserAttributes =
    {
        "objectGUID", "sAMAccountName", "userPrincipalName", "displayName",
        "givenName", "sn", "mail", "department", "title", "physicalDeliveryOfficeName",
        "telephoneNumber", "employeeID", "distinguishedName", "userAccountControl",
        "lockoutTime", "pwdLastSet", "badPwdCount", "lastLogonTimestamp", "whenCreated", "memberOf"
    };

    private static readonly string[] ComputerAttributes =
    {
        "objectGUID", "cn", "dNSHostName", "operatingSystem", "operatingSystemVersion",
        "distinguishedName", "userAccountControl", "lastLogonTimestamp", "description", "whenCreated"
    };

    private static readonly string[] OuAttributes =
    {
        "objectGUID", "ou", "name", "distinguishedName", "description", "nTSecurityDescriptor"
    };

    private static readonly string[] GroupAttributes =
    {
        "objectGUID", "sAMAccountName", "displayName", "cn", "distinguishedName",
        "groupType", "description", "mail", "member", "memberOf"
    };

    private readonly ActiveDirectoryOptions _options;

    public LdapsReadService()
        : this(new ActiveDirectoryOptions())
    {
    }

    public LdapsReadService(ActiveDirectoryOptions options)
    {
        _options = options ?? new ActiveDirectoryOptions();
    }

    public LdapsReadService(IOptions<ActiveDirectoryOptions> optionsAccessor)
        : this(optionsAccessor?.Value ?? new ActiveDirectoryOptions())
    {
    }

    /// <summary>
    /// Effective live connection state. Always false in Phase 2A even if config flag is true.
    /// </summary>
    public bool IsLiveConnectionEnabled => _options.IsEffectiveLiveConnectionAllowed;

    /// <summary>
    /// Enforces the Phase 2A hard lock before any network socket or LDAP bind can occur.
    /// </summary>
    private void EnsureLiveConnectionAllowedOrThrow(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (ActiveDirectoryOptions.IsPhase2ACodeGateLocked || !_options.EnableLiveReadOnlyConnection)
        {
            throw new InvalidOperationException(
                "PHASE_2A_HARD_LOCK: Live Active Directory LDAPS connection is strictly disabled in Phase 2A. " +
                "Setting EnableLiveReadOnlyConnection in configuration alone cannot bypass the Phase 2A code gate.");
        }

        if (_options.HasPlaceholderValues())
        {
            throw new InvalidOperationException(
                "AD_CONFIG_INCOMPLETE: Active Directory configuration still contains Phase 2A placeholder values.");
        }
    }

    /// <summary>
    /// Validates the Domain Controller LDAPS server certificate for Phase 2 readiness.
    /// Never bypasses or disables TLS verification.
    /// </summary>
    public static bool ValidateServerCertificate(
        string expectedServerHostname,
        X509Certificate? certificate,
        bool allowWildcards = false)
    {
        if (string.IsNullOrWhiteSpace(expectedServerHostname) || certificate == null)
        {
            return false;
        }

        using var x509 = new X509Certificate2(certificate);

        var nowUtc = DateTime.UtcNow;
        if (nowUtc < x509.NotBefore.ToUniversalTime() || nowUtc > x509.NotAfter.ToUniversalTime())
        {
            return false;
        }

        var hostMatches = x509.MatchesHostname(
            expectedServerHostname.Trim(),
            allowWildcards: allowWildcards,
            allowCommonName: true);

        if (!hostMatches)
        {
            return false;
        }

        using var chain = new X509Chain();
        chain.ChainPolicy.RevocationMode = X509RevocationMode.Online;
        chain.ChainPolicy.RevocationFlag = X509RevocationFlag.ExcludeRoot;
        chain.ChainPolicy.VerificationFlags = X509VerificationFlags.NoFlag;
        chain.ChainPolicy.VerificationTime = nowUtc;

        if (!chain.Build(x509))
        {
            return false;
        }

        foreach (var status in chain.ChainStatus)
        {
            if (status.Status != X509ChainStatusFlags.NoError)
            {
                return false;
            }
        }

        return true;
    }

    /// <summary>
    /// Decodes Active Directory userAccountControl bitmask and lockoutTime into AccountStatus.
    /// </summary>
    public static string ParseAccountStatus(int userAccountControl, long lockoutTime = 0)
    {
        const int UF_ACCOUNTDISABLE = 0x0002;
        const int UF_LOCKOUT = 0x0010;

        if ((userAccountControl & UF_ACCOUNTDISABLE) != 0)
        {
            return "Disabled";
        }

        if (lockoutTime > 0 || (userAccountControl & UF_LOCKOUT) != 0)
        {
            return "LockedOut";
        }

        return "Enabled";
    }

    /// <summary>
    /// Extracts human-readable UAC flags from the userAccountControl integer attribute.
    /// </summary>
    public static List<string> ParseUacFlags(int userAccountControl, long lockoutTime = 0)
    {
        var flags = new List<string>();
        if ((userAccountControl & 0x0002) != 0) flags.Add("ACCOUNTDISABLE");
        if ((userAccountControl & 0x0010) != 0 || lockoutTime > 0) flags.Add("LOCKOUT");
        if ((userAccountControl & 0x0020) != 0) flags.Add("PASSWD_NOTREQD");
        if ((userAccountControl & 0x0040) != 0) flags.Add("PASSWD_CANT_CHANGE");
        if ((userAccountControl & 0x0200) != 0) flags.Add("NORMAL_ACCOUNT");
        if ((userAccountControl & 0x1000) != 0) flags.Add("WORKSTATION_TRUST_ACCOUNT");
        if ((userAccountControl & 0x2000) != 0) flags.Add("SERVER_TRUST_ACCOUNT");
        if ((userAccountControl & 0x10000) != 0) flags.Add("DONT_EXPIRE_PASSWORD");
        if ((userAccountControl & 0x800000) != 0) flags.Add("PASSWORD_EXPIRED");

        if (flags.Count == 0)
        {
            flags.Add("NORMAL_ACCOUNT");
        }

        return flags;
    }

    /// <summary>
    /// Converts Windows FileTime (100-nanosecond intervals since Jan 1, 1601 UTC) used by
    /// lastLogonTimestamp and pwdLastSet into nullable DateTime UTC.
    /// Note: Refer to LastLogonAccuracyLimitationNote regarding 9-14 day replication accuracy.
    /// </summary>
    public static DateTime? ConvertAdFileTimeToUtc(string? rawFileTime)
    {
        if (string.IsNullOrWhiteSpace(rawFileTime))
        {
            return null;
        }

        if (!long.TryParse(rawFileTime.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var fileTime) ||
            fileTime <= 0 ||
            fileTime == long.MaxValue)
        {
            return null;
        }

        try
        {
            return DateTime.FromFileTimeUtc(fileTime);
        }
        catch (ArgumentOutOfRangeException)
        {
            return null;
        }
    }

    /// <summary>
    /// Decodes Active Directory groupType bitmask into Scope and Type strings.
    /// </summary>
    public static (string Scope, string Type) ParseGroupTypeAndScope(int groupTypeBitmask)
    {
        const uint SECURITY_GROUP_FLAG = 0x80000000;
        var isSecurity = ((uint)groupTypeBitmask & SECURITY_GROUP_FLAG) != 0;
        var type = isSecurity ? "Security" : "Distribution";

        var scope = (groupTypeBitmask & 0x0000000F) switch
        {
            0x00000002 => "Global",
            0x00000004 => "DomainLocal",
            0x00000008 => "Universal",
            _ => "Global"
        };

        return (scope, type);
    }

    public static string ExtractOuPathFromDn(string distinguishedName)
    {
        if (string.IsNullOrWhiteSpace(distinguishedName))
        {
            return string.Empty;
        }

        var parts = distinguishedName
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(p => p.StartsWith("OU=", StringComparison.OrdinalIgnoreCase))
            .ToList();

        return string.Join(",", parts);
    }

    private LdapConnection CreateSecureConnection()
    {
        var timeoutSeconds = _options.GetEffectiveTimeoutSeconds();
        var identifier = new LdapDirectoryIdentifier(_options.DomainControllerFqdn, _options.LdapsPort);
        var credentials = new NetworkCredential(_options.ReadOnlyServiceAccount, _options.ReadOnlyServicePassword);

        var connection = new LdapConnection(identifier, credentials, AuthType.Negotiate)
        {
            Timeout = TimeSpan.FromSeconds(timeoutSeconds)
        };

        connection.SessionOptions.SecureSocketLayer = true;
        connection.SessionOptions.ProtocolVersion = 3;
        connection.SessionOptions.ReferralChasing = ReferralChasingOptions.None;

        var allowWildcards = _options.CertificateValidation.AllowWildcardCertificates;
        connection.SessionOptions.VerifyServerCertificate = (_, cert) =>
            ValidateServerCertificate(_options.DomainControllerFqdn, cert, allowWildcards);

        connection.Bind();
        return connection;
    }

    /// <summary>
    /// Executes a read-only paged LDAP search using PageResultRequestControl with timeout and cancellation guards.
    /// </summary>
    private List<SearchResultEntry> ExecutePagedSearch(
        string searchBaseDn,
        string ldapFilter,
        SearchScope scope,
        string[] attributesToLoad,
        CancellationToken cancellationToken)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        var results = new List<SearchResultEntry>();
        var pageSize = _options.GetEffectivePageSize();
        var timeout = TimeSpan.FromSeconds(_options.GetEffectiveTimeoutSeconds());
        const int maxPagesSafetyLimit = 100;

        using var connection = CreateSecureConnection();
        var searchRequest = new SearchRequest(searchBaseDn, ldapFilter, scope, attributesToLoad);
        var pageControl = new PageResultRequestControl(pageSize) { IsCritical = false };
        searchRequest.Controls.Add(pageControl);

        var pageCount = 0;
        while (pageCount < maxPagesSafetyLimit)
        {
            cancellationToken.ThrowIfCancellationRequested();
            pageCount++;

            var response = (SearchResponse)connection.SendRequest(searchRequest, timeout);
            foreach (SearchResultEntry entry in response.Entries)
            {
                results.Add(entry);
            }

            var pageResponse = response.Controls
                .OfType<PageResultResponseControl>()
                .FirstOrDefault();

            if (pageResponse == null || pageResponse.Cookie == null || pageResponse.Cookie.Length == 0)
            {
                break;
            }

            pageControl.Cookie = pageResponse.Cookie;
        }

        return results;
    }

    public Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken = default)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        var users = ExecutePagedSearch(
            _options.SearchBase,
            LdapFilterSanitizer.BuildUserSearchFilter(new UserFilterQuery()),
            SearchScope.Subtree,
            UserAttributes,
            cancellationToken).Select(MapEntryToUser).ToList();

        var computers = ExecutePagedSearch(
            _options.SearchBase,
            LdapFilterSanitizer.BuildComputerSearchFilter(new ComputerFilterQuery()),
            SearchScope.Subtree,
            ComputerAttributes,
            cancellationToken).Select(MapEntryToComputer).ToList();

        var groups = ExecutePagedSearch(
            _options.SearchBase,
            LdapFilterSanitizer.BuildGroupSearchFilter(new GroupFilterQuery()),
            SearchScope.Subtree,
            GroupAttributes,
            cancellationToken).Select(MapEntryToGroup).ToList();

        var ous = ExecutePagedSearch(
            _options.SearchBase,
            "(objectClass=organizationalUnit)",
            SearchScope.Subtree,
            OuAttributes,
            cancellationToken);

        return Task.FromResult(new DashboardSummaryDto
        {
            UserStats = new UserStatsDto
            {
                Total = users.Count,
                Enabled = users.Count(u => u.Status == "Enabled"),
                Disabled = users.Count(u => u.Status == "Disabled"),
                LockedOut = users.Count(u => u.Status == "LockedOut")
            },
            ComputerStats = new ComputerStatsDto
            {
                Total = computers.Count,
                Servers = computers.Count(c => c.OperatingSystem.Contains("Server", StringComparison.OrdinalIgnoreCase)),
                Workstations = computers.Count(c => !c.OperatingSystem.Contains("Server", StringComparison.OrdinalIgnoreCase)),
                Enabled = computers.Count(c => c.Status == "Enabled")
            },
            GroupStats = new GroupStatsDto
            {
                Total = groups.Count,
                Security = groups.Count(g => g.Type == "Security"),
                Distribution = groups.Count(g => g.Type == "Distribution")
            },
            OuStats = new OuStatsDto
            {
                TotalOus = ous.Count
            },
            ServiceStatus = new ServiceStatusDto
            {
                DomainController = _options.DomainControllerFqdn,
                DcAddressMock = "LDAPS Read-Only Adapter",
                DcStatus = "Connected",
                LdapsPort = _options.LdapsPort,
                TlsCertificate = "Valid",
                AuditDatabase = "InMemoryMock",
                LastRefreshedUtc = DateTime.UtcNow
            }
        });
    }

    public Task<PagedResult<AdUser>> GetUsersAsync(UserFilterQuery query, CancellationToken cancellationToken = default)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        var filter = LdapFilterSanitizer.BuildUserSearchFilter(query);
        var entries = ExecutePagedSearch(_options.SearchBase, filter, SearchScope.Subtree, UserAttributes, cancellationToken);
        var mapped = entries.Select(MapEntryToUser).AsQueryable();

        var isDesc = string.Equals(query.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);
        mapped = (query.SortBy?.ToLowerInvariant()) switch
        {
            "samaccountname" => isDesc ? mapped.OrderByDescending(u => u.SamAccountName) : mapped.OrderBy(u => u.SamAccountName),
            "department" => isDesc ? mapped.OrderByDescending(u => u.Department) : mapped.OrderBy(u => u.Department),
            "status" => isDesc ? mapped.OrderByDescending(u => u.Status) : mapped.OrderBy(u => u.Status),
            _ => isDesc ? mapped.OrderByDescending(u => u.DisplayName) : mapped.OrderBy(u => u.DisplayName)
        };

        var pageNumber = Math.Max(query.PageNumber, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var total = mapped.Count();
        var items = mapped.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();

        return Task.FromResult(new PagedResult<AdUser>
        {
            Items = items,
            TotalCount = total,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    public Task<AdUser?> GetUserByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        var escapedId = LdapFilterSanitizer.EscapeFilterValue(id);
        var filter = $"(&(objectCategory=person)(objectClass=user)(!(objectClass=computer))(sAMAccountName={escapedId}))";
        var entries = ExecutePagedSearch(_options.SearchBase, filter, SearchScope.Subtree, UserAttributes, cancellationToken);
        var first = entries.FirstOrDefault();
        return Task.FromResult(first != null ? MapEntryToUser(first) : null);
    }

    public Task<PagedResult<AdComputer>> GetComputersAsync(ComputerFilterQuery query, CancellationToken cancellationToken = default)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        var filter = LdapFilterSanitizer.BuildComputerSearchFilter(query);
        var entries = ExecutePagedSearch(_options.SearchBase, filter, SearchScope.Subtree, ComputerAttributes, cancellationToken);
        var mapped = entries.Select(MapEntryToComputer).ToList();

        var pageNumber = Math.Max(query.PageNumber, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var total = mapped.Count;
        var items = mapped.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();

        return Task.FromResult(new PagedResult<AdComputer>
        {
            Items = items,
            TotalCount = total,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    public Task<AdComputer?> GetComputerByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        var escapedId = LdapFilterSanitizer.EscapeFilterValue(id);
        var filter = $"(&(objectCategory=computer)(objectClass=computer)(cn={escapedId}))";
        var entries = ExecutePagedSearch(_options.SearchBase, filter, SearchScope.Subtree, ComputerAttributes, cancellationToken);
        var first = entries.FirstOrDefault();
        return Task.FromResult(first != null ? MapEntryToComputer(first) : null);
    }

    public Task<List<AdOrganizationalUnit>> GetOuTreeAsync(CancellationToken cancellationToken = default)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        var entries = ExecutePagedSearch(_options.SearchBase, "(objectClass=organizationalUnit)", SearchScope.Subtree, OuAttributes, cancellationToken);
        var ous = entries.Select(MapEntryToOu).ToList();
        return Task.FromResult(ous);
    }

    public Task<AdOrganizationalUnit?> GetOuByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        var escapedId = LdapFilterSanitizer.EscapeFilterValue(id);
        var filter = $"(&(objectClass=organizationalUnit)(|(ou={escapedId})(distinguishedName={escapedId})))";
        var entries = ExecutePagedSearch(_options.SearchBase, filter, SearchScope.Subtree, OuAttributes, cancellationToken);
        var first = entries.FirstOrDefault();
        return Task.FromResult(first != null ? MapEntryToOu(first) : null);
    }

    public Task<List<AdGroup>> GetGroupsAsync(GroupFilterQuery query, CancellationToken cancellationToken = default)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        var filter = LdapFilterSanitizer.BuildGroupSearchFilter(query);
        var entries = ExecutePagedSearch(_options.SearchBase, filter, SearchScope.Subtree, GroupAttributes, cancellationToken);
        var groups = entries.Select(MapEntryToGroup);

        if (!string.IsNullOrWhiteSpace(query.Scope) && !string.Equals(query.Scope, "All", StringComparison.OrdinalIgnoreCase))
        {
            groups = groups.Where(g => string.Equals(g.Scope, query.Scope, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(query.Type) && !string.Equals(query.Type, "All", StringComparison.OrdinalIgnoreCase))
        {
            groups = groups.Where(g => string.Equals(g.Type, query.Type, StringComparison.OrdinalIgnoreCase));
        }

        return Task.FromResult(groups.ToList());
    }

    public Task<AdGroup?> GetGroupByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        var escapedId = LdapFilterSanitizer.EscapeFilterValue(id);
        var filter = $"(&(objectCategory=group)(objectClass=group)(sAMAccountName={escapedId}))";
        var entries = ExecutePagedSearch(_options.SearchBase, filter, SearchScope.Subtree, GroupAttributes, cancellationToken);
        var first = entries.FirstOrDefault();
        return Task.FromResult(first != null ? MapEntryToGroup(first) : null);
    }

    private static string GetStringAttr(SearchResultEntry entry, string attributeName)
    {
        if (!entry.Attributes.Contains(attributeName) || entry.Attributes[attributeName].Count == 0)
        {
            return string.Empty;
        }

        return entry.Attributes[attributeName][0]?.ToString() ?? string.Empty;
    }

    private static int GetIntAttr(SearchResultEntry entry, string attributeName, int defaultValue = 0)
    {
        var raw = GetStringAttr(entry, attributeName);
        return int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var val) ? val : defaultValue;
    }

    private static long GetLongAttr(SearchResultEntry entry, string attributeName, long defaultValue = 0)
    {
        var raw = GetStringAttr(entry, attributeName);
        return long.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var val) ? val : defaultValue;
    }

    private static List<string> GetMultiStringAttr(SearchResultEntry entry, string attributeName)
    {
        var list = new List<string>();
        if (!entry.Attributes.Contains(attributeName)) return list;

        foreach (var item in entry.Attributes[attributeName])
        {
            var str = item?.ToString();
            if (!string.IsNullOrWhiteSpace(str))
            {
                list.Add(str);
            }
        }
        return list;
    }

    private static AdUser MapEntryToUser(SearchResultEntry entry)
    {
        var uac = GetIntAttr(entry, "userAccountControl", 512);
        var lockoutTime = GetLongAttr(entry, "lockoutTime", 0);
        var dn = entry.DistinguishedName ?? GetStringAttr(entry, "distinguishedName");
        var sam = GetStringAttr(entry, "sAMAccountName");

        return new AdUser
        {
            Id = sam,
            SamAccountName = sam,
            UserPrincipalName = GetStringAttr(entry, "userPrincipalName"),
            DisplayName = GetStringAttr(entry, "displayName"),
            FirstName = GetStringAttr(entry, "givenName"),
            LastName = GetStringAttr(entry, "sn"),
            Email = GetStringAttr(entry, "mail"),
            Department = GetStringAttr(entry, "department"),
            Title = GetStringAttr(entry, "title"),
            Office = GetStringAttr(entry, "physicalDeliveryOfficeName"),
            TelephoneNumber = GetStringAttr(entry, "telephoneNumber"),
            EmployeeId = GetStringAttr(entry, "employeeID"),
            DistinguishedName = dn,
            OuPath = ExtractOuPathFromDn(dn),
            Status = ParseAccountStatus(uac, lockoutTime),
            UserAccountControl = uac,
            UacFlags = ParseUacFlags(uac, lockoutTime),
            PasswordLastSet = ConvertAdFileTimeToUtc(GetStringAttr(entry, "pwdLastSet")),
            BadPasswordCount = GetIntAttr(entry, "badPwdCount", 0),
            LastLogonTimestamp = ConvertAdFileTimeToUtc(GetStringAttr(entry, "lastLogonTimestamp")),
            CreatedDate = DateTime.UtcNow,
            MemberOf = GetMultiStringAttr(entry, "memberOf")
        };
    }

    private static AdComputer MapEntryToComputer(SearchResultEntry entry)
    {
        var uac = GetIntAttr(entry, "userAccountControl", 4096);
        var dn = entry.DistinguishedName ?? GetStringAttr(entry, "distinguishedName");
        var cn = GetStringAttr(entry, "cn");

        return new AdComputer
        {
            Id = cn,
            Name = cn,
            DnsHostName = GetStringAttr(entry, "dNSHostName"),
            OperatingSystem = GetStringAttr(entry, "operatingSystem"),
            OperatingSystemVersion = GetStringAttr(entry, "operatingSystemVersion"),
            DistinguishedName = dn,
            OuPath = ExtractOuPathFromDn(dn),
            Status = ParseAccountStatus(uac) == "Disabled" ? "Disabled" : "Enabled",
            LastLogonTimestamp = ConvertAdFileTimeToUtc(GetStringAttr(entry, "lastLogonTimestamp")),
            DepartmentTag = GetStringAttr(entry, "description"),
            CreatedDate = DateTime.UtcNow
        };
    }

    private static AdOrganizationalUnit MapEntryToOu(SearchResultEntry entry)
    {
        var dn = entry.DistinguishedName ?? GetStringAttr(entry, "distinguishedName");
        var name = GetStringAttr(entry, "ou");
        if (string.IsNullOrWhiteSpace(name))
        {
            name = GetStringAttr(entry, "name");
        }

        return new AdOrganizationalUnit
        {
            Id = name,
            Name = name,
            DistinguishedName = dn,
            Description = GetStringAttr(entry, "description"),
            ProtectedFromAccidentalDeletion = true
        };
    }

    private static AdGroup MapEntryToGroup(SearchResultEntry entry)
    {
        var dn = entry.DistinguishedName ?? GetStringAttr(entry, "distinguishedName");
        var sam = GetStringAttr(entry, "sAMAccountName");
        var groupTypeInt = GetIntAttr(entry, "groupType", unchecked((int)0x80000002));
        var (scope, type) = ParseGroupTypeAndScope(groupTypeInt);
        var memberDns = GetMultiStringAttr(entry, "member");

        var members = memberDns.Select(mDn => new GroupMemberRef
        {
            Id = mDn,
            SamAccountName = mDn,
            DisplayName = mDn,
            Type = "User"
        }).ToList();

        return new AdGroup
        {
            Id = sam,
            SamAccountName = sam,
            DisplayName = GetStringAttr(entry, "displayName"),
            DistinguishedName = dn,
            Scope = scope,
            Type = type,
            Description = GetStringAttr(entry, "description"),
            OuPath = ExtractOuPathFromDn(dn),
            MailAddress = GetStringAttr(entry, "mail"),
            MemberCount = members.Count,
            Members = members
        };
    }
}
