# Samchuk Hospital Active Directory Management (โรงพยาบาลสามชุก)

> **Phase 1: Mock-Only Architecture & Demonstration**  
> สถานะ: **โหมดสาธิต (Synthetic Mock Data Only)** — ไม่มีการเชื่อมต่อ Active Directory จริง และไม่มีการเชื่อมต่อกับ FortiGate / Internet Login

---

## 1. ภาพรวมโครงการ (Project Overview)
ระบบบริหารจัดการ Active Directory สำหรับโรงพยาบาลสามชุก จังหวัดสุพรรณบุรี ออกแบบเพื่อรองรับการตรวจสอบและบริหารไดเรกทอรีภายใน (Windows Server 2025) บนเซิร์ฟเวอร์แอปพลิเคชันอิสระ (Independent Application Server)

### ขอบเขตและข้อกำหนดความปลอดภัย (Phase 1 Boundaries):
- **ระบบจำลองเท่านั้น:** ข้อมูลทั้งหมดเป็นข้อมูลสังเคราะห์ (Synthetic Data) ไม่มีการดึงหรือเขียนข้อมูลจริง
- **ไม่มีการเขียนข้อมูล AD:** คำสั่งสร้าง แก้ไข ระงับ ปลดล็อก หรือรีเซ็ตรหัสผ่านถูกจำกัดไว้สำหรับ Phase 4
- **แยกอิสระจากระบบเดิม:** ไม่เชื่อมต่อกับ Samchuk Central Gateway, IIS 3001/3002, Procurement, Sam_Att, Cash_Cheque, DHCP หรือ FortiGate Captive Portal
- **ไม่บันทึกความลับ:** บันทึกการตรวจสอบ (Audit Trail) ไม่มีข้อมูลรหัสผ่านหรือความลับใดๆ ทั้งสิ้น

---

## 2. โครงสร้างโปรเจกต์ (Repository Structure)
```
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
│   ├── mocks/                            # Synthetic Hospital Mock Data
│   ├── services/                         # DirectoryApi Interface & Mock Implementation
│   └── types/                            # Typed Entity & DTO Contracts
│
├── backend/                              # ASP.NET Core Solution (C# Source Files)
│   ├── SamchukHospital.AdManagement.sln
│   ├── src/
│   │   ├── Api/                          # Web API Controllers, Program.cs, Swagger
│   │   ├── Application/                  # Interfaces, Queries, DTOs, PagedResult
│   │   ├── Domain/                       # Entities (AdUser, AdComputer, etc.), Enums
│   │   └── Infrastructure/               # Mock Reader, LDAPS Skeleton (Disabled), Audit
│   └── tests/
│       └── SamchukHospital.AdManagement.Tests/ # Unit Tests for Filtering & Pagination
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
└── README.md                             # Project Documentation
```

---

## 3. สิทธิ์การใช้งานจำลอง (Demo Roles)
ระบบรองรับการสลับบทบาท 5 ระดับ เพื่อทดสอบ Role-Based Access Control (RBAC):
1. **Viewer (ผู้เข้าชม):** ดูแดชบอร์ดภาพรวมและผู้ใช้ทั่วไป (ถูกปฏิเสธเมื่อเข้า Audit หรือ Settings)
2. **Helpdesk (เจ้าหน้าที่สนับสนุน):** ดูข้อมูลผู้ใช้ คอมพิวเตอร์ และผังหน่วยงาน
3. **ADOperator (ผู้ดูแลปฏิบัติการ):** ตรวจสอบโครงสร้างกลุ่มสิทธิ์และหน่วยงานเชิงลึก
4. **SecurityAuditor (ผู้ตรวจสอบความปลอดภัย):** วิเคราะห์ Audit Logs และสิทธิ์ความปลอดภัย
5. **SystemAdministrator (ผู้ดูแลระบบสูงสุด):** สิทธิ์เข้าถึงทุกหน้าในโหมดอ่าน

---

## 4. วิธีการติดตั้งและรันในสภาพแวดล้อมจริง (Run Locally)

### 4.1 Frontend (React + Vite + Tailwind CSS)
```bash
# ติดตั้ง dependencies
npm install

# รัน Development Server (Port 3000)
npm run dev

# คอมไพล์และตรวจสอบโค้ด
npm run build
npm run lint
```

### 4.2 Backend (ASP.NET Core Web API)
*(ต้องมี .NET 8.0 SDK บนเครื่องที่ต้องการทดสอบ)*
```bash
cd backend
dotnet restore
dotnet build
dotnet test tests/SamchukHospital.AdManagement.Tests/SamchukHospital.AdManagement.Tests.csproj
dotnet run --project src/Api/SamchukHospital.AdManagement.Api.csproj
```
*หมายเหตุ: ในสภาพแวดล้อมเบราว์เซอร์ของ AI Studio ระบบ Frontend จะทำงานร่วมกับ `MockDirectoryApi` ซึ่งปฏิบัติตาม Contract เดียวกันกับ ASP.NET Core Web API โดยสมบูรณ์*

---

## 5. การดำเนินการสำหรับ Phase 2
ก่อนดำเนินการเปิดระบบเชื่อมต่อจริง (Live Read-Only) ใน Phase 2 ฝ่ายโครงสร้างพื้นฐานไอทีโรงพยาบาลสามชุกต้องยืนยันข้อมูลใน `docs/DEPLOYMENT_CHECKLIST.md` และส่งมอบ:
1. Application Server Hostname & Fixed IP
2. Enterprise Root CA Chain Certificate
3. บัญชีบริการ `svc_ad_mgmt_ro` ที่มีสิทธิ์อ่านเท่านั้น
4. กฎไฟร์วอลล์พอร์ต TCP 636 ไปยัง DC `10.2.0.22`
