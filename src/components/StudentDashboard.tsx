import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Calendar, 
  Download, 
  Sliders, 
  Search, 
  Filter, 
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../lib/supabase';
import { calculateAttendance, getMonthlyAttendanceTrends } from '../lib/attendanceCalculations';
import { AttendanceRecord, Subject } from '../types/attendance';
import { AttendanceBadge } from './AttendanceBadge';

export const StudentDashboard: React.FC = () => {
  const { user, threshold, setThreshold } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters for session history table
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);

  // Load attendance records for current student
  const student = user?.student;

  useEffect(() => {
    const loadData = async () => {
      if (!student) return;
      setIsLoading(true);
      try {
        const [allSubjects, studentRecords] = await Promise.all([
          dbService.getSubjects(),
          dbService.getAttendanceRecords({ student_id: student.id }),
        ]);

        // Filter subjects relevant to student's department or enrolled class
        const relevantSubjects = allSubjects.filter(
          s => s.department_id === student.department_id
        );
        setSubjects(relevantSubjects.length > 0 ? relevantSubjects : allSubjects);
        setRecords(studentRecords);
      } catch (e) {
        console.error('Failed to load student data:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [student]);

  // Attendance metrics calculation
  const summary = useMemo(() => {
    return calculateAttendance(records, subjects, threshold);
  }, [records, subjects, threshold]);

  // Monthly trends for Recharts
  const monthlyTrends = useMemo(() => {
    return getMonthlyAttendanceTrends(records);
  }, [records]);

  // Filtered session records
  const filteredRecords = useMemo(() => {
    return records
      .filter(r => {
        if (selectedSubjectFilter !== 'ALL' && r.subject_id !== selectedSubjectFilter) {
          return false;
        }
        if (selectedStatusFilter !== 'ALL' && r.status !== selectedStatusFilter) {
          return false;
        }
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const subjName = r.subject?.name?.toLowerCase() || '';
          const subjCode = r.subject?.code?.toLowerCase() || '';
          const dateStr = r.date.toLowerCase();
          return subjName.includes(term) || subjCode.includes(term) || dateStr.includes(term);
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, selectedSubjectFilter, selectedStatusFilter, searchTerm]);

  // Export CSV Report
  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = ['Date', 'Session', 'Subject Code', 'Subject Name', 'Status', 'Remarks'];
    const rows = records.map(r => [
      r.date,
      r.session,
      r.subject?.code || r.subject_id,
      `"${r.subject?.name || ''}"`,
      r.status,
      `"${r.remarks || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Report_${student?.register_no || 'student'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-28 bg-slate-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Student Profile Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">
              {student?.profile?.full_name || user?.profile?.full_name || 'Student Portal'}
            </h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {student?.register_no}
            </span>
          </div>
          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
            <span>{student?.department?.name || 'Information Technology'}</span>
            <span aria-hidden="true">·</span>
            <span>{student?.class?.name || 'B.Tech IT - 2nd Year'}</span>
            <span aria-hidden="true">·</span>
            <span>Roll No: <span className="font-mono">{student?.roll_no || 'N/A'}</span></span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowThresholdConfig(!showThresholdConfig)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Target: <span className="font-mono font-semibold">{threshold}%</span></span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Threshold Config Drawer */}
      {showThresholdConfig && (
        <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Configure Compliance Threshold:</span>
            <p className="text-slate-500 mt-0.5">Adjust the required university minimum attendance percentage to test warnings.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="range"
              min="50"
              max="90"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              className="w-40 accent-blue-600"
            />
            <span className="text-xs font-mono font-bold text-blue-800 bg-white px-2 py-1 rounded border border-blue-200">
              {threshold}%
            </span>
          </div>
        </div>
      )}

      {/* Shortage Warning Banner (When Below Threshold) */}
      {summary.is_low && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-amber-900">
                Attendance Shortage Notice: Below {threshold}% Threshold
              </h2>
              <span className="text-xs font-mono font-semibold text-amber-800">
                Current: {summary.overall_percentage}%
              </span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Your overall attendance is below the university requirement of {threshold}%. 
              {summary.sessions_needed_for_target > 0 && (
                <span className="font-semibold ml-1">
                  You must attend the next {summary.sessions_needed_for_target} consecutive classes without absence to regain eligibility.
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Overall Percentage */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Overall Attendance</span>
            <AttendanceBadge percentage={summary.overall_percentage} threshold={threshold} size="sm" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
              {summary.overall_percentage}%
            </span>
            <span className="text-xs text-slate-500">/ 100%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full ${summary.is_low ? 'bg-amber-500' : 'bg-blue-600'}`}
              style={{ width: `${Math.min(100, summary.overall_percentage)}%` }}
            />
          </div>
        </div>

        {/* Present Sessions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Present Sessions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
              {summary.present_count}
            </span>
            <span className="text-xs text-slate-500">sessions</span>
          </div>
          <p className="text-[11px] text-slate-500">Includes verified on-duty sessions</p>
        </div>

        {/* Absent Sessions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Absent Sessions</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
              {summary.absent_count}
            </span>
            <span className="text-xs text-slate-500">sessions</span>
          </div>
          <p className="text-[11px] text-slate-500">Unexcused & medical absences</p>
        </div>

        {/* Total Conducted Sessions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Total Conducted</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
              {summary.total_conducted}
            </span>
            <span className="text-xs text-slate-500">classes</span>
          </div>
          <p className="text-[11px] text-slate-500">Recorded by subject faculty</p>
        </div>
      </div>

      {/* Two Column Layout: Monthly Trend + Subject Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Attendance Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Attendance Progression</h2>
              <p className="text-xs text-slate-500">Monthly percentage vs {threshold}% requirement</p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Academic Term 2025
            </div>
          </div>

          <div className="h-64 w-full">
            {monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`${val ?? 0}%`, 'Attendance']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#2563eb" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#attGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No attendance trend records found yet.
              </div>
            )}
          </div>
        </div>

        {/* Subject-wise Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Subject Breakdown</h2>
              <p className="text-xs text-slate-500">Attendance performance per course</p>
            </div>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3.5">
            {summary.subject_breakdown.map((subj) => (
              <div key={subj.subject_id} className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="truncate mr-2">
                    <span className="text-xs font-bold text-slate-900">{subj.subject_code}</span>
                    <span className="text-xs text-slate-600 block truncate">{subj.subject_name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-mono font-bold ${subj.is_low ? 'text-amber-700' : 'text-blue-700'}`}>
                      {subj.percentage}%
                    </span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {subj.present_count}/{subj.total_conducted}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${subj.is_low ? 'bg-amber-500' : 'bg-blue-600'}`}
                    style={{ width: `${Math.min(100, subj.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Session Attendance History</h2>
            <p className="text-xs text-slate-500">Complete log of recorded class sessions</p>
          </div>

          {/* Table Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 w-44"
              />
            </div>

            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700 bg-white"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="On Duty">On Duty</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5">Date</th>
                <th className="py-2.5 px-3.5">Session</th>
                <th className="py-2.5 px-3.5">Subject</th>
                <th className="py-2.5 px-3.5">Faculty</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono tabular-nums font-medium text-slate-900">
                      {r.date}
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {r.session}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span className="font-semibold text-slate-900 mr-1.5">
                        {r.subject?.code || r.subject_id}
                      </span>
                      <span className="text-slate-500">{r.subject?.name}</span>
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600">
                      {r.faculty?.profile?.full_name || 'Assigned Faculty'}
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          r.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'On Duty'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500">
                      {r.remarks || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No attendance sessions found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
