import React from 'react';
import { Menu, PanelLeft } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { ProfileDropdown } from './ProfileDropdown';
import AttendenceButton from './AttendenceButton';

export const Topbar = ({
  onToggleSidebar,
  onOpenMobile,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-10 px-4 md:px-6 flex items-center justify-between shadow-xs">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop sidebar toggle shortcut */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden md:flex p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        <div className="hidden sm:block text-xs font-medium text-slate-400">
          Enterprise HR & Payroll Platform
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2">
        <AttendenceButton />
        <div className="h-6 w-[1px] bg-slate-200 mx-1" />
        <NotificationDropdown />
        <div className="h-6 w-[1px] bg-slate-200 mx-1" />
        <ProfileDropdown />
      </div>
    </header>
  );
};
