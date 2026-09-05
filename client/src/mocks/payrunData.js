/**
 * Payrun & Payrun Employee Dataset
 */

export let MOCK_PAYRUNS = [];
export let MOCK_PAYRUN_EMPLOYEES = [];

export const getRawPayruns = () => MOCK_PAYRUNS;
export const setRawPayruns = (payruns) => { MOCK_PAYRUNS = payruns; };
export const getRawPayrunEmployees = () => MOCK_PAYRUN_EMPLOYEES;
export const setRawPayrunEmployees = (pres) => { MOCK_PAYRUN_EMPLOYEES = pres; };
