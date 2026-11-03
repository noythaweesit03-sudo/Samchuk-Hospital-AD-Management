# Samchuk Hospital AD Management — Google AI Studio Master Prompt

Version: 1.0 | 3 November 2026 | Scope: **AD Management only**

## 1. Role and objective
Act as a senior enterprise full-stack engineer and Windows Active Directory security architect. Build a maintainable, Thai-language internal **Samchuk Hospital AD Management** web application. The project has **not yet been created**: start a new project, do not attempt to migrate an existing app. Prioritize correct architecture and safe implementation over speed. Explain limitations honestly; do not claim live AD integration works without actual tests.

## 2. Confirmed environment and boundaries
- AD Domain Controller: Windows Server 2025; known internal address `10.2.0.22` (for architecture documentation only; **do not hardcode** in source code).
- Web app and backend must be hosted on a **separate Application Server**, not on the Domain Controller. Its OS, hostname, IP, TLS endpoint, ports, AD DNS domain/forest, certificate, service identity, and hosting environment are **TBD**.
- **Independent backend**: do not integrate with or modify Samchuk Hospital Central API Gateway, IIS frontend 3001/backend 3002, Procurement, Sam_Att, Cash_Cheque, DHCP, FortiGate, VPN or firewall policy. Do not assume the independent app uses 3001/3002; propose endpoint/port choices only after inspecting hosting constraints.
- **Out of scope**: Internet Login Portal, Captive Portal, FortiGate integration, network access control, VPN, SSO for other applications.
- Never send real credentials, user lists, tokens, certificate private keys, or hospital confidential information to Google AI Studio, GitHub, or logs.

## 3. Technology decisions
- Frontend: React, TypeScript (strict), Vite, Tailwind CSS, accessible components; responsive Thai-first UI.
- Backend: ASP.NET Core Web API (current supported LTS version compatible with chosen server), C#, dependency injection, typed DTOs, OpenAPI, structured audit events.
- AD connector: `System.DirectoryServices.Protocols` for read-only LDAPS queries with proper TLS certificate validation; avoid browser LDAP. Actual connection is disabled until reviewed and configured.
- Database: abstract audit repository; select SQL Server or PostgreSQL only after deployment decision. Use an in-memory mock repository for phase 1. Never use a database as the authoritative copy of AD users/groups.
- Prefer same-origin frontend/API via a controlled reverse proxy; secure cookies and server-side sessions where feasible; do not store privileged bearer tokens in localStorage.
- Use separate folders and independent configuration, build, test, and deployment scripts.

## 4. Phase 1 — implement now (mock-only)
Create a fully navigable, realistic UI with clearly labeled **DEMO / MOCK DATA** indicator, using synthetic names and no real hospital personnel. All backend operations must be simulated and non-persistent. Do not connect to a real AD server or create any write-capable LDAP/PowerShell operations.

Pages:
1. **Admin Login**: attractive Thai-language login screen; demo authentication only, conspicuously labeled; demo roles. Do not pretend demo login validates AD or MFA.
2. **Dashboard**: total/enabled/disabled/locked users, computers, groups, OUs, mock service status; show last refresh and source label.
3. **Users**: searchable, sortable, paginated list; details with account state, UPN, display name, department, OU, group memberships. UI for create/edit/disable/unlock/reset password must be visibly **disabled / planned**, not functional against AD.
4. **Computers**: searchable list, OS, OU, account enabled state, last-logon field explicitly labeled approximate/unknown as appropriate; never assert online status from lastLogonTimestamp.
5. **Organizational Units**: expandable tree, breadcrumb and details, read-only.
6. **Groups**: list, type/scope, details, members, nested-group indicator, read-only.
7. **Audit Logs**: demo events, actor, action, target, UTC timestamp, result, request ID; never record passwords or secrets.
8. **Settings / Connectivity**: configuration status only, real connection disabled; clear TBD checklist.
9. **Forbidden / Not Found / Session Expired** screens.

UX: sidebar, mobile navigation, loading/error/empty states, skeletons, confirmation design previews, Thai date/time formatting with unambiguous timezone, keyboard accessibility, high-contrast styling, dark/light mode optional. Search and pagination should work on synthetic data. No false success toasts for real AD operations.

## 5. Architecture and contracts
Produce a repository structured approximately as:
```
frontend/
  src/{app,components,features,services,mocks,types}
backend/
  src/{Api,Application,Domain,Infrastructure}
  tests/
shared-contracts/
docs/
README.md
.env.example
.gitignore
```
The frontend uses a typed `DirectoryApi` interface; implement `MockDirectoryApi` now and reserve `HttpDirectoryApi` for later. The backend defines interfaces such as `IDirectoryReadService`, `IDirectoryWriteService` (not registered/enabled), `IAuditLogRepository`, and `ICurrentUser`. Do not add actual write endpoints in phase 1. Use mock API endpoints for dashboard/users/computers/OUs/groups with pagination, filter validation, consistent errors and request IDs.

