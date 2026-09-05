import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { MOCK_CURRENT_USER } from '../mocks/authData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(MOCK_CURRENT_USER);
  const [currentRole, setCurrentRole] = useState(MOCK_CURRENT_USER.role);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initial sync
    setLoading(true);
    authService.getCurrentUser().then((userData) => {
      setUser(userData);
      setCurrentRole(userData.role);
      setLoading(false);
    });
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    const res = await authService.login(email, password);
    if (res.success) {
      setUser(res.user);
      setCurrentRole(res.user.role);
      setIsAuthenticated(true);
    }
    setLoading(false);
    return res;
  };

  const logout = async () => {
    setLoading(true);
    await authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setLoading(false);
  };

  const switchRole = (newRole) => {
    setCurrentRole(newRole);
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user,
        currentRole,
        isAuthenticated,
        loading,
        login,
        logout,
        switchRole,
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
