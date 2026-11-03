using SamchukHospital.AdManagement.Application.Common.Interfaces;
using SamchukHospital.AdManagement.Domain.Entities;

namespace SamchukHospital.AdManagement.Infrastructure.Audit;

/// <summary>
/// In-Memory Audit Log Repository for Phase 1 demonstration.
/// Tracks administrative queries and blocked mutation attempts without persistent storage.
/// Strictly excludes passwords, secret tokens, or private keys.
/// </summary>
public class InMemoryAuditLogRepository : IAuditLogRepository
{
    private readonly List<AuditEntry> _logs = new()
    {
        new AuditEntry
        {
            Id = "aud-001",
            RequestId = "req-8f4b23c1-01",
            TimestampUtc = DateTime.Parse("2026-11-02T07:45:12Z").ToUniversalTime(),
            Actor = "somchai.jai",
            ActorRole = "SystemAdministrator",
            Action = "AUTH_LOGIN",
            TargetObject = "AD Web Management Portal",
            TargetType = "Auth",
            Result = "Success",
            ClientIp = "10.2.15.10",
            Details = "เข้าสู่ระบบโหมดสาธิตสำเร็จด้วยสิทธิ์ SystemAdministrator จากเครือข่าย IT Admin VLAN"
        },
        new AuditEntry
        {
            Id = "aud-002",
            RequestId = "req-7a911e40-02",
            TimestampUtc = DateTime.Parse("2026-11-02T07:46:05Z").ToUniversalTime(),
            Actor = "somchai.jai",
            ActorRole = "SystemAdministrator",
            Action = "USER_LIST_VIEW",
            TargetObject = "OU=Samchuk Hospital,DC=samchuk,DC=local",
            TargetType = "User",
            Result = "Success",
            ClientIp = "10.2.15.10",
            Details = "ค้นหารายชื่อผู้ใช้ใน AD: filter=\"status=All\", page=1, pageSize=10 (Mock Mode)"
        },
        new AuditEntry
        {
            Id = "aud-003",
            RequestId = "req-9c314b99-03",
            TimestampUtc = DateTime.Parse("2026-11-02T07:47:30Z").ToUniversalTime(),
            Actor = "somchai.jai",
            ActorRole = "SystemAdministrator",
            Action = "USER_DETAILS_VIEW",
            TargetObject = "CN=Anong Suriyaporn,OU=Administration,OU=Samchuk Hospital,DC=samchuk,DC=local",
            TargetType = "User",
            Result = "Success",
            ClientIp = "10.2.15.10",
            Details = "เปิดดูรายละเอียดบัญชีที่ถูกล็อก (LockedOut Account: anong.sur)"
        },
        new AuditEntry
        {
            Id = "aud-004",
            RequestId = "req-3b17c2f0-04",
            TimestampUtc = DateTime.Parse("2026-11-02T07:48:15Z").ToUniversalTime(),
            Actor = "somchai.jai",
            ActorRole = "SystemAdministrator",
            Action = "MUTATION_BLOCKED_PHASE1",
            TargetObject = "CN=Anong Suriyaporn (anong.sur)",
            TargetType = "User",
            Result = "SimulatedBlocked",
            ClientIp = "10.2.15.10",
            Details = "การพยายามปลดล็อกบัญชีถูกสกัดกั้นตามนโยบาย Phase 1 (ระบบเปิดเฉพาะ Read-only Mocking)"
        },
        new AuditEntry
        {
            Id = "aud-005",
            RequestId = "req-22f180da-05",
            TimestampUtc = DateTime.Parse("2026-11-02T07:50:00Z").ToUniversalTime(),
            Actor = "helpdesk.test",
            ActorRole = "Helpdesk",
            Action = "COMPUTER_LIST_VIEW",
            TargetObject = "OU=Workstations,OU=Samchuk Hospital",
            TargetType = "Computer",
            Result = "Success",
            ClientIp = "10.2.15.24",
            Details = "ตรวจสอบรายการคอมพิวเตอร์ลูกข่ายและสถานะ BitLocker (Read-only)"
        },
        new AuditEntry
        {
            Id = "aud-006",
            RequestId = "req-15e88411-06",
            TimestampUtc = DateTime.Parse("2026-11-02T07:51:22Z").ToUniversalTime(),
            Actor = "auditor.test",
            ActorRole = "SecurityAuditor",
            Action = "OU_TREE_VIEW",
            TargetObject = "DC=samchuk,DC=local",
            TargetType = "OU",
            Result = "Success",
            ClientIp = "10.2.15.55",
            Details = "ตรวจสอบโครงสร้างไดเรกทอรีและสิทธิ์ความปลอดภัย OUs"
        },
        new AuditEntry
        {
            Id = "aud-007",
            RequestId = "req-04a29bb8-07",
            TimestampUtc = DateTime.Parse("2026-11-02T07:52:40Z").ToUniversalTime(),
            Actor = "viewer.test",
            ActorRole = "Viewer",
            Action = "SETTINGS_VIEW",
            TargetObject = "System Configuration",
            TargetType = "System",
            Result = "Denied",
            ClientIp = "10.2.15.89",
            Details = "ถูกปฏิเสธการเข้าถึงหน้า Settings เนื่องจากบทบาท Viewer ไม่มีสิทธิ์ AD_CONFIG_VIEW"
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
            var pageNum = Math.Max(query.PageNumber, 1);
            var pSize = Math.Max(query.PageSize, 1);
            var items = filtered.Skip((pageNum - 1) * pSize).Take(pSize).ToList();

            return Task.FromResult(new PagedResult<AuditEntry>
            {
                Items = items,
                TotalCount = total,
                PageNumber = pageNum,
                PageSize = pSize
            });
        }
    }
}
