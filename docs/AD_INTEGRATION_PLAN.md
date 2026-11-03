# Samchuk Hospital AD Management — Active Directory Integration Plan

## 1. Environment Overview
- **Domain Controller OS:** Windows Server 2025
- **Reference IP:** `10.2.0.22` (Designation only, non-hardcoded)
- **Root OU:** `OU=Samchuk Hospital,DC=samchuk,DC=local`
- **Application Server:** Independent host running ASP.NET Core Web API behind reverse proxy.

---

## 2. Phased Development Gates

### Phase 1: Mock-Only & Architecture (CURRENT)
- Interactive, responsive Thai-language web portal with synthetic mock data.
- Typed client contracts (`IDirectoryApi`, `MockDirectoryApi`).
- Complete ASP.NET Core backend solution source code with Clean Architecture (`Api`, `Application`, `Domain`, `Infrastructure`, `Tests`).
- Clear visual indicators of **DEMO / MOCK DATA** throughout the UI.
- All write operations visibly disabled with explanation modal.

### Phase 2: Live Read-Only Diagnostics (Pending Approval & Prerequisites)
- Validate Application Server OS, IP, DNS, and TLS certificates.
- Install hospital Root CA chain onto Application Server trust store.
- Create dedicated read-only service account (e.g., `svc_ad_mgmt_ro`) with minimal rights.
- Test LDAPS handshake (`10.2.0.22:636`) using `System.DirectoryServices.Protocols` with strict certificate validation.
- Enable live read-only querying behind a feature flag.

### Phase 3: Production Auth & Hardening
- Enterprise MFA authentication for system operators.
- Permanent audit database (PostgreSQL or SQL Server) with write-once/immutable policies.
- Session timeout, CSRF mitigation, and TLS certificate rotation automation.
- Load testing and LDAP paging benchmarks (pageSize 100-500) to ensure zero impact on Domain Controller CPU.

### Phase 4: Delegated Write Operations (Separate Explicit Approval)
- Grant delegated rights strictly on designated departmental OUs (`OU=Nursing`, `OU=Administration`).
- Built-in protected accounts (`Administrator`, `Domain Admins`, `Schema Admins`, DC objects) remain completely excluded.
- Dual-Approval workflow for account unlock and password reset operations.
- Full backup, directory snapshot, and disaster rollback verification before any write operations.
