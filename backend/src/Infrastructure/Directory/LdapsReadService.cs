using System.DirectoryServices.Protocols;
using System.Globalization;
using System.Net;
using System.Security.Cryptography.X509Certificates;
using SamchukHospital.AdManagement.Application.Common.Interfaces;
using SamchukHospital.AdManagement.Domain.Entities;

namespace SamchukHospital.AdManagement.Infrastructure.Directory;

/// <summary>
/// Phase 2A Read-Only Active Directory LDAPS Adapter for Windows Server 2025 AD DS.
/// 
/// ARCHITECTURAL BOUNDARY (OPTION A — PHASE 2A):
/// - Implements complete read-only LDAP query construction, RFC 4515 filter escaping,
///   RFC 4514 DN validation (with escaped comma support), bounded LDAP paging
///   (PageResultRequestControl + SizeLimit/Window cap), timeout enforcement, cancellation support,
///   AD Lockout Policy-aware status decoding, objectGUID stable ID mapping, and real whenCreated parsing.
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
        "msDS-User-Account-Control-Computed", "lockoutTime", "pwdLastSet", "badPwdCount",
        "lastLogonTimestamp", "whenCreated", "memberOf"
    };

    private static readonly string[] ComputerAttributes =
    {
        "objectGUID", "cn", "dNSHostName", "operatingSystem", "operatingSystemVersion",
        "distinguishedName", "userAccountControl", "lastLogonTimestamp", "description", "whenCreated"
    };

    private static readonly string[] OuAttributes =
    {
        "objectGUID", "ou", "name", "distinguishedName", "description", "whenCreated"
    };

    private static readonly string[] GroupAttributes =
    {
        "objectGUID", "sAMAccountName", "displayName", "cn", "distinguishedName",
        "groupType", "description", "mail", "member", "memberOf", "whenCreated"
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
    /// Evaluates Active Directory account status accurately according to AD Lockout Policy:
    /// 1. UF_ACCOUNTDISABLE (0x0002) on userAccountControl takes precedence -> "Disabled".
    /// 2. If msDS-User-Account-Control-Computed is present, checks its UF_LOCKOUT bit (0x0010),
    ///    which the Domain Controller dynamically computes against the domain's lockoutDuration policy.
    /// 3. Otherwise, evaluates lockoutTime > 0 against lockoutDurationMinutes:
    ///    - In Active Directory, lockoutTime is NOT cleared to 0 when the lockout duration expires
    ///      automatically; it remains > 0 until the user's next login.
    ///    - Therefore, if lockoutDurationMinutes > 0 and (lockoutTimeUtc + lockoutDurationMinutes <= referenceUtc),
    ///      the lockout has already expired and the account is "Enabled", NOT "LockedOut".
    /// </summary>
    public static string ParseAccountStatus(
        int userAccountControl,
        long lockoutTime = 0,
        int? msDsUserAccountControlComputed = null,
        int lockoutDurationMinutes = 30,
        DateTime? referenceUtc = null)
    {
        const int UF_ACCOUNTDISABLE = 0x0002;
        const int UF_LOCKOUT = 0x0010;

        if ((userAccountControl & UF_ACCOUNTDISABLE) != 0)
        {
            return "Disabled";
        }

        if (msDsUserAccountControlComputed.HasValue)
        {
            return (msDsUserAccountControlComputed.Value & UF_LOCKOUT) != 0
                ? "LockedOut"
                : "Enabled";
        }

        if (lockoutTime > 0 && lockoutTime < long.MaxValue)
        {
            // lockoutDurationMinutes <= 0 indicates permanent lockout until administrator manually unlocks
            if (lockoutDurationMinutes <= 0)
            {
                return "LockedOut";
            }

            try
            {
                var lockoutStartUtc = DateTime.FromFileTimeUtc(lockoutTime);
                var lockoutExpiresUtc = lockoutStartUtc.AddMinutes(lockoutDurationMinutes);
                var now = referenceUtc ?? DateTime.UtcNow;

                if (now < lockoutExpiresUtc)
                {
                    return "LockedOut";
                }

                // Lockout window has elapsed; account is automatically unlocked per AD Lockout Policy
                return "Enabled";
            }
            catch (ArgumentOutOfRangeException)
            {
                return "Enabled";
            }
        }

        if ((userAccountControl & UF_LOCKOUT) != 0)
        {
            return "LockedOut";
        }

        return "Enabled";
    }

    /// <summary>
    /// Extracts human-readable UAC flags honoring AD Lockout Policy expiration.
    /// </summary>
    public static List<string> ParseUacFlags(
        int userAccountControl,
        long lockoutTime = 0,
        int? msDsUserAccountControlComputed = null,
        int lockoutDurationMinutes = 30,
        DateTime? referenceUtc = null)
    {
        var flags = new List<string>();
        var effectiveStatus = ParseAccountStatus(
            userAccountControl,
            lockoutTime,
            msDsUserAccountControlComputed,
            lockoutDurationMinutes,
            referenceUtc);

        if ((userAccountControl & 0x0002) != 0) flags.Add("ACCOUNTDISABLE");
        if (effectiveStatus == "LockedOut") flags.Add("LOCKOUT");
        if ((userAccountControl & 0x0020) != 0) flags.Add("PASSWD_NOTREQD");
        if ((userAccountControl & 0x0040) != 0) flags.Add("PASSWD_CANT_CHANGE");
        if ((userAccountControl & 0x0200) != 0) flags.Add("NORMAL_ACCOUNT");
        if ((userAccountControl & 0x1000) != 0) flags.Add("WORKSTATION_TRUST_ACCOUNT");
        if ((userAccountControl & 0x2000) != 0) flags.Add("SERVER_TRUST_ACCOUNT");
        if ((userAccountControl & 0x10000) != 0) flags.Add("DONT_EXPIRE_PASSWORD");
        if ((userAccountControl & 0x800000) != 0 ||
            (msDsUserAccountControlComputed.HasValue && (msDsUserAccountControlComputed.Value & 0x800000) != 0))
        {
            flags.Add("PASSWORD_EXPIRED");
        }

        if (flags.Count == 0)
        {
            flags.Add("NORMAL_ACCOUNT");
        }

        return flags;
    }

    /// <summary>
    /// Calculates a bounded LDAP paging execution plan so queries never load unbounded directory results into memory
    /// while supporting accurate sorting and pagination within the bounded window (MaxResultWindowLimit).
    /// </summary>
    public static BoundedLdapPagingPlan CalculateBoundedPagingPlan(
        int pageNumber,
        int pageSize,
        int configuredLdapPageSize = 100,
        int maxResultWindowLimit = 1000)
    {
        var effectivePageNumber = Math.Max(pageNumber, 1);
        var effectivePageSize = Math.Clamp(pageSize, 1, 100);
        var effectiveMaxWindow = Math.Clamp(maxResultWindowLimit, 10, 2000);
        var skipCount = (effectivePageNumber - 1) * effectivePageSize;

        if (skipCount >= effectiveMaxWindow)
        {
            throw new ArgumentOutOfRangeException(
                nameof(pageNumber),
                $"Requested page offset ({skipCount}) exceeds maximum safe LDAP result window ({effectiveMaxWindow}). Please refine search filters.");
        }

        var maxEntriesToFetch = effectiveMaxWindow;
        var clampedControlPageSize = Math.Clamp(configuredLdapPageSize, 1, 500);
        var ldapControlPageSize = Math.Min(clampedControlPageSize, maxEntriesToFetch);
        var maxLdapPagesToFetch = Math.Max(1, (int)Math.Ceiling((double)maxEntriesToFetch / ldapControlPageSize));

        return new BoundedLdapPagingPlan
        {
            EffectivePageNumber = effectivePageNumber,
            EffectivePageSize = effectivePageSize,
            SkipCount = skipCount,
            MaxEntriesToFetch = maxEntriesToFetch,
            LdapControlPageSize = ldapControlPageSize,
            MaxLdapPagesToFetch = maxLdapPagesToFetch
        };
    }

    /// <summary>
    /// Constructs a PagedResult from a sorted bounded window of items.
    /// Explicitly marks IsTotalCountExact = false and IsResultWindowCapped = true when the LDAP query
    /// hit MaxResultWindowLimit and additional entries exist beyond the window, preventing a capped
    /// count from being misrepresented as the true total directory count.
    /// </summary>
    public static PagedResult<T> BuildBoundedPagedResult<T>(
        IReadOnlyList<T> sortedWindowItems,
        BoundedLdapPagingPlan plan,
        bool hasMoreEntriesBeyondWindow)
    {
        var items = sortedWindowItems
            .Skip(plan.SkipCount)
            .Take(plan.EffectivePageSize)
            .ToList();

        return new PagedResult<T>
        {
            Items = items,
            TotalCount = sortedWindowItems.Count,
            PageNumber = plan.EffectivePageNumber,
            PageSize = plan.EffectivePageSize,
            IsTotalCountExact = !hasMoreEntriesBeyondWindow,
            IsResultWindowCapped = hasMoreEntriesBeyondWindow,
            ResultWindowLimit = plan.MaxEntriesToFetch,
            TotalCountNote = hasMoreEntriesBeyondWindow
                ? $"ผลลัพธ์เกินเพดานความปลอดภัยสูงสุด (MaxResultWindowLimit = {plan.MaxEntriesToFetch} รายการ) จำนวนที่แสดง ({sortedWindowItems.Count}) เป็นจำนวนสูงสุดในขอบเขตที่ดึงมา ไม่ใช่จำนวนทั้งหมดใน Active Directory กรุณาระบุคำค้นหาหรือตัวกรองให้แคบลง"
                : null
        };
    }

    /// <summary>
    /// Converts a 16-byte binary Active Directory objectGUID into a canonical lowercase GUID string (Stable ID).
    /// Falls back to string GUID parsing or fallbackId only if binary GUID is unavailable.
    /// </summary>
    public static string ConvertObjectGuidBytesToString(byte[]? guidBytes, string fallbackId = "")
    {
        if (guidBytes != null && guidBytes.Length == 16)
        {
            return new Guid(guidBytes).ToString("D");
        }

        if (!string.IsNullOrWhiteSpace(fallbackId) && Guid.TryParse(fallbackId.Trim(), out var parsedGuid))
        {
            return parsedGuid.ToString("D");
        }

        return fallbackId?.Trim() ?? string.Empty;
    }

    /// <summary>
    /// Parses Active Directory whenCreated attribute (ASN.1 GeneralizedTime e.g. "20240310020000.0Z"
    /// or ISO 8601) into an accurate UTC DateTime? instead of using DateTime.UtcNow.
    /// Returns null if the attribute is missing or malformed.
    /// </summary>
    public static DateTime? ParseAdWhenCreatedToUtc(string? rawWhenCreated)
    {
        if (string.IsNullOrWhiteSpace(rawWhenCreated))
        {
            return null;
        }

        var trimmed = rawWhenCreated.Trim();
        string[] generalizedTimeFormats =
        {
            "yyyyMMddHHmmss.0Z",
            "yyyyMMddHHmmss.fZ",
            "yyyyMMddHHmmss.ffZ",
            "yyyyMMddHHmmss.fffZ",
            "yyyyMMddHHmmssZ",
            "yyyyMMddHHmmss.0zzz",
            "yyyyMMddHHmmsszzz"
        };

        if (DateTime.TryParseExact(
            trimmed,
            generalizedTimeFormats,
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
            out var exactUtc))
        {
            return DateTime.SpecifyKind(exactUtc, DateTimeKind.Utc);
        }

        if (DateTimeOffset.TryParse(
            trimmed,
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
            out var dto))
        {
            return dto.UtcDateTime;
        }

        return null;
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

    /// <summary>
    /// Extracts the OU path from a Distinguished Name using the RFC 4514 parser
    /// so escaped commas inside OU names are preserved accurately.
    /// </summary>
    public static string ExtractOuPathFromDn(string distinguishedName)
    {
        if (!LdapFilterSanitizer.TryParseDistinguishedNameRdns(distinguishedName, out var rdns, out _))
        {
            return string.Empty;
        }

        var ouRdns = rdns
            .Where(p => p.StartsWith("OU=", StringComparison.OrdinalIgnoreCase))
            .ToList();

        return string.Join(",", ouRdns);
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
    /// Executes a read-only, strictly bounded paged LDAP search using PageResultRequestControl
    /// and optional SortRequestControl.
    /// Stops fetching immediately once maxEntriesToFetch is reached, detects whether additional
    /// entries exist beyond the bounded window (HasMoreBeyondWindow), and validates that searchBaseDn
    /// is scoped within the configured Root SearchBase.
    /// </summary>
    private (List<SearchResultEntry> Entries, bool HasMoreBeyondWindow) ExecuteBoundedPagedSearch(
        string searchBaseDn,
        string ldapFilter,
        SearchScope scope,
        string[] attributesToLoad,
        int maxEntriesToFetch,
        int ldapControlPageSize,
        CancellationToken cancellationToken,
        SortKey? serverSideSortKey = null)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        if (!LdapFilterSanitizer.IsStructurallyValidDistinguishedName(searchBaseDn, out var dnError))
        {
            throw new ArgumentException($"Invalid SearchBase DN: {dnError}", nameof(searchBaseDn));
        }

        if (!LdapFilterSanitizer.IsDnScopedWithinSearchBase(searchBaseDn, _options.SearchBase))
        {
            throw new UnauthorizedAccessException(
                $"SearchBase '{searchBaseDn}' is outside the permitted root SearchBase '{_options.SearchBase}'.");
        }

        var effectiveMaxEntries = Math.Clamp(maxEntriesToFetch, 1, _options.GetEffectiveMaxResultWindow());
        var effectiveControlPageSize = Math.Clamp(ldapControlPageSize, 1, Math.Min(500, effectiveMaxEntries));
        var maxPagesLimit = Math.Max(1, (int)Math.Ceiling((double)effectiveMaxEntries / effectiveControlPageSize));

        var results = new List<SearchResultEntry>(effectiveMaxEntries);
        var hasMoreBeyondWindow = false;
        var timeout = TimeSpan.FromSeconds(_options.GetEffectiveTimeoutSeconds());

        using var connection = CreateSecureConnection();
        var searchRequest = new SearchRequest(searchBaseDn, ldapFilter, scope, attributesToLoad)
        {
            TimeLimit = timeout
        };

        var pageControl = new PageResultRequestControl(effectiveControlPageSize) { IsCritical = false };
        searchRequest.Controls.Add(pageControl);

        if (serverSideSortKey != null)
        {
            var sortControl = new SortRequestControl(serverSideSortKey) { IsCritical = false };
            searchRequest.Controls.Add(sortControl);
        }

        var pageCount = 0;
        while (pageCount < maxPagesLimit && results.Count < effectiveMaxEntries)
        {
            cancellationToken.ThrowIfCancellationRequested();
            pageCount++;

            var response = (SearchResponse)connection.SendRequest(searchRequest, timeout);
            var entryIndex = 0;
            var totalInPage = response.Entries.Count;

            foreach (SearchResultEntry entry in response.Entries)
            {
                entryIndex++;
                results.Add(entry);
                if (results.Count >= effectiveMaxEntries)
                {
                    if (entryIndex < totalInPage)
                    {
                        hasMoreBeyondWindow = true;
                    }
                    break;
                }
            }

            var pageResponse = response.Controls
                .OfType<PageResultResponseControl>()
                .FirstOrDefault();

            var hasMorePagesCookie = pageResponse != null &&
                                     pageResponse.Cookie != null &&
                                     pageResponse.Cookie.Length > 0;

            if (results.Count >= effectiveMaxEntries)
            {
                if (hasMorePagesCookie)
                {
                    hasMoreBeyondWindow = true;
                }
                break;
            }

            if (!hasMorePagesCookie)
            {
                break;
            }

            pageControl.Cookie = pageResponse!.Cookie;
        }

        return (results, hasMoreBeyondWindow);
    }

    public Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken = default)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        var maxWindow = _options.GetEffectiveMaxResultWindow();
        var pageSize = _options.GetEffectivePageSize();

        var (userEntries, _) = ExecuteBoundedPagedSearch(
            _options.SearchBase,
            LdapFilterSanitizer.BuildUserSearchFilter(new UserFilterQuery(), _options.GetEffectiveLockoutDurationMinutes()),
            SearchScope.Subtree,
            UserAttributes,
            maxWindow,
            pageSize,
            cancellationToken);
        var users = userEntries.Select(e => MapEntryToUser(e, _options.GetEffectiveLockoutDurationMinutes())).ToList();

        var (computerEntries, _) = ExecuteBoundedPagedSearch(
            _options.SearchBase,
            LdapFilterSanitizer.BuildComputerSearchFilter(new ComputerFilterQuery()),
            SearchScope.Subtree,
            ComputerAttributes,
            maxWindow,
            pageSize,
            cancellationToken);
        var computers = computerEntries.Select(MapEntryToComputer).ToList();

        var (groupEntries, _) = ExecuteBoundedPagedSearch(
            _options.SearchBase,
            LdapFilterSanitizer.BuildGroupSearchFilter(new GroupFilterQuery()),
            SearchScope.Subtree,
            GroupAttributes,
            maxWindow,
            pageSize,
            cancellationToken);
        var groups = groupEntries.Select(MapEntryToGroup).ToList();

        var (ous, _) = ExecuteBoundedPagedSearch(
            _options.SearchBase,
            "(objectClass=organizationalUnit)",
            SearchScope.Subtree,
            OuAttributes,
            maxWindow,
            pageSize,
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

        var pagingPlan = CalculateBoundedPagingPlan(
            query.PageNumber,
            query.PageSize,
            _options.GetEffectivePageSize(),
            _options.GetEffectiveMaxResultWindow());

        var lockoutDuration = _options.GetEffectiveLockoutDurationMinutes();
        var filter = LdapFilterSanitizer.BuildUserSearchFilter(query, lockoutDuration);

        var isDesc = string.Equals(query.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);
        var ldapSortAttribute = (query.SortBy?.ToLowerInvariant()) switch
        {
            "samaccountname" => "sAMAccountName",
            "department" => "department",
            _ => "displayName"
        };
        var serverSortKey = new SortKey(ldapSortAttribute, "2.5.13.3", isDesc);

        var (entries, hasMoreBeyondWindow) = ExecuteBoundedPagedSearch(
            _options.SearchBase,
            filter,
            SearchScope.Subtree,
            UserAttributes,
            pagingPlan.MaxEntriesToFetch,
            pagingPlan.LdapControlPageSize,
            cancellationToken,
            serverSortKey);

        var mapped = entries.Select(e => MapEntryToUser(e, lockoutDuration)).AsQueryable();

        mapped = (query.SortBy?.ToLowerInvariant()) switch
        {
            "samaccountname" => isDesc ? mapped.OrderByDescending(u => u.SamAccountName) : mapped.OrderBy(u => u.SamAccountName),
            "department" => isDesc ? mapped.OrderByDescending(u => u.Department) : mapped.OrderBy(u => u.Department),
            "status" => isDesc ? mapped.OrderByDescending(u => u.Status) : mapped.OrderBy(u => u.Status),
            _ => isDesc ? mapped.OrderByDescending(u => u.DisplayName) : mapped.OrderBy(u => u.DisplayName)
        };

        var sortedWindowList = mapped.ToList();
        return Task.FromResult(BuildBoundedPagedResult(sortedWindowList, pagingPlan, hasMoreBeyondWindow));
    }

    public Task<AdUser?> GetUserByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        // Supports lookup by objectGUID (Stable ID) or sAMAccountName
        var filter = LdapFilterSanitizer.BuildIdentifierOrAccountFilter(
            "(objectCategory=person)(objectClass=user)(!(objectClass=computer))",
            "sAMAccountName",
            id);

        var (entries, _) = ExecuteBoundedPagedSearch(_options.SearchBase, filter, SearchScope.Subtree, UserAttributes, 1, 1, cancellationToken);
        var first = entries.FirstOrDefault();
        return Task.FromResult(first != null ? MapEntryToUser(first, _options.GetEffectiveLockoutDurationMinutes()) : null);
    }

    public Task<PagedResult<AdComputer>> GetComputersAsync(ComputerFilterQuery query, CancellationToken cancellationToken = default)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        var pagingPlan = CalculateBoundedPagingPlan(
            query.PageNumber,
            query.PageSize,
            _options.GetEffectivePageSize(),
            _options.GetEffectiveMaxResultWindow());

        var filter = LdapFilterSanitizer.BuildComputerSearchFilter(query);
        var serverSortKey = new SortKey("cn", "2.5.13.3", false);

        var (entries, hasMoreBeyondWindow) = ExecuteBoundedPagedSearch(
            _options.SearchBase,
            filter,
            SearchScope.Subtree,
            ComputerAttributes,
            pagingPlan.MaxEntriesToFetch,
            pagingPlan.LdapControlPageSize,
            cancellationToken,
            serverSortKey);

        var sortedWindowList = entries
            .Select(MapEntryToComputer)
            .OrderBy(c => c.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return Task.FromResult(BuildBoundedPagedResult(sortedWindowList, pagingPlan, hasMoreBeyondWindow));
    }

    public Task<AdComputer?> GetComputerByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        var filter = LdapFilterSanitizer.BuildIdentifierOrAccountFilter(
            "(objectCategory=computer)(objectClass=computer)",
            "cn",
            id);

        var (entries, _) = ExecuteBoundedPagedSearch(_options.SearchBase, filter, SearchScope.Subtree, ComputerAttributes, 1, 1, cancellationToken);
        var first = entries.FirstOrDefault();
        return Task.FromResult(first != null ? MapEntryToComputer(first) : null);
    }

    public Task<List<AdOrganizationalUnit>> GetOuTreeAsync(CancellationToken cancellationToken = default)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        var (entries, _) = ExecuteBoundedPagedSearch(
            _options.SearchBase,
            "(objectClass=organizationalUnit)",
            SearchScope.Subtree,
            OuAttributes,
            _options.GetEffectiveMaxResultWindow(),
            _options.GetEffectivePageSize(),
            cancellationToken);

        return Task.FromResult(entries.Select(MapEntryToOu).ToList());
    }

    public Task<AdOrganizationalUnit?> GetOuByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        var filter = LdapFilterSanitizer.BuildIdentifierOrAccountFilter(
            "(objectClass=organizationalUnit)",
            "ou",
            id);

        var (entries, _) = ExecuteBoundedPagedSearch(_options.SearchBase, filter, SearchScope.Subtree, OuAttributes, 1, 1, cancellationToken);
        var first = entries.FirstOrDefault();
        return Task.FromResult(first != null ? MapEntryToOu(first) : null);
    }

    public Task<List<AdGroup>> GetGroupsAsync(GroupFilterQuery query, CancellationToken cancellationToken = default)
    {
        EnsureLiveConnectionAllowedOrThrow(cancellationToken);

        var filter = LdapFilterSanitizer.BuildGroupSearchFilter(query);
        var (entries, _) = ExecuteBoundedPagedSearch(
            _options.SearchBase,
            filter,
            SearchScope.Subtree,
            GroupAttributes,
            _options.GetEffectiveMaxResultWindow(),
            _options.GetEffectivePageSize(),
            cancellationToken);

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

        var filter = LdapFilterSanitizer.BuildIdentifierOrAccountFilter(
            "(objectCategory=group)(objectClass=group)",
            "sAMAccountName",
            id);

        var (entries, _) = ExecuteBoundedPagedSearch(_options.SearchBase, filter, SearchScope.Subtree, GroupAttributes, 1, 1, cancellationToken);
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

    private static int? GetNullableIntAttr(SearchResultEntry entry, string attributeName)
    {
        var raw = GetStringAttr(entry, attributeName);
        return int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var val) ? val : null;
    }

    private static long GetLongAttr(SearchResultEntry entry, string attributeName, long defaultValue = 0)
    {
        var raw = GetStringAttr(entry, attributeName);
        return long.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var val) ? val : defaultValue;
    }

    private static string ExtractStableObjectGuid(SearchResultEntry entry, string fallbackId)
    {
        if (entry.Attributes.Contains("objectGUID") && entry.Attributes["objectGUID"].Count > 0)
        {
            var rawVal = entry.Attributes["objectGUID"][0];
            if (rawVal is byte[] bytes && bytes.Length == 16)
            {
                return ConvertObjectGuidBytesToString(bytes, fallbackId);
            }

            if (rawVal is string strVal && !string.IsNullOrWhiteSpace(strVal))
            {
                return ConvertObjectGuidBytesToString(null, strVal);
            }
        }

        return ConvertObjectGuidBytesToString(null, fallbackId);
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

    private static AdUser MapEntryToUser(SearchResultEntry entry, int lockoutDurationMinutes)
    {
        var uac = GetIntAttr(entry, "userAccountControl", 512);
        var uacComputed = GetNullableIntAttr(entry, "msDS-User-Account-Control-Computed");
        var lockoutTime = GetLongAttr(entry, "lockoutTime", 0);
        var dn = entry.DistinguishedName ?? GetStringAttr(entry, "distinguishedName");
        var sam = GetStringAttr(entry, "sAMAccountName");
        var stableId = ExtractStableObjectGuid(entry, sam);
        var whenCreatedUtc = ParseAdWhenCreatedToUtc(GetStringAttr(entry, "whenCreated")) ?? DateTime.UnixEpoch;

        return new AdUser
        {
            Id = stableId,
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
            Status = ParseAccountStatus(uac, lockoutTime, uacComputed, lockoutDurationMinutes),
            UserAccountControl = uac,
            UacFlags = ParseUacFlags(uac, lockoutTime, uacComputed, lockoutDurationMinutes),
            PasswordLastSet = ConvertAdFileTimeToUtc(GetStringAttr(entry, "pwdLastSet")),
            BadPasswordCount = GetIntAttr(entry, "badPwdCount", 0),
            LastLogonTimestamp = ConvertAdFileTimeToUtc(GetStringAttr(entry, "lastLogonTimestamp")),
            CreatedDate = whenCreatedUtc,
            MemberOf = GetMultiStringAttr(entry, "memberOf")
        };
    }

    private static AdComputer MapEntryToComputer(SearchResultEntry entry)
    {
        var uac = GetIntAttr(entry, "userAccountControl", 4096);
        var dn = entry.DistinguishedName ?? GetStringAttr(entry, "distinguishedName");
        var cn = GetStringAttr(entry, "cn");
        var stableId = ExtractStableObjectGuid(entry, cn);
        var whenCreatedUtc = ParseAdWhenCreatedToUtc(GetStringAttr(entry, "whenCreated")) ?? DateTime.UnixEpoch;

        return new AdComputer
        {
            Id = stableId,
            Name = cn,
            DnsHostName = GetStringAttr(entry, "dNSHostName"),
            OperatingSystem = GetStringAttr(entry, "operatingSystem"),
            OperatingSystemVersion = GetStringAttr(entry, "operatingSystemVersion"),
            DistinguishedName = dn,
            OuPath = ExtractOuPathFromDn(dn),
            Status = ParseAccountStatus(uac) == "Disabled" ? "Disabled" : "Enabled",
            LastLogonTimestamp = ConvertAdFileTimeToUtc(GetStringAttr(entry, "lastLogonTimestamp")),
            DepartmentTag = GetStringAttr(entry, "description"),
            CreatedDate = whenCreatedUtc
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

        var stableId = ExtractStableObjectGuid(entry, name);

        return new AdOrganizationalUnit
        {
            Id = stableId,
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
        var stableId = ExtractStableObjectGuid(entry, sam);
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
            Id = stableId,
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
