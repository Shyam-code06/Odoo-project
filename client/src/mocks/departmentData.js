/**
 * Department Dataset
 */

export let MOCK_DEPARTMENTS = [
  { id: 1, name: 'Engineering', code: 'ENG', description: 'Software engineering & product development', manager_id: 1, status: 'Active' },
  { id: 2, name: 'Human Resources', code: 'HR', description: 'Talent acquisition, operations & compliance', manager_id: 2, status: 'Active' },
  { id: 3, name: 'Finance', code: 'FIN', description: 'Accounting, compensation & payroll', manager_id: 3, status: 'Active' },
  { id: 4, name: 'Sales & Marketing', code: 'MKT', description: 'Growth, brand & business development', manager_id: null, status: 'Active' },
];

export const getRawDepartments = () => MOCK_DEPARTMENTS;
export const setRawDepartments = (depts) => { MOCK_DEPARTMENTS = depts; };
