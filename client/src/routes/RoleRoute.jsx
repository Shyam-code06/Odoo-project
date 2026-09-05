import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hasRolePermission } from '../config/permissions';
import { ErrorState } from '../components/ui/ErrorState';

export const RoleRoute = ({ allowedRoles, children }) => {
  const { currentRole } = useAuth();

  const isAuthorized = hasRolePermission(currentRole, allowedRoles);

  if (!isAuthorized) {
    return (
      <div className="py-12">
        <ErrorState
          title="Access Restricted"
          description={`Your current role (${currentRole}) does not have permission to view this section.`}
        />
      </div>
    );
  }

  return children;
};
