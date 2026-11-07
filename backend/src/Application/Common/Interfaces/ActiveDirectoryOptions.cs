namespace SamchukHospital.AdManagement.Application.Common.Interfaces;

/// <summary>
/// Phase 2A Active Directory & LDAPS Configuration Options.
/// Uses safe placeholders by default. Never stores real IPs or credentials in source code.
/// 
/// CRITICAL PHASE 2A SAFETY GATE:
/// Even if EnableLiveReadOnlyConnection is set to true in configuration files or environment variables,
/// Phase 2A enforces a code-level hard lock (IsPhase2ACodeGateLocked = true) that prevents opening
/// any live LDAPS socket until Phase 2B is formally approved.
/// </summary>
public class ActiveDirectoryOptions
{
    public const string SectionName = "ActiveDirectory";

    /// <summary>
    /// Hard-coded Phase 2A architectural lock. Cannot be overridden via configuration.
    /// </summary>
    public const bool IsPhase2ACodeGateLocked = true;

    public string DomainControllerFqdn { get; set; } = "__PLACEHOLDER_DC_FQDN__";
    public int LdapsPort { get; set; } = 636;
    public bool UseSsl { get; set; } = true;
    public string SearchBase { get; set; } = "OU=PLACEHOLDER_ORG_UNIT,DC=placeholder,DC=example";
    public string ReadOnlyServiceAccount { get; set; } = "__PLACEHOLDER_READONLY_SERVICE_ACCOUNT__";

    /// <summary>
    /// Secret reference or password placeholder.
    /// NEVER log, serialize, or return this property in any API or diagnostic response.
    /// </summary>
    public string ReadOnlyServicePassword { get; set; } = "__PLACEHOLDER_SECRET_DO_NOT_LOG__";

    public int ConnectionTimeoutSeconds { get; set; } = 10;
    public int LdapPageSize { get; set; } = 100;

    /// <summary>
    /// Read-only Feature Flag. Defaults to false.
    /// Note: In Phase 2A, enabling this flag in config alone will NOT activate live AD connections
    /// because IsPhase2ACodeGateLocked is enforced in code.
    /// </summary>
    public bool EnableLiveReadOnlyConnection { get; set; } = false;

    public CertificateValidationOptions CertificateValidation { get; set; } = new();

    /// <summary>
    /// Returns effective live connection state. Always false in Phase 2A due to hard code gate.
    /// </summary>
    public bool IsEffectiveLiveConnectionAllowed => !IsPhase2ACodeGateLocked && EnableLiveReadOnlyConnection;

    public int GetEffectiveTimeoutSeconds() => Math.Clamp(ConnectionTimeoutSeconds, 1, 60);

    public int GetEffectivePageSize() => Math.Clamp(LdapPageSize, 1, 500);

