import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasRolePermission, normalizeRole } from '../config/permissions';

export const RoleRoute = ({ allowedRoles, strictRoles, requiredPermission, children }) => {
  const { currentRole, hasPermission } = useAuth();

  let isAuthorized = true;

  if (strictRoles && strictRoles.length > 0) {
    const canonical = normalizeRole(currentRole);
    isAuthorized = strictRoles.map(normalizeRole).includes(canonical);
  } else if (requiredPermission) {
    isAuthorized = hasPermission(requiredPermission);
  } else if (allowedRoles && allowedRoles.length > 0) {
    isAuthorized = hasRolePermission(currentRole, allowedRoles);
  }

  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
