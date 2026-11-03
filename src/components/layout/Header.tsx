import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  User, 
  LogOut, 
  Clock, 
  Check, 
  ChevronDown, 
  AlertCircle,
  Activity,
  Layers
} from 'lucide-react';
import { CurrentUser, UserRole } from '../../types/ad';
import { formatThaiDateTime } from '../../utils/thaiDate';

interface HeaderProps {
  currentUser: CurrentUser;
  onRoleChange: (newRole: UserRole) => void;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  onTriggerErrorPreview?: (type: '403' | '404' | 'expired') => void;
}

const ROLES: { role: UserRole; label: string; desc: string; color: string }[] = [
  { role: 'Viewer', label: 'ผู้เข้าชม (Viewer)', desc: 'อ่านข้อมูลทั่วไป', color: 'bg-slate-100 text-slate-800' },
  { role: 'Helpdesk', label: 'เจ้าหน้าที่สนับสนุน (Helpdesk)', desc: 'ดูข้อมูลผู้ใช้และคอมพิวเตอร์', color: 'bg-blue-100 text-blue-800' },
  { role: 'ADOperator', label: 'ผู้ดูแลปฏิบัติการ (ADOperator)', desc: 'ดูโครงสร้างและสิทธิ์กลุ่ม', color: 'bg-indigo-100 text-indigo-800' },
  { role: 'SecurityAuditor', label: 'ผู้ตรวจสอบความปลอดภัย (SecurityAuditor)', desc: 'วิเคราะห์ Audit Logs และสิทธิ์', color: 'bg-purple-100 text-purple-800' },
  { role: 'SystemAdministrator', label: 'ผู้ดูแลระบบสูงสุด (SystemAdmin)', desc: 'เข้าถึงทุกฟังก์ชันในโหมดสาธิต', color: 'bg-emerald-100 text-emerald-800' },
];

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onRoleChange,
  onLogout,
  onNavigate,
  onTriggerErrorPreview,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [errorDropdownOpen, setErrorDropdownOpen] = useState(false);

  useEffect(() => {
    const update = () => setCurrentTime(formatThaiDateTime(new Date().toISOString()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            SH
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base leading-tight">
                โรงพยาบาลสามชุก
              </span>
              <span className="text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded">
                AD Management
              </span>
              <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                Phase 1 Mock
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Samchuk Hospital Active Directory Management System (Windows Server 2025)
            </p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Thai Clock */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">{currentTime}</span>
          </div>

          {/* Test Error Screens Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setErrorDropdownOpen(!errorDropdownOpen);
                setRoleDropdownOpen(false);
              }}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
              title="ทดสอบแสดงผลหน้าจอข้อผิดพลาด 403 / 404 / Session Expired"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">จำลอง Error</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {errorDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-40 text-xs">
                <div className="px-3 py-1 font-semibold text-slate-400 text-[10px] uppercase">
                  ทดสอบหน้าจอสถานะ
                </div>
                <button
                  onClick={() => {
                    onTriggerErrorPreview?.('403');
                    setErrorDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <span className="font-mono font-bold text-red-600 bg-red-50 px-1 rounded">403</span>
                  <span>ไม่มีสิทธิ์เข้าถึง (Forbidden)</span>
                </button>
                <button
                  onClick={() => {
                    onTriggerErrorPreview?.('404');
                    setErrorDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1 rounded">404</span>
                  <span>ไม่พบข้อมูล (Not Found)</span>
                </button>
                <button
                  onClick={() => {
                    onTriggerErrorPreview?.('expired');
                    setErrorDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <span className="font-mono font-bold text-amber-600 bg-amber-50 px-1 rounded">401</span>
                  <span>เซสชันหมดอายุ (Expired)</span>
                </button>
              </div>
            )}
          </div>

          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setRoleDropdownOpen(!roleDropdownOpen);
                setErrorDropdownOpen(false);
              }}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[10px]">
                {currentUser.displayName.charAt(0)}
              </div>
              <div className="hidden md:block leading-tight">
                <div className="font-semibold text-slate-800">{currentUser.displayName}</div>
                <div className="text-[10px] text-teal-700 font-medium">สิทธิ์: {currentUser.role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-40">
                <div className="px-3.5 py-1.5 border-b border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    สลับสิทธิ์การทดสอบ (Mock RBAC)
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 font-medium">
                    {currentUser.username} ({currentUser.department})
                  </div>
                </div>

                <div className="py-1">
                  {ROLES.map((r) => {
                    const isCurrent = currentUser.role === r.role;
                    return (
                      <button
                        key={r.role}
                        onClick={() => {
                          onRoleChange(r.role);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-start justify-between gap-2 transition-colors ${
                          isCurrent ? 'bg-teal-50/70 font-semibold' : ''
                        }`}
                      >
                        <div>
                          <div className="text-xs text-slate-800 flex items-center gap-1.5">
                            <span>{r.label}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">{r.desc}</div>
                        </div>
                        {isCurrent && <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 pt-1 mt-1 px-2">
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>ออกจากโหมดทดสอบ (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
