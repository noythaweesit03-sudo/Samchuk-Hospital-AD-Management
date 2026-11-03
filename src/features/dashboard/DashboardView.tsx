import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Monitor, 
  FolderTree, 
  UsersRound, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  RefreshCw, 
  Server, 
  CheckCircle2, 
  ExternalLink,
  ArrowRight,
  Clock,
  Activity
} from 'lucide-react';
import { DashboardSummary, AuditLogEntry } from '../../types/ad';
import { directoryApi } from '../../services/directoryApi';
import { formatThaiDateTime } from '../../utils/thaiDate';

interface DashboardViewProps {
  onNavigate: (page: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentAudits, setRecentAudits] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const data = await directoryApi.getDashboardSummary();
      const audits = await directoryApi.getAuditLogs({ pageSize: 5 });
      setSummary(data);
      setRecentAudits(audits.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading || !summary) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200 rounded-xl"></div>
          <div className="h-28 bg-slate-200 rounded-xl"></div>
          <div className="h-28 bg-slate-200 rounded-xl"></div>
          <div className="h-28 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Title & Top Metadata Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">แดชบอร์ดภาพรวมระบบ Active Directory</h1>
            <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              Phase 1 Mock
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            สรุปข้อมูลสถิติและสถานะการจำลองระบบไดเรกทอรี โรงพยาบาลสามชุก (Samchuk Hospital)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-[11px] text-slate-500 hidden sm:block">
            <div>แหล่งข้อมูล: <strong className="text-slate-700">ข้อมูลสังเคราะห์ (Synthetic Mock)</strong></div>
            <div>อัปเดตล่าสุด: {formatThaiDateTime(summary.serviceStatus.lastRefreshedUtc)}</div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>
      </div>

