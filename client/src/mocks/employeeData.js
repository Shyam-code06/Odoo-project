/**
 * Employee Master Dataset
 */

export let MOCK_EMPLOYEES = [
  {
    id: 1,
    employee_code: 'EMP001',
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@odoo.local',
    phone: '+1234567890',
    date_of_birth: '1985-05-15',
    address: '100 Silicon Blvd, Suite 400',
    department_id: 1,
    job_position_id: 1,
    manager_id: null,
    joining_date: '2020-01-01',
    employment_status: 'active',
    working_schedule_id: 1,
    created_at: '2026-09-05T13:58:42Z',
    updated_at: '2026-09-05T13:58:42Z',
  },
  {
    id: 2,
    employee_code: 'EMP002',
    first_name: 'Sarah',
    last_name: 'Connor',
    email: 'sarah.hr@odoo.local',
    phone: '+1234567891',
    date_of_birth: '1988-08-20',
    address: '200 Market Street, Apt 12',
    department_id: 2,
    job_position_id: 4,
    manager_id: 1,
    joining_date: '2021-03-15',
    employment_status: 'active',
    working_schedule_id: 1,
    created_at: '2026-09-05T13:58:42Z',
    updated_at: '2026-09-05T13:58:42Z',
  },
  {
    id: 3,
    employee_code: 'EMP003',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@odoo.local',
    phone: '+1234567892',
    date_of_birth: '1992-11-10',
    address: '300 Tech Park, Building B',
    department_id: 1,
    job_position_id: 2,
    manager_id: 1,
    joining_date: '2022-06-01',
    employment_status: 'active',
    working_schedule_id: 1,
    created_at: '2026-09-05T13:58:42Z',
    updated_at: '2026-09-05T13:58:42Z',
  },
];

export const getRawEmployees = () => MOCK_EMPLOYEES;
export const setRawEmployees = (employees) => { MOCK_EMPLOYEES = employees; };
