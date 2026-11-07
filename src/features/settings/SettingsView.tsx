import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Network,
  Layers,
  RefreshCw,
  Activity,
  FileCode2,
  Clock,
  Info,
} from 'lucide-react';
import { directoryApi } from '../../services/directoryApi';
import { ConnectionReadinessReport, DiagnosticCheckStatus } from '../../types/ad';
import { formatThaiDateTime } from '../../utils/thaiDate';

export const SettingsView: React.FC = () => {
  const [readinessReport, setReadinessReport] = useState<ConnectionReadinessReport | null>(null);
  const [loadingReadiness, setLoadingReadiness] = useState<boolean>(true);
  const [readinessError, setReadinessError] = useState<string | null>(null);

  const loadConnectionReadiness = useCallback(async () => {
    setLoadingReadiness(true);
    setReadinessError(null);
    try {
      const report = await directoryApi.getConnectionReadiness();
      setReadinessReport(report);
    } catch (err: any) {
      setReadinessError(err?.message || 'ไม่สามารถโหลดข้อมูลสถานะการเตรียมความพร้อมเชื่อมต่อได้');
    } finally {
      setLoadingReadiness(false);
    }
  }, []);

  useEffect(() => {
    loadConnectionReadiness();
  }, [loadConnectionReadiness]);

  const renderDiagnosticBadge = (status: DiagnosticCheckStatus) => {
    switch (status) {
      case 'Simulated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <span>Simulated (จำลองออฟไลน์ / Not Tested จริง)</span>
          </span>
        );
      case 'NotConfigured':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <span>Not Configured (ยังเป็น Placeholder)</span>
          </span>
        );
      case 'NotTested':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-200 text-slate-800 border border-slate-300">
            <span>Not Tested (ยังไม่ได้ทดสอบเชื่อมต่อจริง)</span>
          </span>
        );
    }
  };

  // 10-Item Pre-Phase 2B Checklist required by Phase 2A specification
  const prePhase2BChecklist = [
    {
      id: 'chk-1',
      title: '1. Application Server OS / Hostname / IP',
      status: 'Not Configured (TBD)',
      desc: 'กำหนดระบบปฏิบัติการ (Windows Server 2022/2025 หรือ Linux), Hostname, และ Fixed IP Address ของเซิร์ฟเวอร์แอปพลิเคชันอิสระ (Option A)',
      requiredFor: 'Pre-Phase 2B',
    },
    {
      id: 'chk-2',
      title: '2. AD DNS Domain / Forest',
      status: 'Not Configured (TBD)',
      desc: 'ยืนยันชื่อ AD DNS Domain / Forest และตั้งค่า DNS Resolver บน Application Server ให้ชี้ไปยัง Internal DNS ของโรงพยาบาลสามชุก',
      requiredFor: 'Pre-Phase 2B',
    },
    {
      id: 'chk-3',
      title: '3. Domain Controller FQDN',
      status: 'Placeholder Only',
      desc: 'ระบุ FQDN ของเครื่อง Domain Controller เป้าหมายแทนค่า __PLACEHOLDER_DC_FQDN__ เพื่อให้ตรงกับ Subject Alternative Name (SAN) ในใบรับรอง',
      requiredFor: 'Pre-Phase 2B',
    },
    {
      id: 'chk-4',
      title: '4. Root CA Certificate',
      status: 'Not Installed (TBD)',
      desc: 'นำเข้าใบรับรอง Enterprise Root CA / Intermediate CA ของโรงพยาบาลสามชุกเข้าสู่ Trusted Root Certification Authorities บน Application Server',
      requiredFor: 'Pre-Phase 2B',
    },
    {
      id: 'chk-5',
      title: '5. LDAPS Port 636',
      status: 'Not Tested',
      desc: 'เปิดใช้งานและตรวจสอบ LDAPS over TLS บนพอร์ต TCP 636 ของ Domain Controller (ห้ามใช้พอร์ต 389 แบบไม่เข้ารหัส)',
      requiredFor: 'Pre-Phase 2B',
    },
    {
      id: 'chk-6',
      title: '6. Read-only Service Account',
      status: 'Placeholder Only',
      desc: 'สร้างบัญชีบริการเฉพาะทางที่มีสิทธิ์ Read-Only เท่านั้น (ห้ามอยู่ในกลุ่ม Domain Admins, Account Operators หรือมีสิทธิ์แก้ไขข้อมูล)',
      requiredFor: 'Pre-Phase 2B',
    },
    {
      id: 'chk-7',
      title: '7. Search Base Distinguished Name (DN)',
      status: 'Placeholder Only',
      desc: 'กำหนด Distinguished Name ของ Root OU ของโรงพยาบาลสามชุกแทนค่า OU=PLACEHOLDER_ORG_UNIT,DC=placeholder,DC=example',
      requiredFor: 'Pre-Phase 2B',
    },
    {
      id: 'chk-8',
      title: '8. Firewall Connectivity (ACL TCP 636)',
      status: 'Not Tested (TBD)',
      desc: 'เปิดสิทธิ์ Firewall เฉพาะต้นทาง IP ของ Application Server ไปยัง Domain Controller ที่พอร์ต TCP 636 โดยไม่ผูกกับ FortiGate Captive Portal',
      requiredFor: 'Pre-Phase 2B',
    },
    {
      id: 'chk-9',
      title: '9. Test Environment Verification',
      status: 'Pending Phase 2B',
      desc: 'เตรียมสภาพแวดล้อมทดสอบ (Staging / Test Environment) เพื่อทดสอบ LDAPS Read-Only Adapter ก่อนพิจารณาใช้งานจริง',
      requiredFor: 'Pre-Phase 2B',
    },
    {
      id: 'chk-10',
      title: '10. Formal Security Approval',
      status: 'Pending Approval',
      desc: 'ได้รับการอนุมัติอย่างเป็นทางการจากผู้ดูแลความมั่นคงปลอดภัยสารสนเทศโรงพยาบาลสามชุกก่อนปลดล็อก Phase 2A Code Gate เพื่อเข้าสู่ Phase 2B',
      requiredFor: 'Pre-Phase 2B',
    },
  ];

  const rbacMatrix = [
    { permission: 'เข้าสู่ระบบและดูแดชบอร์ดภาพรวม', viewer: true, helpdesk: true, operator: true, auditor: true, admin: true },
    { permission: 'สืบค้นและดูรายละเอียดผู้ใช้งาน (Read-Only)', viewer: true, helpdesk: true, operator: true, auditor: true, admin: true },
    { permission: 'ตรวจสอบคอมพิวเตอร์และสถานะ OS', viewer: true, helpdesk: true, operator: true, auditor: true, admin: true },
    { permission: 'เรียกดูโครงสร้าง OU และกลุ่มสิทธิ์ (Groups)', viewer: true, helpdesk: true, operator: true, auditor: true, admin: true },
    { permission: 'เข้าถึงบันทึกการตรวจสอบระบบ (Audit Logs)', viewer: false, helpdesk: false, operator: false, auditor: true, admin: true },
    { permission: 'เข้าดูหน้าสถาปัตยกรรม ตั้งค่า และ Connection Readiness (Settings)', viewer: false, helpdesk: false, operator: true, auditor: true, admin: true },
    { permission: 'คำสั่งแก้ไข AD (Create / Unlock / Reset Password / Group Modify)', viewer: false, helpdesk: false, operator: false, auditor: false, admin: false, note: 'ปิดทุกบทบาทใน Phase 1 & 2A (วางแผน Phase 4)' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-800">
              การเชื่อมต่อ & สถาปัตยกรรมระบบ (Architecture & AD Connection Readiness)
            </h1>
            <span className="text-xs bg-indigo-100 text-indigo-800 border border-indigo-300 px-2 py-0.5 rounded font-mono font-semibold">
              Phase 2A — Offline LDAPS Adapter Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            โครงสร้างการเชื่อมต่อ Option A, สถานะความพร้อมของ LDAPS Read-Only Adapter (Simulated / Not Tested) และ Checklist ก่อนเริ่ม Phase 2B
          </p>
        </div>
      </div>

      {/* Phase 2A AD Connection Readiness & Diagnostics Section */}
      <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                สถานะการเตรียมความพร้อมเชื่อมต่อ Active Directory (AD Connection Readiness — Phase 2A)
              </h2>
              <p className="text-[11px] text-slate-500">
                ตรวจสอบการตั้งค่า Placeholder, ความพร้อมของโค้ดอะแดปเตอร์ LDAPS และสถานะความปลอดภัยโดยไม่เชื่อมต่อ Domain Controller จริง
              </p>
            </div>
          </div>

          <button
            onClick={loadConnectionReadiness}
            disabled={loadingReadiness}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingReadiness ? 'animate-spin' : ''}`} />
            <span>ตรวจสอบสถานะจำลอง (Refresh Mock Diagnostics)</span>
          </button>
        </div>

        {/* Mandatory Disclaimer Banner */}
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">
              คำชี้แจงสำคัญ (Zero Live AD Connection in Phase 2A):
            </div>
            <p className="text-[11px] leading-relaxed">
              {readinessReport?.disclaimer ||
                'โหมดเตรียมความพร้อม Phase 2A: ผลลัพธ์ทั้งหมดด้านล่างเป็นสถานะจำลอง (Simulated) หรือยังไม่ได้ทดสอบจริง (Not Tested / Not Configured) ห้ามถือเป็นผลการเชื่อมต่อ Domain Controller จริง'}
            </p>
          </div>
        </div>

        {readinessError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
            <span>{readinessError}</span>
            <button
              onClick={loadConnectionReadiness}
              className="px-2.5 py-1 bg-red-600 text-white rounded font-semibold"
            >
              ลองใหม่
            </button>
          </div>
        )}

        {readinessReport && (
          <>
            {/* Feature Flag & Hard-Lock Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Phase 2A Code Gate
                </div>
                <div className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>LOCKED (บล็อกการเชื่อมต่อจริง)</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  ป้องกันการเปิด Live LDAPS ผ่านไฟล์ตั้งค่าเพียงอย่างเดียว
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Read-Only Feature Flag
                </div>
                <div className="text-xs font-bold text-slate-800 font-mono">
                  EnableLiveReadOnly: {String(readinessReport.configuration.featureFlagConfiguredValue)}
                </div>
                <div className="text-[10px] text-slate-500">
                  Effective Live State: <strong className="text-red-600">false (Disabled)</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  LDAPS Paging & Timeout
                </div>
                <div className="text-xs font-bold text-slate-800 font-mono">
                  PageSize: {readinessReport.configuration.ldapPageSize} | Timeout: {readinessReport.configuration.connectionTimeoutSeconds}s
                </div>
                <div className="text-[10px] text-slate-500">
                  RFC 4515 Filter Escaping & CancellationToken
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Service Account Secret Protection
                </div>
                <div className="text-xs font-bold text-emerald-700 font-mono">
                  {readinessReport.configuration.servicePasswordStatus}
                </div>
                <div className="text-[10px] text-slate-500">
                  ห้ามบันทึก Password หรือ Credential ลงใน Log
                </div>
              </div>
            </div>

            {/* Configuration Placeholders Table */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 font-semibold text-teal-400">
                  <FileCode2 className="w-4 h-4" />
                  <span>ค่าการตั้งค่า LDAPS Read-Only Adapter ปัจจุบัน (Safe Placeholders Only)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  อัปเดตเมื่อ: {formatThaiDateTime(readinessReport.generatedAtUtc)}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400">DomainControllerFqdn: </span>
                  <span className="text-amber-300">{readinessReport.configuration.domainControllerFqdn}</span>
                </div>
                <div>
                  <span className="text-slate-400">LdapsPort / UseSsl: </span>
                  <span className="text-teal-300">
                    {readinessReport.configuration.ldapsPort} / {String(readinessReport.configuration.useSsl)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">SearchBase: </span>
                  <span className="text-amber-300">{readinessReport.configuration.searchBase}</span>
                </div>
                <div>
                  <span className="text-slate-400">ReadOnlyServiceAccount: </span>
                  <span className="text-amber-300">{readinessReport.configuration.readOnlyServiceAccount}</span>
                </div>
                <div>
                  <span className="text-slate-400">TLS Validation: </span>
                  <span className="text-teal-300">
                    Chain={String(readinessReport.configuration.requireValidCertificateChain)}, SAN={String(readinessReport.configuration.requireHostnameMatch)}, Wildcard={String(readinessReport.configuration.allowWildcardCertificates)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">RootCA Thumbprint: </span>
                  <span className="text-amber-300">{readinessReport.configuration.rootCaThumbprintPlaceholder}</span>
                </div>
                <div>
                  <span className="text-slate-400">Bounded Result Window Limit: </span>
                  <span className="text-teal-300">
                    {readinessReport.configuration.maxResultWindowLimit} entries (Capped Window Protection)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Lockout Duration (Test Default): </span>
                  <span className="text-amber-300">
                    {readinessReport.configuration.lockoutDurationMinutes}m — {readinessReport.configuration.lockoutDurationPolicyStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* 6 Diagnostic Readiness Checks */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>ผลการตรวจเช็กความพร้อม 6 รายการ (Mock / Offline Readiness Checks):</span>
                <span className="text-[11px] font-normal text-slate-500">
                  ทุกหัวข้อระบุสถานะ Simulated / Not Configured / Not Tested ตามจริง
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {readinessReport.checks.map((chk) => (
                  <div
                    key={chk.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-xs text-slate-800">{chk.nameThai}</div>
                        {renderDiagnosticBadge(chk.status)}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200/80 truncate">
                        Target: {chk.target}
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed">{chk.summary}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200/70 text-[10px] text-teal-800 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>การเตรียมก่อน Phase 2B:</strong> {chk.remediationOrNextStep}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LastLogonTimestamp Accuracy Limitation Notice */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>ข้อจำกัดความแม่นยำของข้อมูล Last Logon (AD Replication Limitation):</strong>{' '}
                แอตทริบิวต์ <code className="font-mono bg-blue-100 px-1 rounded">lastLogonTimestamp</code> ใน Active Directory
                จะถูกซิงค์ข้อมูลระหว่าง Domain Controllers ตามรอบระยะเวลาประมาณ 9–14 วัน (msDS-LogonTimeSyncInterval)
                จึงใช้สำหรับวิเคราะห์บัญชีที่ไม่มีการเคลื่อนไหว (Inactive Account) เท่านั้น ไม่ใช่สถานะออนไลน์แบบ Real-time
              </div>
            </div>
          </>
        )}
      </div>

      {/* Architecture Overview Diagram Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">
              แผนผังสถาปัตยกรรม Option A: Independent AD Management (ระบบอิสระ)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Strict Separation from Central Gateway & FortiGate
          </span>
        </div>

        {/* Visual Box Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Frontend Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white mx-auto flex items-center justify-center font-bold text-xs">
              UI
            </div>
            <div className="font-bold text-slate-800 text-xs">Web Frontend (React/TypeScript)</div>
            <p className="text-[11px] text-slate-500">
              หน้าเว็บอินเทอร์เน็ตเบราว์เซอร์ สำหรับเจ้าหน้าที่ไอทีโรงพยาบาลสามชุก รองรับภาษาไทยสมบูรณ์
            </p>
            <div className="pt-2 text-[10px] text-teal-700 font-mono">
              Port: 3000 (Development) / 443 (Reverse Proxy)
            </div>
          </div>

          {/* Backend Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-teal-300 text-center space-y-2 relative shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-white mx-auto flex items-center justify-center font-bold text-xs">
              API
            </div>
            <div className="font-bold text-slate-800 text-xs">Application Server (ASP.NET Core Web API)</div>
            <p className="text-[11px] text-slate-500">
              เซิร์ฟเวอร์อิสระ (Independent Host) พร้อม LdapsReadService (Phase 2A Hard-Locked) และ Audit Trail
            </p>
            <div className="pt-2 text-[10px] text-slate-600 font-mono">
              Host / IP: <strong className="text-amber-700">TBD (รอระบุก่อน Phase 2B)</strong>
            </div>
          </div>

          {/* AD Domain Controller Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-700 text-white mx-auto flex items-center justify-center font-bold text-xs">
              DC
            </div>
            <div className="font-bold text-slate-800 text-xs">Domain Controller (Windows Server 2025)</div>
            <p className="text-[11px] text-slate-500">
              เครื่องแม่ข่ายไดเรกทอรีหลัก เตรียมเชื่อมต่อผ่าน LDAPS (TLS Port 636) อ่านข้อมูลอย่างเดียวใน Phase 2B
            </p>
            <div className="pt-2 text-[10px] text-purple-700 font-mono">
              Status: Not Connected in Phase 2A (Offline Prep)
            </div>
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>การแยกขอบเขตชัดเจน:</strong> ระบบนี้ไม่เชื่อมต่อกับ Samchuk Hospital Central API Gateway,
            IIS 3001/3002, Procurement, Sam_Att, Cash_Cheque, DHCP หรือระบบยืนยันตัวตนอินเทอร์เน็ตของ FortiGate
            เพื่อป้องกันผลกระทบต่อระบบปฏิบัติการหลักของโรงพยาบาล
          </p>
        </div>
      </div>

      {/* Pre-Phase 2B Checklist for Infrastructure Team */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">
              รายการตรวจสอบความพร้อม 10 ข้อก่อนเริ่ม Phase 2B (Pre-Phase 2B Readiness Checklist)
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
            หยุดที่ Phase 2A รอการอนุมัติก่อนเริ่ม Phase 2B
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {prePhase2BChecklist.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800 text-xs">{item.title}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                    {item.requiredFor}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
              <span className="shrink-0 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* RBAC Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">
              ตารางสิทธิ์การใช้งาน (Role-Based Access Control - RBAC)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">5 ระดับสิทธิ์ความปลอดภัย</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">สิทธิ์การดำเนินการ (Operation)</th>
                <th className="py-2.5 px-2 text-center">Viewer</th>
                <th className="py-2.5 px-2 text-center">Helpdesk</th>
                <th className="py-2.5 px-2 text-center">ADOperator</th>
                <th className="py-2.5 px-2 text-center">SecurityAuditor</th>
                <th className="py-2.5 px-2 text-center">SystemAdmin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rbacMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-800 font-medium">
                    {row.permission}
                    {row.note && (
                      <span className="text-[10px] text-red-600 block font-normal">*{row.note}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {row.viewer ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-slate-300 font-bold">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {row.helpdesk ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-slate-300 font-bold">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {row.operator ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-slate-300 font-bold">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {row.auditor ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-slate-300 font-bold">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {row.admin ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-slate-300 font-bold">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
