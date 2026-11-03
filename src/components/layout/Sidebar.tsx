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
  ExternalLink
} from 'lucide-react';
import { CurrentUser } from '../../types/ad';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  currentUser: CurrentUser;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  currentUser,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'แดชบอร์ดภาพรวม',
      subLabel: 'Dashboard Summary',
      icon: LayoutDashboard,
      roles: ['Viewer', 'Helpdesk', 'ADOperator', 'SecurityAuditor', 'SystemAdministrator'],
    },
    {
      id: 'users',
      label: 'ผู้ใช้งานในระบบ',
      subLabel: 'Users & Accounts',
      icon: Users,
      roles: ['Viewer', 'Helpdesk', 'ADOperator', 'SecurityAuditor', 'SystemAdministrator'],
    },
    {
      id: 'computers',
      label: 'เครื่องคอมพิวเตอร์',
      subLabel: 'Computers & Servers',
      icon: Monitor,
      roles: ['Viewer', 'Helpdesk', 'ADOperator', 'SecurityAuditor', 'SystemAdministrator'],
    },
    {
      id: 'ous',
      label: 'โครงสร้างหน่วยงาน',
      subLabel: 'Organizational Units',
      icon: FolderTree,
      roles: ['Viewer', 'Helpdesk', 'ADOperator', 'SecurityAuditor', 'SystemAdministrator'],
    },
    {
      id: 'groups',
      label: 'กลุ่มสิทธิ์ความปลอดภัย',
      subLabel: 'Security & Distribution Groups',
      icon: UsersRound,
      roles: ['Viewer', 'Helpdesk', 'ADOperator', 'SecurityAuditor', 'SystemAdministrator'],
    },
    {
      id: 'audit',
      label: 'บันทึกการตรวจสอบ',
      subLabel: 'Audit Trails (Read-Only)',
      icon: FileText,
      roles: ['SecurityAuditor', 'SystemAdministrator'],
      restrictedFor: ['Viewer', 'Helpdesk', 'ADOperator'],
    },
    {
      id: 'settings',
      label: 'การเชื่อมต่อ & สถาปัตยกรรม',
      subLabel: 'Architecture & TBD Gates',
      icon: Settings,
      roles: ['SystemAdministrator', 'SecurityAuditor', 'ADOperator'],
      restrictedFor: ['Viewer', 'Helpdesk'],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-65px)]">
      {/* Scope Reminder */}
      <div className="p-3 bg-slate-800/80 border-b border-slate-700/60 text-xs">
        <div className="flex items-center gap-2 text-teal-400 font-semibold text-[11px] uppercase tracking-wider">
          <Server className="w-3.5 h-3.5" />
          <span>ขอบเขต: AD Management Only</span>
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
          const isRestricted = item.restrictedFor?.includes(currentUser.role);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="truncate flex items-center justify-between">
                  <span>{item.label}</span>
                  {isRestricted && (
                    <span className="text-[9px] font-semibold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/40">
                      จำกัด
                    </span>
                  )}
                </div>
                <div className={`text-[10px] truncate ${isActive ? 'text-teal-100' : 'text-slate-400'}`}>
                  {item.subLabel}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom Service Status Box */}
      <div className="p-3.5 m-3 bg-slate-800/90 rounded-xl border border-slate-700/80 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-200 text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            สถานะ AD Domain
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
            จำลอง (Mock)
          </span>
        </div>

        <div className="space-y-1 text-[11px] text-slate-400 font-mono">
          <div className="flex justify-between">
            <span>DC Server:</span>
            <span className="text-slate-300">SH-DC01</span>
          </div>
          <div className="flex justify-between">
            <span>DC OS:</span>
            <span className="text-slate-300">Win Server 2025</span>
          </div>
          <div className="flex justify-between">
            <span>IP Ref (TBD):</span>
            <span className="text-slate-400">10.2.0.22</span>
          </div>
          <div className="flex justify-between">
            <span>LDAPS Port:</span>
            <span className="text-slate-300">636 (TLS)</span>
          </div>
          <div className="flex justify-between">
            <span>Mode:</span>
            <span className="text-emerald-400 font-sans font-medium">Read-Only Phase 1</span>
          </div>
        </div>

        <div className="pt-1.5 border-t border-slate-700/70 text-[10px] text-slate-400 text-center">
          ระบบจะไม่ส่งคำสั่งแก้ไขไปยัง AD จนกว่าจะผ่านการทดสอบใน Phase 4
        </div>
      </div>
    </aside>
  );
};
