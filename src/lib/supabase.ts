import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Department,
  ClassEntity,
  Subject,
  Faculty,
  Student,
  Admin,
  FacultySubject,
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
} from '../types/attendance';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_FACULTY,
  INITIAL_STUDENTS,
  INITIAL_ADMIN,
  INITIAL_FACULTY_SUBJECTS,
  INITIAL_ATTENDANCE_RECORDS,
} from './mockData';

// Local storage keys
const STORAGE_KEYS = {
  SUPABASE_URL: 'smart_att_supabase_url',
  SUPABASE_KEY: 'smart_att_supabase_key',
  USE_LOCAL: 'smart_att_force_local',
  THRESHOLD: 'smart_att_threshold',
  // Local DB tables (v4: Real class roster 25BIT001-25BIT057 with student names)
  DEPARTMENTS: 'smart_att_v4_departments',
  CLASSES: 'smart_att_v4_classes',
  SUBJECTS: 'smart_att_v4_subjects',
  FACULTY: 'smart_att_v4_faculty',
  STUDENTS: 'smart_att_v4_students',
  FACULTY_SUBJECTS: 'smart_att_v4_faculty_subjects',
  ATTENDANCE: 'smart_att_v4_attendance',
};

// Check env or localStorage for Supabase credentials
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const localUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL);
  const localKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY);

  const url = (localUrl || envUrl || '').trim();
  const key = (localKey || envKey || '').trim();

  const isConfigured = Boolean(
    url && 
    key && 
    url.startsWith('https://') && 
    !url.includes('your-project') &&
    key.length > 20
  );

  return { url, key, isConfigured };
};

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
  localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, key.trim());
  localStorage.removeItem(STORAGE_KEYS.USE_LOCAL);
  // Reinitialize client
  initSupabaseClient();
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
  localStorage.removeItem(STORAGE_KEYS.SUPABASE_KEY);
  localStorage.setItem(STORAGE_KEYS.USE_LOCAL, 'true');
  supabaseInstance = null;
};

// Supabase client instance
let supabaseInstance: SupabaseClient | null = null;

export const initSupabaseClient = (): SupabaseClient | null => {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (isConfigured && !localStorage.getItem(STORAGE_KEYS.USE_LOCAL)) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabaseInstance;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      supabaseInstance = null;
      return null;
    }
  }
  supabaseInstance = null;
  return null;
};

export const getSupabase = () => {
  if (!supabaseInstance) {
    initSupabaseClient();
  }
  return supabaseInstance;
};

// Local storage database engine initializer
const getStoredCollection = <T>(key: string, defaultData: T[]): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
};

const saveStoredCollection = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to persist collection:', key, e);
  }
};

