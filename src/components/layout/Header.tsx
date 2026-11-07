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
  Layers,
  Menu,
  X,
  Timer,
  RefreshCw
} from 'lucide-react';
import { CurrentUser, UserRole } from '../../types/ad';
import { formatThaiDateTime } from '../../utils/thaiDate';

interface HeaderProps {
  currentUser: CurrentUser;
  onRoleChange: (newRole: UserRole) => void;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  onTriggerErrorPreview?: (type: '403' | '404' | 'expired') => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  sessionRemainingSeconds: number;
  onResetSession: () => void;
  onExpireSessionNow: () => void;
  onSimulateExpireInFiveSeconds: () => void;
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
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  sessionRemainingSeconds,
  onResetSession,
  onExpireSessionNow,
  onSimulateExpireInFiveSeconds,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [errorDropdownOpen, setErrorDropdownOpen] = useState(false);
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false);

  useEffect(() => {
    const update = () => setCurrentTime(formatThaiDateTime(new Date().toISOString()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format session remaining as mm:ss
  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isSessionWarning = sessionRemainingSeconds < 60;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={onToggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-sm shrink-0">
            SH
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                โรงพยาบาลสามชุก
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded">
                AD Management
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                Phase 1 Mock
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Samchuk Hospital Active Directory Management System (Windows Server 2025)
            </p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Thai Clock */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">{currentTime}</span>
          </div>

          {/* Simulated Session Countdown & Expiration Controller */}
          <div className="relative">
            <button
              onClick={() => {
                setSessionDropdownOpen(!sessionDropdownOpen);
                setErrorDropdownOpen(false);
                setRoleDropdownOpen(false);
              }}
              className={`text-xs font-mono font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border ${
                isSessionWarning
                  ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="สถานะและตัวควบคุมเซสชันจำลอง (คลิกเพื่อทดสอบการหมดอายุ)"
              aria-label="การตั้งค่าและเวลาคงเหลือของเซสชัน"
            >
              <Timer className={`w-3.5 h-3.5 ${isSessionWarning ? 'text-red-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline font-sans text-[11px]">เซสชัน:</span>
              <span>{formatSessionTime(sessionRemainingSeconds)}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {sessionDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-40 text-xs">
                <div className="px-3.5 py-1.5 border-b border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    การจำลองเซสชัน (Session Controller)
                  </div>
                  <div className="text-xs text-slate-700 mt-1">
                    เวลาคงเหลือ: <strong className="font-mono text-teal-700">{formatSessionTime(sessionRemainingSeconds)}</strong>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    สำหรับทดสอบระบบ Session Timeout ตามข้อกำหนดความปลอดภัย
                  </p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onResetSession();
                      setSessionDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                    <span>ต่อเวลาเซสชัน (รีเซ็ต 15 นาที)</span>
                  </button>

                  <button
                    onClick={() => {
                      onSimulateExpireInFiveSeconds();
                      setSessionDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-amber-50 flex items-center gap-2 text-amber-800"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>จำลองหมดอายุใน 5 วินาที (เร็ว)</span>
                  </button>

                  <button
                    onClick={() => {
                      onExpireSessionNow();
                      setSessionDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 font-medium"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    <span>บังคับเซสชันหมดอายุทันที (Expire Now)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Test Error Screens Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setErrorDropdownOpen(!errorDropdownOpen);
                setRoleDropdownOpen(false);
                setSessionDropdownOpen(false);
              }}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
              title="ทดสอบแสดงผลหน้าจอข้อผิดพลาด 403 / 404 / Session Expired"
              aria-label="ทดสอบหน้าจอสถานะ Error"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">จำลอง Error</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {errorDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs">
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
                setSessionDropdownOpen(false);
              }}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors"
              aria-label="เปลี่ยนบทบาทผู้ใช้"
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
