import { 
  Department, 
  ClassEntity, 
  Subject, 
  Faculty, 
  Student, 
  Admin, 
  FacultySubject, 
  AttendanceRecord 
} from '../types/attendance';

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-it-02',
    code: 'IT',
    name: 'Information Technology',
    hod_name: 'Dr. Marcus Vance',
    created_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 'dept-cse-01',
    code: 'CSE',
    name: 'Computer Science and Engineering',
    hod_name: 'Dr. Katherine Brooks',
    created_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 'dept-ece-03',
    code: 'ECE',
    name: 'Electronics and Communication',
    hod_name: 'Dr. Elena Rostova',
    created_at: '2025-01-15T08:00:00Z',
  },
];

export const INITIAL_CLASSES: ClassEntity[] = [
  {
    id: 'class-it-2a',
    department_id: 'dept-it-02',
    name: 'B.Tech IT - 2nd Year',
    batch_year: 2024,
    semester: 3,
    section: 'A',
    academic_year: '2025-2026',
    created_at: '2025-06-01T08:00:00Z',
  },
  {
    id: 'class-it-2b',
    department_id: 'dept-it-02',
    name: 'B.Tech IT - 2nd Year (Section B)',
    batch_year: 2024,
    semester: 3,
    section: 'B',
    academic_year: '2025-2026',
    created_at: '2025-06-01T08:00:00Z',
  },
];

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'subj-it301',
    code: 'IT301',
    name: 'Data Structures and Algorithms',
    department_id: 'dept-it-02',
    semester: 3,
    credits: 4,
    total_hours: 60,
  },
  {
    id: 'subj-it302',
    code: 'IT302',
    name: 'Object Oriented Programming (Java)',
    department_id: 'dept-it-02',
    semester: 3,
    credits: 4,
    total_hours: 60,
  },
  {
    id: 'subj-it303',
    code: 'IT303',
    name: 'Database Management Systems & SQL',
    department_id: 'dept-it-02',
    semester: 3,
    credits: 3,
    total_hours: 45,
  },
  {
    id: 'subj-it304',
    code: 'IT304',
    name: 'Computer Organization & Architecture',
    department_id: 'dept-it-02',
    semester: 3,
    credits: 3,
    total_hours: 45,
  },
  {
    id: 'subj-it305',
    code: 'IT305',
    name: 'Operating Systems & Shell Scripting',
    department_id: 'dept-it-02',
    semester: 3,
    credits: 3,
    total_hours: 45,
  },
];

// Faculty register numbers: info 71101 to info 71110 (10 faculty members in Department of IT)
// Passwords: info 30 to info 40 (or info info 30 to info 40)
export const INITIAL_FACULTY: Faculty[] = Array.from({ length: 10 }, (_, i) => {
  const num = 71101 + i;
  const facultyId = `info ${num}`;
  const cleanId = `info-${num}`;
  return {
    id: `fac-${cleanId}`,
    user_id: `user-${cleanId}`,
    faculty_id: facultyId,
    department_id: 'dept-it-02',
    designation: i === 0 ? 'Professor & HOD (IT)' : i < 4 ? 'Associate Professor (IT)' : 'Assistant Professor (IT)',
    qualification: i < 5 ? 'Ph.D. in Information Technology' : 'M.Tech in Information Technology',
    is_active: true,
    profile: {
      id: `user-${cleanId}`,
      email: `faculty.${num}@smartattendance.edu`,
      full_name: `Prof. Faculty ${num}`,
      role: 'faculty',
      phone: `+91 9444${String(20000 + i).slice(1)}`,
      is_active: true,
      created_at: '2025-06-01T08:00:00Z',
    },
  };
});

