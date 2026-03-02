import React from 'react';
import { Outlet, NavLink, Navigate } from 'react-router';
import { useApp } from '../lib/AppContext';
import { LogOut, Folders, FileVideo } from 'lucide-react';
import { Toaster } from 'sonner';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Toaster position="bottom-right" theme="dark" expand={false} />

      {/* Main Content */}
      <main className="min-h-screen w-full">
        <div className="w-[80%] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}