// Unified Data Access Layer (Works seamlessly with real Supabase or local persistent store)
export const dbService = {
  // Configuration
  isUsingSupabase: () => {
    return Boolean(getSupabase());
  },

  // Test Supabase connection
  testConnection: async (): Promise<{ success: boolean; message: string }> => {
    const client = getSupabase();
    if (!client) {
      return { success: false, message: 'Supabase credentials not configured' };
    }
    try {
      const { data, error } = await client.from('departments').select('count', { count: 'exact', head: true });
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: `Connected to Supabase! (${data ?? 'OK'})` };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Connection failed' };
    }
  },

  // Reset local database to defaults
  resetLocalDatabase: () => {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(INITIAL_DEPARTMENTS));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
    localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(INITIAL_FACULTY));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.FACULTY_SUBJECTS, JSON.stringify(INITIAL_FACULTY_SUBJECTS));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE_RECORDS));
  },

  // Departments
  getDepartments: async (): Promise<Department[]> => {
    const client = getSupabase();
    if (client) {
      const { data, error } = await client.from('departments').select('*').order('name');
      if (!error && data && data.length > 0) return data;
    }
    return getStoredCollection(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  },

  addDepartment: async (dept: Omit<Department, 'id' | 'created_at'>): Promise<Department> => {
    const client = getSupabase();
    const newDept: Department = {
      ...dept,
      id: `dept-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    if (client) {
      const { data, error } = await client.from('departments').insert([dept]).select().single();
      if (!error && data) return data;
    }

    const current = getStoredCollection(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const updated = [...current, newDept];
    saveStoredCollection(STORAGE_KEYS.DEPARTMENTS, updated);
    return newDept;
  },

  // Classes
  getClasses: async (): Promise<ClassEntity[]> => {
    const client = getSupabase();
    if (client) {
      const { data, error } = await client.from('classes').select('*, department:departments(*)').order('name');
      if (!error && data && data.length > 0) return data;
    }
    const depts = getStoredCollection(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const classes = getStoredCollection(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    return classes.map(c => ({
      ...c,
      department: depts.find(d => d.id === c.department_id),
    }));
  },

  addClass: async (classData: Omit<ClassEntity, 'id' | 'created_at'>): Promise<ClassEntity> => {
    const client = getSupabase();
    const newClass: ClassEntity = {
      ...classData,
      id: `class-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    if (client) {
      const { data, error } = await client.from('classes').insert([classData]).select().single();
      if (!error && data) return data;
    }

    const current = getStoredCollection(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const updated = [...current, newClass];
    saveStoredCollection(STORAGE_KEYS.CLASSES, updated);
    return newClass;
  },

  // Subjects
  getSubjects: async (): Promise<Subject[]> => {
    const client = getSupabase();
    if (client) {
      const { data, error } = await client.from('subjects').select('*, department:departments(*)').order('name');
      if (!error && data && data.length > 0) return data;
    }
    const depts = getStoredCollection(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const subjects = getStoredCollection(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    return subjects.map(s => ({
      ...s,
      department: depts.find(d => d.id === s.department_id),
    }));
  },

  addSubject: async (subj: Omit<Subject, 'id' | 'created_at'>): Promise<Subject> => {
    const client = getSupabase();
    const newSubj: Subject = {
      ...subj,
      id: `subj-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    if (client) {
      const { data, error } = await client.from('subjects').insert([subj]).select().single();
      if (!error && data) return data;
    }

    const current = getStoredCollection(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    const updated = [...current, newSubj];
    saveStoredCollection(STORAGE_KEYS.SUBJECTS, updated);
    return newSubj;
  },

  // Students
  getStudents: async (filters?: { class_id?: string; department_id?: string }): Promise<Student[]> => {
    const client = getSupabase();
    if (client) {
      let query = client.from('students').select('*, profile:profiles(*), department:departments(*), class:classes(*)');
      if (filters?.class_id) query = query.eq('class_id', filters.class_id);
      if (filters?.department_id) query = query.eq('department_id', filters.department_id);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }

    const depts = getStoredCollection(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const classes = getStoredCollection(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    let students = getStoredCollection(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);

    if (filters?.class_id) {
      students = students.filter(s => s.class_id === filters.class_id);
    }
    if (filters?.department_id) {
      students = students.filter(s => s.department_id === filters.department_id);
    }

    return students.map(s => ({
      ...s,
      department: depts.find(d => d.id === s.department_id),
      class: classes.find(c => c.id === s.class_id),
    }));
  },

  addStudent: async (studentData: {
    register_no: string;
    full_name: string;
    email: string;
    phone?: string;
    department_id: string;
    class_id: string;
    roll_no?: string;
    admission_year: number;
  }): Promise<Student> => {
    const newId = `stud-${Date.now()}`;
    const newUserId = `user-${newId}`;
    
    const newStudent: Student = {
      id: newId,
      user_id: newUserId,
      register_no: studentData.register_no.toUpperCase(),
      roll_no: studentData.roll_no || studentData.register_no.slice(-4),
      department_id: studentData.department_id,
      class_id: studentData.class_id,
      admission_year: studentData.admission_year,
      is_active: true,
      created_at: new Date().toISOString(),
      profile: {
        id: newUserId,
        email: studentData.email,
        full_name: studentData.full_name,
        role: 'student',
        phone: studentData.phone,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    };

    const current = getStoredCollection(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    // Check register_no unique constraint
    if (current.some(s => s.register_no.toUpperCase() === studentData.register_no.toUpperCase())) {
      throw new Error(`Student with Register Number ${studentData.register_no} already exists.`);
    }

    const updated = [...current, newStudent];
    saveStoredCollection(STORAGE_KEYS.STUDENTS, updated);
    return newStudent;
  },

  updateStudentStatus: async (studentId: string, isActive: boolean): Promise<void> => {
    const current = getStoredCollection<Student>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const updated = current.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          is_active: isActive,
          profile: s.profile ? { ...s.profile, is_active: isActive } : undefined,
        };
      }
      return s;
    });
    saveStoredCollection(STORAGE_KEYS.STUDENTS, updated);
  },

  // Faculty
  getFaculty: async (): Promise<Faculty[]> => {
    const client = getSupabase();
    if (client) {
      const { data, error } = await client.from('faculty').select('*, profile:profiles(*), department:departments(*)');
      if (!error && data && data.length > 0) return data;
    }
    const depts = getStoredCollection(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const facultyList = getStoredCollection(STORAGE_KEYS.FACULTY, INITIAL_FACULTY);
    return facultyList.map(f => ({
      ...f,
      department: depts.find(d => d.id === f.department_id),
    }));
  },

  addFaculty: async (facData: {
    faculty_id: string;
    full_name: string;
    email: string;
    department_id: string;
    designation: string;
    qualification?: string;
    phone?: string;
  }): Promise<Faculty> => {
    const newId = `fac-${Date.now()}`;
    const newUserId = `user-${newId}`;

    const newFaculty: Faculty = {
      id: newId,
      user_id: newUserId,
      faculty_id: facData.faculty_id.toUpperCase(),
      department_id: facData.department_id,
      designation: facData.designation,
      qualification: facData.qualification,
      is_active: true,
      created_at: new Date().toISOString(),
      profile: {
        id: newUserId,
        email: facData.email,
        full_name: facData.full_name,
        role: 'faculty',
        phone: facData.phone,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    };

    const current = getStoredCollection<Faculty>(STORAGE_KEYS.FACULTY, INITIAL_FACULTY);
    if (current.some(f => f.faculty_id.toUpperCase() === facData.faculty_id.toUpperCase())) {
      throw new Error(`Faculty with ID ${facData.faculty_id} already exists.`);
    }

    const updated = [...current, newFaculty];
    saveStoredCollection(STORAGE_KEYS.FACULTY, updated);
    return newFaculty;
  },

  updateFacultyStatus: async (facultyId: string, isActive: boolean): Promise<void> => {
    const current = getStoredCollection<Faculty>(STORAGE_KEYS.FACULTY, INITIAL_FACULTY);
    const updated = current.map(f => {
      if (f.id === facultyId) {
        return {
          ...f,
          is_active: isActive,
          profile: f.profile ? { ...f.profile, is_active: isActive } : undefined,
        };
      }
      return f;
    });
    saveStoredCollection(STORAGE_KEYS.FACULTY, updated);
  },

  // Faculty Assignments (Classes & Subjects)
  getFacultySubjects: async (facultyId?: string): Promise<FacultySubject[]> => {
    const client = getSupabase();
    if (client) {
      let query = client.from('faculty_subjects').select('*, faculty:faculty(*), subject:subjects(*), class:classes(*)');
      if (facultyId) query = query.eq('faculty_id', facultyId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }

    const assignments = getStoredCollection(STORAGE_KEYS.FACULTY_SUBJECTS, INITIAL_FACULTY_SUBJECTS);
    const facultyList = getStoredCollection(STORAGE_KEYS.FACULTY, INITIAL_FACULTY);
    const subjects = getStoredCollection(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    const classes = getStoredCollection(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);

    const filtered = facultyId ? assignments.filter(a => a.faculty_id === facultyId) : assignments;

    return filtered.map(a => ({
      ...a,
      faculty: facultyList.find(f => f.id === a.faculty_id),
      subject: subjects.find(s => s.id === a.subject_id),
      class: classes.find(c => c.id === a.class_id),
    }));
  },

  assignFacultySubject: async (assignment: {
    faculty_id: string;
    subject_id: string;
    class_id: string;
    academic_year: string;
  }): Promise<FacultySubject> => {
    const current = getStoredCollection<FacultySubject>(STORAGE_KEYS.FACULTY_SUBJECTS, INITIAL_FACULTY_SUBJECTS);
    const exists = current.some(
      a => a.faculty_id === assignment.faculty_id &&
           a.subject_id === assignment.subject_id &&
           a.class_id === assignment.class_id
    );
    if (exists) {
      throw new Error('This faculty is already assigned to this subject and class.');
    }

    const newAssignment: FacultySubject = {
      ...assignment,
      id: `fs-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    saveStoredCollection(STORAGE_KEYS.FACULTY_SUBJECTS, [...current, newAssignment]);
    return newAssignment;
  },

  // Attendance Records
  getAttendanceRecords: async (filters?: {
    student_id?: string;
    class_id?: string;
    subject_id?: string;
    date?: string;
    session?: AttendanceSession;
    faculty_id?: string;
  }): Promise<AttendanceRecord[]> => {
    const client = getSupabase();
    if (client) {
      let query = client.from('attendance').select('*, student:students(*), subject:subjects(*), class:classes(*)');
      if (filters?.student_id) query = query.eq('student_id', filters.student_id);
      if (filters?.class_id) query = query.eq('class_id', filters.class_id);
      if (filters?.subject_id) query = query.eq('subject_id', filters.subject_id);
      if (filters?.date) query = query.eq('date', filters.date);
      if (filters?.session) query = query.eq('session', filters.session);
      if (filters?.faculty_id) query = query.eq('faculty_id', filters.faculty_id);
      const { data, error } = await query;
      if (!error && data) return data;
    }

    let records = getStoredCollection<AttendanceRecord>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE_RECORDS);
    if (filters?.student_id) records = records.filter(r => r.student_id === filters.student_id);
    if (filters?.class_id) records = records.filter(r => r.class_id === filters.class_id);
    if (filters?.subject_id) records = records.filter(r => r.subject_id === filters.subject_id);
    if (filters?.date) records = records.filter(r => r.date === filters.date);
    if (filters?.session) records = records.filter(r => r.session === filters.session);
    if (filters?.faculty_id) records = records.filter(r => r.faculty_id === filters.faculty_id);

    // populate entities for rich display
    const students = getStoredCollection(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const subjects = getStoredCollection(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    const classes = getStoredCollection(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);

    return records.map(r => ({
      ...r,
      student: students.find(s => s.id === r.student_id),
      subject: subjects.find(s => s.id === r.subject_id),
      class: classes.find(c => c.id === r.class_id),
    }));
  },

  // Save session attendance batch (with unique constraint check)
  saveAttendanceBatch: async (
    entries: {
      student_id: string;
      class_id: string;
      subject_id: string;
      faculty_id: string;
      date: string;
      session: AttendanceSession;
      status: AttendanceStatus;
      remarks?: string;
    }[]
  ): Promise<{ inserted: number; updated: number }> => {
    const client = getSupabase();
    if (client) {
      // Upsert using the unique constraint (student_id, subject_id, class_id, date, session)
      const { error } = await client.from('attendance').upsert(
        entries.map(e => ({
          student_id: e.student_id,
          class_id: e.class_id,
          subject_id: e.subject_id,
          faculty_id: e.faculty_id,
          date: e.date,
          session: e.session,
          status: e.status,
          remarks: e.remarks || null,
        })),
        { onConflict: 'student_id,subject_id,class_id,date,session' }
      );

      if (error) {
        throw new Error(error.message);
      }
      return { inserted: entries.length, updated: 0 };
    }

    // Local DB upsert with duplicate constraint enforcement
    const current = getStoredCollection<AttendanceRecord>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE_RECORDS);
    let inserted = 0;
    let updated = 0;

    const newRecords = [...current];

    entries.forEach(entry => {
      const existingIndex = newRecords.findIndex(
        r => r.student_id === entry.student_id &&
             r.subject_id === entry.subject_id &&
             r.class_id === entry.class_id &&
             r.date === entry.date &&
             r.session === entry.session
      );

      if (existingIndex >= 0) {
        newRecords[existingIndex] = {
          ...newRecords[existingIndex],
          status: entry.status,
          remarks: entry.remarks || newRecords[existingIndex].remarks,
          updated_at: new Date().toISOString(),
        };
        updated++;
      } else {
        newRecords.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          student_id: entry.student_id,
          class_id: entry.class_id,
          subject_id: entry.subject_id,
          faculty_id: entry.faculty_id,
          date: entry.date,
          session: entry.session,
          status: entry.status,
          remarks: entry.remarks,
          created_at: new Date().toISOString(),
        });
        inserted++;
      }
    });

    saveStoredCollection(STORAGE_KEYS.ATTENDANCE, newRecords);
    return { inserted, updated };
  },

  // Check if session has already been recorded
  isSessionMarked: async (
    classId: string,
    subjectId: string,
    date: string,
    session: AttendanceSession
  ): Promise<boolean> => {
    const records = await dbService.getAttendanceRecords({
      class_id: classId,
      subject_id: subjectId,
      date,
      session,
    });
    return records.length > 0;
  },

  // Threshold getter & setter
  getThreshold: (): number => {
    const raw = localStorage.getItem(STORAGE_KEYS.THRESHOLD);
    if (!raw) return 75;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? 75 : parsed;
  },

  setThreshold: (val: number): void => {
    localStorage.setItem(STORAGE_KEYS.THRESHOLD, Math.max(50, Math.min(100, val)).toString());
  },
};
