import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { StudentDashboard } from './components/StudentDashboard';
import { FacultyDashboard } from './components/FacultyDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';

const AppContent: React.FC = () => {
  const { user, role, isLoading } = useAuth();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading Attendance System...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar
        onOpenConfig={() => setIsConfigOpen(true)}
        onNavigateHome={() => {}}
      />

      <main className="flex-1">
        {!user ? (
          <LandingPage onOpenConfig={() => setIsConfigOpen(true)} />
        ) : role === 'student' ? (
          <StudentDashboard />
        ) : role === 'faculty' ? (
          <FacultyDashboard />
        ) : role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <LandingPage onOpenConfig={() => setIsConfigOpen(true)} />
        )}
      </main>

      <SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConfigChanged={() => {}}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
