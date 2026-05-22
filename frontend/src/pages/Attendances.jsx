import { useState, useEffect, useMemo } from 'react';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  RiSearchLine, RiArrowUpLine, RiArrowDownLine,
  RiArrowUpDownLine, RiShieldCheckLine, RiUserLine,
  RiCalendarLine, RiTimeLine, RiRefreshLine,
} from 'react-icons/ri';
import Spinner from '../components/common/Spinner';

function canDo(action, targetUserId, currentUser) {
  if (currentUser.role === 'admin') return true;
  if (action === 'toggleAtt') return targetUserId?.toString() === currentUser._id?.toString();
  return false;
}

function WorkingBadge({ value }) {
  const on = value === 'Working';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
      ${on ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-emerald-500' : 'bg-red-400'}`} />
      {value}
    </span>
  );
}

function AttBadge({ value }) {
  const present = value === 'Present';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
      ${present ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${present ? 'bg-blue-500' : 'bg-amber-400'}`} />
      {value}
    </span>
  );
}

function RolePill({ role }) {
  const styles = {
    admin: 'bg-orange-50 text-orange-700',
    member: 'bg-sky-50 text-sky-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${styles[role] || 'bg-slate-100 text-slate-600'}`}>
      {role}
    </span>
  );
}

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <RiArrowUpDownLine className="inline ml-1 opacity-30 text-xs" />;
  return sortDir === 1
    ? <RiArrowUpLine className="inline ml-1 opacity-80 text-xs" />
    : <RiArrowDownLine className="inline ml-1 opacity-80 text-xs" />;
}