Sample future read-only routes (may adjust consistently):
- `GET /api/health` (do not expose secrets)
- `GET /api/dashboard/summary`
- `GET /api/users`, `GET /api/users/{id}`
- `GET /api/computers`, `GET /api/computers/{id}`
- `GET /api/ous/tree`, `GET /api/ous/{id}`
- `GET /api/groups`, `GET /api/groups/{id}`
- `GET /api/audit` (admin-only)

Use stable opaque IDs and safe encoded paths, not arbitrary LDAP filters or raw distinguished names in URLs. Server must enforce authorization regardless of hidden UI buttons. Avoid LDAP injection by using safe, validated filters/escaping and least-privilege directory searches.

## 6. Security requirements for future live deployment (design now, do not activate)
- Authenticate admins through an approved AD-backed identity mechanism; verify actual integration approach and MFA availability before coding production login. Do not invent an MFA provider or claim MFA is active.
- Admin UI accessible only from an approved IT network/VPN; strong MFA, account lockout/rate limits, session timeout, CSRF defenses for cookie auth, security headers, TLS, and strict CORS.
- Define roles: `Viewer`, `Helpdesk`, `ADOperator`, `SecurityAuditor`, `SystemAdministrator`. All rights checked server-side; deny by default. Keep domain privileged accounts outside web-based operations.
- Dedicated read-only AD service identity initially. For future writes, delegate narrow rights only on explicitly approved test OUs; never use Domain Admin or Enterprise Admin as app service identity.
- LDAPS TLS with verified CA chain and hostname; do not disable certificate validation. Validate Windows Server 2025 LDAP signing/channel-binding requirements for actual deployment.
- Immutable/append-only audit strategy with restricted access and retention policy TBD. Log request IDs, actor, target, outcome, timestamp; no passwords, credentials or session secrets.
- Allowlist permitted OUs and actions for future write phase; protected accounts/groups, privileged group membership, GPO, domain settings, DC objects, mass delete, and destructive actions remain out of scope unless separately approved.
- Do not provide dangerous 'test connection' actions that modify AD, FortiGate, firewall, or DHCP.
- Backups and restore testing are prerequisites for any production writes.

## 7. Development phases and gates
**Phase 1 (NOW):** Mock-only UI + typed contracts + optional mock backend + unit tests. No real network integration, no AD credentials, no write endpoints. Deliver a usable preview.
**Phase 2 (after review):** Verify Application Server, DNS, DC health, certificate, LDAPS and network routes with read-only diagnostics. Add live read-only AD adapter behind feature flag; enforce roles and audit; test against a non-production/test directory or approved read-only production scope.
**Phase 3 (after security sign-off):** Production authentication with verified MFA and deployment hardening; validate read-only functionality, paging, performance, audit and rollback.
**Phase 4 (separate explicit approval):** Narrowly delegated create/edit/disable/unlock/group changes on test OUs, dual approval for high-risk changes, end-to-end auditing, backup/restore and rollback. Password reset workflows require extra controls and must not be assumed safe.

## 8. Quality and acceptance criteria
- Project builds cleanly; no TypeScript errors, no fake/unimplemented buttons presented as working.
- Every menu works with mock data; search/filter/pagination and details are functional.
- Clear demo labels throughout; no misleading production login or live data claims.
- API contract documented with example request/response and error semantics.
- Unit tests for permissions, filtering/pagination, and input validation; basic frontend tests.
- `README.md` with local setup, development commands, architecture, environment variable descriptions, and explicit mock limitations.
- `docs/SECURITY.md`, `docs/AD_INTEGRATION_PLAN.md`, `docs/DEPLOYMENT_CHECKLIST.md`, `docs/DECISIONS_AND_TBD.md`.
- `.env.example` contains placeholders only, no live IP/credentials/secrets; real environment files excluded from git.
- Do not add FortiGate, Captive Portal, Internet Login, VPN, or Central Gateway code.

## 9. Instructions to Google AI Studio
First, restate the architecture and scope in Thai, list unknown deployment details as **TBD**, and present the intended folder structure. Then implement **Phase 1 only** with complete files and working preview. If the platform cannot compile/run ASP.NET Core, still generate a separate backend project as source files and explicitly say it is untested until built on a suitable .NET environment; never silently replace it with Node.js. Avoid unnecessary libraries and avoid implementing real AD write operations. At completion, report what is implemented, what is mocked, what is untested, and exact commands to build/test locally. Ask before proceeding to Phase 2.
