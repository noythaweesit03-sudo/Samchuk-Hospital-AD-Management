# Samchuk Hospital AD Management — Security Architecture & Guidelines

Version: 1.2 (Phase 1 Final Hardening & Verification)  
Target: Samchuk Hospital Active Directory Management (Windows Server 2025)  
Architecture: **Option A — Independent AD Management (Isolated Application Server)**

---

## 1. Zero-Write Policy in Phase 1
- **Current State:** The application operates strictly in Read-Only Mock mode.
- **Enforcement:**
  - `IDirectoryWriteService` is purposefully unmapped and unregistered in Dependency Injection.
  - The UI presents write operations (Create, Edit, Disable, Unlock, Reset Password, Group Membership Changes) with clear "Planned for Phase 4" modal dialogs (`ActionPlannedModal`).
  - Automated tests (`tests/writeOperationsDisabled.test.ts`) assert that write operations are absent and strictly blocked.
  - No LDAP modify, add, delete, or modifyDN packets are transmitted to any network endpoint.

---

## 2. Hardened Production Security Guards (No Overrides)
- **Zero Override Allowed:** In non-development environments, unauthenticated access to Phase 1 mock endpoints is **strictly prohibited**.
- The `AllowUnauthenticatedMockInProduction` configuration override has been **completely removed** from code (`Program.cs`) and configuration files (`appsettings.*.json`).
- If an unauthenticated request attempts to call `/api/*` in a production environment, the system immediately terminates the request with `HTTP 403 Forbidden` (`PRODUCTION_MOCK_FORBIDDEN`), exempting only `/api/health` and `/health` for uptime monitoring.

---

## 3. Authentication and Authorization (Demo RBAC vs Phase 2/3)
### Phase 1 Demo RBAC:
- Starts at the Demo Login page (`currentUser = null`).
- Centralized rule engine (`src/utils/rbac.ts`) evaluates page transitions.
- Displays HTTP 403 Forbidden with clear badge: `"การจำลองสิทธิ์ในโหมดสาธิต (Demo RBAC Simulation) — ยังไม่ใช่ Production Authentication"`.
- Simulated session lifecycle includes active countdown timer (default 15 minutes) with test simulation controls (5s fast test, immediate expiration) to allow verification without waiting hours.
- Covers 5 role tiers:
  1. **Viewer:** Read-only access to basic dashboard metrics, users, computers, groups, and OUs.
  2. **Helpdesk:** User lookups, employee ID, telephone numbers, and computer basic status.
  3. **ADOperator:** Organizational Units, directory hierarchy, group memberships, and settings.
  4. **SecurityAuditor:** Read-only access to immutable audit trails, role distributions, and security group memberships.
  5. **SystemAdministrator:** Full administrative visibility across all modules.

### Development/Test Mock Authorization:
- In Development and Test environments, `DemoAuthenticationHandler` inspects `X-Demo-User` and `X-Demo-Role` headers to enable automated test host verification.
- **Fail-Closed Guard:** `DemoAuthenticationHandler` explicitly fails closed if invoked in a Production environment.
- Controllers are annotated with `[Authorize(Policy = AuthorizationPolicies.ViewerOrAbove)]`, `[Authorize(Policy = AuthorizationPolicies.SecurityAuditorOrAbove)]`, etc.

### Phase 2/3 Production Authentication Architecture:
- ASP.NET Core endpoints are designed for Windows Authentication (Negotiate / Kerberos) on the internal hospital network or OpenID Connect (OIDC) JWT Bearer authentication from the Hospital Identity Provider.
- Claims transformation service maps internal security groups to application `UserRole` claims.
- The system will enforce server-side `[Authorize(Policy = "...")]` policies.

---

## 4. Network and Boundary Isolation (Architecture Option A)
- **Domain Controller:** Windows Server 2025 (Reference IP `10.2.0.22` for architecture planning only, not hardcoded).
- **Separation from Hospital Core Systems:**
  - **No integration** with Samchuk Hospital Central API Gateway.
  - **No modification** of IIS frontend port 3001 or backend port 3002.
  - **No integration** with Procurement, Sam_Att, Cash_Cheque, or DHCP.
  - **No FortiGate Integration:** Internet login portals, captive portals, VPN policy, and firewall authentications are strictly excluded.

---

## 5. LDAPS Protocol & TLS Chain of Trust
- Active Directory communication will only occur over **LDAPS (TCP Port 636)**.
- Insecure LDAP (TCP Port 389) without channel binding is prohibited.
- `LdapsReadService` strictly enforces:
  1. **Certificate Chain Validation:** `X509Chain` validation against Samchuk Hospital Root CA with revocation checks (`RevocationMode = Online`).
  2. **Strict Hostname Verification:** Validates that the certificate Common Name or Subject Alternative Name (SAN) matches the target Domain Controller host.
  3. Hardcoded security gate `_isLiveAdEnabled = false` keeps network sockets and binds disabled during Phase 1.

---

## 6. Permanent Audit Logging Architecture & Sanitization
- Located in `backend/src/Infrastructure/Audit/PermanentAuditRepositoryDesign.cs`.
- Compliant with Hospital Accreditation (HA) Information Security Standards and PDPA Thailand.
- Immutable / Write-Once database table (`AdAuditLogs`) with SQL Server trigger (`TR_AdAuditLogs_PreventUpdateDelete`) preventing `UPDATE` or `DELETE`.
- Supported DBMS: Microsoft SQL Server 2019/2022 and PostgreSQL 15/16.
- **AuditSanitizer:** Cleanses all incoming payloads, redacting passwords, tokens, hashes, and secrets (`[REDACTED_BY_AUDIT_POLICY]`) prior to storage.
- Log record schema: `Id`, `CorrelationId`, `TimestampUtc`, `ActorUsername`, `ActorRole`, `ClientIp`, `UserAgent`, `Action`, `TargetObject`, `TargetType`, `Result`, `Reason`, `SanitizedDetailsJson`.
