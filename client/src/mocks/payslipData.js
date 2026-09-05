/**
 * Payslips & Payslip Lines Dataset
 */

export let MOCK_PAYSLIPS = [];
export let MOCK_PAYSLIP_LINES = [];

export const getRawPayslips = () => MOCK_PAYSLIPS;
export const setRawPayslips = (slips) => { MOCK_PAYSLIPS = slips; };
export const getRawPayslipLines = () => MOCK_PAYSLIP_LINES;
export const setRawPayslipLines = (lines) => { MOCK_PAYSLIP_LINES = lines; };
