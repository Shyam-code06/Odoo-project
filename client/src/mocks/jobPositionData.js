/**
 * Job Position Mock Dataset
 */

export let MOCK_JOB_POSITIONS = [
  { id: 'pos-001', title: 'Software Engineer', code: 'SE', department_id: 'dept-001', description: 'Develop and maintain web software applications.', status: 'Active' },
  { id: 'pos-002', title: 'Senior Frontend Engineer', code: 'SFE', department_id: 'dept-001', description: 'Lead frontend architecture and modern web apps.', status: 'Active' },
  { id: 'pos-003', title: 'Backend Tech Lead', code: 'BTL', department_id: 'dept-001', description: 'Design microservices and cloud infrastructure.', status: 'Active' },
  { id: 'pos-004', title: 'HR Operations Specialist', code: 'HRS', department_id: 'dept-002', description: 'Manage employee onboarding and HR workflows.', status: 'Active' },
  { id: 'pos-005', title: 'HR Manager', code: 'HRM', department_id: 'dept-002', description: 'Oversee human resources department and policy.', status: 'Active' },
  { id: 'pos-006', title: 'Payroll Analyst', code: 'PA', department_id: 'dept-003', description: 'Process salary calculations and tax compliance.', status: 'Active' },
  { id: 'pos-007', title: 'Finance Lead', code: 'FL', department_id: 'dept-003', description: 'Manage corporate budget and financial planning.', status: 'Active' },
  { id: 'pos-008', title: 'Product Designer', code: 'PD', department_id: 'dept-004', description: 'Create user interfaces and design systems.', status: 'Active' },
  { id: 'pos-009', title: 'Product Manager', code: 'PM', department_id: 'dept-004', description: 'Define product strategy and feature roadmaps.', status: 'Active' },
  { id: 'pos-010', title: 'Marketing Executive', code: 'ME', department_id: 'dept-005', description: 'Execute brand marketing and customer outreach.', status: 'Active' },
];

export const getRawJobPositions = () => MOCK_JOB_POSITIONS;
export const setRawJobPositions = (positions) => { MOCK_JOB_POSITIONS = positions; };
