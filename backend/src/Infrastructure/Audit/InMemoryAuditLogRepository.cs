using SamchukHospital.AdManagement.Application.Common.Interfaces;
using SamchukHospital.AdManagement.Domain.Entities;

namespace SamchukHospital.AdManagement.Infrastructure.Audit;

public class InMemoryAuditLogRepository : IAuditLogRepository
{
    private readonly List<AuditEntry> _logs = new()
    {
        new AuditEntry
        {
            Id = "aud-001",
            RequestId = "req-8f4b23c1-01",
            TimestampUtc = DateTime.UtcNow.AddMinutes(-20),
            Actor = "somchai.jai",
            ActorRole = "SystemAdministrator",
            Action = "AUTH_LOGIN",
            TargetObject = "AD Web Management Portal",
            TargetType = "Auth",
            Result = "Success",
            ClientIp = "10.2.15.10",
            Details = "เข้าสู่ระบบโหมดสาธิตสำเร็จด้วยสิทธิ์ SystemAdministrator"
        },
        new AuditEntry
        {
            Id = "aud-002",
            RequestId = "req-7a911e40-02",
            TimestampUtc = DateTime.UtcNow.AddMinutes(-18),
            Actor = "somchai.jai",
            ActorRole = "SystemAdministrator",
            Action = "USER_LIST_VIEW",
            TargetObject = "OU=Samchuk Hospital,DC=samchuk,DC=local",
            TargetType = "User",
            Result = "Success",
            ClientIp = "10.2.15.10",
            Details = "ค้นหารายชื่อผู้ใช้ใน AD: filter=\"status=All\""
        }
    };

    public Task LogAsync(AuditEntry entry, CancellationToken cancellationToken = default)
    {
        lock (_logs)
        {
            _logs.Insert(0, entry);
        }
        return Task.CompletedTask;
    }

    public Task<PagedResult<AuditEntry>> GetLogsAsync(AuditFilterQuery query, CancellationToken cancellationToken = default)
    {
        lock (_logs)
        {
            var filtered = _logs.AsQueryable();

            if (!string.IsNullOrWhiteSpace(query.Action) && query.Action != "All")
                filtered = filtered.Where(l => l.Action == query.Action);

            if (!string.IsNullOrWhiteSpace(query.Actor))
            {
                var q = query.Actor.ToLowerInvariant();
                filtered = filtered.Where(l => l.Actor.ToLower().Contains(q));
            }

            if (!string.IsNullOrWhiteSpace(query.Result) && query.Result != "All")
                filtered = filtered.Where(l => l.Result == query.Result);

            var total = filtered.Count();
            var items = filtered.Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize).ToList();

            return Task.FromResult(new PagedResult<AuditEntry>
            {
                Items = items,
                TotalCount = total,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize
            });
        }
    }
}
