import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/apiClient';

export const NotificationDropdown = () => {
  const { currentRole } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchAlerts = async () => {
      try {
        const res = await apiClient.get('/dashboard/alerts');
        if (isMounted && res?.success && Array.isArray(res.data)) {
          const mapped = res.data.map((a, i) => ({
            id: `notif-${i}`,
            title: a.title || 'System Notification',
            description: a.message || '',
            time: 'Just now',
            read: false,
            link: a.category === 'TIME_OFF' ? '/time-off/requests' : a.category === 'PAYROLL' ? '/payroll/payruns' : '/dashboard',
          }));
          setNotifications(mapped);
        } else if (isMounted) {
          setNotifications([]);
        }
      } catch (err) {
        if (isMounted) {
          setNotifications([]);
        }
      }
    };

    fetchAlerts();
    return () => {
      isMounted = false;
    };
  }, [currentRole]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <Dropdown
      align="right"
      className="w-80 p-0"
      trigger={
        <button
          type="button"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-white" />
          )}
        </button>
      }
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-slate-800">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="primary" size="sm">
              {unreadCount} new
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-[11px] font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No notifications for {currentRole}</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif.id)}
              className={`p-3.5 text-xs transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-3 ${
                !notif.read ? 'bg-orange-50/30' : ''
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  !notif.read ? 'bg-orange-500' : 'bg-transparent'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="font-semibold text-slate-900 truncate">{notif.title}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">{notif.time}</span>
                </div>
                <p className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">
                  {notif.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2 border-t border-slate-100 text-center bg-slate-50/50">
        <span className="text-[11px] text-slate-400">Role-Tailored HR Notifications</span>
      </div>
    </Dropdown>
  );
};
