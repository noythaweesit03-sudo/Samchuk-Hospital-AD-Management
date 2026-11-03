using SamchukHospital.AdManagement.Application.Common.Interfaces;
using SamchukHospital.AdManagement.Domain.Entities;

namespace SamchukHospital.AdManagement.Infrastructure.Directory;

public class LdapReadServiceMock : IDirectoryReadService
{
    private static readonly List<AdUser> Users = new()
    {
        new AdUser
        {
            Id = "usr-001",
            SamAccountName = "kittisak.pra",
            UserPrincipalName = "kittisak.pra@samchuk.local",
            DisplayName = "นพ. กิตติศักดิ์ ประเสริฐสุข (Dr. Kittisak Prasertsuk)",
            FirstName = "กิตติศักดิ์",
            LastName = "ประเสริฐสุข",
            Email = "kittisak.pra@samchuk.hospital.mock",
            Department = "กลุ่มงานการแพทย์ (Medical Staff)",
            Title = "นายแพทย์ชำนาญการพิเศษ",
            Office = "ห้องตรวจอายุรกรรม 1",
            TelephoneNumber = "1101",
            EmployeeId = "SH-MD-0014",
            DistinguishedName = "CN=Kittisak Prasertsuk,OU=Medical Staff,OU=Samchuk Hospital,DC=samchuk,DC=local",
            OuPath = "OU=Medical Staff,OU=Samchuk Hospital",
            Status = "Enabled",
            UserAccountControl = 512,
            UacFlags = new() { "NORMAL_ACCOUNT" },
            PasswordLastSet = DateTime.UtcNow.AddDays(-48),
            CreatedDate = DateTime.UtcNow.AddYears(-2),
            MemberOf = new() { "GG_MedicalStaff", "GG_HIS_Physicians" }
        },
        new AdUser
        {
            Id = "usr-002",
            SamAccountName = "supaporn.kae",
            UserPrincipalName = "supaporn.kae@samchuk.local",
            DisplayName = "พว. สุภาพร แก้วมณี (Supaporn Kaewmanee)",
            FirstName = "สุภาพร",
            LastName = "แก้วมณี",
            Email = "supaporn.kae@samchuk.hospital.mock",
            Department = "กลุ่มงานการพยาบาล (Nursing)",
            Title = "พยาบาลวิชาชีพชำนาญการ (หัวหน้า ER)",
            Office = "แผนกอุบัติเหตุ-ฉุกเฉิน",
            TelephoneNumber = "1199",
            EmployeeId = "SH-NR-0082",
            DistinguishedName = "CN=Supaporn Kaewmanee,OU=Nursing,OU=Samchuk Hospital,DC=samchuk,DC=local",
            OuPath = "OU=Nursing,OU=Samchuk Hospital",
            Status = "Enabled",
            UserAccountControl = 512,
            UacFlags = new() { "NORMAL_ACCOUNT" },
            PasswordLastSet = DateTime.UtcNow.AddDays(-32),
            CreatedDate = DateTime.UtcNow.AddYears(-3),
            MemberOf = new() { "GG_Nursing_All", "GG_ER_Staff" }
        },
        new AdUser
        {
            Id = "usr-005",
            SamAccountName = "anong.sur",
            UserPrincipalName = "anong.sur@samchuk.local",
            DisplayName = "นาง อนงค์ สุริยาพร (Anong Suriyaporn)",
            FirstName = "อนงค์",
            LastName = "สุริยาพร",
            Email = "anong.sur@samchuk.hospital.mock",
            Department = "งานเวชระเบียนและสถิติ (Medical Records)",
            Title = "เจ้าพนักงานเวชสถิติชำนาญงาน",
            Office = "ห้องเวชระเบียน",
            TelephoneNumber = "1120",
            EmployeeId = "SH-MR-0042",
            DistinguishedName = "CN=Anong Suriyaporn,OU=Administration,OU=Samchuk Hospital,DC=samchuk,DC=local",
            OuPath = "OU=Administration,OU=Samchuk Hospital",
            Status = "LockedOut",
            UserAccountControl = 528,
            UacFlags = new() { "NORMAL_ACCOUNT", "LOCKOUT" },
            PasswordLastSet = DateTime.UtcNow.AddDays(-15),
            BadPasswordCount = 5,
            CreatedDate = DateTime.UtcNow.AddMonths(-18),
            MemberOf = new() { "GG_MedicalRecords_Staff" }
        }
    };

    private static readonly List<AdComputer> Computers = new()
    {
        new AdComputer
        {
            Id = "cmp-001",
            Name = "SH-OPD-PC01",
            DnsHostName = "sh-opd-pc01.samchuk.local",
            OperatingSystem = "Windows 11 Enterprise",
            OperatingSystemVersion = "10.0 (26100)",
            DistinguishedName = "CN=SH-OPD-PC01,OU=Workstations,OU=Samchuk Hospital,DC=samchuk,DC=local",
            OuPath = "OU=Workstations,OU=Samchuk Hospital",
            Status = "Enabled",
            LastLogonTimestamp = DateTime.UtcNow.AddHours(-6),
            BitLockerConfigured = true,
            DepartmentTag = "แผนกผู้ป่วยนอก",
            CreatedDate = DateTime.UtcNow.AddMonths(-10)
        },
        new AdComputer
        {
            Id = "cmp-006",
            Name = "SH-DC01",
            DnsHostName = "sh-dc01.samchuk.local",
            OperatingSystem = "Windows Server 2025 Standard",
            OperatingSystemVersion = "10.0 (26100)",
            DistinguishedName = "CN=SH-DC01,OU=Domain Controllers,DC=samchuk,DC=local",
            OuPath = "OU=Domain Controllers",
            Status = "Enabled",
            LastLogonTimestamp = DateTime.UtcNow.AddMinutes(-10),
            BitLockerConfigured = true,
            DepartmentTag = "Domain Controller (10.2.0.22 Ref)",
            CreatedDate = DateTime.UtcNow.AddYears(-1)
        }
    };

