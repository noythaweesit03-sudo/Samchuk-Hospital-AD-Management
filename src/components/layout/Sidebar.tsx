import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Monitor, 
  FolderTree, 
  UsersRound, 
  FileText, 
  Settings, 
  Server, 
  ShieldCheck, 
  Lock,
  ExternalLink,
  X
} from 'lucide-react';
import { CurrentUser } from '../../types/ad';
import { hasPageAccess, PAGE_PERMISSIONS } from '../../utils/rbac';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  currentUser: CurrentUser;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'แดชบอร์ดภาพรวม',
      subLabel: 'Dashboard Summary',
      icon: LayoutDashboard,
    },
    {
      id: 'users',
      label: 'ผู้ใช้งานในระบบ',
      subLabel: 'Users & Accounts',
      icon: Users,
    },
    {
      id: 'computers',
      label: 'เครื่องคอมพิวเตอร์',
      subLabel: 'Computers & Servers',
      icon: Monitor,
    },
    {
      id: 'ous',
      label: 'โครงสร้างหน่วยงาน',
      subLabel: 'Organizational Units',
      icon: FolderTree,
    },
    {
      id: 'groups',
      label: 'กลุ่มสิทธิ์ความปลอดภัย',
      subLabel: 'Security & Distribution Groups',
      icon: UsersRound,
    },
    {
      id: 'audit',
      label: 'บันทึกการตรวจสอบ',
      subLabel: 'Audit Trails (Read-Only)',
      icon: FileText,
    },
    {
      id: 'settings',
      label: 'การเชื่อมต่อ & สถาปัตยกรรม',
      subLabel: 'Architecture & TBD Gates',
      icon: Settings,
    },
  ];

  const handleItemClick = (pageId: string) => {
    onNavigate(pageId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Scope Reminder */}
      <div className="p-3 bg-slate-800/80 border-b border-slate-700/60 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-teal-400 font-semibold text-[11px] uppercase tracking-wider">
            <Server className="w-3.5 h-3.5" />
            <span>ขอบเขต: AD Management Only</span>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
              aria-label="ปิดเมนู"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
          แยกอิสระจาก Gateway, IIS, Procurement, Sam_Att, Cash_Cheque และ FortiGate
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          เมนูระบบ (Navigation)
        </div>

        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const isAllowed = hasPageAccess(currentUser.role, item.id);
          const isRestricted = !isAllowed;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="truncate">{item.label}</span>
                  {isRestricted && (
                    <span 
                      className="text-[9px] px-1.5 py-0.2 bg-red-950/60 text-red-300 border border-red-800/60 rounded font-semibold flex items-center gap-0.5 shrink-0 ml-1.5"
                      title="บทบาทปัจจุบันของคุณไม่มีสิทธิ์เข้าถึงหน้านี้ (คลิกเพื่อทดสอบ HTTP 403)"
                    >
                      <Lock className="w-2.5 h-2.5" />
                      403
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {item.subLabel}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Role & System Status Indicator */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">บทบาทปัจจุบัน:</span>
          <span className="text-teal-400 font-semibold font-mono">{currentUser.role}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">โหมดการทำงาน:</span>
          <span className="text-amber-400 font-semibold font-mono">Phase 1 Mock</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
          <span>Target DC:</span>
          <span className="font-mono">10.2.0.22 (Ref)</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md and up) */}
      <aside className="hidden md:flex w-64 shrink-0 min-h-[calc(100vh-65px)] border-r border-slate-800">
        {navContent}
      </aside>

      {/* Mobile Drawer (visible on mobile when open) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" 
            onClick={onCloseMobile}
            aria-label="ปิดเมนู"
          />
          {/* Drawer */}
          <aside className="relative w-72 max-w-[85vw] h-full shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};
