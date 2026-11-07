import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Clock, 
  X, 
  Download,
  AlertCircle
} from 'lucide-react';
import { AuditLogEntry } from '../../types/ad';
import { directoryApi, AuditFilterOptions } from '../../services/directoryApi';
import { formatThaiDateTime, formatUtcTime } from '../../utils/thaiDate';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [resultFilter, setResultFilter] = useState('All');
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const options: AuditFilterOptions = {
        actor: actorFilter,
        action: actionFilter,
        result: resultFilter,
        pageNumber,
        pageSize,
      };
      const res = await directoryApi.getAuditLogs(options);
      setLogs(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'เกิดข้อผิดพลาดในการโหลดบันทึกการตรวจสอบความปลอดภัย');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actorFilter, actionFilter, resultFilter, pageNumber, pageSize]);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">บันทึกการตรวจสอบระบบ (Audit Trails & Events)</h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
              Immutable Mock Logs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกประวัติการสืบค้น การเข้าถึง และเหตุการณ์ด้านความปลอดภัยในระบบบริหารจัดการ AD
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>ห้ามบันทึกรหัสผ่านหรือความลับลงใน Audit Log เด็ดขาด (Strict No-Secret Logging)</span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาตามชื่อผู้ดำเนินการ (Actor)..."
              value={actorFilter}
              onChange={(e) => {
                setActorFilter(e.target.value);
                setPageNumber(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPageNumber(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              <option value="All">ทุกการกระทำ (All Actions)</option>
              <option value="AUTH_LOGIN">AUTH_LOGIN (การเข้าสู่ระบบ)</option>
              <option value="USER_LIST_VIEW">USER_LIST_VIEW (สืบค้นรายการผู้ใช้)</option>
              <option value="USER_DETAILS_VIEW">USER_DETAILS_VIEW (เปิดดูข้อมูลผู้ใช้)</option>
              <option value="COMPUTER_LIST_VIEW">COMPUTER_LIST_VIEW (ดูเครื่องคอมพิวเตอร์)</option>
              <option value="OU_TREE_VIEW">OU_TREE_VIEW (ดูผังหน่วยงาน)</option>
              <option value="MUTATION_BLOCKED_PHASE1">MUTATION_BLOCKED_PHASE1 (สกัดกั้นคำสั่งเขียน)</option>
              <option value="SETTINGS_VIEW">SETTINGS_VIEW (ดูการตั้งค่า)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={resultFilter}
              onChange={(e) => {
                setResultFilter(e.target.value);
                setPageNumber(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              <option value="All">ทุกผลลัพธ์ (All Outcomes)</option>
              <option value="Success">Success (สำเร็จ)</option>
              <option value="Denied">Denied (ถูกปฏิเสธสิทธิ์)</option>
              <option value="SimulatedBlocked">SimulatedBlocked (บล็อกตาม Phase 1)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">เวลา (พ.ศ. / UTC)</th>
                <th className="py-3 px-4">ผู้ดำเนินการ (Actor & Role)</th>
                <th className="py-3 px-4">การกระทำ (Action)</th>
                <th className="py-3 px-4">เป้าหมาย (Target)</th>
                <th className="py-3 px-4">ผลลัพธ์</th>
                <th className="py-3 px-4">Client IP</th>
                <th className="py-3 px-4 text-right">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span className="font-medium text-slate-600">กำลังโหลดบันทึกการตรวจสอบความปลอดภัย...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center bg-rose-50/50">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                      <ShieldAlert className="w-8 h-8 text-rose-500" />
                      <div className="font-semibold text-rose-900 text-sm">ไม่สามารถโหลดบันทึกการตรวจสอบได้</div>
                      <p className="text-xs text-rose-700">{error}</p>
                      <button
                        onClick={loadLogs}
                        className="mt-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      >
                        ลองใหม่อีกครั้ง (Retry)
                      </button>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <div className="font-semibold text-slate-700 text-sm">ไม่พบบันทึกการตรวจสอบ</div>
                      <p className="text-xs text-slate-500">
                        ไม่พบประวัติการเข้าถึงหรือดำเนินการที่ตรงกับเงื่อนไขการค้นหา
                      </p>
                      {(actorFilter || actionFilter !== 'All' || resultFilter !== 'All') && (
                        <button
                          onClick={() => {
                            setActorFilter('');
                            setActionFilter('All');
                            setResultFilter('All');
                            setPageNumber(1);
                          }}
                          className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-300 transition-colors"
                        >
                          ล้างตัวกรองทั้งหมด
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.requestId}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-slate-800 text-[11px]">
                        {formatThaiDateTime(log.timestampUtc)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatUtcTime(log.timestampUtc)}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{log.actor}</div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                        {log.actorRole}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-800 font-semibold text-[11px]">
                      {log.action}
                    </td>

                    <td className="py-3 px-4 text-slate-700 truncate max-w-xs text-[11px]">
                      {log.targetObject}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.result === 'Success' ? 'bg-emerald-100 text-emerald-800' :
                        log.result === 'SimulatedBlocked' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {log.result}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      {log.clientIp}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-slate-700 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>เปิดดู</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div>แสดง {logs.length} รายการ จากทั้งหมด {totalCount} รายการ</div>
          <div className="flex items-center gap-2">
            <span>หน้า {pageNumber} จาก {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber(pageNumber - 1)}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pageNumber >= totalPages}
                onClick={() => setPageNumber(pageNumber + 1)}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base">รายละเอียดเหตุการณ์ความปลอดภัย (Audit Entry)</h3>
                <div className="text-xs text-slate-300 font-mono mt-0.5">
                  Request ID: {selectedLog.requestId}
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px]">Action:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedLog.action}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px]">Actor:</span>
                  <span className="font-semibold text-slate-900">{selectedLog.actor} ({selectedLog.actorRole})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px]">Outcome:</span>
                  <span className="font-bold text-slate-900">{selectedLog.result}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px]">Client IP:</span>
                  <span className="font-mono text-slate-900">{selectedLog.clientIp}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px]">Timestamp:</span>
                  <span className="font-mono text-slate-900">{formatThaiDateTime(selectedLog.timestampUtc)}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">คำอธิบายเหตุการณ์ (Event Details):</span>
                <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                  {selectedLog.details}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">โครงสร้างข้อมูล JSON สำหรับระบบ SIEM/Audit:</span>
                <pre className="p-3 bg-slate-900 text-teal-300 rounded-lg text-[10px] overflow-x-auto font-mono">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
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
