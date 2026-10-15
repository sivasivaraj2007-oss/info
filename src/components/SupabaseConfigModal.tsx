import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck 
} from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig, dbService } from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [key, setKey] = useState(currentConfig.key);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'reset'>('config');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      alert('Please provide both Supabase URL and Anon Key');
      return;
    }
    saveSupabaseConfig(url, key);
    onConfigChanged();
    setTestResult({ success: true, message: 'Settings saved! Testing connection...' });
    runTest();
  };

  const handleClear = () => {
    if (confirm('Switch back to local persistent demo database?')) {
      clearSupabaseConfig();
      setUrl('');
      setKey('');
      setTestResult(null);
      onConfigChanged();
    }
  };

  const runTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await dbService.testConnection();
    setTestResult(result);
    setIsTesting(false);
  };

  const handleResetData = () => {
    if (confirm('Reset local database to initial institutional seed records (students, faculty, classes, and attendance history)?')) {
      dbService.resetLocalDatabase();
      alert('Local database has been re-seeded with demo records.');
      window.location.reload();
    }
  };

  const sampleSqlSnippet = `-- Run this in your Supabase SQL Editor:
-- File: supabase/migrations/20250101000000_init_attendance_system.sql
-- Creates tables: profiles, departments, classes, students, faculty, admins, subjects, faculty_subjects, attendance
-- Enforces UNIQUE(student_id, subject_id, class_id, date, session)
-- Configures Row Level Security (RLS) policies for each role.`;

  const copySqlPath = () => {
    navigator.clipboard.writeText('supabase/migrations/20250101000000_init_attendance_system.sql');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100/80 rounded-lg text-blue-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Database & Supabase Engine</h2>
              <p className="text-xs text-slate-500">Configure connection or examine SQL schema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 px-6 pt-3 gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'config'
                ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Connection Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'sql'
                ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            SQL Migration
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reset')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'reset'
                ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Seed Data
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'config' && (
            <div>
              <div className="mb-5 p-3.5 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <span className="font-semibold">Dual Storage Architecture: </span>
                  When live Supabase credentials are provided, the app securely queries your Supabase PostgreSQL cluster with full RLS. When running offline or without credentials, it seamlessly operates using a high-fidelity local persistent engine.
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Found in your Supabase Dashboard under Project Settings &gt; API
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supabase Anon Public API Key
                  </label>
                  <input
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Safe for browser usage. Never provide your service-role secret key.
                  </p>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                    >
                      Save Credentials
                    </button>
                    {currentConfig.isConfigured && (
                      <button
                        type="button"
                        onClick={runTest}
                        disabled={isTesting}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                        {isTesting ? 'Testing...' : 'Test Connection'}
                      </button>
                    )}
                  </div>
                  {currentConfig.isConfigured && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">Database Migration Script</span>
                <button
                  type="button"
                  onClick={copySqlPath}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Path Copied!' : 'Copy Migration Path'}
                </button>
              </div>
              <div className="bg-slate-900 rounded-lg p-3.5 text-slate-200 text-xs font-mono overflow-x-auto max-h-56 border border-slate-800">
                <pre>{sampleSqlSnippet}</pre>
              </div>
              <p className="text-xs text-slate-600">
                The migration file is available at <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono text-[11px]">supabase/migrations/20250101000000_init_attendance_system.sql</code>. It includes complete schema definitions, UUID keys, foreign constraints, RLS policies, and the <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">resolve_login_identifier</code> function.
              </p>
            </div>
          )}

          {activeTab === 'reset' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Institutional Seed Dataset</h3>
                <p className="text-xs text-slate-600 mb-3">
                  Reset local storage to initial pre-populated departments (CSE, IT, ECE), subjects, faculty members (Dr. Robert Vance, Prof. Ananya Sharma), enrolled students (Sarah Jenkins, Alexander Chen, Priya Patel, etc.), and 40 academic attendance sessions.
                </p>
                <button
                  type="button"
                  onClick={handleResetData}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset to Institutional Defaults
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
