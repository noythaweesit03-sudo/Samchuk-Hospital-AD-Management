using SamchukHospital.AdManagement.Domain.Entities;

namespace SamchukHospital.AdManagement.Application.Common.Interfaces;

public interface IDirectoryReadService
{
    Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken = default);
    Task<PagedResult<AdUser>> GetUsersAsync(UserFilterQuery query, CancellationToken cancellationToken = default);
    Task<AdUser?> GetUserByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<PagedResult<AdComputer>> GetComputersAsync(ComputerFilterQuery query, CancellationToken cancellationToken = default);
    Task<AdComputer?> GetComputerByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<List<AdOrganizationalUnit>> GetOuTreeAsync(CancellationToken cancellationToken = default);
    Task<AdOrganizationalUnit?> GetOuByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<List<AdGroup>> GetGroupsAsync(GroupFilterQuery query, CancellationToken cancellationToken = default);
    Task<AdGroup?> GetGroupByIdAsync(string id, CancellationToken cancellationToken = default);
}

/// <summary>
/// STRICT ARCHITECTURAL BOUNDARY:
/// IDirectoryWriteService is purposefully NOT registered in Dependency Injection during Phase 1.
/// Any future implementation must enforce Delegated OU permissions, Dual-Approval, and MFA verification.
/// </summary>
public interface IDirectoryWriteService
{
    Task<bool> UnlockUserAccountAsync(string samAccountName, string justification, CancellationToken cancellationToken = default);
    Task<bool> ResetUserPasswordAsync(string samAccountName, string temporaryPassword, bool requireChangeAtLogon, CancellationToken cancellationToken = default);
    Task<bool> SetAccountEnabledStateAsync(string samAccountName, bool enable, CancellationToken cancellationToken = default);
}

public interface IAuditLogRepository
{
    Task LogAsync(AuditEntry entry, CancellationToken cancellationToken = default);
    Task<PagedResult<AuditEntry>> GetLogsAsync(AuditFilterQuery query, CancellationToken cancellationToken = default);
}

public interface ICurrentUser
{
    string? UserId { get; }
    string? Username { get; }
    string? Role { get; }
    string? ClientIp { get; }
    bool IsAuthenticated { get; }
}

public class DashboardSummaryDto
{
    public UserStatsDto UserStats { get; set; } = new();
    public ComputerStatsDto ComputerStats { get; set; } = new();
    public GroupStatsDto GroupStats { get; set; } = new();
    public OuStatsDto OuStats { get; set; } = new();
    public ServiceStatusDto ServiceStatus { get; set; } = new();
}

public class UserStatsDto
{
    public int Total { get; set; }
    public int Enabled { get; set; }
    public int Disabled { get; set; }
    public int LockedOut { get; set; }
}

public class ComputerStatsDto
{
    public int Total { get; set; }
    public int Workstations { get; set; }
    public int Servers { get; set; }
    public int Enabled { get; set; }
}

public class GroupStatsDto
{
    public int Total { get; set; }
    public int Security { get; set; }
    public int Distribution { get; set; }
}

public class OuStatsDto
{
    public int TotalOus { get; set; }
}

public class ServiceStatusDto
{
    public string DomainController { get; set; } = string.Empty;
    public string DcAddressMock { get; set; } = string.Empty;
    public string DcStatus { get; set; } = "Simulated";
    public int LdapsPort { get; set; } = 636;
    public string TlsCertificate { get; set; } = "NotConfigured_Phase2";
    public string AuditDatabase { get; set; } = "InMemoryMock";
    public DateTime LastRefreshedUtc { get; set; } = DateTime.UtcNow;
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}

public class UserFilterQuery
{
    public string? Search { get; set; }
    public string? Status { get; set; }
    public string? Department { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; }
    public string? SortOrder { get; set; }
}

public class ComputerFilterQuery
{
    public string? Search { get; set; }
    public string? OperatingSystem { get; set; }
    public string? Status { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class GroupFilterQuery
{
    public string? Search { get; set; }
    public string? Scope { get; set; }
    public string? Type { get; set; }
}

public class AuditFilterQuery
{
    public string? Action { get; set; }
    public string? Actor { get; set; }
    public string? Result { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