function StatCard({ label, value, color }) {
  const colors = {
    default: 'text-slate-800 dark:text-slate-100',
    green: 'text-emerald-600',
    red: 'text-red-500',
    blue: 'text-blue-600',
  };
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colors[color] || colors.default}`}>{value}</p>
    </div>
  );
}

export default function Attendance() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate]             = useState(todayStr);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [toggling, setToggling]     = useState(null);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [attFilter, setAttFilter]   = useState('');
  const [sortCol, setSortCol]       = useState('name');
  const [sortDir, setSortDir]       = useState(1);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { data } = await attendanceAPI.getByDate(date);
      setAttendance(data.attendance);
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAttendance(); }, [date]);

  const handleToggleAtt = async (row) => {
    const newStatus  = row.status === 'Present' ? 'Absent' : 'Present';
    const newWorking = newStatus === 'Present' ? 'Working' : 'Not Working';
    setToggling(row.userId);
    try {
      await attendanceAPI.mark({ userId: row.userId, date, status: newStatus, workingStatus: newWorking });
      setAttendance(prev => prev.map(r =>
        r.userId === row.userId ? { ...r, status: newStatus, workingStatus: newWorking } : r
      ));
      toast.success(`${row.name} marked as ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setToggling(null);
    }
  };

  const handleToggleWorking = async (row) => {
    const newWorking = row.workingStatus === 'Working' ? 'Not Working' : 'Working';
    setToggling(row.userId + '-w');
    try {
      await attendanceAPI.mark({ userId: row.userId, date, status: row.status, workingStatus: newWorking });
      setAttendance(prev => prev.map(r =>
        r.userId === row.userId ? { ...r, workingStatus: newWorking } : r
      ));
      toast.success(`${row.name} status updated`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setToggling(null);
    }
  };

  const handleSort = (col) => {
    setSortDir(prev => sortCol === col ? prev * -1 : 1);
    setSortCol(col);
  };

  const filtered = useMemo(() => {
    return attendance
      .filter(r =>
        (!search     || r.name.toLowerCase().includes(search.toLowerCase())) &&
        (!roleFilter || r.role === roleFilter) &&
        (!attFilter  || r.status === attFilter)
      )
      .sort((a, b) => {
        let av = a[sortCol] ?? '', bv = b[sortCol] ?? '';
        if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
        return av < bv ? -sortDir : av > bv ? sortDir : 0;
      });
  }, [attendance, search, roleFilter, attFilter, sortCol, sortDir]);

  const present = attendance.filter(r => r.status === 'Present').length;
  const absent  = attendance.filter(r => r.status === 'Absent').length;
  const working = attendance.filter(r => r.workingStatus === 'Working').length;
  const isToday = date === todayStr;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Attendance</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isToday ? "Today's attendance" : `Attendance for ${date}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RiCalendarLine className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={date}
            max={todayStr}
            onChange={e => setDate(e.target.value)}
            className="input w-auto"
          />
          {!isToday && (
            <button onClick={() => setDate(todayStr)} className="btn-secondary gap-1.5">
              <RiRefreshLine className="w-4 h-4" /> Today
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
        <RiShieldCheckLine className="text-slate-400 shrink-0" />
        {isAdmin
          ? 'Admin — you can mark attendance and toggle working status for all members'
          : 'Member — you can only update your own attendance'}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Members" value={attendance.length} color="blue" />
        <StatCard label="Present Today"  value={present}          color="blue"    />
        <StatCard label="Working"        value={working}          color="green"   />
        <StatCard label="Absent"         value={absent}           color="red"     />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-44">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
        <select className="input w-auto" value={attFilter} onChange={e => setAttFilter(e.target.value)}>
          <option value="">All Attendance</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
        </select>
        <span className="ml-auto text-xs text-slate-400">{filtered.length} of {attendance.length}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  {[
                    { key: 'name',          label: 'Name'           },
                    { key: 'role',          label: 'Role'           },
                    { key: 'status',        label: 'Attendance'     },
                    { key: 'workingStatus', label: 'Working Status' },
                    { key: 'checkIn',       label: 'Check In'       },
                  ].map(col => (
                    <th key={col.key} onClick={() => handleSort(col.key)}
                      className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:text-slate-700">
                      {col.label}
                      <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />
                    </th>
                  ))}
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!filtered.length ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                      <RiUserLine className="text-3xl mx-auto mb-2 opacity-30" />
                      No members found
                    </td>
                  </tr>
                ) : (
                  filtered.map(row => {
                    const isSelf         = row.userId?.toString() === currentUser._id?.toString();
                    const canAtt         = canDo('toggleAtt', row.userId, currentUser);
                    const isTogglingAtt  = toggling === row.userId;
                    const isTogglingWork = toggling === row.userId + '-w';
                    return (
                      <tr key={row.userId} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
<td className="px-5 py-3.5 text-sm font-semibold text-slate-950 dark:text-black">                          {row.name}
                          {isSelf && <span className="ml-1.5 text-xs text-slate-400 font-normal">(you)</span>}
                        </td>
                        <td className="px-5 py-3.5"><RolePill role={row.role} /></td>
                        <td className="px-5 py-3.5"><AttBadge value={row.status} /></td>
                        <td className="px-5 py-3.5"><WorkingBadge value={row.workingStatus} /></td>
                        <td className="px-5 py-3.5 text-xs text-slate-400">
                          {row.checkIn ? (
                            <span className="flex items-center gap-1">
                              <RiTimeLine className="w-3 h-3" />
                              {new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            {canAtt && (
                              <button onClick={() => handleToggleAtt(row)} disabled={isTogglingAtt}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50">
                                {isTogglingAtt && <Spinner size="sm" />}
                                Mark {row.status === 'Present' ? 'Absent' : 'Present'}
                              </button>
                            )}
                            {isAdmin && (
                              <button onClick={() => handleToggleWorking(row)} disabled={isTogglingWork}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50">
                                {isTogglingWork && <Spinner size="sm" />}
                                {row.workingStatus === 'Working' ? 'Set Not Working' : 'Set Working'}
                              </button>
                            )}
                            {!canAtt && !isAdmin && (
                              <span className="text-xs text-slate-300 dark:text-slate-600">No actions</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}