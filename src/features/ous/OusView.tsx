import React, { useState, useEffect } from 'react';
import { 
  FolderTree, 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  ShieldCheck, 
  Users, 
  Monitor, 
  Layers, 
  Lock, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AdOrganizationalUnit } from '../../types/ad';
import { directoryApi } from '../../services/directoryApi';

export const OusView: React.FC = () => {
  const [ouTree, setOuTree] = useState<AdOrganizationalUnit[]>([]);
  const [selectedOu, setSelectedOu] = useState<AdOrganizationalUnit | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'ou-root-samchuk': true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await directoryApi.getOuTree();
      setOuTree(data);
      if (data.length > 0 && !selectedOu) {
        setSelectedOu(data[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'เกิดข้อผิดพลาดในการโหลดโครงสร้างไดเรกทอรี OU');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOus();
  }, []);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderTreeNodes = (nodes: AdOrganizationalUnit[], level = 0) => {
    return (
      <div className="space-y-1">
        {nodes.map(node => {
          const hasChildren = node.children && node.children.length > 0;
          const isExpanded = !!expandedNodes[node.id];
          const isSelected = selectedOu?.id === node.id;

          return (
            <div key={node.id} className="select-none">
              <div
                onClick={() => setSelectedOu(node)}
                className={`flex items-center gap-2 py-2 px-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-teal-50 text-teal-900 font-semibold border border-teal-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                style={{ paddingLeft: `${Math.max(level * 18 + 8, 8)}px` }}
              >
                {hasChildren ? (
                  <button
                    onClick={(e) => toggleExpand(node.id, e)}
                    className="p-0.5 hover:bg-slate-200 rounded text-slate-500"
                  >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                ) : (
                  <span className="w-3.5" />
                )}

                <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-teal-600 fill-teal-100' : 'text-amber-500 fill-amber-100'}`} />
                <span className="truncate">{node.name}</span>

                <div className="ml-auto flex items-center gap-1.5 shrink-0">
                  {node.userCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] flex items-center gap-1">
                      <Users className="w-2.5 h-2.5" />
                      {node.userCount}
                    </span>
                  )}
                  {node.computerCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] flex items-center gap-1">
                      <Monitor className="w-2.5 h-2.5" />
                      {node.computerCount}
                    </span>
                  )}
                </div>
              </div>

              {hasChildren && isExpanded && node.children && (
                <div className="mt-0.5">
                  {renderTreeNodes(node.children, level + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">โครงสร้างหน่วยงาน (Organizational Units - OUs)</h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
              Read-Only Tree
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            แผนผังโครงสร้างการจัดเก็บออบเจกต์ใน Active Directory โรงพยาบาลสามชุก (Windows Server 2025)
          </p>
        </div>
      </div>

      {/* Grid: Tree on Left, Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Tree Explorer */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <FolderTree className="w-4 h-4 text-teal-600" />
              <span>ผังไดเรกทอรี (Directory Tree)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">DC=samchuk,DC=local</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span>กำลังโหลดผังไดเรกทอรี OU...</span>
              </div>
            </div>
          ) : error ? (
            <div className="py-8 px-3 text-center bg-rose-50/50 rounded-lg border border-rose-200">
              <div className="flex flex-col items-center justify-center gap-1.5 max-w-xs mx-auto">
                <AlertCircle className="w-6 h-6 text-rose-500" />
                <span className="font-semibold text-rose-900 text-xs">โหลดโครงสร้าง OU ไม่สำเร็จ</span>
                <p className="text-[11px] text-rose-700">{error}</p>
                <button
                  onClick={loadOus}
                  className="mt-2 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold"
                >
                  ลองใหม่อีกครั้ง
                </button>
              </div>
            </div>
          ) : ouTree.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              ไม่พบโครงสร้างหน่วยงาน OU ในระบบ
            </div>
          ) : (
            renderTreeNodes(ouTree)
          )}
        </div>

        {/* Right Details Panel */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-5">
          {selectedOu ? (
            <>
              {/* OU Title & Description */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                      <Folder className="w-5 h-5 fill-teal-100" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">{selectedOu.name}</h2>
                      <div className="text-xs text-slate-500">{selectedOu.description}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Active Directory OU</span>
                  </span>
                </div>
              </div>

              {/* Distinguished Name */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 font-mono text-[11px]">
                <div className="text-slate-400 text-[10px] font-sans font-medium uppercase tracking-wider">
                  Distinguished Name (DN):
                </div>
                <div className="text-slate-800 break-all bg-white p-2 rounded border border-slate-200">
                  {selectedOu.distinguishedName}
                </div>
                {selectedOu.parentDn && (
                  <div className="pt-2 text-[10px] text-slate-500 font-sans">
                    Parent OU: <span className="font-mono text-slate-700">{selectedOu.parentDn}</span>
                  </div>
                )}
              </div>

              {/* Counts & Security Flags */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block">จำนวนผู้ใช้งาน (Users):</span>
                  <span className="text-base font-bold text-slate-800 mt-0.5">{selectedOu.userCount} บัญชี</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block">เครื่องคอมพิวเตอร์:</span>
                  <span className="text-base font-bold text-slate-800 mt-0.5">{selectedOu.computerCount} เครื่อง</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block">หน่วยงานย่อย (Sub-OUs):</span>
                  <span className="text-base font-bold text-slate-800 mt-0.5">{selectedOu.children?.length || 0} แห่ง</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block">การป้องกันการลบ:</span>
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Protected
                  </span>
                </div>
              </div>

              {/* Sub-OU Children List */}
              {selectedOu.children && selectedOu.children.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                    หน่วยงานย่อยในสังกัด ({selectedOu.children.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedOu.children.map(child => (
                      <div
                        key={child.id}
                        onClick={() => setSelectedOu(child)}
                        className="p-3 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 cursor-pointer transition-colors flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-amber-500 fill-amber-100" />
                          <div>
                            <div className="font-semibold text-slate-800">{child.name}</div>
                            <div className="text-[11px] text-slate-500">{child.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>{child.userCount} บัญชี</span>
                          <span>•</span>
                          <span>{child.computerCount} เครื่อง</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Boundary Notice */}
              <div className="p-3.5 bg-slate-900 text-slate-300 rounded-xl text-xs space-y-1.5">
                <div className="font-semibold text-teal-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>OU Security & Delegation Policy (Phase 4 Preparation)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ในอนาคต (Phase 4) สิทธิ์ในการสร้างหรือแก้ไขผู้ใช้จะถูกมอบหมายแบบเฉพาะเจาะจง (Delegated Administration) 
                  ไปยัง OU ที่ได้รับอนุญาต เช่น <code>OU=Nursing</code> หรือ <code>OU=Administration</code> เท่านั้น 
                  โดยจะไม่สามารถแก้ไข Root OU, Domain Controllers OU หรือ Built-in Protected Groups ได้
                </p>
              </div>

            </>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              เลือกหน่วยงานในผังด้านซ้ายเพื่อดูรายละเอียด
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
