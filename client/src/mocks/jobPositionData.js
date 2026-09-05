/**
 * Job Position Dataset
 */

export let MOCK_JOB_POSITIONS = [
  { id: 1, title: 'Engineering Manager', code: 'EM', department_id: 1, description: 'Lead engineering team', status: 'Active' },
  { id: 2, title: 'Senior Software Engineer', code: 'SSE', department_id: 1, description: 'Core software design and implementation', status: 'Active' },
  { id: 3, title: 'Junior Software Engineer', code: 'JSE', department_id: 1, description: 'Software features and bug fixing', status: 'Active' },
  { id: 4, title: 'HR Manager', code: 'HRM', department_id: 2, description: 'Oversee HR department operations', status: 'Active' },
  { id: 5, title: 'HR Executive', code: 'HRE', department_id: 2, description: 'Talent management and operations', status: 'Active' },
  { id: 6, title: 'Finance Director', code: 'FD', department_id: 3, description: 'Manage corporate budget and finance', status: 'Active' },
];

export const getRawJobPositions = () => MOCK_JOB_POSITIONS;
export const setRawJobPositions = (positions) => { MOCK_JOB_POSITIONS = positions; };
