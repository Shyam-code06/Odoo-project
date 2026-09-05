import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-500 text-white font-black text-2xl shadow-md shadow-orange-500/20 mb-3">
            H
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">HRMS Enterprise</h1>
          <p className="text-xs text-slate-500 mt-1">Human Resource & Payroll Management System</p>
        </div>

        {/* Card Canvas */}
        <div className="surface-card p-8 shadow-sm">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} HRMS SaaS Platform. All rights reserved.
        </div>
      </div>
    </div>
  );
};
