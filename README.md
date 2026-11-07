# Samchuk Hospital Active Directory Management (โรงพยาบาลสามชุก)

> **Phase 1: Final Hardening & Verification**  
> **Official Architecture: Option A — Independent AD Management (Isolated Application Server)**  
> สถานะ: **โหมดสาธิต (Synthetic Mock Data & Mock Auth 100%)** — เริ่มต้นที่หน้า Demo Login เสมอ ไม่มีการเชื่อมต่อ Active Directory จริง และไม่มีการเชื่อมต่อกับ FortiGate / Central Gateway

---

## 1. ภาพรวมโครงการและการยืนยันสถาปัตยกรรม (Project & Architecture Overview)
ระบบบริหารจัดการ Active Directory สำหรับโรงพยาบาลสามชุก จังหวัดสุพรรณบุรี ออกแบบเพื่อรองรับการตรวจสอบและบริหารไดเรกทอรีภายใน (Windows Server 2025) บนเซิร์ฟเวอร์แอปพลิเคชันอิสระ

### การยืนยันสถาปัตยกรรมหลัก: Architecture Option A
- **ระบบอิสระ (Independent Application Server):** Frontend (React + TypeScript) และ Backend (ASP.NET Core 8 Web API) ทำงานแยกขาดจาก Samchuk Hospital Central API Gateway, IIS พอร์ต 3001/3002, Procurement, Sam_Att, Cash_Cheque, DHCP และ FortiGate Captive Portal
- **แยกขอบเขตความปลอดภัย (Security Boundary):** Process Identity, การกำหนดค่า (Configuration), การพิสูจน์ตัวตน (Authentication) และบันทึกการตรวจสอบ (Audit Trail) แยกเป็นเอกเทศ ป้องกันความเสี่ยงต่อระบบงานหลักของโรงพยาบาล

### ขอบเขตและข้อกำหนดความปลอดภัย (Phase 1 Final Hardening):
1. **ระบบเริ่มต้นที่หน้าล็อกอินเสมอ:** `currentUser` เริ่มต้นเป็น `null` เพื่อให้ผู้ตรวจรับต้องเลือกบทบาทจำลองก่อนเข้าสู่ระบบ
2. **ระบบจำลอง 100% (Strict Mock Mode):** มี API Client Layer (`src/services/directoryApi.ts`) ที่แยก `MockDirectoryApi` และ `HttpDirectoryApi` อย่างชัดเจน โดยค่าเริ่มต้นเป็น `MockDirectoryApi` เสมอ
3. **การป้องกัน Production ปราศจาก Override (Zero Override):** ตัดสิทธิ์การเปิด Unauthenticated Mock API ใน Production ทั้งหมด (`Program.cs` ปฏิเสธทันทีด้วย HTTP 403 `PRODUCTION_MOCK_FORBIDDEN` ยกเว้นเฉพาะ `/api/health`)
4. **ความปลอดภัยของคำสั่งแก้ไข AD (Zero AD Write Safety):** ปุ่ม Create User, Edit User, Disable User, Unlock Account, Reset Password, และ Group Membership Changes ถูกล็อกไว้อย่างปลอดภัย โดยแสดง `ActionPlannedModal` ที่ระบุชัดเจนว่า Planned for Phase 4 โดยไม่มีการส่งคำสั่งแก้ไขหรือแสดงผลสำเร็จปลอม
5. **UI รองรับภาษาไทย Responsive และครบทุกสถานะ:** แสดงผล Loading Spinner, ข้อมูลว่าง (Empty State พร้อมปุ่มล้างตัวกรอง), หน้าต่างข้อผิดพลาด (Error State พร้อมปุ่ม Retry), HTTP 403 (Demo RBAC), HTTP 404 และ 401 Session Expired อย่างสมบูรณ์
6. **Mobile Navigation:** มีปุ่มเปิด/ปิดเมนูบนอุปกรณ์มือถือ (Hamburger Drawer) พร้อมฉากหลัง Backdrop และการปิดเมนูอัตโนมัติเมื่อเลือกหน้า
7. **Session Expiration จำลองที่ทดสอบได้จริง:** มีระบบนับเวลาถอยหลัง (ค่าเริ่มต้น 15 นาที) พร้อมปุ่มต่อเวลา, จำลองหมดอายุใน 5 วินาที, หรือบังคับหมดอายุทันที เพื่อให้ผู้ตรวจรับทดสอบได้โดยไม่ต้องรอหลายชั่วโมง
8. **Keyboard Accessibility:** รองรับปุ่ม `Escape` ในการปิดหน้าต่าง Drawer, Modals, และ Error Screens พร้อม Focus Ring ตามมาตรฐานความปลอดภัย