    public Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new DashboardSummaryDto
        {
            UserStats = new UserStatsDto { Total = 48, Enabled = 44, Disabled = 3, LockedOut = 1 },
            ComputerStats = new ComputerStatsDto { Total = 32, Workstations = 28, Servers = 4, Enabled = 30 },
            GroupStats = new GroupStatsDto { Total = 14, Security = 11, Distribution = 3 },
            OuStats = new OuStatsDto { TotalOus = 7 },
            ServiceStatus = new ServiceStatusDto
            {
                DomainController = "Windows Server 2025 (SH-DC01)",
                DcAddressMock = "10.2.0.22 (Architecture Reference Only)",
                DcStatus = "Simulated",
                LdapsPort = 636,
                TlsCertificate = "NotConfigured_Phase2",
                AuditDatabase = "InMemoryMock",
                LastRefreshedUtc = DateTime.UtcNow
            }
        });
    }

    public Task<PagedResult<AdUser>> GetUsersAsync(UserFilterQuery query, CancellationToken cancellationToken = default)
    {
        var filtered = Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var q = query.Search.ToLowerInvariant();
            filtered = filtered.Where(u => u.DisplayName.ToLower().Contains(q) || u.SamAccountName.ToLower().Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(query.Status) && query.Status != "All")
        {
            filtered = filtered.Where(u => u.Status == query.Status);
        }

        var total = filtered.Count();
        var items = filtered.Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize).ToList();

        return Task.FromResult(new PagedResult<AdUser>
        {
            Items = items,
            TotalCount = total,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        });
    }

    public Task<AdUser?> GetUserByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        var user = Users.FirstOrDefault(u => u.Id == id || u.SamAccountName == id);
        return Task.FromResult(user);
    }

    public Task<PagedResult<AdComputer>> GetComputersAsync(ComputerFilterQuery query, CancellationToken cancellationToken = default)
    {
        var filtered = Computers.AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var q = query.Search.ToLowerInvariant();
            filtered = filtered.Where(c => c.Name.ToLower().Contains(q) || c.DepartmentTag.ToLower().Contains(q));
        }

        var total = filtered.Count();
        var items = filtered.Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize).ToList();

        return Task.FromResult(new PagedResult<AdComputer>
        {
            Items = items,
            TotalCount = total,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        });
    }

    public Task<AdComputer?> GetComputerByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Computers.FirstOrDefault(c => c.Id == id || c.Name == id));
    }

    public Task<List<AdOrganizationalUnit>> GetOuTreeAsync(CancellationToken cancellationToken = default)
    {
        var root = new AdOrganizationalUnit
        {
            Id = "ou-root",
            Name = "Samchuk Hospital",
            DistinguishedName = "OU=Samchuk Hospital,DC=samchuk,DC=local",
            Description = "Root OU โรงพยาบาลสามชุก",
            UserCount = 48,
            ComputerCount = 32,
            Children = new List<AdOrganizationalUnit>
            {
                new() { Id = "ou-med", Name = "Medical Staff", DistinguishedName = "OU=Medical Staff,OU=Samchuk Hospital,DC=samchuk,DC=local", UserCount = 8, ComputerCount = 4 },
                new() { Id = "ou-nr", Name = "Nursing", DistinguishedName = "OU=Nursing,OU=Samchuk Hospital,DC=samchuk,DC=local", UserCount = 16, ComputerCount = 10 }
            }
        };

        return Task.FromResult(new List<AdOrganizationalUnit> { root });
    }

    public Task<AdOrganizationalUnit?> GetOuByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<AdOrganizationalUnit?>(new AdOrganizationalUnit
        {
            Id = id,
            Name = "Samchuk Hospital OU",
            DistinguishedName = "OU=Samchuk Hospital,DC=samchuk,DC=local"
        });
    }

    public Task<List<AdGroup>> GetGroupsAsync(GroupFilterQuery query, CancellationToken cancellationToken = default)
    {
        var groups = new List<AdGroup>
        {
            new() { Id = "grp-1", SamAccountName = "GG_MedicalStaff", DisplayName = "Medical Staff", Scope = "Global", Type = "Security", MemberCount = 8 },
            new() { Id = "grp-2", SamAccountName = "GG_Nursing_All", DisplayName = "Nursing Staff", Scope = "Global", Type = "Security", MemberCount = 16 }
        };
        return Task.FromResult(groups);
    }

    public Task<AdGroup?> GetGroupByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<AdGroup?>(new AdGroup
        {
            Id = id,
            SamAccountName = "GG_MedicalStaff",
            DisplayName = "Medical Staff"
        });
    }
}
