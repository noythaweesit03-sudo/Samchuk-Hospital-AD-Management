import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  UserPlus, 
  Edit3, 
  UserX, 
  Unlock, 
  KeyRound, 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  X, 
  Clock, 
  Building2, 
  Phone, 
  Mail, 
  Layers
} from 'lucide-react';
import { AdUser, AccountStatus } from '../../types/ad';
import { directoryApi, UserFilterOptions } from '../../services/directoryApi';
import { formatThaiDateTime } from '../../utils/thaiDate';
import { ActionPlannedModal } from '../../components/common/ActionPlannedModal';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<AdUser[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortBy, setSortBy] = useState<'displayName' | 'sAMAccountName' | 'department' | 'status'>('displayName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Detail Drawer / Modal
  const [selectedUser, setSelectedUser] = useState<AdUser | null>(null);

  // Planned Action Modal
  const [plannedAction, setPlannedAction] = useState<{
    isOpen: boolean;
    title: string;
    targetName?: string;
    type?: 'create' | 'edit' | 'disable' | 'unlock' | 'reset-password';
  }>({ isOpen: false, title: '' });

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const options: UserFilterOptions = {
        search,
        status: statusFilter,
        department: departmentFilter,
        pageNumber,
        pageSize,
        sortBy,
        sortOrder,
      };
      const result = await directoryApi.getUsers(options);
      setUsers(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้งานจาก Directory Service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, statusFilter, departmentFilter, pageNumber, pageSize, sortBy, sortOrder]);

  const handleOpenActionModal = (
    title: string, 
    targetName?: string, 
    type?: 'create' | 'edit' | 'disable' | 'unlock' | 'reset-password'
  ) => {
    setPlannedAction({
      isOpen: true,
      title,
      targetName,
      type,
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">จัดการข้อมูลผู้ใช้งาน (Active Directory Users)</h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
              Total: {totalCount} บัญชี
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            สืบค้นและตรวจสอบข้อมูลบัญชีผู้ใช้งานในสังกัดโรงพยาบาลสามชุก (โหมดอ่านอย่างเดียว Phase 1)
          </p>
        </div>

        {/* Create User Button (Visibly marked as planned) */}
        <div>
          <button
            onClick={() => handleOpenActionModal('สร้างบัญชีผู้ใช้ใหม่ (Create AD User)', undefined, 'create')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            title="ปุ่มนี้ล็อกไว้สำหรับ Phase 4 (ไม่มีการเขียนข้อมูล AD ใน Phase 1)"
          >
            <UserPlus className="w-4 h-4 text-slate-500" />
            <span>สร้างผู้ใช้ใหม่</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
              Phase 4 Planned
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, sAMAccountName, แผนก, รหัสพนักงาน..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageNumber(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPageNumber(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700"
            >
              <option value="All">ทุกสถานะบัญชี (All Statuses)</option>
              <option value="Enabled">เปิดใช้งาน (Enabled)</option>
              <option value="Disabled">ปิดการใช้งาน (Disabled)</option>
              <option value="LockedOut">ถูกระงับ/ล็อก (Locked Out)</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="md:col-span-4">
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPageNumber(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700"
            >
              <option value="All">ทุกกลุ่มงาน/ฝ่าย (All Departments)</option>
              <option value="การแพทย์">กลุ่มงานการแพทย์ (Medical Staff)</option>
              <option value="การพยาบาล">กลุ่มงานการพยาบาล (Nursing)</option>
              <option value="เภสัชกรรม">กลุ่มงานเภสัชกรรม (Pharmacy)</option>
              <option value="รังสี">งานรังสีการแพทย์ (Radiology)</option>
              <option value="คอมพิวเตอร์">ศูนย์เทคโนโลยีสารสนเทศ (IT)</option>
              <option value="บริหาร">กลุ่มงานบริหาร/เวชระเบียน/การเงิน</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th 
                  onClick={() => {
                    if (sortBy === 'displayName') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('displayName');
                      setSortOrder('asc');
                    }
                  }}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>ชื่อ-นามสกุล / ตำแหน่ง</span>
                    {sortBy === 'displayName' && <span className="text-[10px]">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                  </div>
                </th>
                <th 
                  onClick={() => {
                    if (sortBy === 'sAMAccountName') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('sAMAccountName');
                      setSortOrder('asc');
                    }
                  }}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>ชื่อบัญชี (sAMAccountName / UPN)</span>
                    {sortBy === 'sAMAccountName' && <span className="text-[10px]">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                  </div>
                </th>
                <th className="py-3 px-4">กลุ่มงาน / สังกัด (OU)</th>
                <th className="py-3 px-4">สถานะบัญชี (Status)</th>
                <th className="py-3 px-4">รหัสผ่านล่าสุด</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span className="font-medium text-slate-600">กำลังโหลดข้อมูลผู้ใช้งาน Active Directory...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center bg-rose-50/50">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                      <ShieldAlert className="w-8 h-8 text-rose-500" />
                      <div className="font-semibold text-rose-900 text-sm">ไม่สามารถโหลดข้อมูลผู้ใช้งานได้</div>
                      <p className="text-xs text-rose-700">{error}</p>
                      <button
                        onClick={loadUsers}
                        className="mt-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      >
                        ลองใหม่อีกครั้ง (Retry)
                      </button>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Users className="w-8 h-8 text-slate-300" />
                      <div className="font-semibold text-slate-700 text-sm">ไม่พบข้อมูลผู้ใช้งาน</div>
                      <p className="text-xs text-slate-500">
                        ไม่พบบัญชีผู้ใช้ที่ตรงกับคำค้นหาหรือเงื่อนไขตัวกรองที่คุณระบุ
                      </p>
                      {(search || statusFilter !== 'All' || departmentFilter !== 'All') && (
                        <button
                          onClick={() => {
                            setSearch('');
                            setStatusFilter('All');
                            setDepartmentFilter('All');
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
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Display Name & Title */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{user.displayName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{user.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {user.employeeId}</div>
                    </td>

                    {/* sAMAccountName / UPN */}
                    <td className="py-3 px-4 font-mono">
                      <div className="font-semibold text-slate-800 text-xs">{user.sAMAccountName}</div>
                      <div className="text-[10px] text-slate-500">{user.userPrincipalName}</div>
                    </td>

                    {/* Department / OU */}
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{user.department}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">{user.ouPath}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {user.status === 'Enabled' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          เปิดใช้งาน (Enabled)
                        </span>
                      )}
                      {user.status === 'Disabled' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                          <UserX className="w-3 h-3 text-slate-500" />
                          ปิดใช้งาน (Disabled)
                        </span>
                      )}
                      {user.status === 'LockedOut' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          <Lock className="w-3 h-3 text-red-600" />
                          บัญชีถูกล็อก ({user.badPasswordCount} ครั้ง)
                        </span>
                      )}
                    </td>

                    {/* Password Last Set */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {formatThaiDateTime(user.passwordLastSet)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                          title="ดูรายละเอียดบัญชี"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenActionModal('แก้ไขข้อมูลผู้ใช้ (Edit AD User)', user.displayName, 'edit')}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="แก้ไขข้อมูล (Phase 4 Planned)"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {user.status === 'LockedOut' && (
                          <button
                            onClick={() => handleOpenActionModal('ปลดล็อกบัญชี (Unlock AD Account)', user.displayName, 'unlock')}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                            title="ปลดล็อกบัญชี (Phase 4 Planned)"
                          >
                            <Unlock className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenActionModal('รีเซ็ตรหัสผ่าน (Reset Password)', user.displayName, 'reset-password')}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="รีเซ็ตรหัสผ่าน (Phase 4 Planned)"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>แสดง</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageNumber(1);
              }}
              className="border border-slate-300 rounded px-2 py-1 bg-white text-xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>รายการต่อหน้า (ทั้งหมด {totalCount} รายการ)</span>
          </div>

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

      {/* User Detail Drawer / Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg">
                  {selectedUser.firstName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base">{selectedUser.displayName}</h3>
                  <div className="text-xs text-slate-300 font-mono mt-0.5">
                    {selectedUser.sAMAccountName} • {selectedUser.userPrincipalName}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">สถานะบัญชีในระบบ:</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                    selectedUser.status === 'Enabled' ? 'bg-emerald-100 text-emerald-800' :
                    selectedUser.status === 'LockedOut' ? 'bg-red-100 text-red-800' :
                    'bg-slate-200 text-slate-800'
                  }`}>
                    {selectedUser.status}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-500">
                  UAC Flags: {selectedUser.uacFlags.join(', ')} ({selectedUser.userAccountControl})
                </div>
              </div>

              {/* General Attributes */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>ข้อมูลตำแหน่งและหน่วยงาน</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">ตำแหน่ง / สายงาน:</span>
                    <span className="font-semibold text-slate-800">{selectedUser.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">กลุ่มงาน / ฝ่าย:</span>
                    <span className="font-semibold text-slate-800">{selectedUser.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">สถานที่ปฏิบัติงาน:</span>
                    <span className="font-semibold text-slate-800">{selectedUser.office}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">เบอร์โทรศัพท์ภายใน:</span>
                    <span className="font-semibold text-slate-800">{selectedUser.telephoneNumber}</span>
                  </div>
                </div>
              </div>

              {/* AD Directory Attributes */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>ข้อมูลทางเทคนิคใน Active Directory (LDAP Attributes)</span>
                </h4>
                <div className="space-y-2 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Distinguished Name (DN):</span>
                    <span className="text-slate-800 break-all">{selectedUser.distinguishedName}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Password Last Set:</span>
                      <span className="text-slate-700">{formatThaiDateTime(selectedUser.passwordLastSet)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Bad Password Count:</span>
                      <span className="text-slate-700">{selectedUser.badPasswordCount} ครั้ง</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Approx. Last Logon:</span>
                      <span className="text-slate-700">{formatThaiDateTime(selectedUser.lastLogonTimestamp)}</span>
                      <span className="text-[10px] text-amber-700 block font-sans">
                        *(ค่าโดยประมาณตาม replication)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Object Created:</span>
                      <span className="text-slate-700">{formatThaiDateTime(selectedUser.createdDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Memberships */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5">
                  การเป็นสมาชิกกลุ่มสิทธิ์ (Group Memberships - {selectedUser.memberOf.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedUser.memberOf.map((grp) => (
                    <span 
                      key={grp}
                      className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-mono font-medium"
                    >
                      {grp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  ปุ่มการดำเนินการ (แก้ไข/ระงับ/รีเซ็ตรหัสผ่าน) ในหน้านี้เป็นโหมดสาธิต การเปลี่ยนแปลงจริงในไดเรกทอรีจะเปิดให้ใช้งานใน Phase 4 ภายหลังผ่านการตรวจสอบ Delegated OU และ MFA
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedUser.status === 'LockedOut' && (
                  <button
                    onClick={() => handleOpenActionModal('ปลดล็อกบัญชี (Unlock Account)', selectedUser.displayName, 'unlock')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>ปลดล็อกบัญชี (Phase 4 Planned)</span>
                  </button>
                )}
                <button
                  onClick={() => handleOpenActionModal('รีเซ็ตรหัสผ่าน (Reset Password)', selectedUser.displayName, 'reset-password')}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                  <span>รีเซ็ตรหัสผ่าน (Phase 4 Planned)</span>
                </button>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                ปิด
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Planned Action Modal */}
      <ActionPlannedModal
        isOpen={plannedAction.isOpen}
        onClose={() => setPlannedAction({ isOpen: false, title: '' })}
        actionTitle={plannedAction.title}
        targetName={plannedAction.targetName}
        actionType={plannedAction.type}
      />
    </div>
  );
};