// Official Class Nominal Roll from B.Tech IT - 2nd Year (Semester III)
// S.NO, ROLL NO, NAME OF THE STUDENT
export const OFFICIAL_ROSTER_DATA = [
  { sNo: 1, rollNo: '25BIT001', name: 'ABISHEK M' },
  { sNo: 2, rollNo: '25BIT002', name: 'AJITHRAJA S' },
  { sNo: 3, rollNo: '25BIT003', name: 'AKALYA M' },
  { sNo: 4, rollNo: '25BIT004', name: 'ANAGHA U' },
  { sNo: 5, rollNo: '25BIT005', name: 'ARULRAJ I' },
  { sNo: 6, rollNo: '25BIT006', name: 'ARUSUDHAN A' },
  { sNo: 7, rollNo: '25BIT007', name: 'BHARANIDHARAN S' },
  { sNo: 8, rollNo: '25BIT008', name: 'DHARANESH K' },
  { sNo: 9, rollNo: '25BIT009', name: 'DHARANI L' },
  { sNo: 10, rollNo: '25BIT010', name: 'DHARSIK A' },
  { sNo: 11, rollNo: '25BIT011', name: 'DHIVAN K' },
  { sNo: 12, rollNo: '25BIT012', name: 'DINESH R' },
  { sNo: 13, rollNo: '25BIT013', name: 'ESAKKI RAJ E' },
  { sNo: 14, rollNo: '25BIT014', name: 'GIRI JEYAM M' },
  { sNo: 15, rollNo: '25BIT015', name: 'GNANA SEKARAN M' },
  { sNo: 16, rollNo: '25BIT016', name: 'GOBALA KRISHNAN S' },
  { sNo: 17, rollNo: '25BIT017', name: 'GOPIKA N' },
  { sNo: 18, rollNo: '25BIT018', name: 'GOWRISAN B' },
  { sNo: 19, rollNo: '25BIT020', name: 'HARIHARAN G' },
  { sNo: 20, rollNo: '25BIT021', name: 'HEMAVATHI G' },
  { sNo: 21, rollNo: '25BIT022', name: 'JANANI G' },
  { sNo: 22, rollNo: '25BIT023', name: 'JEBASTIN' },
  { sNo: 23, rollNo: '25BIT024', name: 'JENITA S' },
  { sNo: 24, rollNo: '25BIT025', name: 'JOTHIPRIYA P' },
  { sNo: 25, rollNo: '25BIT027', name: 'KAVIYARASAN D' },
  { sNo: 26, rollNo: '25BIT028', name: 'KISHORE M' },
  { sNo: 27, rollNo: '25BIT029', name: 'KUTTYMADHESHWARAN M' },
  { sNo: 28, rollNo: '25BIT030', name: 'MOHAMED ZUBER' },
  { sNo: 29, rollNo: '25BIT031', name: 'MOULIDHARN K' },
  { sNo: 30, rollNo: '25BIT032', name: 'NIKISH MOHANRAJ' },
  { sNo: 31, rollNo: '25BIT033', name: 'NIRANJANA V' },
  { sNo: 32, rollNo: '25BIT034', name: 'NIVANGELLIN M' },
  { sNo: 33, rollNo: '25BIT035', name: 'PARAMESH P' },
  { sNo: 34, rollNo: '25BIT036', name: 'PRAVIN R' },
  { sNo: 35, rollNo: '25BIT037', name: 'RAGULAN B' },
  { sNo: 36, rollNo: '25BIT038', name: 'RITHIKA R' },
  { sNo: 37, rollNo: '25BIT039', name: 'SAKTHI SRI DEVI T' },
  { sNo: 38, rollNo: '25BIT040', name: 'SANDHIYA M' },
  { sNo: 39, rollNo: '25BIT041', name: 'SANJAI V A' },
  { sNo: 40, rollNo: '25BIT042', name: 'SANJITH K' },
  { sNo: 41, rollNo: '25BIT043', name: 'SARANYA M' },
  { sNo: 42, rollNo: '25BIT044', name: 'SARAVANAKUMAR S' },
  { sNo: 43, rollNo: '25BIT045', name: 'SARAVANAVEL C' },
  { sNo: 44, rollNo: '25BIT046', name: 'SATHYA C' },
  { sNo: 45, rollNo: '25BIT047', name: 'SHARAN S' },
  { sNo: 46, rollNo: '25BIT048', name: 'SIVARAJ S' },
  { sNo: 47, rollNo: '25BIT049', name: 'SUMAN D' },
  { sNo: 48, rollNo: '25BIT050', name: 'TAMIL SELVAN N' },
  { sNo: 49, rollNo: '25BIT051', name: 'THASHALAN B' },
  { sNo: 50, rollNo: '25BIT053', name: 'VETRIVEL K' },
  { sNo: 51, rollNo: '25BIT054', name: 'VETRIVEL M' },
  { sNo: 52, rollNo: '25BIT055', name: 'VISHNU KANTHAN M' },
  { sNo: 53, rollNo: '25BIT056', name: 'YAZHINI S' },
  { sNo: 54, rollNo: '25BIT057', name: 'YUVASRI S' },
  { sNo: 55, rollNo: '25BIT301', name: 'HARI PRASADH G' },
  { sNo: 56, rollNo: '25BIT302', name: 'PRADHEESH S' },
  { sNo: 57, rollNo: '25BIT303', name: 'PRAVEEN KUMAR S' },
];

// Students register numbers: 711025205001 to 711025205057 (57 students)
// Roll Numbers: 25BIT001 to 25BIT057 / 25BIT302 from official roster
// Passwords: student 1 to student 57
export const INITIAL_STUDENTS: Student[] = OFFICIAL_ROSTER_DATA.map((studentItem, index) => {
  const num = studentItem.sNo;
  const numStr = String(num).padStart(3, '0');
  const regNo = `711025205${numStr}`;
  
  return {
    id: `stud-${regNo}`,
    user_id: `user-${regNo}`,
    register_no: regNo,
    roll_no: studentItem.rollNo,
    department_id: 'dept-it-02',
    class_id: 'class-it-2a',
    admission_year: 2024,
    is_active: true,
    profile: {
      id: `user-${regNo}`,
      email: `${regNo}@student.smartattendance.edu`,
      full_name: studentItem.name,
      role: 'student',
      phone: `+91 9840${String(10000 + num).slice(1)}`,
      is_active: true,
      created_at: '2025-08-01T08:00:00Z',
    },
  };
});

