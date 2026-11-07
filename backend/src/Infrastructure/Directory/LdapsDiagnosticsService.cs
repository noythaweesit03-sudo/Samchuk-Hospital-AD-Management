using SamchukHospital.AdManagement.Application.Common.Interfaces;

namespace SamchukHospital.AdManagement.Infrastructure.Directory;

/// <summary>
/// Phase 2A Connection Diagnostics Service (Mock / Offline Readiness Evaluation).
/// Evaluates the 6 mandatory pre-Phase 2B readiness areas WITHOUT opening any live network socket.
/// Every check explicitly reports "Simulated", "NotTested", or "NotConfigured".
/// Never reports a false "Passed" or "Connected" status in Phase 2A.
/// </summary>
public class LdapsDiagnosticsService : IConnectionDiagnosticsService
{
    private readonly ActiveDirectoryOptions _options;

    public LdapsDiagnosticsService()
        : this(new ActiveDirectoryOptions())
    {
    }

    public LdapsDiagnosticsService(ActiveDirectoryOptions options)
    {
        _options = options ?? new ActiveDirectoryOptions();
    }

    public Task<ConnectionReadinessReportDto> GetConnectionReadinessAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var isDnSyntaxValid = LdapFilterSanitizer.IsStructurallyValidDistinguishedName(
            _options.SearchBase,
            out var dnValidationMsg);

        var isDcPlaceholder = string.IsNullOrWhiteSpace(_options.DomainControllerFqdn) ||
                              _options.DomainControllerFqdn.Contains("PLACEHOLDER", StringComparison.OrdinalIgnoreCase) ||
                              _options.DomainControllerFqdn.Contains("TBD", StringComparison.OrdinalIgnoreCase);

        var isSvcAccountPlaceholder = string.IsNullOrWhiteSpace(_options.ReadOnlyServiceAccount) ||
                                      _options.ReadOnlyServiceAccount.Contains("PLACEHOLDER", StringComparison.OrdinalIgnoreCase) ||
                                      _options.ReadOnlyServiceAccount.Contains("TBD", StringComparison.OrdinalIgnoreCase);

