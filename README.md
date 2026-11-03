# Samchuk Hospital Active Directory Management (โรงพยาบาลสามชุก)

> **Phase 1: Mock-Only Architecture & Demonstration**  
> สถานะ: **โหมดสาธิต (Synthetic Mock Data Only)** — เริ่มต้นที่หน้า Demo Login เสมอ ไม่มีการเชื่อมต่อ Active Directory จริง และไม่มีการเชื่อมต่อกับ FortiGate / Internet Login

---

## 1. ภาพรวมโครงการ (Project Overview)
ระบบบริหารจัดการ Active Directory สำหรับโรงพยาบาลสามชุก จังหวัดสุพรรณบุรี ออกแบบเพื่อรองรับการตรวจสอบและบริหารไดเรกทอรีภายใน (Windows Server 2025) บนเซิร์ฟเวอร์แอปพลิเคชันอิสระ (Independent Application Server)

### ขอบเขตและข้อกำหนดความปลอดภัย (Phase 1 Boundaries):
- **ระบบเริ่มต้นที่หน้าล็อกอินเสมอ:** `currentUser` เริ่มต้นเป็น `null` เพื่อให้ผู้ตรวจรับต้องเลือกบทบาทจำลองก่อนเข้าสู่ระบบ
- **ระบบจำลองเท่านั้น:** ข้อมูลทั้งหมดเป็นข้อมูลสังเคราะห์ (Synthetic Data) ไม่มีการดึงหรือเขียนข้อมูลจริง
- **การจำลองสิทธิ์ Demo RBAC:** ตรวจสอบสิทธิ์แบบรวมศูนย์ (`src/utils/rbac.ts`) แสดงหน้าจอ HTTP 403 Forbidden ชัดเจน พร้อมระบุว่าเป็นการจำลองสิทธิ์ ไม่ใช่ Production Authentication
- **ห้ามเปิด API Mock สู่เครือข่าย Production:** มีมิดเดิลแวร์ตรวจจับใน `Program.cs` ป้องกันไม่ให้ Mock API ที่ไม่มีการยืนยันตัวตนถูกเรียกใช้งานในสภาพแวดล้อม Production
- **ไม่มีการเขียนข้อมูล AD:** คำสั่งสร้าง แก้ไข ระงับ ปลดล็อก หรือรีเซ็ตรหัสผ่านถูกจำกัดไว้สำหรับ Phase 4
- **แยกอิสระจากระบบเดิม:** ไม่เชื่อมต่อกับ Samchuk Central Gateway, IIS 3001/3002, Procurement, Sam_Att, Cash_Cheque, DHCP หรือ FortiGate Captive Portal
- **ไม่บันทึกความลับ:** บันทึกการตรวจสอบ (Audit Trail) ไม่มีข้อมูลรหัสผ่านหรือความลับใดๆ ทั้งสิ้น

---

