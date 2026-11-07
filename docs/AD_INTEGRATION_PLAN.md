# Samchuk Hospital AD Management — Active Directory Integration Plan

## 1. Environment & Architecture Overview
- **Architecture:** **Option A — Independent AD Management (Isolated Application Server)**
- **Domain Controller OS:** Windows Server 2025
- **Communication Protocol:** LDAPS over TLS 1.2/1.3 (TCP Port 636 only; Port 389 unencrypted LDAP is strictly prohibited)
- **Current Stage:** **Phase 2A — Offline LDAPS Read-Only Adapter & Connection Readiness Preparation**
- **Strict Boundary:** Zero integration with Samchuk Hospital Central API Gateway, IIS 3001/3002, Procurement, Sam_Att, Cash_Cheque, DHCP, or FortiGate Captive Portal.

---

## 2. Phased Development Gates

### Phase 1: Mock-Only & Architecture Foundation (COMPLETED)
- Interactive, responsive Thai-language web portal with synthetic mock data.
- Typed client contracts (`IDirectoryApi`, `MockDirectoryApi`, `HttpDirectoryApi`).
- ASP.NET Core 8 backend solution with Clean Architecture (`Api`, `Application`, `Domain`, `Infrastructure`, `Tests`).
- Strict Session Expiration lockout and 5-role RBAC enforcement.

### Phase 2A: Offline LDAPS Adapter & Readiness Preparation (CURRENT — STOP GATE)
- Full implementation of `LdapsReadService` (`System.DirectoryServices.Protocols`) supporting read-only queries for Dashboard Summary, Users, User Details, Computers, Computer Details, OUs, Groups, Group Members, UAC Account Status decoding, and `lastLogonTimestamp` FileTime conversion (with explicit 9–14 day replication accuracy limitation note).
- RFC 4515 LDAP Filter Escaping (`LdapFilterSanitizer`), search input length validation, DN syntax validation, LDAP Paging (`PageResultRequestControl`), timeouts, and `CancellationToken` handling.
- Placeholder-only configuration (`ActiveDirectoryOptions`) with `EnableLiveReadOnlyConnection = false` and code-level hard lock (`IsPhase2ACodeGateLocked = true`) preventing activation via config files alone.
- Offline Connection Readiness Diagnostics (`LdapsDiagnosticsService` & `/api/diagnostics/connection-readiness`) reporting `Simulated`, `NotConfigured`, or `NotTested` statuses across 6 readiness checks without opening any live network socket.

### Phase 2B: Live Read-Only LDAPS Verification in Test/Staging (PENDING APPROVAL)
- Requires completion of all 10 items in the **Pre-Phase 2B Checklist** below and formal Security Approval.
- Test live LDAPS read-only connection in an isolated Test/Staging environment first.

### Phase 3: Production Authentication & Permanent Audit Database
- Enterprise Kerberos / OIDC authentication with mandatory MFA.
- Immutable SQL Server / PostgreSQL audit repository (`PermanentAuditRepositoryDesign`).

### Phase 4: Delegated Write Operations (Separate Explicit Approval)
- Strictly scoped delegated permissions on designated departmental OUs with dual approval.

---

## 3. Mandatory Pre-Phase 2B Checklist (10 Items Required Before Phase 2B)

Before unlocking the Phase 2A code gate or attempting any live Domain Controller connection in Phase 2B, the following 10 items must be prepared and verified:

1. **Application Server OS / Hostname / IP:**
   - Provision dedicated Application Server (Windows Server 2022/2025 or Ubuntu LTS) with fixed IP and hostname under Option A.
2. **AD DNS Domain / Forest:**
   - Confirm internal AD DNS domain/forest name and configure Application Server DNS resolvers to resolve hospital internal records.
3. **Domain Controller FQDN:**
   - Replace `__PLACEHOLDER_DC_FQDN__` with the exact FQDN of the Domain Controller matching its TLS certificate Subject Alternative Name (SAN).
4. **Root CA Certificate:**
   - Install Samchuk Hospital Enterprise Root CA and Intermediate CA certificates into the Application Server's Trusted Root Certification Authorities store.
5. **LDAPS Port 636:**
   - Verify LDAPS listener on TCP Port 636 on the target Domain Controller with a valid TLS certificate.
6. **Read-only Service Account:**
   - Create a dedicated least-privilege service account (e.g. read-only user in `Domain Users` with delegated Read access on target OUs only; strictly excluded from `Domain Admins`, `Account Operators`, or write permissions).
7. **Search Base Distinguished Name (DN):**
   - Replace `OU=PLACEHOLDER_ORG_UNIT,DC=placeholder,DC=example` with the verified root Organizational Unit DN of Samchuk Hospital.
8. **Firewall Connectivity:**
   - Permit TCP Port 636 strictly from the Application Server IP to the Domain Controller IP without SSL inspection/interception and without FortiGate Captive Portal dependencies.
9. **Test Environment:**
   - Validate all LDAPS read queries, paging, and certificate chain checks in a non-production Test/Staging environment first.
10. **Security Approval:**
    - Obtain formal written sign-off from Samchuk Hospital IT Security / Hospital Management before transitioning from Phase 2A to Phase 2B.
