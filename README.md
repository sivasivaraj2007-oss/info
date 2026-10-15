# Smart Student Attendance Management System

A production-grade, role-based academic attendance platform built with **React**, **Vite**, **Tailwind CSS**, **Recharts**, and **Supabase PostgreSQL & Auth**, configured for seamless deployment on **Vercel**.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC) & Identifiers**:
   - **Student Login**: Sign in with **Register Number** (e.g. `REG2023CS01`) and password.
   - **Faculty Login**: Sign in with **Faculty ID** (e.g. `FAC104`) and password.
   - **Admin Login**: Sign in with **Username** (e.g. `admin`) and password.
   - Secure identifier mapping via Postgres RPC `resolve_login_identifier` mapping directly into Supabase Auth.

2. **Student Dashboard**:
   - Real-time overall attendance percentage calculation:
     $$\text{Attendance } \% = \left(\frac{\text{Present Sessions}}{\text{Total Conducted Sessions}}\right) \times 100$$
   - Handles zero conducted sessions gracefully.
   - **Automated Shortage Notice**: Alerts students when below the 75% university eligibility requirement.
   - **Consecutive Session Calculator**: Calculates exactly how many consecutive sessions the student must attend without missing to restore exam eligibility.
   - Monthly attendance progression graph (Recharts Area Chart).
   - Subject-wise attendance breakdown with individual progress bars.
   - Session history filterable by date, subject, and status (Present, Absent, On Duty) with CSV export.

3. **Faculty Dashboard**:
   - Filter by assigned class, assigned course/subject, date, and session.
   - **Anti-Duplicate Constraint & Detection**: Pre-queries existing sessions to prevent duplicate database rows; updates existing marks seamlessly.
   - Quick bulk marking actions ("Mark All Present", "Mark All Absent", "Mark All On Duty") + 1-click individual toggles.
   - Full history of conducted sessions and class attendance log export.

4. **Admin Console**:
   - Institutional dashboard with aggregate attendance health rates.
   - **Student Management**: Add new students with roll numbers, search, filter, and deactivate/activate accounts.
   - **Faculty Management**: Register faculty, assign designations, and manage active status.
   - **Department & Class Management**: Manage academic cohorts and sections.
   - **Course Allocation Matrix**: Assign faculty to subjects and classes.
   - **Master Institutional Audit**: Download full CSV reports.
   - **Configurable Threshold**: Adjust university-wide attendance requirements (default: 75%).

---

## 🚀 Quick Start & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file based on `.env.example`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

*Note: If no Supabase keys are provided, the app will automatically run using its built-in local persistent storage engine with realistic institutional seed data.*

### 3. Start Development Server
```bash
npm run dev
```

---

## 🗄️ Supabase PostgreSQL Setup & Migrations

The database migration file is located at:
`supabase/migrations/20250101000000_init_attendance_system.sql`

### How to apply:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor** > **New Query**.
3. Paste the contents of `supabase/migrations/20250101000000_init_attendance_system.sql`.
4. Click **Run**.

### Schema Highlights:
- **`profiles`**: Extends `auth.users` with roles (`student`, `faculty`, `admin`).
- **`departments`**, **`classes`**, **`subjects`**: Core academic hierarchy.
- **`students`**, **`faculty`**, **`admins`**: Role profiles linked by foreign keys.
- **`faculty_subjects`**: Maps faculty to courses and classes.
- **`attendance`**: Enforces strict unique constraint:
  ```sql
  CONSTRAINT unique_student_session_attendance 
    UNIQUE (student_id, subject_id, class_id, date, session)
  ```
- **Row Level Security (RLS)**: Enforces that students can read only their own attendance; faculty can insert and update attendance for their assigned classes.

---

## 🔑 Login Credentials

| Role | Identifier | Password | Details |
| :--- | :--- | :--- | :--- |
| **Students (57 Accounts)** | Register No (`711025205001` to `711025205057`) OR Roll No (`25BIT001` to `25BIT057`) | `student 1` to `student 57` | e.g. `25BIT001` (ABISHEK M) with `student 1`, `25BIT048` (SIVARAJ S) with `student 46`, `25BIT057` with `student 54` |
| **Faculty (10 Accounts)** | `info 71101` to `info 71110` | `info 30` to `info 40` (or `info info 30`) | e.g. `info 71101` with `info 30`, `info 71110` with `info 40` |
| **Administrator** | `2025` | `admin` | Academic Administration Console |

---

## 🌐 Vercel Deployment

1. Push this repository to GitHub or GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. Set the Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. The deployment will automatically use `vercel.json` for SPA rewrites.