// Admin register number: 2025, password: admin
export const INITIAL_ADMIN: Admin = {
  id: 'admin-2025',
  user_id: 'user-admin-2025',
  username: '2025',
  department: 'Central Academic Administration (IT & Engineering)',
  profile: {
    id: 'user-admin-2025',
    email: 'admin2025@smartattendance.edu',
    full_name: 'Academic Administrator (2025)',
    role: 'admin',
    phone: '+91 98400 02025',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
};

// Faculty Subject Allocations for B.Tech IT - 2nd Year
export const INITIAL_FACULTY_SUBJECTS: FacultySubject[] = [
  {
    id: 'fs-01',
    faculty_id: 'fac-info-71101',
    subject_id: 'subj-it301',
    class_id: 'class-it-2a',
    academic_year: '2025-2026',
  },
  {
    id: 'fs-02',
    faculty_id: 'fac-info-71102',
    subject_id: 'subj-it302',
    class_id: 'class-it-2a',
    academic_year: '2025-2026',
  },
  {
    id: 'fs-03',
    faculty_id: 'fac-info-71103',
    subject_id: 'subj-it303',
    class_id: 'class-it-2a',
    academic_year: '2025-2026',
  },
  {
    id: 'fs-04',
    faculty_id: 'fac-info-71104',
    subject_id: 'subj-it304',
    class_id: 'class-it-2a',
    academic_year: '2025-2026',
  },
  {
    id: 'fs-05',
    faculty_id: 'fac-info-71105',
    subject_id: 'subj-it305',
    class_id: 'class-it-2a',
    academic_year: '2025-2026',
  },
];

// Seed Attendance Records for all 57 students in B.Tech IT - 2nd Year
export const generateSeedAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const subjects = ['subj-it301', 'subj-it302', 'subj-it303', 'subj-it304', 'subj-it305'];

  // Days list (20 academic days across Sep & Oct 2025)
  const days = [
    '2025-09-01', '2025-09-03', '2025-09-05', '2025-09-08', '2025-09-10',
    '2025-09-12', '2025-09-15', '2025-09-17', '2025-09-19', '2025-09-22',
    '2025-09-24', '2025-09-26', '2025-09-29', '2025-10-01', '2025-10-03',
    '2025-10-06', '2025-10-08', '2025-10-10', '2025-10-13', '2025-10-14',
  ];

  let idCounter = 1;

  days.forEach((day, dayIndex) => {
    // 2 subjects per day for B.Tech IT - 2nd Year
    const subjA = subjects[dayIndex % 5];
    const subjB = subjects[(dayIndex + 1) % 5];
    const facultyA = subjA === 'subj-it301' ? 'fac-info-71101' : subjA === 'subj-it302' ? 'fac-info-71102' : 'fac-info-71103';
    const facultyB = subjB === 'subj-it304' ? 'fac-info-71104' : subjB === 'subj-it305' ? 'fac-info-71105' : 'fac-info-71101';

    INITIAL_STUDENTS.forEach((student, studIndex) => {
      let statusA: 'Present' | 'Absent' = 'Present';
      let statusB: 'Present' | 'Absent' = 'Present';

      // Sivaraj S (25BIT048, studIndex 45) will have high attendance (95%)
      const isSivaraj = student.roll_no === '25BIT048';
      const isShortageStudent = (studIndex + 1) % 7 === 0 && !isSivaraj;

      if (isShortageStudent) {
        if (dayIndex % 2 === 0) statusA = 'Absent';
        if (dayIndex % 3 === 0) statusB = 'Absent';
      } else {
        if ((studIndex + dayIndex) % 13 === 0 && !isSivaraj) statusA = 'Absent';
        if ((studIndex + dayIndex) % 17 === 0 && !isSivaraj) statusB = 'Absent';
      }

      records.push({
        id: `att-${idCounter++}`,
        student_id: student.id,
        class_id: 'class-it-2a',
        subject_id: subjA,
        faculty_id: facultyA,
        date: day,
        session: 'Session 1',
        status: statusA,
        remarks: statusA === 'Absent' ? 'Unexcused' : 'Attended',
        created_at: `${day}T09:15:00Z`,
      });

      records.push({
        id: `att-${idCounter++}`,
        student_id: student.id,
        class_id: 'class-it-2a',
        subject_id: subjB,
        faculty_id: facultyB,
        date: day,
        session: 'Session 2',
        status: statusB,
        remarks: statusB === 'Absent' ? 'Medical leave' : 'Attended',
        created_at: `${day}T11:15:00Z`,
      });
    });
  });

  return records;
};

export const INITIAL_ATTENDANCE_RECORDS = generateSeedAttendance();
