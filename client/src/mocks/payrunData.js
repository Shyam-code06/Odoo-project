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

export let MOCK_PAYRUNS = loadFromStorage('hrms_mock_payruns', []);
export let MOCK_PAYRUN_EMPLOYEES = loadFromStorage('hrms_mock_payrun_employees', []);

export const getRawPayruns = () => loadFromStorage('hrms_mock_payruns', MOCK_PAYRUNS);
export const setRawPayruns = (payruns) => {
  MOCK_PAYRUNS = payruns;
  saveToStorage('hrms_mock_payruns', payruns);
};

export const getRawPayrunEmployees = () => loadFromStorage('hrms_mock_payrun_employees', MOCK_PAYRUN_EMPLOYEES);
export const setRawPayrunEmployees = (pres) => {
  MOCK_PAYRUN_EMPLOYEES = pres;
  saveToStorage('hrms_mock_payrun_employees', pres);
};