      {/* 4 Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Users Card */}
        <div 
          onClick={() => onNavigate('users')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-teal-500 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">บัญชีผู้ใช้งาน (Users)</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{summary.userStats.total}</div>
            </div>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-medium">เปิดใช้งาน: {summary.userStats.enabled}</span>
            <span className="text-slate-500">ปิดใช้งาน: {summary.userStats.disabled}</span>
            <span className="text-red-600 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              ถูกล็อก: {summary.userStats.lockedOut}
            </span>
          </div>
        </div>

        {/* Computers Card */}
        <div 
          onClick={() => onNavigate('computers')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">เครื่องคอมพิวเตอร์ (Computers)</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{summary.computerStats.total}</div>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Monitor className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-600">Workstation: {summary.computerStats.workstations}</span>
            <span className="text-slate-600">Server: {summary.computerStats.servers}</span>
            <span className="text-emerald-700 font-medium">Active: {summary.computerStats.enabled}</span>
          </div>
        </div>

        {/* Groups Card */}
        <div 
          onClick={() => onNavigate('groups')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-purple-500 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">กลุ่มสิทธิ์ (Groups)</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{summary.groupStats.total}</div>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <UsersRound className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-purple-700 font-medium">Security Groups: {summary.groupStats.security}</span>
            <span className="text-slate-500">Distribution: {summary.groupStats.distribution}</span>
          </div>
        </div>

        {/* OUs Card */}
        <div 
          onClick={() => onNavigate('ous')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-amber-500 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">หน่วยงาน (Organizational Units)</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{summary.ouStats.totalOus}</div>
            </div>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <FolderTree className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-amber-800 font-medium">Samchuk Hospital Domain</span>
            <span className="text-slate-500 flex items-center gap-1">ดูโครงสร้างต้นไม้ &rarr;</span>
          </div>
        </div>

      </div>

      {/* Middle Section: Mock Service Status & Architecture Gates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Service Connectivity Status Box */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-800">สถานะการเชื่อมต่อบริการ (Mock Service Status)</h2>
            </div>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
              Phase 1 Standalone
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[11px]">Domain Controller</div>
              <div className="font-semibold text-slate-800 mt-0.5">{summary.serviceStatus.domainController}</div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-mono text-[10px]">Addr: {summary.serviceStatus.dcAddressMock}</span>
                <span className="text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-medium">
                  {summary.serviceStatus.dcStatus}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[11px]">LDAPS Protocol</div>
              <div className="font-semibold text-slate-800 mt-0.5">TLS Port 636 (Read-Only LDAPS)</div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">CA Validation:</span>
                <span className="text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded font-medium">
                  Phase 2 Gate
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[11px]">Audit Repository</div>
              <div className="font-semibold text-slate-800 mt-0.5">In-Memory Mock Repository</div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">SQL/PostgreSQL:</span>
                <span className="text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded font-medium">
                  TBD (Phase 2/3)
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[11px]">Independent Backend</div>
              <div className="font-semibold text-slate-800 mt-0.5">ASP.NET Core Web API (Separate Host)</div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">No Gateway Coupling:</span>
                <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-medium">
                  Enforced
                </span>
              </div>
            </div>

          </div>

          <div className="bg-slate-900 text-slate-300 p-3 rounded-lg text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-100">นโยบายความปลอดภัยสูงสุด:</span>
              <p className="text-[11px] text-slate-400">
                ระบบจะไม่ต่อตรงกับ Active Directory หรือส่งแพ็กเก็ตไปยัง IP 10.2.0.22 จนกว่าจะมีการตรวจสอบความพร้อมของเซิร์ฟเวอร์แอปพลิเคชัน ใบรับรองดิจิทัล CA และเส้นทางเครือข่ายใน Phase 2
              </p>
            </div>
          </div>
        </div>

        {/* Development Phases Progression */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800">ขั้นตอนการพัฒนา (Development Gates)</h2>
            <button 
              onClick={() => onNavigate('settings')}
              className="text-teal-600 hover:text-teal-700 text-xs font-semibold flex items-center gap-1"
            >
              <span>รายละเอียด</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <div>
                <div className="font-bold text-teal-900 flex items-center gap-2">
                  <span>Phase 1 (ปัจจุบัน): Mock-only</span>
                  <span className="text-[9px] bg-teal-700 text-white px-1.5 py-0.2 rounded">กำลังทำงาน</span>
                </div>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  UI สมบูรณ์ภาษาไทย, ข้อมูลจำลอง, Typed Contracts, ไม่เชื่อมต่อ AD จริง
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5 opacity-80">
              <span className="w-5 h-5 rounded-full bg-slate-400 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <div>
                <div className="font-semibold text-slate-700">Phase 2: Live Read-Only Diagnostics</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ตรวจสอบ Application Server, DNS, CA Chain, เชื่อมต่อ LDAPS พอร์ต 636 โหมดอ่านอย่างเดียว
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5 opacity-70">
              <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                3
              </span>
              <div>
                <div className="font-semibold text-slate-600">Phase 3: Production Auth & Hardening</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ยืนยันตัวตนด้วย MFA จริง, ติดตั้งฐานข้อมูล Audit Log ถาวร, ทดสอบ Performance
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5 opacity-60">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                4
              </span>
              <div>
                <div className="font-semibold text-slate-500">Phase 4: Delegated Write Operations</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  จำกัดสิทธิ์เฉพาะ OU ที่ได้รับอนุมัติ, Dual-Approval สำหรับ Unlock/Reset, สำรองข้อมูล
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Section: Recent Simulated Audit Logs */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-800">บันทึกการตรวจสอบล่าสุด (Simulated Audit Trail)</h2>
          </div>
          <button
            onClick={() => onNavigate('audit')}
            className="text-teal-600 hover:text-teal-700 text-xs font-semibold flex items-center gap-1"
          >
            <span>ดูบันทึกทั้งหมด ({recentAudits.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">เวลา (พ.ศ. / ICT)</th>
                <th className="py-2.5 px-3">ผู้ดำเนินการ (Actor)</th>
                <th className="py-2.5 px-3">การกระทำ (Action)</th>
                <th className="py-2.5 px-3">เป้าหมาย (Target)</th>
                <th className="py-2.5 px-3">ผลลัพธ์ (Outcome)</th>
                <th className="py-2.5 px-3">IP เครื่อง (Client IP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentAudits.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {formatThaiDateTime(log.timestampUtc)}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-800">{log.actor}</span>
                    <span className="text-[10px] text-slate-400 block">{log.actorRole}</span>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px] text-slate-800">
                    {log.action}
                  </td>
                  <td className="py-2 px-3 truncate max-w-xs text-slate-600">
                    {log.targetObject}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.result === 'Success' ? 'bg-emerald-100 text-emerald-800' :
                      log.result === 'SimulatedBlocked' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {log.result}
                    </span>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                    {log.clientIp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
