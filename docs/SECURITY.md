# Samchuk Hospital AD Management — Security Architecture & Guidelines

Version: 1.1 (Phase 1 Code Review & Hardening)  
Target: Samchuk Hospital Active Directory Management (Windows Server 2025)

---

## 1. Zero-Write Policy in Phase 1
- **Current State:** The application operates strictly in Read-Only Mock mode.
- **Enforcement:**
  - `IDirectoryWriteService` is purposefully unmapped and unregistered in Dependency Injection.
  - The UI presents write operations (Create, Edit, Disable, Unlock, Reset Password) with clear "Planned for Phase 4" modal dialogs.
  - Automated tests (`tests/writeOperationsDisabled.test.ts`) assert that write operations are absent and strictly blocked.
  - No LDAP modify, add, delete, or modifyDN packets are transmitted to any network endpoint.

---

## 2. Authentication and Authorization (Demo RBAC vs Phase 2/3)
### Phase 1 Demo RBAC:
- Starts at the Demo Login page (`currentUser = null`).
- Centralized rule engine (`src/utils/rbac.ts`) evaluates page transitions.
- Displays HTTP 403 Forbidden with clear badge: `"การจำลองสิทธิ์ในโหมดสาธิต (Demo RBAC Simulation) — ยังไม่ใช่ Production Authentication"`.
- Covers 5 role tiers:
  1. **Viewer:** Read-only access to basic dashboard metrics and user listings.
  2. **Helpdesk:** User lookups, employee ID, telephone numbers, and computer basic status.
  3. **ADOperator:** Organizational Units, directory hierarchy, group memberships, and settings.
  4. **SecurityAuditor:** Read-only access to immutable audit trails, role distributions, and security group memberships.
  5. **SystemAdministrator:** Full administrative visibility across all modules.

### Phase 2/3 Production Authentication Architecture:
- ASP.NET Core endpoints are designed for Windows Authentication (Negotiate / Kerberos) on the internal hospital network or OpenID Connect (OIDC) JWT Bearer authentication from the Hospital Identity Provider.
- Claims transformation service `HospitalAdRoleClaimsTransformation` maps internal security groups to application `UserRole` claims.
- The system will enforce server-side `[Authorize(Roles = "...")]` policies.
- In Phase 1, the backend controllers explicitly document that mock data is returned without production authentication enforcement.

---

## 3. Network and Boundary Isolation
- **Domain Controller:** Windows Server 2025 (Reference IP `10.2.0.22` for architecture planning only, not hardcoded).
- **Separation from Hospital Core Systems:**
  - **No integration** with Samchuk Hospital Central API Gateway.
  - **No modification** of IIS frontend port 3001 or backend port 3002.
  - **No integration** with Procurement, Sam_Att, Cash_Cheque, or DHCP.
  - **No FortiGate Integration:** Internet login portals, captive portals, VPN policy, and firewall authentications are strictly excluded.

---

## 4. LDAPS Protocol & TLS Chain of Trust
- Active Directory communication will only occur over **LDAPS (TCP Port 636)**.
- Insecure LDAP (TCP Port 389) without channel binding is prohibited.
- `LdapsReadService` strictly enforces `X509Chain` validation against Samchuk Hospital Root CA. Disabling TLS validation (`return true`) is strictly forbidden.

---

## 5. Audit Logging Architecture
- All access requests are tracked via opaque Request IDs (e.g. `req-xxxx-xx`).
- Passwords, hashes, Kerberos tickets, and secret tokens are **strictly excluded** from logs.
- Audit entries record UTC timestamp, Thai local time, actor username, assigned role, action type, target DN, outcome, and client IP address.
