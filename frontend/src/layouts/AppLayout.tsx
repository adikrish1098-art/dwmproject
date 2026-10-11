import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export const AppLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium tracking-wide">Initializing Clinical Warehouse System...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
