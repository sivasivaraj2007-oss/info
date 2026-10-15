-- ====================================================================
-- Smart Student Attendance Management System - Database Migration
-- Target: Supabase PostgreSQL (Supports RLS & Supabase Auth)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running migration
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.faculty_subjects CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.faculty CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- --------------------------------------------------------------------
-- 3. Profiles Table (extends Supabase auth.users)
-- --------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- 4. Academic Structure: Departments & Classes
-- --------------------------------------------------------------------
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    hod_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    batch_year INTEGER NOT NULL,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_department_class_section UNIQUE (department_id, batch_year, semester, section)
);

-- --------------------------------------------------------------------
-- 5. Role Entities: Students, Faculty, Admins
-- --------------------------------------------------------------------
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    register_no TEXT UNIQUE NOT NULL,
    roll_no TEXT,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    admission_year INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    faculty_id TEXT UNIQUE NOT NULL,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    designation TEXT NOT NULL,
    qualification TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    department TEXT DEFAULT 'Central Academic Administration',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- 6. Subjects and Faculty-Subject-Class Assignments
-- --------------------------------------------------------------------
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    credits INTEGER NOT NULL DEFAULT 3,
    total_hours INTEGER NOT NULL DEFAULT 45,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.faculty_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_faculty_subject_class UNIQUE (faculty_id, subject_id, class_id, academic_year)
);

-- --------------------------------------------------------------------
-- 7. Attendance Records (with strict unique constraint)
-- --------------------------------------------------------------------
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    session TEXT NOT NULL CHECK (session IN ('Session 1', 'Session 2', 'Session 3', 'Session 4', 'Session 5', 'Morning', 'Afternoon')),
    status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'On Duty', 'Late')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    -- CRITICAL REQUIREMENT: Prevent duplicate attendance for student, subject, class, date & session
    CONSTRAINT unique_student_session_attendance UNIQUE (student_id, subject_id, class_id, date, session)
);

-- --------------------------------------------------------------------
-- 8. Indexes for High-Performance Queries
-- --------------------------------------------------------------------
CREATE INDEX idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX idx_attendance_class_subject_date ON public.attendance(class_id, subject_id, date, session);
CREATE INDEX idx_students_register_no ON public.students(register_no);
CREATE INDEX idx_faculty_faculty_id ON public.faculty(faculty_id);
CREATE INDEX idx_admins_username ON public.admins(username);
CREATE INDEX idx_classes_department ON public.classes(department_id);
CREATE INDEX idx_faculty_subjects_lookup ON public.faculty_subjects(faculty_id, class_id, subject_id);

-- --------------------------------------------------------------------
-- 9. Trigger for Updated At
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_attendance_updated
    BEFORE UPDATE ON public.attendance
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- --------------------------------------------------------------------
-- 10. Identifier Mapping Function (Secure Login Lookup)
-- --------------------------------------------------------------------
-- Maps Register Number, Faculty ID, or Admin Username to user email securely
CREATE OR REPLACE FUNCTION public.resolve_login_identifier(
    p_identifier TEXT,
    p_role TEXT
)
RETURNS TABLE (email TEXT, user_id UUID, role TEXT) AS $$
BEGIN
    IF p_role = 'student' THEN
        RETURN QUERY
        SELECT p.email, p.id, p.role
        FROM public.students s
        JOIN public.profiles p ON p.id = s.user_id
        WHERE LOWER(s.register_no) = LOWER(p_identifier)
          AND p.is_active = true
        LIMIT 1;
    ELSIF p_role = 'faculty' THEN
        RETURN QUERY
        SELECT p.email, p.id, p.role
        FROM public.faculty f
        JOIN public.profiles p ON p.id = f.user_id
        WHERE LOWER(f.faculty_id) = LOWER(p_identifier)
          AND p.is_active = true
        LIMIT 1;
    ELSIF p_role = 'admin' THEN
        RETURN QUERY
        SELECT p.email, p.id, p.role
        FROM public.admins a
        JOIN public.profiles p ON p.id = a.user_id
        WHERE LOWER(a.username) = LOWER(p_identifier)
          AND p.is_active = true
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------------------
-- 11. Row Level Security (RLS) Configuration
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins have full access to profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- Departments & Classes (Read by all authenticated, modified by Admin)
CREATE POLICY "Authenticated users can read departments"
    ON public.departments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage departments"
    ON public.departments FOR ALL
    USING (public.is_admin());

