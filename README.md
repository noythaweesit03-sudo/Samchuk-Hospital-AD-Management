# Samchuk Hospital Active Directory Management (โรงพยาบาลสามชุก)

> **Phase 2A: Offline LDAPS Read-Only Adapter & Connection Readiness Preparation**  
> **Official Architecture: Option A — Independent AD Management (Isolated Application Server)**  
> สถานะปัจจุบัน: **เตรียมความพร้อม LDAPS Read-Only Adapter เสร็จสมบูรณ์ (Phase 2A Hard-Locked)** — ยังไม่เชื่อมต่อ Domain Controller จริง ใช้ Mock Data / Mock Diagnostics (`Simulated` / `Not Configured` / `Not Tested`) และหยุดรอการอนุมัติก่อนเริ่ม Phase 2B

---

## 1. ภาพรวมโครงการและการยืนยันสถาปัตยกรรม (Project & Architecture Overview)
ระบบบริหารจัดการ Active Directory สำหรับโรงพยาบาลสามชุก จังหวัดสุพรรณบุรี ออกแบบตามสถาปัตยกรรม **Option A — Independent AD Management (Isolated Application Server)** โดย Frontend (React 19 + TypeScript) และ Backend (ASP.NET Core 8 Web API) ทำงานเป็นระบบอิสระ ไม่พึ่งพา Samchuk Hospital Central API Gateway, IIS 3001/3002, Procurement, Sam_Att, Cash_Cheque, DHCP หรือ FortiGate Captive Portal

### สิ่งที่พัฒนาเพิ่มเติมใน Phase 2A:
1. **Read-Only AD Adapter (`LdapsReadService.cs` & `LdapFilterSanitizer.cs`):**
   - พัฒนาอะแดปเตอร์อ่านข้อมูล Active Directory ผ่าน `System.DirectoryServices.Protocols` (LDAPS Port 636) รองรับการอ่าน Dashboard Summary, Users, User Details, Computers, Computer Details, Organizational Units (OUs), Groups, Group Members, การถอดรหัสสถานะบัญชีจาก `userAccountControl` / `lockoutTime`, และการแปลงเวลา `lastLogonTimestamp` (พร้อมระบุข้อจำกัดความแม่นยำตามรอบ Replication 9–14 วัน)
   - ป้องกัน LDAP Injection ด้วยการ Escape อักขระพิเศษตามมาตรฐาน **RFC 4515** (`\2a`, `\28`, `\29`, `\5c`, `\00`) และจำกัดความยาวคำค้นหาไม่เกิน 128 ตัวอักษร
   - รองรับการแบ่งหน้า LDAP (`PageResultRequestControl`), การจำกัดเวลาเชื่อมต่อ (`ConnectionTimeoutSeconds`), การยกเลิกคำขอ (`CancellationToken`), และการตรวจสอบใบรับรอง TLS (`X509Chain` + `MatchesHostname`)
2. **Configuration & Double Safety Gate (`ActiveDirectoryOptions.cs`):**
   - ใช้ค่า Placeholder ที่ปลอดภัยทั้งหมด (`__PLACEHOLDER_DC_FQDN__`, `OU=PLACEHOLDER_ORG_UNIT,DC=placeholder,DC=example`, `__PLACEHOLDER_READONLY_SERVICE_ACCOUNT__`)
   - ปิด Feature Flag เป็นค่าเริ่มต้น (`EnableLiveReadOnlyConnection = false`) และล็อกซ้ำด้วย Code Gate (`IsPhase2ACodeGateLocked = true`) ทำให้ไม่สามารถเปิดการเชื่อมต่อ AD จริงผ่านการแก้ไฟล์ตั้งค่าเพียงอย่างเดียวใน Phase 2A
   - ซ่อนรหัสผ่านบัญชีบริการด้วย `[REDACTED_NEVER_LOGGED]` เสมอ
3. **Connection Diagnostics (`LdapsDiagnosticsService.cs`, `DiagnosticsController.cs` & หน้า Settings):**
   - เพิ่ม API `GET /api/diagnostics/connection-readiness` (จำกัดสิทธิ์เฉพาะ `ADOperator`, `SecurityAuditor`, `SystemAdministrator`) และส่วนแสดงผลในหน้า Settings
   - ตรวจสอบความพร้อม 6 ด้าน: **DNS Resolution**, **TCP 636 Reachability**, **TLS Certificate Validation**, **LDAPS Bind Readiness**, **Search Base Validation**, และ **Service Account Permission Readiness**
   - ทุกรายการแสดงสถานะตามจริงว่าเป็น **`Simulated`**, **`NotConfigured`**, หรือ **`NotTested`** โดยไม่สร้างผลการเชื่อมต่อสำเร็จปลอม

---

