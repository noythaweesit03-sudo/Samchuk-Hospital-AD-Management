import React, { useState, useEffect } from 'react';
import { 
  UsersRound, 
  Search, 
  Filter, 
  ShieldCheck, 
  Mail, 
  User, 
  Layers, 
  ExternalLink, 
  X,
  Info,
  Network
} from 'lucide-react';
import { AdGroup, GroupScope, GroupType } from '../../types/ad';
import { directoryApi, GroupFilterOptions } from '../../services/directoryApi';

export const GroupsView: React.FC = () => {
  const [groups, setGroups] = useState<AdGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const [selectedGroup, setSelectedGroup] = useState<AdGroup | null>(null);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const options: GroupFilterOptions = {
        search,
        scope: scopeFilter,
        type: typeFilter,
      };
      const data = await directoryApi.getGroups(options);
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [search, scopeFilter, typeFilter]);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">กลุ่มสิทธิ์ความปลอดภัย (AD Security & Distribution Groups)</h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
              Total: {groups.length} กลุ่ม
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดการและตรวจสอบกลุ่มสิทธิ์ความปลอดภัย (Security Groups) และกลุ่มกระจายอีเมล (Distribution Groups)
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อกลุ่มสิทธิ์, sAMAccountName, คำอธิบาย..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              <option value="All">ทุกประเภทกลุ่ม (All Types)</option>
              <option value="Security">Security (กลุ่มสิทธิ์ความปลอดภัย)</option>
              <option value="Distribution">Distribution (กลุ่มกระจายข่าวสาร/เมล)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              <option value="All">ทุกขอบเขต (All Scopes)</option>
              <option value="Global">Global Group</option>
              <option value="Universal">Universal Group</option>
              <option value="DomainLocal">Domain Local Group</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            กำลังโหลดข้อมูลกลุ่มสิทธิ์...
          </div>
        ) : groups.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            ไม่พบกลุ่มสิทธิ์ตามเงื่อนไขที่กำหนด
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-teal-500 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="font-mono font-bold text-slate-900 text-xs truncate">
                    {group.sAMAccountName}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                    group.type === 'Security' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {group.type}
                  </span>
                </div>

                <div className="text-slate-800 font-semibold text-xs mt-1">
                  {group.displayName}
                </div>

                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {group.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                  Scope: {group.scope}
                </span>

                <div className="flex items-center gap-2">
                  {group.nestedGroups.length > 0 && (
                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded flex items-center gap-1 font-semibold">
                      <Network className="w-2.5 h-2.5" />
                      {group.nestedGroups.length} Nested
                    </span>
                  )}
                  <span className="font-semibold text-slate-800">
                    {group.memberCount} สมาชิก
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Group Detail Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                  <UsersRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-mono">{selectedGroup.sAMAccountName}</h3>
                  <div className="text-xs text-slate-300">{selectedGroup.displayName}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">ประเภทกลุ่ม (Group Type):</span>
                  <span className="font-semibold text-slate-800">{selectedGroup.type} Group</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ขอบเขตกลุ่ม (Group Scope):</span>
                  <span className="font-semibold text-slate-800">{selectedGroup.scope} Scope</span>
                </div>
                {selectedGroup.mailAddress && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">อีเมลกลุ่ม (Mail Address):</span>
                    <span className="font-mono text-slate-800">{selectedGroup.mailAddress}</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[11px]">
                <span className="text-slate-400 block text-[10px] font-sans">Distinguished Name (DN):</span>
                <span className="text-slate-800 break-all">{selectedGroup.distinguishedName}</span>
              </div>

              {/* Nested Groups */}
              {selectedGroup.nestedGroups.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Network className="w-4 h-4 text-amber-600" />
                    <span>กลุ่มที่ซ้อนอยู่ (Nested Groups - {selectedGroup.nestedGroups.length})</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedGroup.nestedGroups.map(ng => (
                      <span key={ng} className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-mono font-medium">
                        {ng}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Members */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  รายชื่อสมาชิกในกลุ่ม (Members - {selectedGroup.members.length} บัญชีที่แสดงผล)
                </h4>
                {selectedGroup.members.length === 0 ? (
                  <div className="text-slate-400 text-center py-4 bg-slate-50 rounded-lg border border-slate-200">
                    ไม่มีสมาชิกระดับตรง หรือเป็นกลุ่มกระจายข่าวสารภาพรวม
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedGroup.members.map((m) => (
                      <div key={m.id} className="p-3 bg-white flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <div>
                            <span className="font-semibold text-slate-800">{m.displayName}</span>
                            <span className="font-mono text-[10px] text-slate-400 block">({m.sAMAccountName})</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">{m.department}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
              <button
                onClick={() => setSelectedGroup(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