        var checks = new List<DiagnosticCheckItemDto>
        {
            new()
            {
                Id = "dns-resolution",
                Name = "DNS Resolution",
                NameThai = "1. การแปลงชื่อโดเมน (DNS Resolution)",
                Status = isDcPlaceholder ? "NotConfigured" : "Simulated",
                IsLiveTested = false,
                Target = _options.DomainControllerFqdn,
                Summary = isDcPlaceholder
                    ? "[Not Configured / Not Tested] ยังเป็นค่า Placeholder สำหรับ Phase 2A ยังไม่ได้ระบุ FQDN ของ Domain Controller จริง"
                    : "[Simulated / Not Tested] รูปแบบ FQDN ถูกต้องตามโครงสร้าง แต่ยังไม่ได้ส่งคำขอ DNS Query จริงใน Phase 2A",
                RemediationOrNextStep = "ระบุ Domain Controller FQDN จริง และตรวจสอบ DNS Forward/Reverse Lookup บน Application Server ก่อนเริ่ม Phase 2B"
            },
            new()
            {
                Id = "tcp-636-reachability",
                Name = "TCP 636 Reachability",
                NameThai = "2. การเข้าถึงพอร์ตเครือข่าย LDAPS (TCP 636 Reachability)",
                Status = "NotTested",
                IsLiveTested = false,
                Target = $"{_options.DomainControllerFqdn}:{_options.LdapsPort}",
                Summary = "[Not Tested] ปิดการเปิด TCP Socket จริงใน Phase 2A ตามข้อกำหนดความปลอดภัย (Zero Live Network Connection)",
                RemediationOrNextStep = "ประสานทีมเครือข่ายเปิด Firewall เฉพาะ TCP 636 จาก IP ของ Application Server ไปยัง Domain Controller ก่อนเริ่ม Phase 2B"
            },
            new()
            {
                Id = "tls-certificate-validation",
                Name = "TLS Certificate Validation",
                NameThai = "3. การตรวจสอบใบรับรองความปลอดภัย (TLS Certificate & SAN Validation)",
                Status = "Simulated",
                IsLiveTested = false,
                Target = $"RequireChain={_options.CertificateValidation.RequireValidCertificateChain}, RequireSAN={_options.CertificateValidation.RequireHostnameMatch}, AllowWildcard={_options.CertificateValidation.AllowWildcardCertificates}",
                Summary = "[Simulated — Offline Logic Verified] ลอจิกตรวจสอบ X509Chain และ SAN/Hostname (MatchesHostname) พร้อมใช้งานแล้ว แต่ยังไม่ได้ทำ TLS Handshake กับ DC จริง (Not Tested)",
                RemediationOrNextStep = "ติดตั้งใบรับรอง Enterprise Root CA ของโรงพยาบาลสามชุกใน Trusted Root Certification Authorities บน Application Server"
            },
            new()
            {
                Id = "ldaps-bind-readiness",
                Name = "LDAPS Bind Readiness",
                NameThai = "4. ความพร้อมในการยืนยันตัวตน LDAPS Bind (LDAPS Bind Readiness)",
                Status = "NotTested",
                IsLiveTested = false,
                Target = $"AuthType.Negotiate over TLS (Timeout: {_options.GetEffectiveTimeoutSeconds()}s, WindowLimit: {_options.GetEffectiveMaxResultWindow()})",
                Summary = "[Not Tested] อะแดปเตอร์ LdapsReadService เตรียมคำสั่ง Bind แบบ Read-Only พร้อม Bounded Paging, Timeout และ CancellationToken แล้ว แต่ถูกล็อกด้วย Phase 2A Code Gate",
                RemediationOrNextStep = "รอการอนุมัติ Security Gate เพื่อทดสอบ LDAPS Bind ในสภาพแวดล้อม Test/Staging ใน Phase 2B"
            },
            new()
            {
                Id = "search-base-validation",
                Name = "Search Base Validation",
                NameThai = "5. การตรวจสอบโครงสร้าง Search Base DN (Search Base Validation)",
                Status = isDnSyntaxValid ? "Simulated" : "NotConfigured",
                IsLiveTested = false,
                Target = _options.SearchBase,
                Summary = isDnSyntaxValid
                    ? $"[Simulated] โครงสร้าง RFC 4514 DN ถูกต้องตามไวยากรณ์ ({dnValidationMsg})"
                    : $"[Not Configured] {dnValidationMsg}",
                RemediationOrNextStep = "กำหนด Distinguished Name ของ Root OU จริงของโรงพยาบาลสามชุกผ่าน Environment Variable หรือ Secret Store ใน Phase 2B"
            },
            new()
            {
                Id = "service-account-permission-readiness",
                Name = "Service Account Permission Readiness",
                NameThai = "6. ความพร้อมของบัญชีบริการอ่านข้อมูลอย่างเดียว (Service Account Permission Readiness)",
                Status = isSvcAccountPlaceholder ? "NotConfigured" : "NotTested",
                IsLiveTested = false,
                Target = $"{_options.ReadOnlyServiceAccount} (Password: [REDACTED])",
                Summary = isSvcAccountPlaceholder
                    ? "[Not Configured / Not Tested] บัญชีบริการยังเป็นค่า Placeholder (__PLACEHOLDER_READONLY_SERVICE_ACCOUNT__)"
                    : "[Not Tested] กำหนดชื่อบัญชีบริการแล้ว แต่ยังไม่ได้ทดสอบสิทธิ์ Read-Only บน OU จริงใน Phase 2A",
                RemediationOrNextStep = "สร้างบัญชีบริการเฉพาะทางที่มีสิทธิ์ Read-Only เท่านั้น (ห้ามอยู่ในกลุ่ม Domain Admins หรือ Account Operators)"
            }
        };

        var report = new ConnectionReadinessReportDto
        {
            Phase = "Phase 2A — Offline LDAPS Adapter & Readiness Preparation",
            Architecture = "Option A: Independent AD Management (Isolated Application Server)",
            OverallStatus = "Simulated / Not Tested (Live AD Connection Strictly Disabled in Phase 2A)",
            IsLiveAdConnectionActive = false,
            IsPhase2ACodeGateLocked = ActiveDirectoryOptions.IsPhase2ACodeGateLocked,
            Disclaimer = "โหมดเตรียมความพร้อม Phase 2A: ผลลัพธ์ทั้งหมดเป็นสถานะจำลอง (Simulated) หรือยังไม่ได้ทดสอบจริง (Not Tested / Not Configured) ห้ามถือเป็นผลการเชื่อมต่อ Domain Controller จริง",
            GeneratedAtUtc = DateTime.UtcNow,
            Configuration = _options.ToRedactedSummary(),
            Checks = checks
        };

        return Task.FromResult(report);
    }
}
