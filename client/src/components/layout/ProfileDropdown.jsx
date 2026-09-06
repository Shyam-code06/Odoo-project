import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ShieldAlert, ChevronDown } from 'lucide-react';
import { Dropdown, DropdownItem, DropdownDivider } from '../ui/Dropdown';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { ALL_ROLES } from '../../config/permissions';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';

export const ProfileDropdown = () => {
  const { user, currentRole, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = async () => {
    await logout();
    toast.info('Logged out successfully.');
    navigate('/auth/login', { replace: true });
  };

  // const handleRoleChange = (newRole) => {
  //   switchRole(newRole);
  //   toast.info(`Switched role to ${newRole}`);
  // };

  return (
    <Dropdown
      align="right"
      className="w-64"
      trigger={
        <button
          type="button"
          className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-left"
        >
          <Avatar src={user?.avatar} name={user?.name || 'User'} size="sm" status="online" />
          <div className="hidden sm:flex flex-col min-w-0">
            <span className="text-xs font-semibold text-slate-800 truncate leading-none">
              {user?.name || 'User'}
            </span>
            <span className="text-[10px] text-slate-500 truncate mt-0.5">
              {currentRole || 'Employee'}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
        </button>
      }
    >
      <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/50">
        <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
        <div className="mt-1.5">
          <Badge variant="primary" size="sm">
            {currentRole}
          </Badge>
        </div>
      </div>

      {/* Role Switcher Toolbar for Development Testing */}
      {/* <div className="px-3 py-2 border-b border-slate-100 bg-orange-50/30">
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-orange-500" />
          Switch Role (Dev Testing)
        </label>
        <select
          value={currentRole || ''}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="w-full text-xs rounded border border-slate-300 bg-white px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div> */}

      <DropdownItem icon={User} onClick={() => navigate('/profile')}>
        My Profile
      </DropdownItem>
      <DropdownItem icon={Settings} onClick={() => navigate('/settings/account')}>
        Account Settings
      </DropdownItem>

      <DropdownDivider />

      <DropdownItem icon={LogOut} isDanger onClick={handleLogout}>
        Log Out
      </DropdownItem>
    </Dropdown>
  );
};