## 2. โครงสร้างโปรเจกต์ (Repository Structure)
```
├── .github/
│   └── workflows/
│       └── ci.yml                        # GitHub Actions CI Workflow (.NET 8 & Node.js 22)
│
├── src/                                  # React Frontend Application
│   ├── app/                              # Root App Entry
│   ├── components/                       # Shared UI Components (Header, Sidebar, DemoBanner)
│   ├── features/                         # Core Modules
│   │   ├── auth/                         # Demo Login with 5 Role Presets
│   │   ├── dashboard/                    # Overview Metrics & Service Status
│   │   ├── users/                        # User directory, filters & planned actions
│   │   ├── computers/                    # Computer list & lastLogonTimestamp notice
│   │   ├── ous/                          # Hierarchical OU Tree Browser
│   │   ├── groups/                       # Security & Distribution Groups
│   │   ├── audit/                        # Structured Audit Trail
│   │   ├── settings/                     # Architecture & TBD Checklist
│   │   └── errors/                       # 403, 404, and Session Expired Previews
│   ├── mocks/                            # Synthetic Hospital Mock Data (8 users, 6 computers, etc.)
│   ├── services/                         # DirectoryApi Interface & Mock Implementation
│   ├── types/                            # Typed Entity & DTO Contracts
│   └── utils/                            # thaiDate.ts, rbac.ts (Centralized RBAC Rules)
│
├── tests/                                # Automated Unit Test Suite (34 tests passing)
│   ├── rbac.test.ts                      # Demo RBAC Matrix Tests (11 tests)
│   ├── mockApi.test.ts                   # Mock API Operation Tests (11 tests)
│   ├── pagination.test.ts                # Pagination & Sorting Tests (4 tests)
│   ├── inputValidation.test.ts           # Input Sanitization & Boundary Tests (6 tests)
│   └── writeOperationsDisabled.test.ts   # AD Write Operations Lock Tests (2 tests)
│
├── backend/                              # ASP.NET Core Solution (C# Source Files)
│   ├── SamchukHospital.AdManagement.sln
│   ├── src/
│   │   ├── Api/                          # Web API Controllers, Program.cs, Swagger, ApiErrorResponse
│   │   ├── Application/                  # Interfaces, Queries, DTOs, PagedResult
│   │   ├── Domain/                       # Entities (AdUser, AdComputer, etc.), Enums (UserRole, UAC)
│   │   └── Infrastructure/               # Mock Reader, LDAPS Skeleton (Disabled), InMemoryAudit
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

| หมวดการทดสอบ | รายการทดสอบ | สถานะ | รายละเอียด |
| :--- | :--- | :---: | :--- |
| **Frontend Tests** | `tests/rbac.test.ts` | **PASSED** (11/11) | ตรวจสอบสิทธิ์ 5 บทบาทครอบคลุม 7 หน้าเมนู |
| **Frontend Tests** | `tests/mockApi.test.ts` | **PASSED** (11/11) | ดึงข้อมูลสรุป, กรองผู้ใช้, ตรวจสอบคอมพิวเตอร์, OU, กลุ่ม |
| **Frontend Tests** | `tests/pagination.test.ts` | **PASSED** (4/4) | คำนวณขนาดหน้า, หน้านอกขอบเขต, เรียงลำดับ asc/desc |
| **Frontend Tests** | `tests/inputValidation.test.ts` | **PASSED** (6/6) | การตัด whitespace, case-insensitivity, ตัวกรองไม่ระบุ |
| **Frontend Tests** | `tests/writeOperationsDisabled.test.ts`| **PASSED** (2/2) | ล็อกห้ามมีฟังก์ชันเขียนหรือแก้ไขใน API Contract |
| **Frontend Build** | `npm run lint` (`tsc --noEmit`) | **PASSED** | ผ่าน Typecheck 100% ไม่มีข้อผิดพลาด |
| **Frontend Build** | `npm run build` (Vite) | **PASSED** | คอมไพล์ Static Bundle สำเร็จ |
| **Backend Tests** | `dotnet restore / build / test` | **NOT EXECUTED LOCALLY** | สภาพแวดล้อมคอนเทนเนอร์ปัจจุบันไม่มีโปรแกรม `dotnet` ติดตั้งอยู่<br>*(ตั้งค่าผ่าน GitHub Actions CI ใน `.github/workflows/ci.yml` สำหรับรันบน Server)* |

---

## 5. วิธีการติดตั้งและรันในสภาพแวดล้อมจริง (Run Locally)

### 5.1 Frontend (React + Vite + Tailwind CSS)
```bash
# ติดตั้ง dependencies
npm install

# รัน Automated Unit Tests (34 tests)
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

## 6. การดำเนินการสำหรับ Phase 2
ก่อนดำเนินการเปิดระบบเชื่อมต่อจริง (Live Read-Only) ใน Phase 2 ฝ่ายโครงสร้างพื้นฐานไอทีโรงพยาบาลสามชุกต้องยืนยันข้อมูลใน `docs/DEPLOYMENT_CHECKLIST.md` และส่งมอบ:
1. Application Server Hostname & Fixed IP
2. Enterprise Root CA Chain Certificate
3. บัญชีบริการ `svc_ad_mgmt_ro` ที่มีสิทธิ์อ่านเท่านั้น
4. กฎไฟร์วอลล์พอร์ต TCP 636 ไปยัง DC `10.2.0.22`
