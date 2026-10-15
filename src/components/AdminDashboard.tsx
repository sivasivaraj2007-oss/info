import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Building2, 
  Layers, 
  CheckCircle, 
  XCircle, 
  ShieldAlert, 
  Settings,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../lib/supabase';
import { 
  Student, 
  Faculty, 
  Department, 
  ClassEntity, 
  Subject, 
  FacultySubject, 
  AttendanceRecord 
} from '../types/attendance';

export const AdminDashboard: React.FC = () => {
  const { threshold, setThreshold } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'faculty' | 'departments' | 'subjects' | 'reports'>('overview');

  const [students, setStudents] = useState<Student[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [facultySubjects, setFacultySubjects] = useState<FacultySubject[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAssignFacultyModal, setShowAssignFacultyModal] = useState(false);

  // Search & Filter States
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDeptFilter, setStudentDeptFilter] = useState('ALL');
  const [facultySearch, setFacultySearch] = useState('');

  // Form States
  const [newStudent, setNewStudent] = useState({
    register_no: '',
    full_name: '',
    email: '',
    phone: '',
    department_id: '',
    class_id: '',
    roll_no: '',
    admission_year: 2023,
  });

  const [newFaculty, setNewFaculty] = useState({
    faculty_id: '',
    full_name: '',
    email: '',
    phone: '',
    department_id: '',
    designation: 'Assistant Professor',
    qualification: 'M.Tech / Ph.D.',
  });

  const [newDept, setNewDept] = useState({
    code: '',
    name: '',
    hod_name: '',
  });

  const [newClass, setNewClass] = useState({
    name: '',
    department_id: '',
    batch_year: 2023,
    semester: 5,
    section: 'A',
    academic_year: '2025-2026',
  });

  const [newSubject, setNewSubject] = useState({
    code: '',
    name: '',
    department_id: '',
    semester: 5,
    credits: 3,
    total_hours: 45,
  });

  const [newAssignment, setNewAssignment] = useState({
    faculty_id: '',
    subject_id: '',
    class_id: '',
    academic_year: '2025-2026',
  });

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [
        depts,
        cls,
        subjs,
        studs,
        facs,
        facSubjs,
        att,
      ] = await Promise.all([
        dbService.getDepartments(),
        dbService.getClasses(),
        dbService.getSubjects(),
        dbService.getStudents(),
        dbService.getFaculty(),
        dbService.getFacultySubjects(),
        dbService.getAttendanceRecords(),
      ]);

      setDepartments(depts);
      setClasses(cls);
      setSubjects(subjs);
      setStudents(studs);
      setFacultyList(facs);
      setFacultySubjects(facSubjs);
      setAttendanceRecords(att);

      // Set default department dropdowns
      if (depts.length > 0) {
        setNewStudent(prev => ({ ...prev, department_id: depts[0].id }));
        setNewFaculty(prev => ({ ...prev, department_id: depts[0].id }));
        setNewClass(prev => ({ ...prev, department_id: depts[0].id }));
        setNewSubject(prev => ({ ...prev, department_id: depts[0].id }));
      }
      if (cls.length > 0) {
        setNewStudent(prev => ({ ...prev, class_id: cls[0].id }));
        setNewAssignment(prev => ({ ...prev, class_id: cls[0].id }));
      }
      if (facs.length > 0) {
        setNewAssignment(prev => ({ ...prev, faculty_id: facs[0].id }));
      }
      if (subjs.length > 0) {
        setNewAssignment(prev => ({ ...prev, subject_id: subjs[0].id }));
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (studentDeptFilter !== 'ALL' && s.department_id !== studentDeptFilter) return false;
      if (studentSearch.trim()) {
        const term = studentSearch.toLowerCase();
        const name = s.profile?.full_name?.toLowerCase() || '';
        const reg = s.register_no.toLowerCase();
        const roll = s.roll_no?.toLowerCase() || '';
        return name.includes(term) || reg.includes(term) || roll.includes(term);
      }
      return true;
    });
  }, [students, studentDeptFilter, studentSearch]);

  // Overall Institutional Average Attendance
  const institutionalAverage = useMemo(() => {
    if (attendanceRecords.length === 0) return 100;
    const present = attendanceRecords.filter(r => r.status === 'Present' || r.status === 'On Duty').length;
    return Number(((present / attendanceRecords.length) * 100).toFixed(1));
  }, [attendanceRecords]);

  // Handle Add Student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.addStudent(newStudent);
      setShowAddStudentModal(false);
      setNewStudent(prev => ({
        ...prev,
        register_no: '',
        full_name: '',
        email: '',
        roll_no: '',
      }));
      await loadAllData();
      alert('Student added successfully.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add student');
    }
  };

  // Handle Toggle Student Status
  const handleToggleStudent = async (student: Student) => {
    const nextStatus = !student.is_active;
    if (confirm(`Are you sure you want to ${nextStatus ? 'activate' : 'deactivate'} student ${student.register_no}?`)) {
      await dbService.updateStudentStatus(student.id, nextStatus);
      await loadAllData();
    }
  };

  // Handle Add Faculty
  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.addFaculty(newFaculty);
      setShowAddFacultyModal(false);
      setNewFaculty(prev => ({
        ...prev,
        faculty_id: '',
        full_name: '',
        email: '',
      }));
      await loadAllData();
      alert('Faculty member registered successfully.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add faculty');
    }
  };

  // Handle Toggle Faculty Status
  const handleToggleFaculty = async (faculty: Faculty) => {
    const nextStatus = !faculty.is_active;
    if (confirm(`Are you sure you want to ${nextStatus ? 'activate' : 'deactivate'} faculty ${faculty.faculty_id}?`)) {
      await dbService.updateFacultyStatus(faculty.id, nextStatus);
      await loadAllData();
    }
  };

  // Handle Add Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.addDepartment(newDept);
      setShowAddDeptModal(false);
      setNewDept({ code: '', name: '', hod_name: '' });
      await loadAllData();
      alert('Department created successfully.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add department');
    }
  };

  // Handle Add Class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.addClass(newClass);
      setShowAddClassModal(false);
      setNewClass(prev => ({ ...prev, name: '' }));
      await loadAllData();
      alert('Class added successfully.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add class');
    }
  };

  // Handle Add Subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.addSubject(newSubject);
      setShowAddSubjectModal(false);
      setNewSubject(prev => ({ ...prev, code: '', name: '' }));
      await loadAllData();
      alert('Subject added successfully.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add subject');
    }
  };

  // Handle Assign Faculty to Subject
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.assignFacultySubject(newAssignment);
      setShowAssignFacultyModal(false);
      await loadAllData();
      alert('Faculty successfully assigned to course and class.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Assignment failed');
    }
  };

  // Export Master Institutional Report CSV
  const handleExportMasterCSV = () => {
    if (attendanceRecords.length === 0) return;
    const headers = ['Record ID', 'Date', 'Session', 'Class', 'Subject Code', 'Subject Name', 'Student Name', 'Register No', 'Status', 'Remarks'];
    const rows = attendanceRecords.map(r => [
      r.id,
      r.date,
      r.session,
      `"${r.class?.name || ''}"`,
      r.subject?.code || '',
      `"${r.subject?.name || ''}"`,
      `"${r.student?.profile?.full_name || ''}"`,
      r.student?.register_no || '',
      r.status,
      `"${r.remarks || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Institutional_Master_Attendance_Report.csv`);
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
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">Central Academic Administration</h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Admin Console
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Institutional governance, role-based security, student directory & course assignments
          </p>
        </div>

        {/* Global Export & Reload */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportMasterCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Master Audit</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-6 text-sm font-medium">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'students', label: `Students (${students.length})` },
          { key: 'faculty', label: `Faculty (${facultyList.length})` },
          { key: 'departments', label: `Departments & Classes (${departments.length}/${classes.length})` },
          { key: 'subjects', label: `Subjects & Allocation (${subjects.length})` },
          { key: 'reports', label: 'Institutional Audit' },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 whitespace-nowrap relative transition-colors ${
              activeTab === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Institutional KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Enrolled Students</span>
                <GraduationCap className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
                {students.length}
              </div>
              <p className="text-[11px] text-slate-500">{students.filter(s => s.is_active).length} active</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Active Faculty</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
                {facultyList.length}
              </div>
              <p className="text-[11px] text-slate-500">Across {departments.length} departments</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Conducted Sessions</span>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
                {attendanceRecords.length}
              </div>
              <p className="text-[11px] text-slate-500">Total student session logs</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Institution Attendance Rate</span>
                <Building2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
                {institutionalAverage}%
              </div>
              <p className="text-[11px] text-slate-500">Compliance target: {threshold}%</p>
            </div>
          </div>

          {/* Quick Actions & Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Institutional Governance & Threshold</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                The university enforces a mandatory minimum attendance requirement for semester examination hall tickets.
              </p>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-800">Minimum Exam Eligibility Threshold</span>
                  <p className="text-[11px] text-slate-500">Applies to all student shortage warnings</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="50"
                    max="90"
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt(e.target.value, 10) || 75)}
                    className="w-16 px-2 py-1 text-xs font-mono font-bold rounded border border-slate-300 text-center bg-white"
                  />
                  <span className="text-xs font-semibold text-slate-700">%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Academic Structure Summary</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">Departments</span>
                  <span className="text-lg font-bold font-mono text-slate-900">{departments.length}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">Academic Classes</span>
                  <span className="text-lg font-bold font-mono text-slate-900">{classes.length}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">Total Subjects</span>
                  <span className="text-lg font-bold font-mono text-slate-900">{subjects.length}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">Faculty Allocations</span>
                  <span className="text-lg font-bold font-mono text-slate-900">{facultySubjects.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS MANAGEMENT */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Student Directory</h2>
              <p className="text-xs text-slate-500">Manage registered students, enrollment, and account status</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddStudentModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Student</span>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, register no..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 w-56"
              />
            </div>
            <select
              value={studentDeptFilter}
              onChange={(e) => setStudentDeptFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700 bg-white"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5">Register No</th>
                  <th className="py-2.5 px-3.5">Roll No</th>
                  <th className="py-2.5 px-3.5">Full Name</th>
                  <th className="py-2.5 px-3.5">Department</th>
                  <th className="py-2.5 px-3.5">Class</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono font-medium text-slate-900">{student.register_no}</td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-500">{student.roll_no || '—'}</td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-900">{student.profile?.full_name || 'Student'}</td>
                    <td className="py-2.5 px-3.5">{student.department?.code || 'CSE'}</td>
                    <td className="py-2.5 px-3.5">{student.class?.name || 'Class A'}</td>
                    <td className="py-2.5 px-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                        student.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {student.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleStudent(student)}
                        className={`text-xs font-semibold ${student.is_active ? 'text-rose-600 hover:text-rose-800' : 'text-emerald-600 hover:text-emerald-800'}`}
                      >
                        {student.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FACULTY MANAGEMENT */}
      {activeTab === 'faculty' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Faculty Directory</h2>
              <p className="text-xs text-slate-500">Manage teaching faculty members, designations, and account status</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddFacultyModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Faculty</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5">Faculty ID</th>
                  <th className="py-2.5 px-3.5">Name</th>
                  <th className="py-2.5 px-3.5">Department</th>
                  <th className="py-2.5 px-3.5">Designation</th>
                  <th className="py-2.5 px-3.5">Qualification</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {facultyList.map(faculty => (
                  <tr key={faculty.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono font-medium text-slate-900">{faculty.faculty_id}</td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-900">{faculty.profile?.full_name}</td>
                    <td className="py-2.5 px-3.5">{faculty.department?.name || 'CSE'}</td>
                    <td className="py-2.5 px-3.5">{faculty.designation}</td>
                    <td className="py-2.5 px-3.5">{faculty.qualification || 'Ph.D.'}</td>
                    <td className="py-2.5 px-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                        faculty.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {faculty.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleFaculty(faculty)}
                        className={`text-xs font-semibold ${faculty.is_active ? 'text-rose-600 hover:text-rose-800' : 'text-emerald-600 hover:text-emerald-800'}`}
                      >
                        {faculty.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DEPARTMENTS & CLASSES */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Departments Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Academic Departments</h2>
                <p className="text-xs text-slate-500">{departments.length} departments active</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDeptModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Dept</span>
              </button>
            </div>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {departments.map(d => (
                <div key={d.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 mr-2 font-mono">{d.code}</span>
                    <span className="text-slate-700 font-medium">{d.name}</span>
                    <span className="block text-slate-400 text-[11px] mt-0.5">HOD: {d.hod_name || 'Dr. Katherine Brooks'}</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {students.filter(s => s.department_id === d.id).length} Students
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Classes Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Class Cohorts & Sections</h2>
                <p className="text-xs text-slate-500">{classes.length} class sections registered</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddClassModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Class</span>
              </button>
            </div>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {classes.map(c => (
                <div key={c.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{c.name}</span>
                    <span className="block text-slate-400 text-[11px] mt-0.5">
                      Batch {c.batch_year} · Semester {c.semester} · Section {c.section}
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {students.filter(s => s.class_id === c.id).length} Enrolled
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SUBJECTS & ALLOCATION */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Faculty Subject Allocations</h2>
                <p className="text-xs text-slate-500">Assigned courses linking teachers to specific classes</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignFacultyModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Faculty</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3.5">Course Code</th>
                    <th className="py-2.5 px-3.5">Subject Name</th>
                    <th className="py-2.5 px-3.5">Class / Section</th>
                    <th className="py-2.5 px-3.5">Assigned Faculty</th>
                    <th className="py-2.5 px-3.5">Academic Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {facultySubjects.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">{a.subject?.code}</td>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900">{a.subject?.name}</td>
                      <td className="py-2.5 px-3.5">{a.class?.name || 'Class 3A'}</td>
                      <td className="py-2.5 px-3.5 text-blue-700 font-medium">
                        {a.faculty?.profile?.full_name} ({a.faculty?.faculty_id})
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-slate-500">{a.academic_year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: REPORTS & AUDIT */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Institutional Master Attendance Audit</h2>
              <p className="text-xs text-slate-500">Comprehensive log across all departments and academic classes</p>
            </div>
            <button
              type="button"
              onClick={handleExportMasterCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Complete CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3.5">Date</th>
                  <th className="py-2.5 px-3.5">Session</th>
                  <th className="py-2.5 px-3.5">Class</th>
                  <th className="py-2.5 px-3.5">Subject</th>
                  <th className="py-2.5 px-3.5">Register No</th>
                  <th className="py-2.5 px-3.5">Student</th>
                  <th className="py-2.5 px-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attendanceRecords.slice(0, 100).map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3.5 font-mono tabular-nums">{r.date}</td>
                    <td className="py-2 px-3.5">{r.session}</td>
                    <td className="py-2 px-3.5">{r.class?.name || 'CSE 3A'}</td>
                    <td className="py-2 px-3.5 font-semibold">{r.subject?.code}</td>
                    <td className="py-2 px-3.5 font-mono">{r.student?.register_no}</td>
                    <td className="py-2 px-3.5">{r.student?.profile?.full_name}</td>
                    <td className="py-2 px-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                        r.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD STUDENT */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add New Student</h3>
              <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStudent} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Register Number (Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. REG2023CS07"
                  value={newStudent.register_no}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, register_no: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Miller"
                  value={newStudent.full_name}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. reg2023cs07@student.smartattendance.edu"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={newStudent.department_id}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, department_id: e.target.value }))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class Section</label>
                  <select
                    value={newStudent.class_id}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, class_id: e.target.value }))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD FACULTY */}
      {showAddFacultyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add Faculty Member</h3>
              <button onClick={() => setShowAddFacultyModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateFaculty} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Faculty ID (Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FAC112"
                  value={newFaculty.faculty_id}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, faculty_id: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Faculty Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Samuel Wright"
                  value={newFaculty.full_name}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. fac112@faculty.smartattendance.edu"
                  value={newFaculty.email}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={newFaculty.department_id}
                    onChange={(e) => setNewFaculty(prev => ({ ...prev, department_id: e.target.value }))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={newFaculty.designation}
                    onChange={(e) => setNewFaculty(prev => ({ ...prev, designation: e.target.value }))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddFacultyModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Register Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DEPARTMENT */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add Academic Department</h3>
              <button onClick={() => setShowAddDeptModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDepartment} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dept Code (e.g. MECH)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MECH"
                  value={newDept.code}
                  onChange={(e) => setNewDept(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mechanical Engineering"
                  value={newDept.name}
                  onChange={(e) => setNewDept(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">HOD Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Alan Green"
                  value={newDept.hod_name}
                  onChange={(e) => setNewDept(prev => ({ ...prev, hod_name: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CLASS */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add Class Section</h3>
              <button onClick={() => setShowAddClassModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={newClass.department_id}
                  onChange={(e) => setNewClass(prev => ({ ...prev, department_id: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Class Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Tech MECH - 2nd Year"
                  value={newClass.name}
                  onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch</label>
                  <input
                    type="number"
                    value={newClass.batch_year}
                    onChange={(e) => setNewClass(prev => ({ ...prev, batch_year: parseInt(e.target.value, 10) }))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sem</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={newClass.semester}
                    onChange={(e) => setNewClass(prev => ({ ...prev, semester: parseInt(e.target.value, 10) }))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={newClass.section}
                    onChange={(e) => setNewClass(prev => ({ ...prev, section: e.target.value.toUpperCase() }))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono uppercase"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN FACULTY */}
      {showAssignFacultyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Assign Faculty to Course</h3>
              <button onClick={() => setShowAssignFacultyModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAssignment} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Faculty Member</label>
                <select
                  value={newAssignment.faculty_id}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, faculty_id: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  {facultyList.map(f => (
                    <option key={f.id} value={f.id}>{f.profile?.full_name} ({f.faculty_id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                <select
                  value={newAssignment.subject_id}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, subject_id: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Class Section</label>
                <select
                  value={newAssignment.class_id}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, class_id: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAssignFacultyModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
