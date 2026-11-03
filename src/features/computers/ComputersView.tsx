import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  HardDrive, 
  Server, 
  Info,
  X
} from 'lucide-react';
import { AdComputer } from '../../types/ad';
import { directoryApi, ComputerFilterOptions } from '../../services/directoryApi';
import { formatThaiDateTime } from '../../utils/thaiDate';

export const ComputersView: React.FC = () => {
  const [computers, setComputers] = useState<AdComputer[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  const [search, setSearch] = useState<string>('');
  const [osFilter, setOsFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [selectedComputer, setSelectedComputer] = useState<AdComputer | null>(null);

  const loadComputers = async () => {
    setLoading(true);
    try {
      const options: ComputerFilterOptions = {
        search,
        operatingSystem: osFilter,
        status: statusFilter,
        pageNumber,
        pageSize,
      };
      const result = await directoryApi.getComputers(options);
      setComputers(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComputers();
  }, [search, osFilter, statusFilter, pageNumber, pageSize]);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">เครื่องคอมพิวเตอร์และเซิร์ฟเวอร์ (AD Computers)</h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
              Total: {totalCount} เครื่อง
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            รายการอุปกรณ์คอมพิวเตอร์ลูกข่ายและเซิร์ฟเวอร์ที่ผูกเข้าร่วมโดเมน Active Directory โรงพยาบาลสามชุก
          </p>
        </div>
      </div>

      {/* Critical Security/Engineering Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-blue-950">
            ข้อพึงระวังเกี่ยวกับแอตทริบิวต์ lastLogonTimestamp:
          </span>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            ค่าวันเวลาเข้าสู่ระบบล่าสุดใน Active Directory เกิดจากการซิงค์แบบ Replication Cycle (โดยทั่วไปมีรอบการอัปเดตทุก 9–14 วัน เพื่อลดทราฟฟิกในเครือข่าย) 
            <strong>ระบบนี้จะไม่นำค่านั้นมาตีความสถานะ Online/Offline แบบเรียลไทม์</strong> เพื่อป้องกันความเข้าใจผิดในงานสารสนเทศ
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อเครื่อง, DNS Host Name, จุดติดตั้ง..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageNumber(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={osFilter}
              onChange={(e) => {
                setOsFilter(e.target.value);
                setPageNumber(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              <option value="All">ทุกระบบปฏิบัติการ (All OS)</option>
              <option value="Windows 11">Windows 11</option>
              <option value="Windows 10">Windows 10</option>
              <option value="Windows Server">Windows Server</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPageNumber(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              <option value="All">ทุกสถานะบัญชีคอมพิวเตอร์</option>
              <option value="Enabled">เปิดใช้งาน (Enabled)</option>
              <option value="Disabled">ปิดใช้งาน (Disabled)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ชื่อเครื่อง (Computer Name / DNS)</th>
                <th className="py-3 px-4">ระบบปฏิบัติการ (OS)</th>
                <th className="py-3 px-4">จุดติดตั้ง / แผนก</th>
                <th className="py-3 px-4">สถานะบัญชี</th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <span>lastLogonTimestamp</span>
                    <span className="text-[10px] text-amber-700 font-normal bg-amber-100 px-1 rounded">(โดยประมาณ)</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-right">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span>กำลังโหลดรายการคอมพิวเตอร์...</span>
                    </div>
                  </td>
                </tr>
              ) : computers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    ไม่พบข้อมูลคอมพิวเตอร์ตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                computers.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {comp.operatingSystem.includes('Server') ? (
                          <Server className="w-4 h-4 text-purple-600 shrink-0" />
                        ) : (
                          <Monitor className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <div>
                          <span className="font-bold text-slate-900 font-mono">{comp.name}</span>
                          <span className="text-[11px] text-slate-500 block font-mono">{comp.dnsHostName}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{comp.operatingSystem}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Build {comp.operatingSystemVersion}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{comp.departmentTag}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-xs">{comp.ouPath}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {comp.status === 'Enabled' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          เปิดใช้งาน
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                          <XCircle className="w-3 h-3 text-slate-400" />
                          ปิดใช้งาน
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {comp.lastLogonTimestamp ? formatThaiDateTime(comp.lastLogonTimestamp) : 'ไม่ระบุ / นานเกินเกณฑ์'}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedComputer(comp)}
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
          <div>แสดง {computers.length} รายการ จากทั้งหมด {totalCount} รายการ</div>
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

      {/* Computer Detail Modal */}
      {selectedComputer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-mono">{selectedComputer.name}</h3>
                  <div className="text-xs text-slate-300 font-mono">{selectedComputer.dnsHostName}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedComputer(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">สถานะบัญชีเครื่อง:</span>
                  <span className="font-semibold text-slate-800">{selectedComputer.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">BitLocker Encryption:</span>
                  <span className={`font-semibold ${selectedComputer.bitLockerConfigured ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {selectedComputer.bitLockerConfigured ? 'เปิดใช้งาน (Configured)' : 'ไม่ได้เปิดใช้งาน'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">จุดติดตั้ง / แผนก:</span>
                  <span className="font-semibold text-slate-800">{selectedComputer.departmentTag}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">IP Address จำลอง (Mock Subnet):</span>
                  <span className="font-mono text-slate-800">{selectedComputer.ipAddressSimulated || 'DHCP'}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Distinguished Name (DN):</span>
                  <span className="text-slate-800 break-all">{selectedComputer.distinguishedName}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">OS Build:</span>
                    <span className="text-slate-700">{selectedComputer.operatingSystem} ({selectedComputer.operatingSystemVersion})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Joined Date:</span>
                    <span className="text-slate-700">{formatThaiDateTime(selectedComputer.createdDate)}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-1">
                <span className="font-semibold flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  คำเตือนการตรวจสอบสถานะเครื่อง (Live Status Limitation)
                </span>
                <p className="text-[11px] leading-relaxed">
                  Active Directory ไม่ใช่ระบบ Network Monitoring หรือ Asset Real-Time Agent ดังนั้นค่า lastLogonTimestamp 
                  ({formatThaiDateTime(selectedComputer.lastLogonTimestamp)}) จึงเป็นเพียงค่าที่ซิงค์ตามรอบเวลาเท่านั้น ไม่สามารถรับประกันได้ว่าเครื่องกำลังเปิดอยู่จริงในขณะนี้
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
              <button
                onClick={() => setSelectedComputer(null)}
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