---

## 2. โครงสร้างโปรเจกต์ (Repository Structure)
```
├── .github/
│   └── workflows/
│       └── ci.yml                        # GitHub Actions CI Workflow (.NET 8 & Node.js 22)
│
├── src/                                  # React Frontend Application (Vite 8 + Tailwind CSS 4)
│   ├── app/                              # Root App Entry
│   ├── components/                       # Shared UI Components (Header, Sidebar, DemoBanner, ActionPlannedModal)
│   ├── features/                         # 11 Core Features & Error Previews
│   │   ├── auth/                         # Demo Login with 5 Role Presets
│   │   ├── dashboard/                    # Overview Metrics & Service Status
│   │   ├── users/                        # User directory, filters, sort, pagination & error retry
│   │   ├── computers/                    # Computer list, filters & lastLogonTimestamp notice
│   │   ├── ous/                          # Hierarchical OU Tree Browser
│   │   ├── groups/                       # Security & Distribution Groups & Member Modal
│   │   ├── audit/                        # Structured Audit Trail
│   │   ├── settings/                     # Architecture Option A & TBD Checklist
│   │   └── errors/                       # 403 (Demo RBAC), 404, and 401 Session Expired
│   ├── mocks/                            # Synthetic Hospital Mock Data (8 users, 6 computers, etc.)
│   ├── services/                         # IDirectoryApi, MockDirectoryApi, HttpDirectoryApi, Client Factory
│   ├── types/                            # Typed Entity & DTO Contracts
│   └── utils/                            # thaiDate.ts, rbac.ts (Centralized RBAC Rules)
│
├── tests/                                # Automated Unit & Contract Test Suite (49 tests passing)
│   ├── contractIntegration.test.ts       # API Contract, Query Params, Headers, Timeout, Health & Error (8 tests)
│   ├── sessionExpiration.test.ts         # Session lifecycle, warning threshold, fast simulation (7 tests)
│   ├── rbac.test.ts                      # Demo RBAC Matrix Tests (11 tests)
│   ├── mockApi.test.ts                   # Mock API Operation Tests (11 tests)
│   ├── pagination.test.ts                # Pagination & Sorting Tests (4 tests)
│   ├── inputValidation.test.ts           # Input Sanitization & Boundary Tests (6 tests)
│   └── writeOperationsDisabled.test.ts   # AD Write Operations Lock Tests (2 tests)
│
├── backend/                              # ASP.NET Core Solution (C# .NET 8)
│   ├── SamchukHospital.AdManagement.sln
│   ├── src/
│   │   ├── Api/                          # Web API Controllers, Program.cs, Security Policies, Configs
│   │   │   ├── Controllers/              # Users, Computers, Groups, Ous, Dashboard, Audit, Health
│   │   │   ├── Security/                 # AuthorizationPolicies.cs, DemoAuthenticationHandler.cs
│   │   │   ├── Models/                   # ApiErrorResponse DTO
│   │   │   ├── appsettings.Development.json
│   │   │   ├── appsettings.Test.json
│   │   │   └── appsettings.Production.json
│   │   ├── Application/                  # Interfaces, Queries, DTOs, PagedResult
│   │   ├── Domain/                       # Entities (AdUser, AdComputer, etc.), Enums (UserRole, UAC)
│   │   └── Infrastructure/               # Mock Reader, LDAPS Skeleton (Disabled), Permanent Audit Design
│   │       ├── Directory/                # LdapsReadService.cs (TLS & Hostname Verification)
│   │       └── Audit/                    # InMemoryAudit, PermanentAuditRepositoryDesign, AuditSanitizer
│   └── tests/
│       └── SamchukHospital.AdManagement.Tests/ # xUnit Unit Tests for User Filtering
│
├── shared-contracts/
│   └── api-spec.json                     # OpenAPI 3.0 Specification
├── docs/                                 # Architectural Documentation
│   ├── SECURITY.md                       # Security Policies & Boundary Details
│   ├── AD_INTEGRATION_PLAN.md            # Phased Migration Plan (Phase 1 -> 4)
│   ├── DEPLOYMENT_CHECKLIST.md           # Infrastructure Team Checklist
│   └── DECISIONS_AND_TBD.md              # Decision Matrix & TBD Parameters
│
├── .env.example                          # Environment Variables Example (No Secrets)
├── package-lock.json                     # Deterministic Dependency Lockfile for npm ci
└── README.md                             # Project Documentation
```