## 2. รายการตรวจสอบความพร้อม 10 ข้อก่อนเริ่ม Phase 2B (Pre-Phase 2B Checklist)

ก่อนปลดล็อกเข้าสู่ Phase 2B จะต้องเตรียมและตรวจสอบรายการต่อไปนี้ให้ครบถ้วน:
- [ ] **1. Application Server OS / Hostname / IP:** จัดสรรเครื่องเซิร์ฟเวอร์อิสระ (Windows Server 2022/2025 หรือ Ubuntu LTS) พร้อม Fixed IP และ Hostname
- [ ] **2. AD DNS Domain / Forest:** ยืนยันชื่อโดเมนและตั้งค่า DNS บน Application Server ให้ชี้ไปยัง Internal AD DNS
- [ ] **3. Domain Controller FQDN:** ระบุ FQDN ของ Domain Controller จริงแทนค่า Placeholder ให้ตรงกับ SAN ในใบรับรอง
- [ ] **4. Root CA Certificate:** ติดตั้งใบรับรอง Enterprise Root CA ของโรงพยาบาลสามชุกใน Trusted Root Certification Authorities บน Application Server
- [ ] **5. LDAPS Port 636:** ยืนยันการเปิดใช้งาน LDAPS (TCP 636) บน Domain Controller พร้อมใบรับรองที่ยังไม่หมดอายุ
- [ ] **6. Read-only Service Account:** สร้างบัญชีบริการที่มีสิทธิ์เฉพาะ Read-only เท่านั้น (ห้ามอยู่ในกลุ่ม Domain Admins หรือมีสิทธิ์เขียนข้อมูล)
- [ ] **7. Search Base:** กำหนด Distinguished Name (DN) ของ Root OU โรงพยาบาลสามชุกแทนค่า Placeholder
- [ ] **8. Firewall Connectivity:** เปิด Firewall เฉพาะ TCP 636 จาก Application Server IP ไปยัง Domain Controller โดยไม่ผ่าน SSL Inspection หรือ FortiGate Captive Portal
- [ ] **9. Test Environment:** เตรียมสภาพแวดล้อมทดสอบ (Test/Staging) สำหรับทดสอบการอ่านข้อมูลผ่าน LDAPS
- [ ] **10. Security Approval:** ได้รับการอนุมัติอย่างเป็นทางการจากผู้รับผิดชอบด้านความมั่นคงปลอดภัยสารสนเทศของโรงพยาบาลสามชุก

---

## 3. รายงานผลการทดสอบอัตโนมัติ (Automated Test Status — Phase 2A)

| หมวดการทดสอบ | ไฟล์ทดสอบ | สถานะ | รายละเอียด |
| :--- | :--- | :---: | :--- |
| **Phase 2A LDAPS & Diagnostics** | `tests/phase2AReadiness.test.ts` | **PASSED** (7/7) | RFC 4515 LDAP Escaping, DN Validation, Feature Flag Code Gate, 6 Diagnostics Checks, Secret Redaction |
| **Contract & Integration** | `tests/contractIntegration.test.ts` | **PASSED** (8/8) | HttpDirectoryApi, Query Params, Headers, Timeout, Health, Error Parsing |
| **Session Expiration Lock** | `tests/sessionExpiration.test.ts` | **PASSED** (7/7) | ล็อกการเข้าถึง Dashboard และการต่อเวลาเมื่อเซสชันหมดอายุจนกว่าจะ Mock Login ใหม่ |
| **RBAC Matrix** | `tests/rbac.test.ts` | **PASSED** (11/11) | ตรวจสอบสิทธิ์ 5 บทบาทครอบคลุมทุกเมนู |
| **Mock API Contract** | `tests/mockApi.test.ts` | **PASSED** (11/11) | ตรวจสอบการอ่านข้อมูลจำลอง Users, Computers, OUs, Groups, Audit Logs |
| **Pagination & Sorting** | `tests/pagination.test.ts` | **PASSED** (4/4) | ตรวจสอบการคำนวณหน้าและการเรียงลำดับข้อมูล |
| **Input Validation** | `tests/inputValidation.test.ts` | **PASSED** (6/6) | ตรวจสอบการตัด Whitespace, Case-insensitivity, Boundary handling |
| **AD Write Lock** | `tests/writeOperationsDisabled.test.ts` | **PASSED** (2/2) | ยืนยันว่าไม่มีเมธอดแก้ไขหรือเขียนข้อมูล AD ใน API Contract |
| **Backend .NET 8 xUnit Tests** | `Phase2AReadinessTests.cs` & `UserFilterTests.cs` | **CI VERIFIED** | ทดสอบ `LdapFilterSanitizer`, `LdapsReadService`, `LdapsDiagnosticsService`, `DemoAuthenticationHandler`, `AuthorizationPolicies` ผ่าน GitHub Actions CI |
