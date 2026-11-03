using SamchukHospital.AdManagement.Application.Common.Interfaces;
using SamchukHospital.AdManagement.Domain.Entities;

namespace SamchukHospital.AdManagement.Infrastructure.Directory;

/// <summary>
/// Synthetic Mock implementation of IDirectoryReadService for Phase 1 demonstration.
/// Contains identical synthetic records as the Frontend mock dataset.
/// No connection to Windows Server 2025 Domain Controller or live hospital network.
/// </summary>
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
            Title = "นายแพทย์ชำนาญการพิเศษ (อายุรแพทย์)",
            Office = "ห้องตรวจอายุรกรรม 1 อาคารผู้ป่วยนอก",
            TelephoneNumber = "1101",
            EmployeeId = "SH-MD-0014",
            DistinguishedName = "CN=Kittisak Prasertsuk,OU=Medical Staff,OU=Samchuk Hospital,DC=samchuk,DC=local",
            OuPath = "OU=Medical Staff,OU=Samchuk Hospital",
            Status = "Enabled",
            UserAccountControl = 512,
            UacFlags = new() { "NORMAL_ACCOUNT" },
            PasswordLastSet = DateTime.Parse("2026-09-15T08:30:00Z").ToUniversalTime(),
            PasswordExpires = DateTime.Parse("2026-12-14T08:30:00Z").ToUniversalTime(),
            BadPasswordCount = 0,
            LastLogonTimestamp = DateTime.Parse("2026-11-02T01:14:22Z").ToUniversalTime(),
            CreatedDate = DateTime.Parse("2024-03-10T02:00:00Z").ToUniversalTime(),
            MemberOf = new() { "GG_MedicalStaff", "GG_HIS_Physicians", "GG_Clinical_EHR_Write" }
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
            Title = "พยาบาลวิชาชีพชำนาญการ (หัวหน้าแผนกอุบัติเหตุ-ฉุกเฉิน ER)",
            Office = "ห้องหัวหน้าพยาบาล แผนกอุบัติเหตุ-ฉุกเฉิน",
            TelephoneNumber = "1199",
            EmployeeId = "SH-NR-0082",
            DistinguishedName = "CN=Supaporn Kaewmanee,OU=Nursing,OU=Samchuk Hospital,DC=samchuk,DC=local",
            OuPath = "OU=Nursing,OU=Samchuk Hospital",
            Status = "Enabled",
            UserAccountControl = 512,
            UacFlags = new() { "NORMAL_ACCOUNT" },
            PasswordLastSet = DateTime.Parse("2026-10-01T04:12:00Z").ToUniversalTime(),
            PasswordExpires = DateTime.Parse("2026-12-30T04:12:00Z").ToUniversalTime(),
            BadPasswordCount = 0,
            LastLogonTimestamp = DateTime.Parse("2026-11-02T06:45:10Z").ToUniversalTime(),
            CreatedDate = DateTime.Parse("2023-08-15T03:30:00Z").ToUniversalTime(),
            MemberOf = new() { "GG_Nursing_All", "GG_Nursing_Supervisors", "GG_ER_Staff" }
        },
        new AdUser
        {
            Id = "usr-003",
            SamAccountName = "wuttichai.sam",
            UserPrincipalName = "wuttichai.sam@samchuk.local",
            DisplayName = "ภก. วุฒิชัย สามชุกดี (Wuttichai Samchukdee)",
            FirstName = "วุฒิชัย",
            LastName = "สามชุกดี",
            Email = "wuttichai.sam@samchuk.hospital.mock",
            Department = "กลุ่มงานเภสัชกรรม (Pharmacy)",
            Title = "เภสัชกรชำนาญการ (หัวหน้างานบริการจ่ายยาผู้ป่วยนอก)",
            Office = "ห้องจ่ายยาผู้ป่วยนอก อาคาร 1",
            TelephoneNumber = "1142",
            EmployeeId = "SH-RX-0031",
            DistinguishedName = "CN=Wuttichai Samchukdee,OU=Allied Health,OU=Samchuk Hospital,DC=samchuk,DC=local",
            OuPath = "OU=Allied Health,OU=Samchuk Hospital",
            Status = "Enabled",
            UserAccountControl = 512,
            UacFlags = new() { "NORMAL_ACCOUNT" },
            PasswordLastSet = DateTime.Parse("2026-08-20T02:15:00Z").ToUniversalTime(),
            PasswordExpires = DateTime.Parse("2026-11-18T02:15:00Z").ToUniversalTime(),
            BadPasswordCount = 0,
            LastLogonTimestamp = DateTime.Parse("2026-11-01T10:05:00Z").ToUniversalTime(),
            CreatedDate = DateTime.Parse("2024-01-12T05:00:00Z").ToUniversalTime(),
            MemberOf = new() { "GG_Pharmacy_Users", "GG_DrugDispense_Auth" }
        },
        new AdUser
        {
            Id = "usr-004",
            SamAccountName = "somchai.jai",
            UserPrincipalName = "somchai.jai@samchuk.local",
            DisplayName = "นาย สมชาย ใจมั่นคง (Somchai Jaimankong)",
            FirstName = "สมชาย",
            LastName = "ใจมั่นคง",
            Email = "somchai.jai@samchuk.hospital.mock",
            Department = "ศูนย์เทคโนโลยีสารสนเทศ (IT Department)",
            Title = "นักวิชาการคอมพิวเตอร์ปฏิบัติการ (System & AD Administrator)",
            Office = "ศูนย์คอมพิวเตอร์ ชั้น 3 อาคารสนับสนุน",
            TelephoneNumber = "1180",
            EmployeeId = "SH-IT-0005",
            DistinguishedName = "CN=Somchai Jaimankong,OU=IT & Infrastructure,OU=Samchuk Hospital,DC=samchuk,DC=local",
            OuPath = "OU=IT & Infrastructure,OU=Samchuk Hospital",
            Status = "Enabled",
            UserAccountControl = 66048,
            UacFlags = new() { "NORMAL_ACCOUNT", "DONT_EXPIRE_PASSWORD" },
            PasswordLastSet = DateTime.Parse("2026-05-10T09:00:00Z").ToUniversalTime(),
            BadPasswordCount = 0,
            LastLogonTimestamp = DateTime.Parse("2026-11-02T07:12:44Z").ToUniversalTime(),
            CreatedDate = DateTime.Parse("2022-06-01T01:00:00Z").ToUniversalTime(),
            MemberOf = new() { "GG_IT_Support", "GG_IT_Operators", "GG_Server_Operators" }
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
            Office = "ห้องเวชระเบียน ชั้น 1",
            TelephoneNumber = "1120",
            EmployeeId = "SH-MR-0042",
            DistinguishedName = "CN=Anong Suriyaporn,OU=Administration,OU=Samchuk Hospital,DC=samchuk,DC=local",
            OuPath = "OU=Administration,OU=Samchuk Hospital",
            Status = "LockedOut",
            UserAccountControl = 528,
            UacFlags = new() { "NORMAL_ACCOUNT", "LOCKOUT" },
            PasswordLastSet = DateTime.Parse("2026-10-18T03:00:00Z").ToUniversalTime(),
            PasswordExpires = DateTime.Parse("2027-01-16T03:00:00Z").ToUniversalTime(),
            BadPasswordCount = 5,
            LastLogonTimestamp = DateTime.Parse("2026-11-01T04:22:10Z").ToUniversalTime(),
            CreatedDate = DateTime.Parse("2023-11-05T07:15:00Z").ToUniversalTime(),
            MemberOf = new() { "GG_MedicalRecords_Staff", "GG_HIS_Registration" }
        },
        new AdUser
        {
            Id = "usr-006",
            SamAccountName = "pranee.bun",
            UserPrincipalName = "pranee.bun@samchuk.local",
            DisplayName = "น.ส. ปราณี บุญช่วย (Pranee Boonchuay)",
            FirstName = "ปราณี",
            LastName = "บุญช่วย",
            Email = "pranee.bun@samchuk.hospital.mock",
            Department = "กลุ่มงานการเงินและบัญชี (Finance)",
            Title = "นักวิชาการเงินและบัญชี",
            Office = "ห้องการเงิน อาคารอำนวยการ",
            TelephoneNumber = "1135",
            EmployeeId = "SH-FN-0019",
            DistinguishedName = "CN=Pranee Boonchuay,OU=Administration,OU=Samchuk Hospital,DC=samchuk,DC=local",
            OuPath = "OU=Administration,OU=Samchuk Hospital",
            Status = "Disabled",
            UserAccountControl = 514,
            UacFlags = new() { "ACCOUNTDISABLE", "NORMAL_ACCOUNT" },
            PasswordLastSet = DateTime.Parse("2026-06-12T01:30:00Z").ToUniversalTime(),
            BadPasswordCount = 0,
            LastLogonTimestamp = DateTime.Parse("2026-08-31T09:00:00Z").ToUniversalTime(),
            CreatedDate = DateTime.Parse("2023-04-10T02:00:00Z").ToUniversalTime(),
            MemberOf = new() { "GG_Finance_Users" }
        },
        new AdUser
        {
            Id = "usr-007",
            SamAccountName = "manoch.sak",
            UserPrincipalName = "manoch.sak@samchuk.local",
            DisplayName = "นาย มาโนช ศักดิ์เจริญ (Manoch Sakcharoen)",
            FirstName = "มาโนช",
            LastName = "ศักดิ์เจริญ",
            Email = "manoch.sak@samchuk.hospital.mock",
            Department = "งานรังสีการแพทย์ (Radiology / X-Ray)",
            Title = "นักรังสีการแพทย์ปฏิบัติการ",
            Office = "ห้องเอกซเรย์ อาคารอุบัติเหตุ",
            TelephoneNumber = "1150",
            EmployeeId = "SH-XR-0012",
            DistinguishedName = "CN=Manoch Sakcharoen,OU=Allied Health,OU=Samchuk Hospital,DC=samchuk,DC=local",
            OuPath = "OU=Allied Health,OU=Samchuk Hospital",
            Status = "Enabled",
            UserAccountControl = 512,
            UacFlags = new() { "NORMAL_ACCOUNT" },
            PasswordLastSet = DateTime.Parse("2026-10-10T05:00:00Z").ToUniversalTime(),
            PasswordExpires = DateTime.Parse("2027-01-08T05:00:00Z").ToUniversalTime(),
            BadPasswordCount = 0,
            LastLogonTimestamp = DateTime.Parse("2026-11-02T02:10:00Z").ToUniversalTime(),
            CreatedDate = DateTime.Parse("2024-02-18T04:20:00Z").ToUniversalTime(),
            MemberOf = new() { "GG_Radiology_Staff", "GG_PACS_Viewers" }
        },
        new AdUser
        {
            Id = "usr-008",
            SamAccountName = "chatchai.rat",
            UserPrincipalName = "chatchai.rat@samchuk.local",
            DisplayName = "ทพ. ฉัตรชัย รัตนวงศ์ (Dr. Chatchai Rattanawong)",
            FirstName = "ฉัตรชัย",
            LastName = "รัตนวงศ์",
            Email = "chatchai.rat@samchuk.hospital.mock",
            Department = "กลุ่มงานทันตกรรม (Dental Department)",
            Title = "ทันตแพทย์ชำนาญการ",
            Office = "คลินิกทันตกรรม ชั้น 2",
            TelephoneNumber = "1160",
            EmployeeId = "SH-DT-0008",
            DistinguishedName = "CN=Chatchai Rattanawong,OU=Medical Staff,OU=Samchuk Hospital,DC=samchuk,DC=local",
            OuPath = "OU=Medical Staff,OU=Samchuk Hospital",
            Status = "Enabled",
            UserAccountControl = 512,
            UacFlags = new() { "NORMAL_ACCOUNT" },
            PasswordLastSet = DateTime.Parse("2026-09-02T08:00:00Z").ToUniversalTime(),
            PasswordExpires = DateTime.Parse("2026-12-01T08:00:00Z").ToUniversalTime(),
            BadPasswordCount = 1,
            LastLogonTimestamp = DateTime.Parse("2026-10-31T08:45:00Z").ToUniversalTime(),
            CreatedDate = DateTime.Parse("2023-10-01T03:00:00Z").ToUniversalTime(),
            MemberOf = new() { "GG_MedicalStaff", "GG_Dental_Staff" }
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
            LastLogonTimestamp = DateTime.Parse("2026-11-02T01:30:00Z").ToUniversalTime(),
            IpAddressSimulated = "10.2.10.45",
            BitLockerConfigured = true,
            DepartmentTag = "แผนกผู้ป่วยนอก (OPD Room 1)",
            CreatedDate = DateTime.Parse("2024-05-15T02:00:00Z").ToUniversalTime()
        },
        new AdComputer
        {
            Id = "cmp-002",
            Name = "SH-ER-TRIAGE01",
            DnsHostName = "sh-er-triage01.samchuk.local",
            OperatingSystem = "Windows 11 Enterprise",
            OperatingSystemVersion = "10.0 (26100)",
            DistinguishedName = "CN=SH-ER-TRIAGE01,OU=Workstations,OU=Samchuk Hospital,DC=samchuk,DC=local",
            OuPath = "OU=Workstations,OU=Samchuk Hospital",
            Status = "Enabled",
            LastLogonTimestamp = DateTime.Parse("2026-11-02T07:10:00Z").ToUniversalTime(),
            IpAddressSimulated = "10.2.11.12",
            BitLockerConfigured = true,
            DepartmentTag = "ห้องคัดกรองอุบัติเหตุฉุกเฉิน (ER Triage)",
            CreatedDate = DateTime.Parse("2024-04-10T03:00:00Z").ToUniversalTime()
        },
        new AdComputer
        {
            Id = "cmp-003",
            Name = "SH-PHARM-DISP01",
            DnsHostName = "sh-pharm-disp01.samchuk.local",
            OperatingSystem = "Windows 10 Pro",
            OperatingSystemVersion = "10.0 (19045)",
            DistinguishedName = "CN=SH-PHARM-DISP01,OU=Workstations,OU=Samchuk Hospital,DC=samchuk,DC=local",
            OuPath = "OU=Workstations,OU=Samchuk Hospital",
            Status = "Enabled",
            LastLogonTimestamp = DateTime.Parse("2026-11-01T12:00:00Z").ToUniversalTime(),
            IpAddressSimulated = "10.2.12.8",
            BitLockerConfigured = true,
            DepartmentTag = "เคาน์เตอร์จ่ายยาผู้ป่วยนอก",
            CreatedDate = DateTime.Parse("2023-09-01T08:00:00Z").ToUniversalTime()
        },
        new AdComputer
        {
            Id = "cmp-004",
            Name = "SH-XRAY-WORK01",
            DnsHostName = "sh-xray-work01.samchuk.local",
            OperatingSystem = "Windows 11 Pro for Workstations",
            OperatingSystemVersion = "10.0 (26100)",
            DistinguishedName = "CN=SH-XRAY-WORK01,OU=Workstations,OU=Samchuk Hospital,DC=samchuk,DC=local",
            OuPath = "OU=Workstations,OU=Samchuk Hospital",
            Status = "Enabled",
            LastLogonTimestamp = DateTime.Parse("2026-11-02T02:00:00Z").ToUniversalTime(),
            IpAddressSimulated = "10.2.13.15",
            BitLockerConfigured = true,
            DepartmentTag = "สถานีอ่านฟิล์มเอกซเรย์ (PACS Workstation)",
            CreatedDate = DateTime.Parse("2024-08-20T04:30:00Z").ToUniversalTime()
        },
        new AdComputer
        {
            Id = "cmp-005",
            Name = "SH-ADM-FIN02",
            DnsHostName = "sh-adm-fin02.samchuk.local",
            OperatingSystem = "Windows 10 Pro",
            OperatingSystemVersion = "10.0 (19045)",
            DistinguishedName = "CN=SH-ADM-FIN02,OU=Workstations,OU=Samchuk Hospital,DC=samchuk,DC=local",
            OuPath = "OU=Workstations,OU=Samchuk Hospital",
            Status = "Disabled",
            LastLogonTimestamp = DateTime.Parse("2026-07-15T09:20:00Z").ToUniversalTime(),
            IpAddressSimulated = "10.2.14.22",
            BitLockerConfigured = false,
            DepartmentTag = "โต๊ะการเงินเก่า (สำรองส่งซ่อม)",
            CreatedDate = DateTime.Parse("2022-11-10T06:00:00Z").ToUniversalTime()
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
            LastLogonTimestamp = DateTime.Parse("2026-11-02T07:45:00Z").ToUniversalTime(),
            IpAddressSimulated = "10.2.0.22",
            BitLockerConfigured = true,
            DepartmentTag = "Primary Domain Controller (Windows Server 2025)",
            CreatedDate = DateTime.Parse("2025-01-10T00:00:00Z").ToUniversalTime()
        }
    };

    private static readonly List<AdOrganizationalUnit> Ous = new()
    {
        new AdOrganizationalUnit
        {
            Id = "ou-root-samchuk",
            Name = "Samchuk Hospital",
            DistinguishedName = "OU=Samchuk Hospital,DC=samchuk,DC=local",
            Description = "รากฐานหน่วยงานโรงพยาบาลสามชุก (Root Hospital Organizational Unit)",
            ProtectedFromAccidentalDeletion = true,
            UserCount = 48,
            ComputerCount = 32,
            SubOuCount = 6,
            Children = new List<AdOrganizationalUnit>
            {
                new()
                {
                    Id = "ou-medical-staff",
                    Name = "Medical Staff (กลุ่มงานการแพทย์)",
                    DistinguishedName = "OU=Medical Staff,OU=Samchuk Hospital,DC=samchuk,DC=local",
                    ParentDn = "OU=Samchuk Hospital,DC=samchuk,DC=local",
                    Description = "แพทย์ประจำ, แพทย์เฉพาะทาง, ทันตแพทย์",
                    ProtectedFromAccidentalDeletion = true,
                    UserCount = 8,
                    ComputerCount = 4
                },
                new()
                {
                    Id = "ou-nursing",
                    Name = "Nursing (กลุ่มงานการพยาบาล)",
                    DistinguishedName = "OU=Nursing,OU=Samchuk Hospital,DC=samchuk,DC=local",
                    ParentDn = "OU=Samchuk Hospital,DC=samchuk,DC=local",
                    Description = "พยาบาลวิชาชีพ แผนกผู้ป่วยนอก, ผู้ป่วยใน, ฉุกเฉิน, ห้องผ่าตัด",
                    ProtectedFromAccidentalDeletion = true,
                    UserCount = 16,
                    ComputerCount = 10
                },
                new()
                {
                    Id = "ou-allied-health",
                    Name = "Allied Health (กลุ่มงานเทคนิคและบริการ)",
                    DistinguishedName = "OU=Allied Health,OU=Samchuk Hospital,DC=samchuk,DC=local",
                    ParentDn = "OU=Samchuk Hospital,DC=samchuk,DC=local",
                    Description = "กลุ่มงานเภสัชกรรม, รังสีการแพทย์, เทคนิคการแพทย์ (Lab), กายภาพบำบัด",
                    ProtectedFromAccidentalDeletion = true,
                    UserCount = 10,
                    ComputerCount = 6
                },
                new()
                {
                    Id = "ou-administration",
                    Name = "Administration (กลุ่มงานบริหารทั่วไป)",
                    DistinguishedName = "OU=Administration,OU=Samchuk Hospital,DC=samchuk,DC=local",
                    ParentDn = "OU=Samchuk Hospital,DC=samchuk,DC=local",
                    Description = "ฝ่ายบริหาร, เวชระเบียน, การเงินและบัญชี, พัสดุ, ทรัพยากรบุคคล",
                    ProtectedFromAccidentalDeletion = true,
                    UserCount = 8,
                    ComputerCount = 7
                },
                new()
                {
                    Id = "ou-it-support",
                    Name = "IT & Infrastructure (ศูนย์คอมพิวเตอร์)",
                    DistinguishedName = "OU=IT & Infrastructure,OU=Samchuk Hospital,DC=samchuk,DC=local",
                    ParentDn = "OU=Samchuk Hospital,DC=samchuk,DC=local",
                    Description = "เจ้าหน้าที่ศูนย์คอมพิวเตอร์และระบบสารสนเทศโรงพยาบาล",
                    ProtectedFromAccidentalDeletion = true,
                    UserCount = 6,
                    ComputerCount = 5
                },
                new()
                {
                    Id = "ou-workstations",
                    Name = "Workstations (อุปกรณ์ลูกข่าย)",
                    DistinguishedName = "OU=Workstations,OU=Samchuk Hospital,DC=samchuk,DC=local",
                    ParentDn = "OU=Samchuk Hospital,DC=samchuk,DC=local",
                    Description = "เครื่องคอมพิวเตอร์ประจำคลินิกและแผนกต่างๆ",
                    ProtectedFromAccidentalDeletion = true,
                    UserCount = 0,
                    ComputerCount = 28
                }
            }
        }
    };

    private static readonly List<AdGroup> Groups = new()
    {
        new AdGroup
        {
            Id = "grp-001",
            SamAccountName = "GG_MedicalStaff",
            DisplayName = "Global Group - Medical Staff",
            DistinguishedName = "CN=GG_MedicalStaff,OU=Groups,OU=Samchuk Hospital,DC=samchuk,DC=local",
            Scope = "Global",
            Type = "Security",
            Description = "กลุ่มสิทธิ์ความปลอดภัยสำหรับแพทย์และทันตแพทย์ประจำโรงพยาบาล",
            OuPath = "OU=Groups,OU=Samchuk Hospital",
            MailAddress = "medical-staff@samchuk.local",
            MemberCount = 8,
            Members = new()
            {
                new() { Id = "usr-001", SamAccountName = "kittisak.pra", DisplayName = "นพ. กิตติศักดิ์ ประเสริฐสุข", Type = "User", Department = "Medical Staff" },
                new() { Id = "usr-008", SamAccountName = "chatchai.rat", DisplayName = "ทพ. ฉัตรชัย รัตนวงศ์", Type = "User", Department = "Dental" }
            },
            NestedGroups = new() { "GG_Clinical_EHR_Write" }
        },
        new AdGroup
        {
            Id = "grp-002",
            SamAccountName = "GG_Nursing_All",
            DisplayName = "Global Group - Nursing Staff",
            DistinguishedName = "CN=GG_Nursing_All,OU=Groups,OU=Samchuk Hospital,DC=samchuk,DC=local",
            Scope = "Global",
            Type = "Security",
            Description = "พยาบาลวิชาชีพและผู้ปฏิบัติงานการพยาบาลทุกแผนก",
            OuPath = "OU=Groups,OU=Samchuk Hospital",
            MemberCount = 16,
            Members = new()
            {
                new() { Id = "usr-002", SamAccountName = "supaporn.kae", DisplayName = "พว. สุภาพร แก้วมณี", Type = "User", Department = "Nursing ER" }
            },
            NestedGroups = new() { "GG_ER_Staff" }
        },
        new AdGroup
        {
            Id = "grp-003",
            SamAccountName = "GG_IT_Support",
            DisplayName = "Global Group - IT Support and Helpdesk",
            DistinguishedName = "CN=GG_IT_Support,OU=Groups,OU=Samchuk Hospital,DC=samchuk,DC=local",
            Scope = "Global",
            Type = "Security",
            Description = "เจ้าหน้าที่ศูนย์คอมพิวเตอร์และทีมสนับสนุนระบบงานไอที",
            OuPath = "OU=Groups,OU=Samchuk Hospital",
            MemberCount = 6,
            Members = new()
            {
                new() { Id = "usr-004", SamAccountName = "somchai.jai", DisplayName = "นาย สมชาย ใจมั่นคง", Type = "User", Department = "IT" }
            },
            NestedGroups = new() { "GG_IT_Operators" }
        },
        new AdGroup
        {
            Id = "grp-004",
            SamAccountName = "GG_Pharmacy_Users",
            DisplayName = "Global Group - Pharmacy Users",
            DistinguishedName = "CN=GG_Pharmacy_Users,OU=Groups,OU=Samchuk Hospital,DC=samchuk,DC=local",
            Scope = "Global",
            Type = "Security",
            Description = "เภสัชกรและเจ้าพนักงานเภสัชกรรม คลังยาและจ่ายยา",
            OuPath = "OU=Groups,OU=Samchuk Hospital",
            MemberCount = 10,
            Members = new()
            {
                new() { Id = "usr-003", SamAccountName = "wuttichai.sam", DisplayName = "ภก. วุฒิชัย สามชุกดี", Type = "User", Department = "Pharmacy" }
            },
            NestedGroups = new()
        },
        new AdGroup
        {
            Id = "grp-005",
            SamAccountName = "DG_All_Staff_Announce",
            DisplayName = "Distribution Group - All Staff Announcements",
            DistinguishedName = "CN=DG_All_Staff_Announce,OU=Groups,OU=Samchuk Hospital,DC=samchuk,DC=local",
            Scope = "Universal",
            Type = "Distribution",
            Description = "กลุ่มกระจายข่าวสารและอีเมลประกาศสำหรับบุคลากรทั้งหมด (ไม่ใช่กลุ่มสิทธิ์)",
            OuPath = "OU=Groups,OU=Samchuk Hospital",
            MailAddress = "all-staff@samchuk.local",
            MemberCount = 48,
            Members = new(),
            NestedGroups = new() { "GG_MedicalStaff", "GG_Nursing_All", "GG_IT_Support" }
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
            filtered = filtered.Where(u => 
                u.DisplayName.ToLower().Contains(q) || 
                u.SamAccountName.ToLower().Contains(q) ||
                u.Email.ToLower().Contains(q) ||
                u.Department.ToLower().Contains(q) ||
                u.EmployeeId.ToLower().Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(query.Status) && query.Status != "All")
        {
            filtered = filtered.Where(u => u.Status == query.Status);
        }

        if (!string.IsNullOrWhiteSpace(query.Department) && query.Department != "All")
        {
            filtered = filtered.Where(u => u.Department.Contains(query.Department));
        }

        var total = filtered.Count();
        var pageNum = Math.Max(query.PageNumber, 1);
        var pSize = Math.Max(query.PageSize, 1);
        var items = filtered.Skip((pageNum - 1) * pSize).Take(pSize).ToList();

        return Task.FromResult(new PagedResult<AdUser>
        {
            Items = items,
            TotalCount = total,
            PageNumber = pageNum,
            PageSize = pSize
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
            filtered = filtered.Where(c => 
                c.Name.ToLower().Contains(q) || 
                c.DnsHostName.ToLower().Contains(q) ||
                c.DepartmentTag.ToLower().Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(query.OperatingSystem) && query.OperatingSystem != "All")
        {
            filtered = filtered.Where(c => c.OperatingSystem.Contains(query.OperatingSystem));
        }

        if (!string.IsNullOrWhiteSpace(query.Status) && query.Status != "All")
        {
            filtered = filtered.Where(c => c.Status == query.Status);
        }

        var total = filtered.Count();
        var pageNum = Math.Max(query.PageNumber, 1);
        var pSize = Math.Max(query.PageSize, 1);
        var items = filtered.Skip((pageNum - 1) * pSize).Take(pSize).ToList();

        return Task.FromResult(new PagedResult<AdComputer>
        {
            Items = items,
            TotalCount = total,
            PageNumber = pageNum,
            PageSize = pSize
        });
    }

    public Task<AdComputer?> GetComputerByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Computers.FirstOrDefault(c => c.Id == id || c.Name == id));
    }

    public Task<List<AdOrganizationalUnit>> GetOuTreeAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Ous);
    }

    public Task<AdOrganizationalUnit?> GetOuByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        AdOrganizationalUnit? FindInTree(IEnumerable<AdOrganizationalUnit> nodes)
        {
            foreach (var node in nodes)
            {
                if (node.Id == id || node.DistinguishedName == id) return node;
                if (node.Children.Any())
                {
                    var found = FindInTree(node.Children);
                    if (found != null) return found;
                }
            }
            return null;
        }

        return Task.FromResult(FindInTree(Ous));
    }

    public Task<List<AdGroup>> GetGroupsAsync(GroupFilterQuery query, CancellationToken cancellationToken = default)
    {
        var filtered = Groups.AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var q = query.Search.ToLowerInvariant();
            filtered = filtered.Where(g => 
                g.DisplayName.ToLower().Contains(q) || 
                g.SamAccountName.ToLower().Contains(q) ||
                g.Description.ToLower().Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(query.Scope) && query.Scope != "All")
        {
            filtered = filtered.Where(g => g.Scope == query.Scope);
        }

        if (!string.IsNullOrWhiteSpace(query.Type) && query.Type != "All")
        {
            filtered = filtered.Where(g => g.Type == query.Type);
        }

        return Task.FromResult(filtered.ToList());
    }

    public Task<AdGroup?> GetGroupByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Groups.FirstOrDefault(g => g.Id == id || g.SamAccountName == id));
    }
}
