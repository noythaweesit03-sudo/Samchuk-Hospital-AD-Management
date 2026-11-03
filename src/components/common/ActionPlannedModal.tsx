import React from 'react';
import { ShieldAlert, X, CheckCircle2, Lock, ArrowRight, FileText } from 'lucide-react';

interface ActionPlannedModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionTitle: string;
  targetName?: string;
  actionType?: 'create' | 'edit' | 'disable' | 'unlock' | 'reset-password' | 'delete';
}

export const ActionPlannedModal: React.FC<ActionPlannedModalProps> = ({
  isOpen,
  onClose,
  actionTitle,
  targetName,
  actionType = 'edit',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500 text-white rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                ฟังก์ชันถูกจำกัดใน Phase 1 (Planned for Phase 4)
              </h3>
              <p className="text-xs text-amber-900 font-medium">
                การกระทำ: {actionTitle} {targetName ? `[${targetName}]` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm text-slate-600">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs uppercase tracking-wider">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>หลักการความปลอดภัยด้าน Active Directory (Zero Write in Phase 1)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ตามข้อกำหนดความปลอดภัยของโรงพยาบาลสามชุก ระบบใน Phase 1 ให้บริการเฉพาะการอ่านข้อมูลจำลอง (Mock Read-Only) 
              ห้ามไม่ให้มีคำสั่งแก้ไข บันทึก หรือเขียนข้อมูลลงในไดเรกทอรีใดๆ ทั้งสิ้น
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-2">
              ข้อกำหนดที่ต้องดำเนินการก่อนเปิดใช้งานจริงใน Phase 4:
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>การมอบหมายสิทธิ์ขั้นต่ำ (Least Privilege Delegation):</strong> บัญชี Service Account ต้องได้รับสิทธิ์เฉพาะ OU ที่ได้รับอนุมัติเท่านั้น ห้ามใช้สิทธิ์ Domain Admin เด็ดขาด
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>การยืนยันตัวตนแบบหลายปัจจัย (MFA):</strong> ผู้ดูแลระบบต้องผ่านการยืนยันตัวตนด้วย MFA ที่ตรวจสอบได้จริง
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>กระบวนการอนุมัติแบบ Dual-Approval:</strong> การเปลี่ยนแปลงสำคัญ เช่น ปลดล็อกบัญชี หรือรีเซ็ตรหัสผ่าน ต้องมีบันทึก Audit แบบป้องกันการแก้ไข (Immutable Audit)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>การสำรองข้อมูล (Backup & Rollback):</strong> ผ่านการทดสอบกู้คืน Directory และ Disaster Recovery
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <FileText className="w-4 h-4 text-blue-600" />
              ดูรายละเอียดในเอกสาร docs/AD_INTEGRATION_PLAN.md
            </span>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
              Phase 4 Gate
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            รับทราบและปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
