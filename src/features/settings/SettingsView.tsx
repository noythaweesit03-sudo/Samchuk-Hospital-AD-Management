import React from 'react';
import { 
  Settings, 
  Server, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Network, 
  KeyRound, 
  FileText, 
  HelpCircle,
  Clock,
  Layers,
  Database
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const tbdItems = [
    {
      id: 'tbd-1',
      title: 'ข้อมูลเซิร์ฟเวอร์แอปพลิเคชัน (Application Server Host)',
      status: 'TBD (รอการจัดสรร)',
      desc: 'ระบบปฏิบัติการ (Windows Server หรือ Linux), Hostname, Fixed IP Address, TLS Certificate ประจำ Web Endpoint',
      requiredFor: 'Phase 2',
    },
    {
      id: 'tbd-2',
      title: 'ใบรับรองความปลอดภัย Root CA Chain สำหรับ LDAPS (Port 636)',
      status: 'TBD (รอส่งมอบ)',
      desc: 'ใบรับรอง Enterprise Root CA / Intermediate CA ของโรงพยาบาลสามชุก เพื่อตรวจสอบความถูกต้องของ Domain Controller Certificate โดยไม่ปิด TLS Validation',
      requiredFor: 'Phase 2',
    },
    {
      id: 'tbd-3',
      title: 'บัญชีบริการสำหรับอ่านข้อมูล AD (Read-Only Service Identity)',
      status: 'TBD (รอสร้างใน AD)',
      desc: 'บัญชีเฉพาะ (เช่น svc_ad_mgmt_ro) ที่มีสิทธิ์เฉพาะอ่านออบเจกต์ใน OU ที่กำหนดเท่านั้น ห้ามใช้บัญชี Domain Admin หรือสิทธิ์ระดับสูงเด็ดขาด',
      requiredFor: 'Phase 2',
    },
    {
      id: 'tbd-4',
      title: 'การเปิดเส้นทางไฟร์วอลล์ (Network Firewall & Routing ACL)',
      status: 'TBD (รอประสานงานเครือข่าย)',
      desc: 'เปิดพอร์ต TCP 636 (LDAPS) จาก Application Server IP ไปยัง Domain Controller 10.2.0.22 โดยไม่ผ่าน FortiGate User Authentication',
      requiredFor: 'Phase 2',
    },
    {
      id: 'tbd-5',
      title: 'ฐานข้อมูลสำหรับบันทึกการตรวจสอบ (Permanent Audit Database)',
      status: 'TBD (เลือก SQL Server หรือ PostgreSQL)',
      desc: 'เลือกประเภท DBMS สำหรับจัดเก็บ Audit Trail แบบถาวร (ใน Phase 1 ใช้ In-Memory Mock Repository)',
      requiredFor: 'Phase 3',
    },
  ];

  const rbacMatrix = [
    { permission: 'เข้าสู่ระบบและดูแดชบอร์ดภาพรวม', viewer: true, helpdesk: true, operator: true, auditor: true, admin: true },
    { permission: 'สืบค้นและดูรายละเอียดผู้ใช้งาน (Read-Only)', viewer: true, helpdesk: true, operator: true, auditor: true, admin: true },
    { permission: 'ตรวจสอบคอมพิวเตอร์และสถานะ OS', viewer: true, helpdesk: true, operator: true, auditor: true, admin: true },
    { permission: 'เรียกดูโครงสร้าง OU และกลุ่มสิทธิ์ (Groups)', viewer: true, helpdesk: true, operator: true, auditor: true, admin: true },
    { permission: 'เข้าถึงบันทึกการตรวจสอบระบบ (Audit Logs)', viewer: false, helpdesk: false, operator: false, auditor: true, admin: true },
    { permission: 'เข้าดูหน้าสถาปัตยกรรมและตั้งค่า (Settings & TBD)', viewer: false, helpdesk: false, operator: true, auditor: true, admin: true },
    { permission: 'คำสั่งแก้ไข AD (Create / Unlock / Reset Password)', viewer: false, helpdesk: false, operator: false, auditor: false, admin: false, note: 'ปิดทุกบทบาทใน Phase 1 (วางแผน Phase 4)' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">การเชื่อมต่อ & สถาปัตยกรรมระบบ (Architecture & Connectivity)</h1>
            <span className="text-xs bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-mono font-semibold">
              Phase 1 Configuration
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            โครงสร้างการเชื่อมต่อ ข้อกำหนดความปลอดภัย และรายการรอตรวจสอบ (TBD Checklist) สำหรับโรงพยาบาลสามชุก
          </p>
        </div>
      </div>

      {/* Architecture Overview Diagram Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">แผนผังสถาปัตยกรรมระบบ (System Architecture Topology)</h2>
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
              เซิร์ฟเวอร์อิสระ (Independent Host) ทำงานด้วย Clean Architecture, DTOs, และ Audit Trail
            </p>
            <div className="pt-2 text-[10px] text-slate-600 font-mono">
              Host / IP: <strong className="text-amber-700">TBD (รอระบุ)</strong>
            </div>
          </div>

          {/* AD Domain Controller Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-700 text-white mx-auto flex items-center justify-center font-bold text-xs">
              DC
            </div>
            <div className="font-bold text-slate-800 text-xs">Domain Controller (Windows Server 2025)</div>
            <p className="text-[11px] text-slate-500">
              เครื่องแม่ข่ายไดเรกทอรีหลัก เชื่อมต่อผ่าน LDAPS (TLS Port 636) อ่านข้อมูลอย่างเดียว
            </p>
            <div className="pt-2 text-[10px] text-purple-700 font-mono">
              IP Ref: 10.2.0.22 (Architecture Only)
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

      {/* TBD Checklist for Infrastructure Team */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">รายการรอตรวจสอบก่อนขึ้น Phase 2 (TBD Checklist)</h2>
          </div>
          <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
            ต้องผ่านการตรวจสอบก่อนเชื่อมต่อจริง
          </span>
        </div>

        <div className="space-y-3">
          {tbdItems.map((item) => (
            <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-xs">{item.title}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                    {item.requiredFor}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
              <span className="shrink-0 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg">
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
            <h2 className="text-sm font-bold text-slate-800">ตารางสิทธิ์การใช้งาน (Role-Based Access Control - RBAC)</h2>
          </div>
          <span className="text-[11px] text-slate-500">
            5 ระดับสิทธิ์ความปลอดภัย
          </span>
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
                      <span className="text-[10px] text-red-600 block font-normal">
                        *{row.note}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {row.viewer ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300 font-bold">—</span>}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {row.helpdesk ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300 font-bold">—</span>}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {row.operator ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300 font-bold">—</span>}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {row.auditor ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300 font-bold">—</span>}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {row.admin ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300 font-bold">—</span>}
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
