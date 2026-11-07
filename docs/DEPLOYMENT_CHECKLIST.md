# Samchuk Hospital AD Management — Pre-Phase 2B Deployment & Readiness Checklist

This checklist covers all 10 mandatory prerequisites that must be completed and approved before transitioning from **Phase 2A (Offline LDAPS Adapter Ready)** to **Phase 2B (Live Read-Only Verification)**:

## 1. Application Server OS / Hostname / IP
- [ ] Operating System provisioned (Windows Server 2022/2025 or Linux Ubuntu LTS) on an isolated host (Option A)
- [ ] Fixed IP address assigned in hospital server VLAN
- [ ] Application Server Hostname and DNS A-Record registered
- [ ] Reverse Proxy (IIS or NGINX) configured with HTTPS TLS certificate

## 2. AD DNS Domain / Forest
- [ ] Active Directory DNS Domain and Forest names confirmed
- [ ] Application Server configured to use internal AD DNS servers for forward and reverse lookup

## 3. Domain Controller FQDN
- [ ] Target Domain Controller FQDN confirmed (replacing `__PLACEHOLDER_DC_FQDN__`)
- [ ] Verified that DC FQDN matches the DNS Name in the DC TLS Certificate Subject Alternative Name (SAN)

## 4. Root CA Certificate
- [ ] Hospital Enterprise Root CA & Intermediate CA certificates exported (`.cer` / `.crt`)
- [ ] Root CA chain imported into Application Server `LocalMachine\Root` (Trusted Root Certification Authorities)

## 5. LDAPS Port 636
- [ ] LDAPS over TLS 1.2/1.3 enabled and listening on TCP Port 636 on the Domain Controller
- [ ] Unencrypted LDAP Port 389 disabled/unused by the application

## 6. Read-only Service Account
- [ ] Dedicated Read-only Service Account created (replacing `__PLACEHOLDER_READONLY_SERVICE_ACCOUNT__`)
- [ ] Verified account is NOT a member of `Domain Admins`, `Enterprise Admins`, `Account Operators`, or `Server Operators`
- [ ] Password stored in secure OS Secret Store / Environment Variable (`[REDACTED_NEVER_LOGGED]`)

## 7. Search Base
- [ ] Target Search Base Distinguished Name (DN) confirmed (replacing `OU=PLACEHOLDER_ORG_UNIT,DC=placeholder,DC=example`)

## 8. Firewall Connectivity
- [ ] Firewall ACL opened strictly from Application Server IP to Domain Controller on TCP Port 636
- [ ] Confirmed zero SSL deep packet inspection (DPI) on TCP 636 (to preserve DC certificate chain integrity)
- [ ] Confirmed zero coupling with FortiGate Captive Portal or Central API Gateway

## 9. Test Environment
- [ ] Non-production Test / Staging environment prepared to validate `LdapsReadService` paging, timeouts, and certificate verification

## 10. Security Approval
- [ ] Formal Security Review and written approval granted before unlocking `ActiveDirectoryOptions.IsPhase2ACodeGateLocked` for Phase 2B
