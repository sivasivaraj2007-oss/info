import React from 'react';
import { Database, LogOut, GraduationCap, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSupabaseConfig } from '../lib/supabase';

interface NavbarProps {
  onOpenConfig: () => void;
  onNavigateHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenConfig, onNavigateHome }) => {
  const { user, role, signOut } = useAuth();
  const config = getSupabaseConfig();

  const getRoleLabel = () => {
    if (role === 'student') return 'Student Portal';
    if (role === 'faculty') return 'Faculty Console';
    if (role === 'admin') return 'Academic Admin';
    return 'Academic Portal';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title, single line */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Smart Attendance
            </span>
          </button>
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span aria-hidden="true">/</span>
              <span className="font-medium text-slate-700">{getRoleLabel()}</span>
            </div>
          )}
        </div>

        {/* Zone 2: Navigation links / system contextual tags */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <span className="text-xs text-slate-500">Academic Year 2025-2026</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="text-xs text-slate-500">Odd Semester</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="text-xs text-slate-500">Minimum 75% Rule Enforced</span>
        </nav>

        {/* Zone 3: Actions (Supabase status pill + Profile/Logout) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Supabase Status Pill */}
          <button
            type="button"
            onClick={onOpenConfig}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors whitespace-nowrap"
            title="Configure Supabase Connection"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">
              {config.isConfigured ? 'Supabase Connected' : 'Local Storage DB'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                config.isConfigured ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
            />
          </button>

          {/* User Profile / Logout */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {user.profile.full_name}
                </span>
                <span className="text-[11px] text-slate-500 capitalize">
                  {user.role}
                </span>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors whitespace-nowrap"
                title="Sign out of current account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <User className="w-4 h-4 text-slate-400" />
              <span>Not Signed In</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
