/**
 * Employment Contract Dataset
 */

export let MOCK_CONTRACTS = [
  {
    id: 1,
    contract_code: 'CNT-2020-001',
    contract_number: 'CNT-2020-001',
    employee_id: 1,
    salary_structure_id: 2,
    wage: 120000,
    employment_type: 'full_time',
    start_date: '2020-01-01',
    end_date: null,
    status: 'Active',
    has_bank_details: true,
  },
  {
    id: 2,
    contract_code: 'CNT-2021-002',
    contract_number: 'CNT-2021-002',
    employee_id: 2,
    salary_structure_id: 1,
    wage: 85000,
    employment_type: 'full_time',
    start_date: '2021-03-15',
    end_date: null,
    status: 'Active',
    has_bank_details: true,
  },
  {
    id: 3,
    contract_code: 'CNT-2022-003',
    contract_number: 'CNT-2022-003',
    employee_id: 3,
    salary_structure_id: 1,
    wage: 75000,
    employment_type: 'full_time',
    start_date: '2022-06-01',
    end_date: null,
    status: 'Active',
    has_bank_details: true,
  },
];

export const getRawContracts = () => MOCK_CONTRACTS;
export const setRawContracts = (contracts) => { MOCK_CONTRACTS = contracts; };
