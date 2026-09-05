import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasRolePermission } from '../config/permissions';

export const RoleRoute = ({ allowedRoles, requiredPermission, children }) => {
  const { currentRole, hasPermission } = useAuth();

  let isAuthorized = true;

  if (requiredPermission) {
    isAuthorized = hasPermission(requiredPermission);
  } else if (allowedRoles && allowedRoles.length > 0) {
    isAuthorized = hasRolePermission(currentRole, allowedRoles);
  }

  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
