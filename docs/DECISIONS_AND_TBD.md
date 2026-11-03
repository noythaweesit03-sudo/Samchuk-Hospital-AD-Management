# Samchuk Hospital AD Management — Architecture Decisions & TBD Matrix

| Item | Decision / Current State (Phase 1) | Planned Approach for Future Phase | Owner / TBD |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React 19, TypeScript (strict), Vite, Tailwind CSS 4 | Production static bundle served via NGINX or IIS | Frontend Team |
| **Backend Framework** | ASP.NET Core 8 Web API, C#, Clean Architecture | Run as Windows Service or systemd daemon | Backend Team |
| **Domain Controller** | Windows Server 2025 (Reference: `10.2.0.22`) | Read-only LDAPS queries via `System.DirectoryServices.Protocols` | Server Team (TBD) |
| **LDAP Port & Security** | LDAPS Port 636 with TLS Certificate Validation | Mandatory TLS validation; Insecure LDAP 389 rejected | Security Team (TBD) |
| **Audit Repository** | In-Memory Mock Repository (`InMemoryAuditLogRepository`) | Dedicated relational database (SQL Server or PostgreSQL) | Database Team (TBD) |
| **Authentication** | Synthetic Mock Login with 5 demo roles | Enterprise Active Directory Auth + Mandatory MFA | Security Team (TBD) |
| **Write Operations** | Zero-write policy; disabled in Phase 1 | Delegated write with dual approval in Phase 4 | Hospital Director (TBD) |
| **FortiGate / Network Login** | Explicitly out of scope; no integration | Maintained outside AD Management portal | Network Team |
| **Central API Gateway** | Independent application; no gateway coupling | Retains independent isolated lifecycle | Systems Architect |