CREATE POLICY "Authenticated users can read classes"
    ON public.classes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage classes"
    ON public.classes FOR ALL
    USING (public.is_admin());

-- Students Policies
CREATE POLICY "Students can read their own record"
    ON public.students FOR SELECT
    USING (
        user_id = auth.uid()
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.faculty_subjects fs
            JOIN public.faculty f ON f.id = fs.faculty_id
            WHERE f.user_id = auth.uid() AND fs.class_id = students.class_id
        )
    );

CREATE POLICY "Admins can manage students"
    ON public.students FOR ALL
    USING (public.is_admin());

-- Faculty Policies
CREATE POLICY "Anyone authenticated can view faculty"
    ON public.faculty FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage faculty"
    ON public.faculty FOR ALL
    USING (public.is_admin());

-- Subjects Policies
CREATE POLICY "Authenticated users can view subjects"
    ON public.subjects FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage subjects"
    ON public.subjects FOR ALL
    USING (public.is_admin());

CREATE POLICY "Authenticated users can view faculty_subjects"
    ON public.faculty_subjects FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage faculty_subjects"
    ON public.faculty_subjects FOR ALL
    USING (public.is_admin());

-- Attendance Policies
-- 1. Students can view only their own attendance records
CREATE POLICY "Students can read own attendance"
    ON public.attendance FOR SELECT
    USING (
        student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR public.is_admin()
        OR faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid())
    );

-- 2. Faculty can insert attendance for their assigned classes and subjects
CREATE POLICY "Faculty can insert attendance for assigned subjects"
    ON public.attendance FOR INSERT
    WITH CHECK (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.faculty_subjects fs
            JOIN public.faculty f ON f.id = fs.faculty_id
            WHERE f.user_id = auth.uid()
              AND fs.class_id = attendance.class_id
              AND fs.subject_id = attendance.subject_id
        )
    );

-- 3. Faculty can update attendance they marked
CREATE POLICY "Faculty can update their marked attendance"
    ON public.attendance FOR UPDATE
    USING (
        public.is_admin()
        OR faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid())
    );

-- 4. Admins have full access to attendance
CREATE POLICY "Admins can manage all attendance"
    ON public.attendance FOR ALL
    USING (public.is_admin());

-- --------------------------------------------------------------------
-- 12. Seed Institutional Data (Department IT & Class B.Tech IT - 2nd Year)
-- --------------------------------------------------------------------
INSERT INTO public.departments (id, code, name, hod_name)
VALUES ('00000000-0000-0000-0000-000000000002', 'IT', 'Information Technology', 'Dr. Marcus Vance')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.classes (id, department_id, name, batch_year, semester, section, academic_year)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000002',
    'B.Tech IT - 2nd Year',
    2024,
    3,
    'A',
    '2025-2026'
)
ON CONFLICT (department_id, batch_year, semester, section) DO NOTHING;

INSERT INTO public.subjects (id, code, name, department_id, semester, credits, total_hours)
VALUES 
    ('00000000-0000-0000-0000-000000000301', 'IT301', 'Data Structures and Algorithms', '00000000-0000-0000-0000-000000000002', 3, 4, 60),
    ('00000000-0000-0000-0000-000000000302', 'IT302', 'Object Oriented Programming (Java)', '00000000-0000-0000-0000-000000000002', 3, 4, 60),
    ('00000000-0000-0000-0000-000000000303', 'IT303', 'Database Management Systems & SQL', '00000000-0000-0000-0000-000000000002', 3, 3, 45),
    ('00000000-0000-0000-0000-000000000304', 'IT304', 'Computer Organization & Architecture', '00000000-0000-0000-0000-000000000002', 3, 3, 45),
    ('00000000-0000-0000-0000-000000000305', 'IT305', 'Operating Systems & Shell Scripting', '00000000-0000-0000-0000-000000000002', 3, 3, 45)
ON CONFLICT (code) DO NOTHING;