---

## 3. สิทธิ์การใช้งานจำลอง (Demo Roles)
ระบบรองรับการสลับบทบาท 5 ระดับ เพื่อทดสอบ Role-Based Access Control (RBAC):
1. **Viewer (ผู้เข้าชม):** ดูแดชบอร์ดภาพรวมและผู้ใช้ทั่วไป (ถูกปฏิเสธเมื่อเข้า Audit หรือ Settings ด้วยรหัส 403)
2. **Helpdesk (เจ้าหน้าที่สนับสนุน):** ดูข้อมูลผู้ใช้ คอมพิวเตอร์ และผังหน่วยงาน (ถูกปฏิเสธเมื่อเข้า Settings ด้วยรหัส 403)
3. **ADOperator (ผู้ดูแลปฏิบัติการ):** ตรวจสอบโครงสร้างกลุ่มสิทธิ์, หน่วยงาน และ Settings (ถูกปฏิเสธเมื่อเข้า Audit ด้วยรหัส 403)
4. **SecurityAuditor (ผู้ตรวจสอบความปลอดภัย):** วิเคราะห์ Audit Logs และสิทธิ์ความปลอดภัย
5. **SystemAdministrator (ผู้ดูแลระบบสูงสุด):** สิทธิ์เข้าถึงทุกหน้าในโหมดอ่าน

---

## 4. รายงานผลการทดสอบ (Test Execution Status)

| หมวดการทดสอบ | รายการทดสอบ | สถานะ | ผลการรัน |
| :--- | :--- | :---: | :--- |
| **Contract & Integration** | `tests/contractIntegration.test.ts` | **PASSED** (8/8) | ตรวจสอบ HttpDirectoryApi, Query Params, Headers, Timeout, Health, Error Parsing |
| **Session Lifecycle** | `tests/sessionExpiration.test.ts` | **PASSED** (7/7) | ตรวจสอบวงรอบเซสชัน 15 นาที, Warning threshold < 60s, จำลองเร็ว 5s, Re-auth reset |
| **RBAC Unit Tests** | `tests/rbac.test.ts` | **PASSED** (11/11) | ตรวจสอบสิทธิ์ 5 บทบาทครอบคลุม 7 หน้าเมนู |
| **Mock API Tests** | `tests/mockApi.test.ts` | **PASSED** (11/11) | ดึงข้อมูลสรุป, กรองผู้ใช้, ตรวจสอบคอมพิวเตอร์, OU, กลุ่ม, Audit |
| **Pagination Tests** | `tests/pagination.test.ts` | **PASSED** (4/4) | คำนวณขนาดหน้า, หน้านอกขอบเขต, เรียงลำดับ asc/desc |
| **Validation Tests** | `tests/inputValidation.test.ts` | **PASSED** (6/6) | การตัด whitespace, case-insensitivity, ตัวกรองไม่ระบุ |
| **Security Lock Tests** | `tests/writeOperationsDisabled.test.ts`| **PASSED** (2/2) | ล็อกห้ามมีฟังก์ชันเขียนหรือแก้ไขใน API Contract |
| **Dependency Audit** | `npm ci` | **PASSED** | ติดตั้ง 95 แพ็กเกจ ตรวจสอบ 95 แพ็กเกจ พบช่องโหว่ 0 |
| **Frontend Lint** | `npm run lint` (`tsc --noEmit`) | **PASSED** | ผ่าน Typecheck 100% ไม่มีข้อผิดพลาด |
| **Frontend Build** | `npm run build` (Vite 8) | **PASSED** | คอมไพล์ Static Bundle สำเร็จ |
| **Backend Tests** | `dotnet restore / build / test` | **NOT EXECUTED LOCALLY** | สภาพแวดล้อมคอนเทนเนอร์ปัจจุบันไม่มีโปรแกรม `dotnet` ติดตั้งอยู่<br>*(ทดสอบผ่าน GitHub Actions CI ใน `.github/workflows/ci.yml` บน ubuntu-latest)* |