    public bool HasPlaceholderValues()
    {
        return string.IsNullOrWhiteSpace(DomainControllerFqdn) ||
               DomainControllerFqdn.Contains("PLACEHOLDER", StringComparison.OrdinalIgnoreCase) ||
               DomainControllerFqdn.Contains("TBD", StringComparison.OrdinalIgnoreCase) ||
               DomainControllerFqdn.EndsWith(".local", StringComparison.OrdinalIgnoreCase) && DomainControllerFqdn.StartsWith("mock-", StringComparison.OrdinalIgnoreCase) ||
               string.IsNullOrWhiteSpace(SearchBase) ||
               SearchBase.Contains("PLACEHOLDER", StringComparison.OrdinalIgnoreCase) ||
               string.IsNullOrWhiteSpace(ReadOnlyServiceAccount) ||
               ReadOnlyServiceAccount.Contains("PLACEHOLDER", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Returns a safe, redacted representation suitable for diagnostics and logging.
    /// Never includes ReadOnlyServicePassword.
    /// </summary>
    public RedactedAdConfigurationDto ToRedactedSummary()
    {
        return new RedactedAdConfigurationDto
        {
            DomainControllerFqdn = DomainControllerFqdn,
            LdapsPort = LdapsPort,
            UseSsl = UseSsl,
            SearchBase = SearchBase,
            ReadOnlyServiceAccount = ReadOnlyServiceAccount,
            ServicePasswordStatus = "[REDACTED_NEVER_LOGGED]",
            ConnectionTimeoutSeconds = GetEffectiveTimeoutSeconds(),
            LdapPageSize = GetEffectivePageSize(),
            FeatureFlagConfiguredValue = EnableLiveReadOnlyConnection,
            Phase2ACodeGateLocked = IsPhase2ACodeGateLocked,
            EffectiveLiveConnectionEnabled = IsEffectiveLiveConnectionAllowed,
            RequireValidCertificateChain = CertificateValidation.RequireValidCertificateChain,
            RequireHostnameMatch = CertificateValidation.RequireHostnameMatch,
            AllowWildcardCertificates = CertificateValidation.AllowWildcardCertificates,
            RootCaThumbprintPlaceholder = CertificateValidation.RootCaThumbprintPlaceholder
        };
    }
}

public class CertificateValidationOptions
{
    public bool RequireValidCertificateChain { get; set; } = true;
    public bool RequireHostnameMatch { get; set; } = true;
    public bool AllowWildcardCertificates { get; set; } = false;
    public string RootCaThumbprintPlaceholder { get; set; } = "__PLACEHOLDER_HOSPITAL_ROOT_CA_THUMBPRINT__";
}

public class RedactedAdConfigurationDto
{
    public string DomainControllerFqdn { get; set; } = string.Empty;
    public int LdapsPort { get; set; } = 636;
    public bool UseSsl { get; set; } = true;
    public string SearchBase { get; set; } = string.Empty;
    public string ReadOnlyServiceAccount { get; set; } = string.Empty;
    public string ServicePasswordStatus { get; set; } = "[REDACTED_NEVER_LOGGED]";
    public int ConnectionTimeoutSeconds { get; set; }
    public int LdapPageSize { get; set; }
    public bool FeatureFlagConfiguredValue { get; set; }
    public bool Phase2ACodeGateLocked { get; set; } = true;
    public bool EffectiveLiveConnectionEnabled { get; set; } = false;
    public bool RequireValidCertificateChain { get; set; } = true;
    public bool RequireHostnameMatch { get; set; } = true;
    public bool AllowWildcardCertificates { get; set; } = false;
    public string RootCaThumbprintPlaceholder { get; set; } = string.Empty;
}

public class ConnectionReadinessReportDto
{
    public string Phase { get; set; } = "Phase 2A — Offline LDAPS Adapter & Readiness Preparation";
    public string Architecture { get; set; } = "Option A: Independent AD Management (Isolated Application Server)";
    public string OverallStatus { get; set; } = "Simulated / Not Tested (Live AD Connection Disabled)";
    public bool IsLiveAdConnectionActive { get; set; } = false;
    public bool IsPhase2ACodeGateLocked { get; set; } = true;
    public string Disclaimer { get; set; } =
        "โหมดเตรียมความพร้อม Phase 2A: ผลลัพธ์ทั้งหมดด้านล่างเป็นสถานะจำลอง (Simulated) หรือยังไม่ได้ทดสอบจริง (Not Tested / Not Configured) ห้ามถือเป็นผลการเชื่อมต่อ Domain Controller จริง";
    public DateTime GeneratedAtUtc { get; set; } = DateTime.UtcNow;
    public RedactedAdConfigurationDto Configuration { get; set; } = new();
    public List<DiagnosticCheckItemDto> Checks { get; set; } = new();
}

public class DiagnosticCheckItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string NameThai { get; set; } = string.Empty;
    /// <summary>
    /// Allowed values in Phase 2A: "Simulated", "NotTested", "NotConfigured".
    /// Never "Passed" or "Connected" in Phase 2A.
    /// </summary>
    public string Status { get; set; } = "NotTested";
    public bool IsLiveTested { get; set; } = false;
    public string Target { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string RemediationOrNextStep { get; set; } = string.Empty;
}

public interface IConnectionDiagnosticsService
{
    Task<ConnectionReadinessReportDto> GetConnectionReadinessAsync(CancellationToken cancellationToken = default);
}
