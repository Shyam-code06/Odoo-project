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
          avatar: mgrEmp.avatar,
        };
      }
    }

    // Calculate derived counts
    const employeeCount = employees.filter((e) => e.department_id === dept.id).length;
    const jobPositionCount = jobPositions.filter((p) => p.department_id === dept.id).length;

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
