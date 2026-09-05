/**
 * Job Position Adapter
 * Transforms raw Job Position data into UI-ready models with derived relational properties.
 */

export const jobPositionAdapter = {
  toUIModel: (pos, departments = [], employees = []) => {
    if (!pos) return null;

    const departmentId = pos.department_id || pos.departmentId;
    let department = null;

    if (departmentId) {
      const deptObj = departments.find((d) => d.id === departmentId);
      if (deptObj) {
        department = {
          id: deptObj.id,
          name: deptObj.name,
          code: deptObj.code,
        };
      } else if (pos.department_name) {
        department = {
          id: departmentId,
          name: pos.department_name,
          code: pos.department_code || '',
        };
      }
    }

    const employeeCount = pos.employee_count !== undefined
      ? parseInt(pos.employee_count, 10) || 0
      : employees.filter((e) => e.job_position_id === pos.id).length;

    return {
      id: pos.id,
      title: pos.title || '',
      code: pos.code || '',
      departmentId: departmentId || null,
      department,
      description: pos.description || '',
      employeeCount,
      status: pos.status || 'Active',
      created_at: pos.created_at || new Date().toISOString(),
      updated_at: pos.updated_at || new Date().toISOString(),
    };
  },

  toAPIModel: (uiData) => {
    return {
      title: uiData.title ? uiData.title.trim() : '',
      code: uiData.code ? uiData.code.trim().toUpperCase() : '',
      department_id: uiData.departmentId || uiData.department_id || null,
      description: uiData.description ? uiData.description.trim() : '',
      status: uiData.status || 'Active',
    };
  },
};
