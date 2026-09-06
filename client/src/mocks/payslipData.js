const loadFromStorage = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
};

export let MOCK_PAYSLIPS = loadFromStorage('hrms_mock_payslips', []);
export let MOCK_PAYSLIP_LINES = loadFromStorage('hrms_mock_payslip_lines', []);

export const getRawPayslips = () => loadFromStorage('hrms_mock_payslips', MOCK_PAYSLIPS);
export const setRawPayslips = (slips) => {
  MOCK_PAYSLIPS = slips;
  saveToStorage('hrms_mock_payslips', slips);
};

export const getRawPayslipLines = () => loadFromStorage('hrms_mock_payslip_lines', MOCK_PAYSLIP_LINES);
export const setRawPayslipLines = (lines) => {
  MOCK_PAYSLIP_LINES = lines;
  saveToStorage('hrms_mock_payslip_lines', lines);
};
