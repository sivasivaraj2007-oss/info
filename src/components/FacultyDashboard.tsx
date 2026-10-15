import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, 
  X, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Users, 
  Save, 
  FileCheck,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../lib/supabase';
import { 
  ClassEntity, 
  Subject, 
  FacultySubject, 
  Student, 
  AttendanceSession, 
  AttendanceStatus,
  AttendanceRecord 
} from '../types/attendance';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const faculty = user?.faculty;

  const [activeTab, setActiveTab] = useState<'mark' | 'history'>('mark');
  const [assignments, setAssignments] = useState<FacultySubject[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  
  // Date & session for marking
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession>('Session 1');

  // Enrolled students in the selected class
  const [students, setStudents] = useState<Student[]>([]);
  const [studentMarks, setStudentMarks] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});
  
  // Existing session state
  const [isExistingSession, setIsExistingSession] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Past sessions history
  const [pastRecords, setPastRecords] = useState<AttendanceRecord[]>([]);

  // 1. Load Faculty Assignments
  useEffect(() => {
    const loadFacultyData = async () => {
      if (!faculty) return;
      setIsLoading(true);
      try {
        const [facAssignments, facAttendance] = await Promise.all([
          dbService.getFacultySubjects(faculty.id),
          dbService.getAttendanceRecords({ faculty_id: faculty.id }),
        ]);

        setAssignments(facAssignments);
        setPastRecords(facAttendance);
        if (facAssignments.length > 0 && !selectedAssignmentId) {
          setSelectedAssignmentId(facAssignments[0].id);
        }
      } catch (e) {
        console.error('Failed to load faculty assignments:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadFacultyData();
  }, [faculty]);

  // Current selected assignment (class & subject)
  const currentAssignment = useMemo(() => {
    return assignments.find(a => a.id === selectedAssignmentId);
  }, [assignments, selectedAssignmentId]);

  // 2. When assignment, date, or session changes, fetch enrolled students and check duplicate attendance
  useEffect(() => {
    const fetchClassStudentsAndExistingMarks = async () => {
      if (!currentAssignment || !currentAssignment.class_id) return;

      setIsLoading(true);
      setSaveMessage(null);
      try {
        const classStudents = await dbService.getStudents({ class_id: currentAssignment.class_id });
        const activeStudents = classStudents.filter(s => s.is_active);
        setStudents(activeStudents);

        // Check if attendance is already recorded for this (class, subject, date, session)
        const existingRecords = await dbService.getAttendanceRecords({
          class_id: currentAssignment.class_id,
          subject_id: currentAssignment.subject_id,
          date: selectedDate,
          session: selectedSession,
        });

        const marksMap: Record<string, { status: AttendanceStatus; remarks: string }> = {};

        if (existingRecords.length > 0) {
          setIsExistingSession(true);
          // Populate existing marks
          activeStudents.forEach(s => {
            const match = existingRecords.find(r => r.student_id === s.id);
            if (match) {
              marksMap[s.id] = { status: match.status, remarks: match.remarks || '' };
            } else {
              marksMap[s.id] = { status: 'Present', remarks: '' };
            }
          });
        } else {
          setIsExistingSession(false);
          // Default all to Present for convenient marking
          activeStudents.forEach(s => {
            marksMap[s.id] = { status: 'Present', remarks: '' };
          });
        }

        setStudentMarks(marksMap);
      } catch (err) {
        console.error('Failed to load roster:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassStudentsAndExistingMarks();
  }, [currentAssignment, selectedDate, selectedSession]);

  // Bulk actions
  const markAll = (status: AttendanceStatus) => {
    const updated = { ...studentMarks };
    students.forEach(s => {
      updated[s.id] = { ...updated[s.id], status };
    });
    setStudentMarks(updated);
  };

  const toggleStudentStatus = (studentId: string) => {
    setStudentMarks(prev => {
      const current = prev[studentId]?.status || 'Present';
      const next: AttendanceStatus = current === 'Present' ? 'Absent' : current === 'Absent' ? 'On Duty' : 'Present';
      return {
        ...prev,
        [studentId]: { ...prev[studentId], status: next },
      };
    });
  };

  const handleRemarkChange = (studentId: string, remarks: string) => {
    setStudentMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks },
    }));
  };

  // Submit attendance to database
  const handleSaveAttendance = async () => {
    if (!faculty || !currentAssignment) return;
    if (students.length === 0) {
      setSaveMessage({ type: 'error', text: 'No students enrolled in this class.' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const batch = students.map(s => ({
        student_id: s.id,
        class_id: currentAssignment.class_id,
        subject_id: currentAssignment.subject_id,
        faculty_id: faculty.id,
        date: selectedDate,
        session: selectedSession,
        status: studentMarks[s.id]?.status || 'Present',
        remarks: studentMarks[s.id]?.remarks || '',
      }));

      const res = await dbService.saveAttendanceBatch(batch);
      setIsExistingSession(true);

      // Refresh history records
      const refreshedHistory = await dbService.getAttendanceRecords({ faculty_id: faculty.id });
      setPastRecords(refreshedHistory);

      setSaveMessage({
        type: 'success',
        text: `Attendance recorded successfully for ${batch.length} students (${res.inserted} saved, ${res.updated} updated).`,
      });
    } catch (err: unknown) {
      setSaveMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save attendance.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Export Faculty CSV
  const handleExportFacultyCSV = () => {
    if (pastRecords.length === 0) return;
    const headers = ['Date', 'Session', 'Class', 'Subject Code', 'Subject Name', 'Student Name', 'Register No', 'Status'];
    const rows = pastRecords.map(r => [
      r.date,
      r.session,
      `"${r.class?.name || ''}"`,
      r.subject?.code || '',
      `"${r.subject?.name || ''}"`,
      `"${r.student?.profile?.full_name || ''}"`,
      r.student?.register_no || '',
      r.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Faculty_Attendance_Log_${faculty?.faculty_id || 'FAC'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Present and Absent counts for current mark sheet
  const currentPresentCount = students.filter(s => studentMarks[s.id]?.status === 'Present').length;
  const currentAbsentCount = students.filter(s => studentMarks[s.id]?.status === 'Absent').length;
  const currentOnDutyCount = students.filter(s => studentMarks[s.id]?.status === 'On Duty').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Faculty Profile Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">
              {faculty?.profile?.full_name || user?.profile?.full_name || 'Faculty Portal'}
            </h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {faculty?.faculty_id}
            </span>
          </div>
          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
            <span>{faculty?.designation || 'Faculty Member'}</span>
            <span aria-hidden="true">·</span>
            <span>{faculty?.department?.name || 'Information Technology'}</span>
            <span aria-hidden="true">·</span>
            <span>{faculty?.qualification || 'Ph.D.'}</span>
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('mark')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'mark'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mark Attendance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Conducted Sessions ({pastRecords.length})
          </button>
        </div>
      </div>

      {activeTab === 'mark' ? (
        <div className="space-y-6">
          {/* Class, Subject, Date, & Session Selectors */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Course / Subject Assignment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Course & Class
                </label>
                <select
                  value={selectedAssignmentId}
                  onChange={(e) => setSelectedAssignmentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  {assignments.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.subject?.code}: {a.subject?.name} ({a.class?.section || 'A'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Info (read-only display) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Class
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentAssignment?.class?.name || 'Class not selected'}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-medium"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attendance Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white font-mono"
                />
              </div>

              {/* Session / Period */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Session / Period
                </label>
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value as AttendanceSession)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="Session 1">Session 1 (08:30 - 09:30)</option>
                  <option value="Session 2">Session 2 (09:30 - 10:30)</option>
                  <option value="Session 3">Session 3 (10:45 - 11:45)</option>
                  <option value="Session 4">Session 4 (11:45 - 12:45)</option>
                  <option value="Session 5">Session 5 (01:45 - 02:45)</option>
                  <option value="Morning">Morning Full Half</option>
                  <option value="Afternoon">Afternoon Full Half</option>
                </select>
              </div>
            </div>

            {/* Duplicate Session Notification */}
            {isExistingSession && (
              <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3">
                <FileCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <span className="font-semibold">Existing Attendance Found: </span>
                  Attendance records for this date and session are already in the database. Any modifications made below will update the existing session entries without creating duplicate rows.
                </div>
              </div>
            )}
          </div>

          {/* Roster & Attendance Marking Panel */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Student Attendance Roster</h2>
                <p className="text-xs text-slate-500">
                  {students.length} students enrolled in {currentAssignment?.class?.name}
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => markAll('Present')}
                  className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => markAll('Absent')}
                  className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  Mark All Absent
                </button>
                <button
                  type="button"
                  onClick={() => markAll('On Duty')}
                  className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  Mark All On Duty
                </button>
              </div>
            </div>

            {/* Live Count Pill */}
            <div className="flex items-center gap-4 text-xs font-mono text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span>Present: <strong className="text-emerald-700">{currentPresentCount}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Absent: <strong className="text-rose-700">{currentAbsentCount}</strong></span>
              <span aria-hidden="true">·</span>
              <span>On Duty: <strong className="text-blue-700">{currentOnDutyCount}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Total: <strong className="text-slate-900">{students.length}</strong></span>
            </div>

            {/* Attendance Roster Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3.5 w-16">Roll No</th>
                    <th className="py-2.5 px-3.5 w-32">Register No</th>
                    <th className="py-2.5 px-3.5">Student Name</th>
                    <th className="py-2.5 px-3.5 w-48 text-center">Status Toggle</th>
                    <th className="py-2.5 px-3.5 w-44">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.map((student) => {
                    const mark = studentMarks[student.id] || { status: 'Present', remarks: '' };
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono tabular-nums text-slate-500">
                          {student.roll_no || '—'}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono font-medium text-slate-900">
                          {student.register_no}
                        </td>
                        <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                          {student.profile?.full_name || 'Enrolled Student'}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setStudentMarks(prev => ({
                                ...prev,
                                [student.id]: { ...prev[student.id], status: 'Present' }
                              }))}
                              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                mark.status === 'Present'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              P
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentMarks(prev => ({
                                ...prev,
                                [student.id]: { ...prev[student.id], status: 'Absent' }
                              }))}
                              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                mark.status === 'Absent'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              A
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentMarks(prev => ({
                                ...prev,
                                [student.id]: { ...prev[student.id], status: 'On Duty' }
                              }))}
                              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                                mark.status === 'On Duty'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              OD
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <input
                            type="text"
                            placeholder="Optional remark..."
                            value={mark.remarks}
                            onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                            className="w-full px-2 py-1 text-xs rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Save Button & Feedback Message */}
            {saveMessage && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  saveMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {saveMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{saveMessage.text}</span>
              </div>
            )}

            <div className="flex items-center justify-end pt-3">
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Submitting to Supabase...' : isExistingSession ? 'Update Attendance Records' : 'Save Attendance to Database'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* History & Reports Tab */
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Attendance Log by Faculty</h2>
              <p className="text-xs text-slate-500">Historical records of sessions marked under your credentials</p>
            </div>
            <button
              type="button"
              onClick={handleExportFacultyCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5">Date</th>
                  <th className="py-2.5 px-3.5">Session</th>
                  <th className="py-2.5 px-3.5">Subject</th>
                  <th className="py-2.5 px-3.5">Class</th>
                  <th className="py-2.5 px-3.5">Student</th>
                  <th className="py-2.5 px-3.5">Register No</th>
                  <th className="py-2.5 px-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pastRecords.length > 0 ? (
                  pastRecords.slice(0, 50).map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3.5 font-mono tabular-nums">{r.date}</td>
                      <td className="py-2 px-3.5">{r.session}</td>
                      <td className="py-2 px-3.5 font-semibold text-slate-900">
                        {r.subject?.code || r.subject_id}
                      </td>
                      <td className="py-2 px-3.5">{r.class?.name || 'Class'}</td>
                      <td className="py-2 px-3.5">{r.student?.profile?.full_name || 'Student'}</td>
                      <td className="py-2 px-3.5 font-mono">{r.student?.register_no}</td>
                      <td className="py-2 px-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                            r.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No attendance sessions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