**สรุปยอดรวมผลการทดสอบอัตโนมัติฝั่ง Frontend/Contract:** 49 ผ่าน / 0 ไม่ผ่าน (100% Success)

---

## 5. วิธีการติดตั้งและรันในสภาพแวดล้อมจริง (Run Locally)

### 5.1 Frontend (React + Vite + Tailwind CSS)
```bash
# ติดตั้ง dependencies ผ่าน lockfile
npm ci

# รัน Automated Unit & Contract Tests (49 tests)
npm test

# รัน Development Server (Port 3000)
npm run dev

# คอมไพล์และตรวจสอบโค้ด
npm run build
npm run lint
```

### 5.2 Backend (ASP.NET Core Web API)
*(ต้องมี .NET 8.0 SDK บนเครื่องเป้าหมายหรือ Application Server)*
```bash
cd backend
dotnet restore
dotnet build
dotnet test tests/SamchukHospital.AdManagement.Tests/SamchukHospital.AdManagement.Tests.csproj
dotnet run --project src/Api/SamchukHospital.AdManagement.Api.csproj
```

---

## 6. ข้อจำกัดของ Google AI Studio และการเตรียมความพร้อมขึ้น Phase 2
1. **ข้อจำกัดของ Google AI Studio:**
   - โครงสร้าง Frontend ต้องอยู่ที่ Root Directory (`/src`, `/index.html`, `/package.json`) เพื่อให้ Dev Server ของ AI Studio บนพอร์ต 3000 ทำงานได้สมบูรณ์ หากย้ายไปที่ `frontend/` ระบบแสดงผลสดของคอนเทนเนอร์จะไม่ทำงาน
   - คอนเทนเนอร์ของ AI Studio ไม่มี .NET 8 SDK ติดตั้งอยู่ภายใน จึงรัน `dotnet` ในเครื่องนี้ไม่ได้ โดยความถูกต้องของโค้ด C# และ Build ถูกรับประกันผ่าน GitHub Actions CI Workflow
2. **สิ่งที่ต้องเตรียมพร้อมก่อนเปิดใช้งานจริงใน Phase 2:**
   - รายละเอียด Hostname, Fixed IP และใบรับรอง TLS ของ Application Server
   - ใบรับรอง Enterprise Root CA Chain ของโรงพยาบาลสามชุก สำหรับติดตั้งใน Trust Store
   - บัญชีบริการ `svc_ad_mgmt_ro` ใน AD ที่มีสิทธิ์เฉพาะอ่านออบเจกต์ใน OU เท่านั้น
   - การเปิดพอร์ตไฟร์วอลล์ TCP 636 ไปยัง Domain Controller `10.2.0.22` โดยไม่ผ่าน FortiGate Captive Portal
