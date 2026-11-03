import React from 'react';
import { AlertTriangle, ShieldCheck, Info } from 'lucide-react';

interface DemoBannerProps {
  compact?: boolean;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white uppercase tracking-wider">
            DEMO / MOCK
          </span>
          <span>โหมดสาธิต Phase 1 — ข้อมูลสังเคราะห์ ไม่มีผลกับระบบ Active Directory จริง</span>
        </div>
        <span className="text-amber-800 hidden sm:inline text-[11px]">
          DC: Windows Server 2025 (10.2.0.22 - Read Only TBD)
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-y border-amber-200 px-4 py-2.5 text-amber-950 text-xs sm:text-sm shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-1 bg-amber-500 text-white rounded">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded text-[11px]">
                PHASE 1: SYNTHETIC MOCK DATA
              </span>
              <span className="font-semibold text-slate-800">
                ระบบจำลองการบริหารจัดการ Active Directory โรงพยาบาลสามชุก
              </span>
            </div>
            <p className="text-slate-600 text-xs mt-0.5">
              ข้อมูลทั้งหมดเป็นข้อมูลสมมุติ ไม่มีการติดต่อ Domain Controller จริง ไม่มีการบันทึกหรือแก้ไข และไม่มีส่วนเชื่อมต่อ FortiGate / Internet Login
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-1.5 bg-white/80 border border-amber-200 px-2.5 py-1 rounded text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Read-Only Protection: <strong className="text-emerald-700">Active</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
