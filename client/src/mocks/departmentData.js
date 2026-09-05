/**
 * Department Mock Dataset
 */

export let MOCK_DEPARTMENTS = [
  { id: 'dept-001', name: 'Engineering', code: 'ENG', description: 'Software engineering & product development', manager_id: 'emp-001', status: 'Active' },
  { id: 'dept-002', name: 'Human Resources', code: 'HR', description: 'Talent acquisition, operations & compliance', manager_id: 'emp-002', status: 'Active' },
  { id: 'dept-003', name: 'Finance & Payroll', code: 'FIN', description: 'Accounting, compensation & payroll', manager_id: 'emp-004', status: 'Active' },
  { id: 'dept-004', name: 'Product & Design', code: 'PD', description: 'Product management & UI/UX design', manager_id: 'emp-006', status: 'Active' },
  { id: 'dept-005', name: 'Marketing & Sales', code: 'MKT', description: 'Growth, brand & business development', manager_id: null, status: 'Active' },
];

export const getRawDepartments = () => MOCK_DEPARTMENTS;
export const setRawDepartments = (depts) => { MOCK_DEPARTMENTS = depts; };
