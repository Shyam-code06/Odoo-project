import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import {
  ROLE_PERMISSIONS,
  normalizeRole,
  hasPermission as checkHasPermission,
} from '../config/permissions';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session state on startup from localStorage
  useEffect(() => {
    let isMounted = true;
    authService
      .getCurrentSession()
      .then((session) => {
        if (isMounted) {
          if (session && session.user) {
            const canonicalRole = normalizeRole(session.user.role || session.user.role_name);
            session.user.role = canonicalRole;
            setUser(session.user);
            setCurrentRole(canonicalRole);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setCurrentRole(null);
            setIsAuthenticated(false);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
          setCurrentRole(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    const res = await authService.login(email, password);
    if (res.success && res.user) {
      const canonicalRole = normalizeRole(res.user.role || res.user.role_name);
      res.user.role = canonicalRole;
      setUser(res.user);
      setCurrentRole(canonicalRole);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
    return res;
  };

  const logout = async () => {
    setIsLoading(true);
    await authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setCurrentRole(null);
    setIsLoading(false);
  };

  const switchRole = (newRole) => {
    setCurrentRole(newRole);
    if (user) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      authService.updateProfile({ role: newRole });
    }
  };

  const hasPermission = (permissionKey) => {
    if (!currentRole) return false;
    return checkHasPermission(currentRole, permissionKey);
  };

  const hasRole = (allowedRoles = []) => {
    if (!currentRole) return false;
    if (allowedRoles.length === 0) return true;
    return allowedRoles.includes(currentRole);
  };

  const activePermissions = currentRole ? ROLE_PERMISSIONS[currentRole] || [] : [];

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user,
        role: currentRole,
        currentRole,
        permissions: activePermissions,
        isAuthenticated,
        isLoading,
        login,
        logout,
        switchRole,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
