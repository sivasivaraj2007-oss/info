import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, Profile, Student, Faculty, Admin } from '../types/attendance';
import { dbService, getSupabase } from '../lib/supabase';

interface AuthUser {
  id: string;
  email: string;
  role: Role;
  profile: Profile;
  student?: Student;
  faculty?: Faculty;
  admin?: Admin;
}

interface AuthContextType {
  user: AuthUser | null;
  role: Role | null;
  isLoading: boolean;
  threshold: number;
  setThreshold: (value: number) => void;
  signInWithIdentifier: (identifier: string, password: string, role: Role) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'smart_att_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [threshold, setThresholdState] = useState<number>(dbService.getThreshold());

  const setThreshold = (value: number) => {
    dbService.setThreshold(value);
    setThresholdState(value);
  };

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser;
          // Refresh user data from dbService
          await hydrateUserSession(parsed.profile.id, parsed.role);
        }
      } catch (e) {
        console.error('Failed to restore auth session:', e);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const hydrateUserSession = async (userId: string, role: Role): Promise<AuthUser | null> => {
    if (role === 'student') {
      const students = await dbService.getStudents();
      const currentStudent = students.find(s => s.user_id === userId || s.id === userId);
      if (currentStudent && currentStudent.profile) {
        const authUser: AuthUser = {
          id: currentStudent.user_id,
          email: currentStudent.profile.email,
          role: 'student',
          profile: currentStudent.profile,
          student: currentStudent,
        };
        setUser(authUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
        return authUser;
      }
    } else if (role === 'faculty') {
      const facultyList = await dbService.getFaculty();
      const currentFaculty = facultyList.find(f => f.user_id === userId || f.id === userId);
      if (currentFaculty && currentFaculty.profile) {
        const authUser: AuthUser = {
          id: currentFaculty.user_id,
          email: currentFaculty.profile.email,
          role: 'faculty',
          profile: currentFaculty.profile,
          faculty: currentFaculty,
        };
        setUser(authUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
        return authUser;
      }
    } else if (role === 'admin') {
      const adminProfile: Profile = {
        id: 'user-admin-2025',
        email: 'admin2025@smartattendance.edu',
        full_name: 'Academic Administrator (2025)',
        role: 'admin',
        phone: '+91 98400 02025',
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
      };
      const authUser: AuthUser = {
        id: 'user-admin-2025',
        email: adminProfile.email,
        role: 'admin',
        profile: adminProfile,
        admin: {
          id: 'admin-2025',
          user_id: 'user-admin-2025',
          username: '2025',
          department: 'Central Academic Administration',
          profile: adminProfile,
        },
      };
      setUser(authUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      return authUser;
    }
    return null;
  };

  const signInWithIdentifier = async (
    identifier: string,
    password: string,
    role: Role
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanId = identifier.trim().toLowerCase();
      const compactId = cleanId.replace(/\s+/g, '');

      // Check if Supabase client is connected
      const supabase = getSupabase();
      if (supabase) {
        let resolvedEmail = '';
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('resolve_login_identifier', {
            p_identifier: identifier.trim(),
            p_role: role,
          });

          if (!rpcError && rpcData && rpcData.length > 0) {
            resolvedEmail = rpcData[0].email;
          }
        } catch {
          // If RPC is not created yet, map by standard pattern
        }

        if (!resolvedEmail) {
          if (role === 'student') resolvedEmail = `${compactId}@student.smartattendance.edu`;
          else if (role === 'faculty') resolvedEmail = `faculty.${compactId}@smartattendance.edu`;
          else resolvedEmail = `admin2025@smartattendance.edu`;
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password: password,
        });

        if (authError) {
          console.warn('Supabase Auth error, checking local store:', authError.message);
        } else if (authData.user) {
          const hydrated = await hydrateUserSession(authData.user.id, role);
          if (hydrated) {
            setIsLoading(false);
            return { success: true };
          }
        }
      }

      // Local / Offline authentication engine
      if (role === 'student') {
        const students = await dbService.getStudents();
        const student = students.find(s => {
          const sReg = s.register_no.toLowerCase().replace(/\s+/g, '');
          const sRoll = (s.roll_no || '').toLowerCase().replace(/\s+/g, '');
          return sReg === compactId || sRoll === compactId;
        });

        if (!student) {
          setIsLoading(false);
          return { 
            success: false, 
            error: `Student not found. Enter Register Number (711025205001-057) or Roll Number (25BIT001-057).` 
          };
        }

        if (!student.is_active) {
          setIsLoading(false);
          return { success: false, error: 'This student account has been deactivated.' };
        }

        // Extract student number (e.g. 711025205001 -> 1, 711025205048 -> 48)
        const match = student.register_no.match(/(\d+)$/);
        const studentNum = match ? parseInt(match[1].slice(-3), 10) : 1;
        const cleanPass = password.trim().toLowerCase();

        const isValidPassword = 
          cleanPass === `student ${studentNum}` ||
          cleanPass === `student${studentNum}` ||
          cleanPass === `password@123` ||
          cleanPass === student.register_no.toLowerCase() ||
          cleanPass === (student.roll_no || '').toLowerCase();

        if (!isValidPassword) {
          setIsLoading(false);
          return { 
            success: false, 
            error: `Invalid password. For ${student.profile?.full_name || student.roll_no || student.register_no}, use password "student ${studentNum}".` 
          };
        }

        const authUser: AuthUser = {
          id: student.user_id,
          email: student.profile?.email || `${student.register_no}@student.smartattendance.edu`,
          role: 'student',
          profile: student.profile || {
            id: student.user_id,
            email: `${student.register_no}@student.smartattendance.edu`,
            full_name: `Student ${studentNum}`,
            role: 'student',
            is_active: true,
            created_at: new Date().toISOString(),
          },
          student: student,
        };

        setUser(authUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
        setIsLoading(false);
        return { success: true };

      } else if (role === 'faculty') {
        const facultyList = await dbService.getFaculty();
        const faculty = facultyList.find(f => {
          const fComp = f.faculty_id.toLowerCase().replace(/\s+/g, '');
          return fComp === compactId || compactId.includes(fComp) || fComp.includes(compactId);
        });

        if (!faculty) {
          setIsLoading(false);
          return { 
            success: false, 
            error: `Faculty not found. Valid IDs are "info 71101" to "info 71110".` 
          };
        }

        if (!faculty.is_active) {
          setIsLoading(false);
          return { success: false, error: 'This faculty account is currently marked inactive.' };
        }

        // Extract faculty number e.g. 71101 -> 30, 71110 -> 40
        const facNumMatch = faculty.faculty_id.match(/(\d+)/);
        const facNum = facNumMatch ? parseInt(facNumMatch[1], 10) : 71101;
        const passOffset = facNum - 71101;
        const passNum = 30 + passOffset;
        const cleanPass = password.trim().toLowerCase();

        const isValidPassword =
          cleanPass === `info ${passNum}` ||
          cleanPass === `info info ${passNum}` ||
          cleanPass === `info${passNum}` ||
          cleanPass === `infoinfo${passNum}` ||
          cleanPass === `password@123`;

        if (!isValidPassword) {
          setIsLoading(false);
          return { 
            success: false, 
            error: `Invalid password. For ${faculty.faculty_id}, use password "info ${passNum}" or "info info ${passNum}".` 
          };
        }

        const authUser: AuthUser = {
          id: faculty.user_id,
          email: faculty.profile?.email || `faculty.${facNum}@smartattendance.edu`,
          role: 'faculty',
          profile: faculty.profile || {
            id: faculty.user_id,
            email: `faculty.${facNum}@smartattendance.edu`,
            full_name: `Prof. Faculty ${facNum}`,
            role: 'faculty',
            is_active: true,
            created_at: new Date().toISOString(),
          },
          faculty: faculty,
        };

        setUser(authUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
        setIsLoading(false);
        return { success: true };

      } else if (role === 'admin') {
        const isAdminId = 
          cleanId === '2025' || 
          cleanId === 'admin' || 
          cleanId === 'admin2025';

        if (!isAdminId) {
          setIsLoading(false);
          return { 
            success: false, 
            error: 'Invalid admin register number. Use "2025".' 
          };
        }

        const cleanPass = password.trim().toLowerCase();
        const isValidAdminPass = 
          cleanPass === 'admin' || 
          cleanPass === 'admin123' || 
          cleanPass === 'adminpassword@123';

        if (!isValidAdminPass) {
          setIsLoading(false);
          return { 
            success: false, 
            error: 'Invalid password. For Admin 2025, use password "admin".' 
          };
        }

        const adminProfile: Profile = {
          id: 'user-admin-2025',
          email: 'admin2025@smartattendance.edu',
          full_name: 'Academic Administrator (2025)',
          role: 'admin',
          phone: '+91 98400 02025',
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
        };

        const authUser: AuthUser = {
          id: 'user-admin-2025',
          email: adminProfile.email,
          role: 'admin',
          profile: adminProfile,
          admin: {
            id: 'admin-2025',
            user_id: 'user-admin-2025',
            username: '2025',
            department: 'Central Academic Administration',
            profile: adminProfile,
          },
        };

        setUser(authUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Invalid role specified.' };
    } catch (err: unknown) {
      setIsLoading(false);
      return { success: false, error: err instanceof Error ? err.message : 'Authentication failed.' };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setIsLoading(false);
  };

  const refreshUserData = async () => {
    if (!user) return;
    await hydrateUserSession(user.id, user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        threshold,
        setThreshold,
        signInWithIdentifier,
        signOut,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
