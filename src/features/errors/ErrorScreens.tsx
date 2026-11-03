import React from 'react';
import { ShieldAlert, AlertCircle, Clock, ArrowLeft, RefreshCw, LogIn } from 'lucide-react';

interface ErrorScreenProps {
  type: '403' | '404' | 'expired';
  onDismiss: () => void;
  onLoginAgain?: () => void;
}

export const ErrorScreens: React.FC<ErrorScreenProps> = ({
  type,
  onDismiss,
  onLoginAgain,
}) => {
  if (type === '403') {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-2xl border border-red-200 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 mb-2">
            <span>การจำลองสิทธิ์ในโหมดสาธิต (Demo RBAC Simulation) — ยังไม่ใช่ Production Authentication</span>
          </div>
          <br />
          <span className="font-mono text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
            HTTP 403 FORBIDDEN
          </span>
          <h2 className="text-xl font-bold text-slate-800 mt-2">
            ไม่มีสิทธิ์เข้าถึงข้อมูลหรือดำเนินการนี้
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
            บทบาท (Role) ของคุณในปัจจุบันไม่ได้รับอนุญาตให้เข้าถึงทรัพยากรนี้ 
            (ตัวอย่าง: บทบาท Viewer หรือ Helpdesk ไม่มีสิทธิ์เข้าถึง Audit Logs หรือหน้า Settings)
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 font-mono text-left space-y-1">
          <div>Policy Enforcement: Demo RBAC Simulation Rule</div>
          <div>Deny Reason: Current Role lacks permission for this module</div>
          <div className="text-amber-700 text-[10px] font-sans pt-1 border-t border-slate-200">
            * ใน Phase 2/3 ระบบจะบังคับใช้การตรวจสอบสิทธิ์ฝั่งเซิร์ฟเวอร์ด้วย Windows Authentication / MFA จริง
          </div>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={onDismiss}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าหลัก</span>
          </button>
        </div>
      </div>
    );
  }

  if (type === '404') {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-2xl border border-blue-200 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
            HTTP 404 NOT FOUND
          </span>
          <h2 className="text-xl font-bold text-slate-800 mt-2">
            ไม่พบออบเจกต์ที่ระบุใน Active Directory
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
            ไม่พบออบเจกต์ บัญชีผู้ใช้ หรือคอมพิวเตอร์ตาม Distinguished Name หรือ GUID ที่ร้องขอ 
            อาจถูกลบไปแล้ว หรืออยู่นอกขอบเขต OU ที่ระบบได้รับอนุญาตให้สืบค้น
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 font-mono text-left">
          <div>Search Base: OU=Samchuk Hospital,DC=samchuk,DC=local</div>
          <div>Filter: (&(objectCategory=person)(objectClass=user)(sAMAccountName=unknown))</div>
          <div>Result: 0 entries returned</div>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={onDismiss}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าหลัก</span>
          </button>
        </div>
      </div>
    );
  }

  // Session Expired
  return (
    <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-2xl border border-amber-200 shadow-xl text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
        <Clock className="w-8 h-8" />
      </div>
      <div>
        <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
          HTTP 401 UNAUTHORIZED / SESSION EXPIRED
        </span>
        <h2 className="text-xl font-bold text-slate-800 mt-2">
          เซสชันการทำงานหมดอายุ (Session Expired)
        </h2>
        <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
          เพื่อความปลอดภัยของระบบไดเรกทอรีโรงพยาบาลสามชุก เซสชันการทำงานของผู้ดูแลระบบจะหมดอายุโดยอัตโนมัติเมื่อครบกำหนดเวลา 
          กรุณาเข้าสู่ระบบใหม่อีกครั้ง
        </p>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 font-mono text-left">
        <div>Session Status: Revoked / Expired</div>
        <div>Security Header: SameSite=Strict; Secure; HttpOnly</div>
      </div>

      <div className="pt-2 flex justify-center gap-3">
        <button
          onClick={onLoginAgain}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          <span>เข้าสู่ระบบใหม่ (Re-authenticate)</span>
        </button>
      </div>
    </div>
  );
};
