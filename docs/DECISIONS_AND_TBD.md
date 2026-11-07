# Samchuk Hospital AD Management — Architecture Decisions & TBD Matrix

## 1. Official Architecture Confirmation
**Decision:** **Architecture Option A — Independent AD Management (Isolated Application Server)**
- The frontend React application and backend ASP.NET Core Web API operate as an independent, self-contained system.
- Zero dependencies on Samchuk Hospital Central API Gateway, IIS ports 3001/3002, Procurement, Sam_Att, Cash_Cheque, DHCP, or FortiGate Captive Portal.
- Isolated process identity, dedicated configuration files, independent security boundary, and segregated audit trail.

---

## 2. Technical Decision & TBD Matrix

| Item | Decision / Current State (Phase 1) | Planned Approach for Future Phase | Owner / TBD |
| :--- | :--- | :--- | :--- |
| **Architecture Topology** | Option A: Independent AD Management (Isolated Host) | Dedicated Windows Server 2022/2025 or IIS site | Systems Architect |
| **Frontend Framework** | React 19, TypeScript (strict), Vite, Tailwind CSS 4 | Production static bundle served via IIS or NGINX | Frontend Team |
| **Backend Framework** | ASP.NET Core 8 Web API, C#, Clean Architecture | Run as IIS In-Process or Kestrel Windows Service | Backend Team |
| **AI Studio Preview Constraint** | Frontend source maintained at `/src` with root `package.json` to allow live Vite preview on port 3000 | In production repository, can build `dist/` or separate submodules | DevOps / Architect |
| **Domain Controller** | Windows Server 2025 (Reference: `10.2.0.22`) | Read-only LDAPS queries via `System.DirectoryServices.Protocols` | Server Team (TBD) |
| **LDAP Port & Security** | LDAPS Port 636 with TLS Certificate & Hostname Validation | Mandatory TLS validation; Insecure LDAP 389 rejected | Security Team (TBD) |
| **Production Mock Guard** | Zero override permitted in Production (`PRODUCTION_MOCK_FORBIDDEN`) | Enterprise Kerberos / OIDC Bearer Authentication | Security Team (TBD) |
| **Audit Repository** | In-Memory Mock Repository (`InMemoryAuditLogRepository`) | Dedicated relational database (SQL Server or PostgreSQL) with immutable trigger | Database Team (TBD) |
| **Authentication** | Synthetic Mock Login with 5 demo roles & active testable session timer | Enterprise Active Directory Auth + Mandatory MFA | Security Team (TBD) |
| **Write Operations** | Zero-write policy; disabled in Phase 1 (`ActionPlannedModal`) | Delegated write with dual approval in Phase 4 | Hospital Director (TBD) |
| **FortiGate / Network Login** | Explicitly out of scope; zero integration | Maintained outside AD Management portal | Network Team |
| **Central API Gateway** | Independent application; no gateway coupling | Retains independent isolated lifecycle | Systems Architect |

---

## 3. Google AI Studio Technical Constraints
1. **Dev Server Port 3000 & Root Directory:** Google AI Studio runs Vite on port 3000 from the repository workspace root (`/app/applet`), resolving `/src` and `/index.html`. Moving the entire frontend to a nested `frontend/` folder in this environment would break AI Studio's container supervisor and development preview. Therefore, the workspace root serves the frontend, while the complete ASP.NET Core solution is cleanly organized in `/backend`.
2. **.NET SDK in AI Studio Container:** The local AI Studio container is based on Node.js 22 and does not provide the `dotnet` CLI binary. Automated backend verification (`dotnet restore`, `dotnet build`, `dotnet test`) is maintained and executed via GitHub Actions CI in `.github/workflows/ci.yml`.
