# Samchuk Hospital AD Management — Deployment Checklist

Pre-deployment verification checklist for Samchuk Hospital IT Infrastructure Team prior to advancing from Phase 1 to Phase 2:

## 1. Application Server Hosting Environment
- [ ] Operating System decided (Windows Server 2022/2025 or Linux Ubuntu LTS)
- [ ] Fixed IP address assigned in hospital server VLAN
- [ ] DNS A-Record configured (e.g. `ad-mgmt.samchuk.hospital.local`)
- [ ] Reverse Proxy installed (IIS with URL Rewrite / ARR or NGINX)
- [ ] Web TLS Certificate installed (Issued by Hospital CA)

## 2. Active Directory Infrastructure & LDAPS
- [ ] Windows Server 2025 Domain Controller (`10.2.0.22`) health check verified
- [ ] LDAPS (Port 636) enabled on Domain Controller
- [ ] Hospital Enterprise Root CA & Intermediate CA certificates exported (.cer / .crt)
- [ ] Root CA installed in Application Server Local Computer Trusted Root Certification Authorities
- [ ] Service Account `svc_ad_mgmt_ro` created in AD with:
  - Strong random password (min 25 characters)
  - Member of `Domain Users` only (NO Domain Admins)
  - Read permissions granted explicitly on `OU=Samchuk Hospital`

## 3. Network and Firewall Routing
- [ ] Firewall rule permitted: App Server IP -> DC `10.2.0.22` on TCP Port 636 (LDAPS)
- [ ] Verified NO interception or SSL inspection on port 636
- [ ] Confirmed NO dependencies on FortiGate captive portal or user authentication

## 4. Software Runtimes
- [ ] .NET 8.0 SDK / ASP.NET Core Runtime 8.0 installed on Application Server
- [ ] Node.js 20+ LTS installed for frontend production build (`npm run build`)
- [ ] Application service configured with least-privilege service account (not LocalSystem/root)
