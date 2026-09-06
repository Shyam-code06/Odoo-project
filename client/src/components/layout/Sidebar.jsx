import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { NAVIGATION_CATEGORIES } from '../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { currentRole, hasPermission } = useAuth();
  const location = useLocation();

  const renderIcon = (name) => {
    const IconComponent = Icons[name] || Icons.Circle;
    return <IconComponent className="w-5 h-5 shrink-0 transition-colors" />;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-orange-500 text-white font-black text-lg flex items-center justify-center shadow-sm shadow-orange-500/20 shrink-0">
            H
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-900 tracking-tight text-base leading-none">
                HRMS
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                Enterprise SaaS
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <Icons.ChevronRight className="w-4 h-4" />
          ) : (
            <Icons.PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Links Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAVIGATION_CATEGORIES.map((category) => {
          // Filter navigation items using permission check and role restrictions
          const visibleItems = category.items.filter((item) => {
            if (item.hideForRoles && item.hideForRoles.includes(currentRole)) {
              return false;
            }
            if (item.roles && !item.roles.includes(currentRole)) {
              return false;
            }
            return hasPermission(item.permission);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={category.id} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {category.label}
                </h3>
              )}
              {visibleItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-orange-50 text-orange-600 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-orange-500" />
                    )}

                    <span className={isActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-600'}>
                      {renderIcon(item.iconName)}
                    </span>

                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer Area with active role info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[11px] text-slate-600 font-semibold truncate">
              {currentRole || 'Guest'}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside
        className={`hidden md:block h-screen sticky top-0 transition-all duration-300 ease-in-out z-20 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-xs bg-white h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <button
              type="button"
              onClick={onCloseMobile}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <Icons.X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
