/**
 * Department Adapter
 * Transforms raw Department data into UI-ready models with derived relational properties.
 */

export const departmentAdapter = {
  toUIModel: (dept, employees = [], jobPositions = []) => {
    if (!dept) return null;

    // Find manager details if manager_id or managerId exists
    const managerId = dept.manager_id || dept.managerId;
    let manager = null;
    if (managerId) {
      const mgrEmp = employees.find((e) => e.id === managerId);
      if (mgrEmp) {
        manager = {
          id: mgrEmp.id,
          name: `${mgrEmp.first_name} ${mgrEmp.last_name}`,
          code: mgrEmp.employee_code,
          email: mgrEmp.email,
          avatar: mgrEmp.avatar || '',
        };
      } else if (dept.manager_name) {
        manager = {
          id: managerId,
          name: dept.manager_name,
          code: dept.manager_code || '',
          email: dept.manager_email || '',
          avatar: '',
        };
      }
    }

    // Calculate derived counts from real DB if provided, else filter
    const employeeCount = dept.employee_count !== undefined
      ? parseInt(dept.employee_count, 10) || 0
      : employees.filter((e) => e.department_id === dept.id).length;
    const jobPositionCount = dept.job_position_count !== undefined
      ? parseInt(dept.job_position_count, 10) || 0
      : jobPositions.filter((p) => p.department_id === dept.id).length;

    return {
      id: dept.id,
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
      managerId: managerId || null,
      manager,
      employeeCount,
      jobPositionCount,
      status: dept.status || 'Active',
      created_at: dept.created_at || new Date().toISOString(),
      updated_at: dept.updated_at || new Date().toISOString(),
    };
  },

  toAPIModel: (uiData) => {
    return {
      name: uiData.name ? uiData.name.trim() : '',
      code: uiData.code ? uiData.code.trim().toUpperCase() : '',
      description: uiData.description ? uiData.description.trim() : '',
      manager_id: uiData.managerId || uiData.manager_id || null,
      status: uiData.status || 'Active',
    };
  },
};
