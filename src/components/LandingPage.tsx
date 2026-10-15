import React, { useState } from 'react';
import { 
  GraduationCap, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  UserCheck, 
  BookOpen, 
  AlertCircle,
  Database,
  Building,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';
import { Role } from '../types/attendance';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onOpenConfig: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenConfig }) => {
  const { signInWithIdentifier, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [identifier, setIdentifier] = useState('711025205001');
  const [password, setPassword] = useState('student 1');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Switch role tabs and populate recommended demo credentials
  const handleRoleTabChange = (role: Role) => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'student') {
      setIdentifier('711025205001');
      setPassword('student 1');
    } else if (role === 'faculty') {
      setIdentifier('info 71101');
      setPassword('info 30');
    } else if (role === 'admin') {
      setIdentifier('2025');
      setPassword('admin');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both identifier and password.');
      return;
    }

    const result = await signInWithIdentifier(identifier, password, selectedRole);
    if (!result.success && result.error) {
      setErrorMessage(result.error);
    }
  };

  const getIdentifierLabel = () => {
    if (selectedRole === 'student') return 'Register Number (711025205001 - 057)';
    if (selectedRole === 'faculty') return 'Faculty Register Num (info 71101 - 71110)';
    return 'Admin Register Number (2025)';
  };

  const getIdentifierPlaceholder = () => {
    if (selectedRole === 'student') return 'e.g. 711025205001';
    if (selectedRole === 'faculty') return 'e.g. info 71101';
    return 'e.g. 2025';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Column: Brand & Hero Storytelling (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Enterprise Student Attendance & Compliance Platform</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight" style={{ textWrap: 'balance' }}>
                Automated Academic Attendance Management
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Real-time role-based attendance governance powered by Supabase PostgreSQL. Built with strict anti-duplicate database constraints, automatic 75% shortage calculations, and granular RLS authorization.
              </p>
            </div>

            {/* Campus Architectural Image Feature */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 group">
              <img
                src="/src/assets/images/smart_campus_building_1792036324699.jpg"
                alt="Smart Academic Campus Facilities"
                referrerPolicy="no-referrer"
                className="w-full h-56 sm:h-64 object-cover group-hover:scale-[1.01] transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent flex items-end p-5">
                <div className="text-white text-xs space-y-1">
                  <span className="font-semibold text-sm block">Central University Academic Complex</span>
                  <p className="text-slate-300 text-[11px]">
                    Unified data pipeline for students, faculty, and academic administration.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Architectural Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900 block">Strict Sessions</span>
                <p className="text-[11px] text-slate-500">Database constraint prevents duplicate session records</p>
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900 block">75% Shortage Math</span>
                <p className="text-[11px] text-slate-500">Calculates exact consecutive sessions required for exam eligibility</p>
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900 block">Supabase + RLS</span>
                <p className="text-[11px] text-slate-500">Row Level Security enforces student & faculty privacy</p>
              </div>
            </div>
          </div>

          {/* Right Column: Secure Role Authentication Portal (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Institutional Portal Sign In</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your role to access your dashboard
                </p>
              </div>

              {/* Role Selection Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleRoleTabChange('student')}
                  className={`py-2 text-xs font-semibold rounded-md transition-all flex flex-col items-center gap-1 ${
                    selectedRole === 'student'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleTabChange('faculty')}
                  className={`py-2 text-xs font-semibold rounded-md transition-all flex flex-col items-center gap-1 ${
                    selectedRole === 'faculty'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Faculty</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleTabChange('admin')}
                  className={`py-2 text-xs font-semibold rounded-md transition-all flex flex-col items-center gap-1 ${
                    selectedRole === 'admin'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Admin</span>
                </button>
              </div>

              {/* Quick Fill Demo Credential Pill */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 text-xs text-blue-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Pre-Configured Credentials:</span>
                  <span className="text-[11px] text-blue-600 font-medium">Ready to Test</span>
                </div>
                
                {selectedRole === 'student' && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-600">
                      Dept: <strong className="text-slate-900">Information Technology (IT)</strong> · Class: <strong className="text-slate-900">B.Tech IT - 2nd Year</strong>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Roll No: <strong className="font-mono text-blue-900">25BIT001 - 25BIT057</strong> | Pass: <strong className="font-mono text-blue-900">student 1 - student 57</strong>
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => { setIdentifier('25BIT001'); setPassword('student 1'); }}
                        className="px-2 py-0.5 text-[11px] font-mono rounded bg-white border border-blue-200 text-blue-800 hover:bg-blue-100 transition-colors"
                      >
                        ABISHEK M (25BIT001)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIdentifier('25BIT048'); setPassword('student 46'); }}
                        className="px-2 py-0.5 text-[11px] font-mono rounded bg-white border border-blue-200 text-blue-800 hover:bg-blue-100 transition-colors font-bold"
                      >
                        SIVARAJ S (25BIT048)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIdentifier('25BIT057'); setPassword('student 54'); }}
                        className="px-2 py-0.5 text-[11px] font-mono rounded bg-white border border-blue-200 text-blue-800 hover:bg-blue-100 transition-colors"
                      >
                        YUVASRI S (25BIT057)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIdentifier('711025205001'); setPassword('student 1'); }}
                        className="px-2 py-0.5 text-[11px] font-mono rounded bg-white border border-blue-200 text-slate-700 hover:bg-blue-100 transition-colors"
                      >
                        By Reg No (711025205001)
                      </button>
                    </div>
                  </div>
                )}

                {selectedRole === 'faculty' && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-600">
                      Register: <strong className="font-mono text-blue-900">info 71101 - info 71110</strong> | Password: <strong className="font-mono text-blue-900">info 30 - info 40</strong>
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => { setIdentifier('info 71101'); setPassword('info 30'); }}
                        className="px-2 py-0.5 text-[11px] font-mono rounded bg-white border border-blue-200 text-blue-800 hover:bg-blue-100 transition-colors"
                      >
                        Faculty (info 71101 / info 30)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIdentifier('info 71110'); setPassword('info 40'); }}
                        className="px-2 py-0.5 text-[11px] font-mono rounded bg-white border border-blue-200 text-blue-800 hover:bg-blue-100 transition-colors"
                      >
                        Faculty (info 71110 / info 40)
                      </button>
                    </div>
                  </div>
                )}

                {selectedRole === 'admin' && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-600">
                      Register No: <strong className="font-mono text-blue-900">2025</strong> | Password: <strong className="font-mono text-blue-900">admin</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => { setIdentifier('2025'); setPassword('admin'); }}
                      className="px-2 py-0.5 text-[11px] font-mono rounded bg-white border border-blue-200 text-blue-800 hover:bg-blue-100 transition-colors"
                    >
                      Admin 2025 / admin
                    </button>
                  </div>
                )}
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {getIdentifierLabel()}
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={getIdentifierPlaceholder()}
                      className="w-full pl-9 pr-3.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <span>{isLoading ? 'Verifying Account...' : `Sign In as ${selectedRole.toUpperCase()}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Bottom Database Status */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Database Status:</span>
                <button
                  type="button"
                  onClick={onOpenConfig}
                  className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                >
                  <span>Manage Supabase Config</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Smart Student Attendance Management System</span>
            <span aria-hidden="true">·</span>
            <span>Academic Version 2025-2026</span>
          </div>
          <div>
            Built with React, Vite, Tailwind CSS, Supabase PostgreSQL, and Vercel.
          </div>
        </div>
      </footer>
    </div>
  );
};
