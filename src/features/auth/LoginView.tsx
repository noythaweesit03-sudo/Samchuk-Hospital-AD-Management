import React, { useState } from 'react';
import { Shield, Lock, AlertTriangle, KeyRound, UserCheck, ArrowRight, Hospital, Server } from 'lucide-react';
import { CurrentUser, UserRole } from '../../types/ad';

interface LoginViewProps {
  onLoginSuccess: (user: CurrentUser) => void;
}

const PRESET_ACCOUNTS: {
  username: string;
  displayName: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  description: string;
}[] = [
  {
    username: 'somchai.jai',
    displayName: 'นาย สมชาย ใจมั่นคง',
    role: 'SystemAdministrator',
    roleTitle: 'ผู้ดูแลระบบสูงสุด (System Administrator)',
    department: 'ศูนย์คอมพิวเตอร์และสารสนเทศ',
    description: 'สิทธิ์ดูภาพรวม ผู้ใช้งาน เครื่องคอมพิวเตอร์ หน่วยงาน และรายงานตรวจสอบทั้งหมด (Read-Only Demo)',
  },
  {
    username: 'auditor.sec',
    displayName: 'นาง วิไลวรรณ ตรวจการ',
    role: 'SecurityAuditor',
    roleTitle: 'ผู้ตรวจสอบความปลอดภัย (Security Auditor)',
    department: 'กลุ่มงานตรวจสอบภายใน',
    description: 'สิทธิ์ตรวจสอบ Audit Logs และการกระจายสิทธิ์ความปลอดภัยในไดเรกทอรี',
  },
  {
    username: 'operator.ad',
    displayName: 'นาย เกรียงไกร คุมระบบ',
    role: 'ADOperator',
    roleTitle: 'ผู้ดูแลปฏิบัติการ (AD Operator)',
    department: 'ศูนย์คอมพิวเตอร์',
    description: 'ตรวจสอบโครงสร้าง OU, กลุ่มผู้ใช้งาน และคอมพิวเตอร์',
  },
  {
    username: 'helpdesk.it',
    displayName: 'น.ส. ศิริพร บริการดี',
    role: 'Helpdesk',
    roleTitle: 'เจ้าหน้าที่ช่วยเหลือผู้ใช้ (IT Helpdesk)',
    department: 'ศูนย์คอมพิวเตอร์',
    description: 'ตรวจสอบสถานะบัญชีพนักงาน ค้นหาเบอร์โทรและรหัสผู้ใช้งาน',
  },
  {
    username: 'viewer.guest',
    displayName: 'ผู้สังเกตการณ์ระบบ (Guest Viewer)',
    role: 'Viewer',
    roleTitle: 'ผู้เข้าชมทั่วไป (Viewer)',
    department: 'ฝ่ายอำนวยการ',
    description: 'เข้าดูแดชบอร์ดภาพรวมเท่านั้น ไม่สามารถดูข้อมูลบันทึกตรวจสอบหรือการตั้งค่าได้',
  },
];

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [usernameInput, setUsernameInput] = useState<string>(PRESET_ACCOUNTS[0].username);
  const [passwordInput, setPasswordInput] = useState<string>('••••••••••••');
  const [loading, setLoading] = useState(false);

  const handleSelectPreset = (index: number) => {
    setSelectedPreset(index);
    setUsernameInput(PRESET_ACCOUNTS[index].username);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const preset = PRESET_ACCOUNTS[selectedPreset];
      const user: CurrentUser = {
        id: `mock-usr-${preset.role.toLowerCase()}`,
        username: preset.username,
        displayName: preset.displayName,
        role: preset.role,
        department: preset.department,
        sessionExpiry: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      };
      setLoading(false);
      onLoginSuccess(user);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700/40">
        
        {/* Left Side: Brand & Context */}
        <div className="md:col-span-5 bg-gradient-to-b from-teal-800 to-slate-900 p-8 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-inner">
                <Hospital className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">โรงพยาบาลสามชุก</h1>
                <p className="text-xs text-teal-200">Samchuk Hospital, Suphan Buri</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>PHASE 1: SYNTHETIC DEMO ONLY</span>
              </div>

              <h2 className="text-xl font-bold text-slate-100">
                ระบบบริหารจัดการ Active Directory
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed">
                ระบบจัดการไดเรกทอรีภายในแบบแยกอิสระ (Independent Application Server) 
                ทำงานร่วมกับ Domain Controller (Windows Server 2025) ผ่านโปรโตคอล LDAPS (TLS Port 636)
              </p>

              <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/80 text-[11px] text-slate-300 space-y-2">
                <div className="font-semibold text-teal-300 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  <span>ขอบเขตความปลอดภัย (Security Boundaries)</span>
                </div>
                <ul className="space-y-1 text-slate-400">
                  <li>• ไม่มีฟังก์ชันเขียนหรือแก้ไข AD จริงใน Phase 1</li>
                  <li>• ไม่เชื่อมต่อ FortiGate / Internet Login / Gateway</li>
                  <li>• ไม่มีการบันทึกรหัสผ่านหรือข้อมูลบุคลากรจริง</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
            <span>สถาปัตยกรรมรุ่น: 1.0.0</span>
            <span className="font-mono text-teal-400">WS-2025 AD (Mock)</span>
          </div>
        </div>

        {/* Right Side: Demo Authentication Form */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-slate-50">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">เข้าสู่ระบบโหมดสาธิต (Demo Login)</h3>
              <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                ไม่มีการตรวจสอบ AD จริง
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-5">
              เลือกบทบาทจำลองเพื่อเข้าสู่ระบบทดสอบสิทธิ์ (RBAC Demonstration):
            </p>

            {/* Role Preset Selector */}
            <div className="space-y-2 mb-6">
              {PRESET_ACCOUNTS.map((preset, idx) => {
                const isSelected = selectedPreset === idx;
                return (
                  <div
                    key={preset.username}
                    onClick={() => handleSelectPreset(idx)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-500 shadow-xs ring-1 ring-teal-500'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs font-bold text-slate-800">{preset.displayName}</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        preset.role === 'SystemAdministrator' ? 'bg-emerald-100 text-emerald-800' :
                        preset.role === 'SecurityAuditor' ? 'bg-purple-100 text-purple-800' :
                        preset.role === 'Helpdesk' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {preset.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 pl-6">
                      {preset.roleTitle} — {preset.department}
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อผู้ใช้งานจำลอง (Username)
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    readOnly
                    value={usernameInput}
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono text-slate-700 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  รหัสผ่านจำลอง (Demo Password)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    readOnly
                    value={passwordInput}
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono text-slate-700 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  * หมายเหตุ: ใน Phase 1 ไม่มีการตรวจสอบรหัสผ่านกับ Domain Controller จริง
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {loading ? (
                  <span>กำลังเตรียมข้อมูลสาธิต...</span>
                ) : (
                  <>
                    <span>เข้าสู่ระบบสาธิตในฐานะ {PRESET_ACCOUNTS[selectedPreset].role}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-center text-[11px] text-slate-500">
            ระบบความปลอดภัยโรงพยาบาลสามชุก • สอดคล้องกับระเบียบว่าด้วยการคุ้มครองข้อมูลส่วนบุคคล (PDPA)
          </div>
        </div>
      </div>
    </div>
  );
};
