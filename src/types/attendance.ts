export type Role = 'student' | 'faculty' | 'admin';

export type AttendanceStatus = 'Present' | 'Absent' | 'On Duty' | 'Late';

export type AttendanceSession = 
  | 'Session 1' 
  | 'Session 2' 
  | 'Session 3' 
  | 'Session 4' 
  | 'Session 5' 
  | 'Morning' 
  | 'Afternoon';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  hod_name?: string;
  created_at?: string;
}

export interface ClassEntity {
  id: string;
  department_id: string;
  name: string;
  batch_year: number;
  semester: number;
  section: string;
  academic_year: string;
  department?: Department;
  created_at?: string;
}

export interface Student {
  id: string;
  user_id: string;
  register_no: string;
  roll_no?: string;
  department_id: string;
  class_id: string;
  admission_year: number;
  is_active: boolean;
  profile?: Profile;
  department?: Department;
  class?: ClassEntity;
  created_at?: string;
}

export interface Faculty {
  id: string;
  user_id: string;
  faculty_id: string;
  department_id: string;
  designation: string;
  qualification?: string;
  is_active: boolean;
  profile?: Profile;
  department?: Department;
  created_at?: string;
}

export interface Admin {
  id: string;
  user_id: string;
  username: string;
  department?: string;
  profile?: Profile;
  created_at?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  department_id: string;
  semester: number;
  credits: number;
  total_hours: number;
  department?: Department;
  created_at?: string;
}

export interface FacultySubject {
  id: string;
  faculty_id: string;
  subject_id: string;
  class_id: string;
  academic_year: string;
  faculty?: Faculty;
  subject?: Subject;
  class?: ClassEntity;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  subject_id: string;
  faculty_id: string;
  date: string; // YYYY-MM-DD
  session: AttendanceSession;
  status: AttendanceStatus;
  remarks?: string;
  created_at: string;
  updated_at?: string;
  student?: Student;
  subject?: Subject;
  class?: ClassEntity;
  faculty?: Faculty;
}

export interface SubjectAttendanceStat {
  subject_id: string;
  subject_code: string;
  subject_name: string;
  total_conducted: number;
  present_count: number;
  absent_count: number;
  percentage: number;
  is_low: boolean;
}

export interface StudentAttendanceSummary {
  total_conducted: number;
  present_count: number;
  absent_count: number;
  overall_percentage: number;
  is_low: boolean;
  sessions_needed_for_target: number;
  subject_breakdown: SubjectAttendanceStat[];
}
