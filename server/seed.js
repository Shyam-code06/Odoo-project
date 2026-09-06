import { db } from './src/config/db.js';
import bcrypt from 'bcryptjs';

// =============================================================================
// INDIAN NAMES & REALISTIC DATA REPOSITORIES
// =============================================================================

const MALE_FIRST_NAMES = [
  'Aarav', 'Vihaan', 'Vivaan', 'Aditya', 'Reyansh', 'Arjun', 'Sai', 'Arnav', 'Ayaan', 'Krishna',
  'Ishaan', 'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Dhruv', 'Kabir', 'Ritvik', 'Darsh', 'Aryan',
  'Dev', 'Harsh', 'Tanmay', 'Yash', 'Rohit', 'Ankit', 'Rahul', 'Amit', 'Siddharth', 'Kunal',
  'Sameer', 'Alok', 'Nikhil', 'Manish', 'Gaurav', 'Rajesh', 'Suresh', 'Deepak', 'Vivek', 'Akash',
  'Shubham', 'Chirag', 'Parth', 'Bhavin', 'Tushar', 'Meet', 'Jay', 'Hardik', 'Manan', 'Romil',
  'Chetan', 'Varun', 'Karan', 'Rohan', 'Mayank', 'Prashant', 'Sachin', 'Anand', 'Naveen', 'Manoj'
];

const FEMALE_FIRST_NAMES = [
  'Ananya', 'Diya', 'Sanvi', 'Aadhya', 'Kiara', 'Pari', 'Myra', 'Riya', 'Tara', 'Ishita',
  'Pooja', 'Sneha', 'Neha', 'Priya', 'Kavya', 'Tanvi', 'Shreya', 'Meera', 'Rashi', 'Divya',
  'Swati', 'Nisha', 'Shruti', 'Pallavi', 'Ritu', 'Anjali', 'Preeti', 'Payal', 'Komal', 'Kajal',
  'Sakshi', 'Mansi', 'Vidhi', 'Janki', 'Dhwani', 'Riddhi', 'Siddhi', 'Kruti', 'Hetal', 'Urvashi',
  'Nidhi', 'Aditi', 'Bhavna', 'Charu', 'Deepika', 'Esha', 'Garima', 'Isha', 'Jyoti', 'Kritika',
  'Lavanya', 'Monika', 'Nandini', 'Prachi', 'Radhika', 'Simran', 'Trisha', 'Vaishali', 'Zoya', 'Kalyani'
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Verma', 'Mehta', 'Gupta', 'Kumar', 'Singh', 'Iyer', 'Nair', 'Joshi',
  'Rao', 'Reddy', 'Chatterjee', 'Mukherjee', 'Kulkarni', 'Deshmukh', 'Bhat', 'Pillai', 'Chauhan', 'Das',
  'Sen', 'Mishra', 'Pandey', 'Jain', 'Agarwal', 'Kapoor', 'Malhotra', 'Shah', 'Trivedi', 'Pandya',
  'Bhatt', 'Dave', 'Shukla', 'Tiwari', 'Saxena', 'Bansal', 'Goel', 'Singhal', 'Varma', 'Yadav',
  'Banerjee', 'Dutta', 'Ghosh', 'Choudhury', 'Goswami', 'Namboodiri', 'Menon', 'Hegde', 'Naik', 'Rane',
  'Patil', 'Shinde', 'More', 'Jadhav', 'Gaikwad', 'Pawar', 'Bhosale', 'Salunkhe', 'Kadam', 'Thorat'
];

const INDIAN_LOCALITIES = [
  { city: 'Ahmedabad', state: 'Gujarat', areas: ['SG Highway', 'Prahlad Nagar', 'Bodakdev', 'Satellite', 'Bopal', 'Vastrapur'] },
  { city: 'Bengaluru', state: 'Karnataka', areas: ['Koramangala', 'HSR Layout', 'Indiranagar', 'Whitefield', 'Electronic City', 'Marathahalli'] },
  { city: 'Mumbai', state: 'Maharashtra', areas: ['Powai', 'Andheri East', 'Bandra West', 'Malad', 'Borivali', 'Goregaon'] },
  { city: 'Pune', state: 'Maharashtra', areas: ['Hinjewadi', 'Viman Nagar', 'Kothrud', 'Baner', 'Magarpatta City', 'Wakad'] },
  { city: 'Hyderabad', state: 'Telangana', areas: ['HITEC City', 'Madhapur', 'Gachibowli', 'Jubilee Hills', 'Kondapur', 'Banjara Hills'] },
  { city: 'Gurugram', state: 'Haryana', areas: ['Cyber City', 'Golf Course Road', 'DLF Phase 3', 'Sohna Road', 'Sector 56'] },
  { city: 'Noida', state: 'Uttar Pradesh', areas: ['Sector 62', 'Sector 18', 'Sector 137', 'Sector 50', 'Greater Noida West'] },
  { city: 'Chennai', state: 'Tamil Nadu', areas: ['OMR', 'Velachery', 'T Nagar', 'Adyar', 'Anna Nagar', 'Guindy'] },
  { city: 'Kolkata', state: 'West Bengal', areas: ['Salt Lake Sector V', 'New Town', 'Park Street', 'Rajarhat', 'Ballygunge'] },
  { city: 'Jaipur', state: 'Rajasthan', areas: ['Malviya Nagar', 'Vaishali Nagar', 'Mansarovar', 'C Scheme', 'Jagatpura'] },
  { city: 'Surat', state: 'Gujarat', areas: ['Vesu', 'Adajan', 'Pal', 'Piplod', 'Ghod Dod Road'] },
  { city: 'Vadodara', state: 'Gujarat', areas: ['Alkapuri', 'Gotri', 'Vasna', 'Akota', 'Manjalpur'] },
  { city: 'Indore', state: 'Madhya Pradesh', areas: ['Vijay Nagar', 'Palasia', 'Super Corridor', 'AB Road', 'Rau'] }
];

const MOBILE_PREFIXES = ['98', '97', '96', '99', '94', '95', '93', '91', '88', '87', '89', '70', '79'];

// Department configurations with job titles, codes, and target distribution weights
const DEPT_CONFIGS = [
  {
    dept_id: 1, // Engineering
    weight: 0.40, // 40% of workforce
    roles: [
      { title: 'Engineering Manager', code: 'ENG_MGR', isManager: true, wageRange: [160000, 240000], structureId: 2, roleId: 3 },
      { title: 'Senior Software Engineer', code: 'SR_SWE', isManager: false, wageRange: [90000, 135000], structureId: 1, roleId: 4 },
      { title: 'Junior Software Engineer', code: 'JR_SWE', isManager: false, wageRange: [35000, 50000], structureId: 1, roleId: 4 },
      { title: 'QA Engineer', code: 'ENG_QA', isManager: false, wageRange: [45000, 75000], structureId: 1, roleId: 4 },
      { title: 'DevOps Engineer', code: 'ENG_DEVOPS', isManager: false, wageRange: [80000, 125000], structureId: 1, roleId: 4 }
    ]
  },
  {
    dept_id: 4, // Sales & Marketing
    weight: 0.22, // 22% of workforce
    roles: [
      { title: 'Sales Manager', code: 'SALES_MGR', isManager: true, wageRange: [130000, 190000], structureId: 2, roleId: 3 },
      { title: 'Sales Executive', code: 'SALES_EXEC', isManager: false, wageRange: [38000, 65000], structureId: 1, roleId: 4 },
      { title: 'Marketing Specialist', code: 'MKT_SPEC', isManager: false, wageRange: [45000, 75000], structureId: 1, roleId: 4 }
    ]
  },
  {
    dept_id: 7, // Operations
    weight: 0.16, // 16% of workforce
    roles: [
      { title: 'Operations Manager', code: 'OPS_MGR', isManager: true, wageRange: [120000, 175000], structureId: 2, roleId: 3 },
      { title: 'Operations Specialist', code: 'OPS_SPEC', isManager: false, wageRange: [40000, 65000], structureId: 1, roleId: 4 }
    ]
  },
  {
    dept_id: 3, // Finance
    weight: 0.11, // 11% of workforce
    roles: [
      { title: 'Finance Director', code: 'FIN_DIR', isManager: true, wageRange: [175000, 250000], structureId: 2, roleId: 3 },
      { title: 'Senior Accountant', code: 'SR_ACC', isManager: false, wageRange: [65000, 95000], structureId: 1, roleId: 4 },
      { title: 'Financial Analyst', code: 'FIN_ANL', isManager: false, wageRange: [50000, 80000], structureId: 1, roleId: 4 }
    ]
  },
  {
    dept_id: 2, // Human Resources
    weight: 0.11, // 11% of workforce
    roles: [
      { title: 'HR Manager', code: 'HR_MGR', isManager: true, wageRange: [120000, 180000], structureId: 2, roleId: 2 },
      { title: 'HR Executive', code: 'HR_EXEC', isManager: false, wageRange: [40000, 65000], structureId: 1, roleId: 2 },
      { title: 'Talent Acquisition Specialist', code: 'HR_TA', isManager: false, wageRange: [45000, 70000], structureId: 1, roleId: 4 }
    ]
  }
];

// Helper to pick random element
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to generate a random integer in range [min, max]
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to generate random Indian phone number
function generateIndianPhone() {
  const prefix = pickRandom(MOBILE_PREFIXES);
  const remaining = String(randomInt(10000000, 99999999));
  return `+91 ${prefix}${remaining.slice(0, 3)} ${remaining.slice(3)}`;
}

// Helper to generate realistic Indian address
function generateIndianAddress(index) {
  const loc = pickRandom(INDIAN_LOCALITIES);
  const area = pickRandom(loc.areas);
  const houseNum = randomInt(1, 450);
  const buildingTypes = ['Heights', 'Enclave', 'Residency', 'Society', 'Towers', 'Apartments', 'Greens'];
  const buildingName = `${pickRandom(['Shivalik', 'Gokul', 'Prestige', 'Oberoi', 'Surya', 'Nilkanth', 'Silver', 'Navratna'])} ${pickRandom(buildingTypes)}`;
  return `Flat ${houseNum}, ${buildingName}, ${area}, ${loc.city}, ${loc.state}`;
}

// Helper to generate a realistic joining date between 2022 and 2026
function generateJoiningDate() {
  const start = new Date('2022-01-15').getTime();
  const end = new Date('2026-03-01').getTime();
  const date = new Date(start + Math.random() * (end - start));
  return date.toISOString().split('T')[0];
}

// Helper to generate date of birth for working age 22 to 50
function generateDOB() {
  const start = new Date('1976-01-01').getTime();
  const end = new Date('2003-12-31').getTime();
  const date = new Date(start + Math.random() * (end - start));
  return date.toISOString().split('T')[0];
}

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================
export async function runSeed() {
  console.log('\n===============================================================');
  console.log('🌱 STARTING BULK SEEDING: 250 EMPLOYEES & ALL RELATED TABLES 🌱');
  console.log('===============================================================\n');

  const TARGET_EMPLOYEE_COUNT = 250;
  const SEED_PASSWORD = '123456';

  try {
    // 1. Verify and ensure master positions exist
    console.log('1. Verifying departments and job positions...');
    const existingPositions = await db('job_positions').select('*');
    const positionMap = new Map(); // key: `${dept_id}_${title}` => id

    for (const p of existingPositions) {
      positionMap.set(`${p.department_id}_${p.title}`, p.id);
    }

    // Insert any missing job positions for our departments
    for (const dept of DEPT_CONFIGS) {
      for (const role of dept.roles) {
        const key = `${dept.dept_id}_${role.title}`;
        if (!positionMap.has(key)) {
          const [newPosId] = await db('job_positions').insert({
            title: role.title,
            code: role.code,
            department_id: dept.dept_id,
            description: `${role.title} in Department ID ${dept.dept_id}`
          });
          positionMap.set(key, newPosId);
          console.log(`   + Created missing job position: "${role.title}" (ID: ${newPosId})`);
        }
      }
    }

    // 2. Hash password '123456' once for high performance
    console.log(`\n2. Computing password hash for non-admin accounts ("${SEED_PASSWORD}")...`);
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
    console.log('   ✔ Password hash ready.');

    // 3. Clean up previously seeded Indian employees (code prefix 'EMP-IND-') and related records
    console.log('\n3. Cleaning up any previous seed data (EMP-IND-* and Seed Payruns)...');
    const existingSeedEmployees = await db('employees')
      .where('employee_code', 'like', 'EMP-IND-%')
      .select('id', 'email');

    if (existingSeedEmployees.length > 0) {
      const empIds = existingSeedEmployees.map(e => e.id);
      const empEmails = existingSeedEmployees.map(e => e.email);

      // Clean up payslips and lines for these employees
      const existingPayslips = await db('payslips').whereIn('employee_id', empIds).select('id');
      if (existingPayslips.length > 0) {
        await db('payslip_lines').whereIn('payslip_id', existingPayslips.map(p => p.id)).del();
        await db('payslips').whereIn('id', existingPayslips.map(p => p.id)).del();
      }

      // Clean up payrun_employees
      await db('payrun_employees').whereIn('employee_id', empIds).del();

      // Clean up attendance
      await db('attendance').whereIn('employee_id', empIds).del();

      // Clean up time off requests
      await db('time_off_requests').whereIn('employee_id', empIds).del();

      // Clean up time off allocations
      await db('time_off_allocations').whereIn('employee_id', empIds).del();

      // Clean up contracts
      await db('contracts').whereIn('employee_id', empIds).del();

      // Clean up users
      await db('users').whereIn('employee_id', empIds).orWhereIn('email', empEmails).del();

      // Clean up employees
      await db('employees').whereIn('id', empIds).del();

      // Clean up any seeded payruns
      await db('payruns').where('name', 'like', '%Seed%').del();

      console.log(`   ✔ Removed previous seed data cleanly.`);
    } else {
      console.log('   ✔ No previous seed data found.');
    }

    // 4. Generate 250 Indian Employee specifications
    console.log(`\n4. Generating ${TARGET_EMPLOYEE_COUNT} Indian employee specifications...`);
    const employeeSpecs = [];
    const usedEmails = new Set();
    const existingEmails = new Set((await db('users').select('email')).map(u => u.email.toLowerCase()));

    // Distribute employees across departments based on weights
    let remainingCount = TARGET_EMPLOYEE_COUNT;
    const deptAllocations = [];
    DEPT_CONFIGS.forEach((dept, idx) => {
      const count = (idx === DEPT_CONFIGS.length - 1)
        ? remainingCount
        : Math.round(TARGET_EMPLOYEE_COUNT * dept.weight);
      deptAllocations.push({ dept, count });
      remainingCount -= count;
    });

    let currentEmpNum = 1;
    for (const alloc of deptAllocations) {
      const { dept, count } = alloc;
      for (let i = 0; i < count; i++) {
        const isFemale = Math.random() > 0.5;
        const firstName = isFemale ? pickRandom(FEMALE_FIRST_NAMES) : pickRandom(MALE_FIRST_NAMES);
        const lastName = pickRandom(LAST_NAMES);

        // Pick role: first in dept is manager, subsequent are distributed
        let selectedRole;
        if (i === 0) {
          selectedRole = dept.roles.find(r => r.isManager) || dept.roles[0];
        } else {
          const nonManagers = dept.roles.filter(r => !r.isManager);
          selectedRole = nonManagers.length > 0 ? pickRandom(nonManagers) : pickRandom(dept.roles);
        }

        const positionKey = `${dept.dept_id}_${selectedRole.title}`;
        const jobPositionId = positionMap.get(positionKey) || 1;

        // Unique employee code: EMP-IND-001 ... EMP-IND-250
        const codePadded = String(currentEmpNum).padStart(3, '0');
        const employeeCode = `EMP-IND-${codePadded}`;

        // Unique professional email
        let baseEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
        baseEmail = baseEmail.replace(/[^a-z0-9.]/g, '');
        let emailCandidate = `${baseEmail}@odoo.local`;
        let counter = 1;
        while (usedEmails.has(emailCandidate) || existingEmails.has(emailCandidate)) {
          emailCandidate = `${baseEmail}${counter}@odoo.local`;
          counter++;
        }
        usedEmails.add(emailCandidate);

        const joiningDate = generateJoiningDate();
        const dateOfBirth = generateDOB();
        const phone = generateIndianPhone();
        const address = generateIndianAddress(currentEmpNum);
        const wage = randomInt(selectedRole.wageRange[0], selectedRole.wageRange[1]);

        employeeSpecs.push({
          empNum: currentEmpNum,
          employeeCode,
          firstName,
          lastName,
          email: emailCandidate,
          phone,
          dateOfBirth,
          address,
          departmentId: dept.dept_id,
          jobPositionId,
          roleId: selectedRole.roleId,
          salaryStructureId: selectedRole.structureId,
          wage,
          joiningDate,
          isManager: selectedRole.isManager
        });

        currentEmpNum++;
      }
    }

    console.log(`   ✔ Prepared ${employeeSpecs.length} employee specifications.`);

    // 5. Database Batch Insertion (Chunks of 50 for employees, contracts, leave allocations, users)
    console.log('\n5. Inserting 250 Employees, Contracts, Leave Allocations, and Users...');
    const CHUNK_SIZE = 50;
    const insertedEmployeesList = [];
    const insertedContractsList = [];
    const insertedAllocationsList = [];

    for (let c = 0; c < employeeSpecs.length; c += CHUNK_SIZE) {
      const chunk = employeeSpecs.slice(c, c + CHUNK_SIZE);

      await db.transaction(async (trx) => {
        // A. Insert employees
        const employeeRows = chunk.map(s => ({
          employee_code: s.employeeCode,
          first_name: s.firstName,
          last_name: s.lastName,
          email: s.email,
          phone: s.phone,
          date_of_birth: s.dateOfBirth,
          address: s.address,
          department_id: s.departmentId,
          job_position_id: s.jobPositionId,
          manager_id: 1, // Default reporting to System/HR Lead
          joining_date: s.joiningDate,
          employment_status: 'active',
          working_schedule_id: 1 // Standard 40 Hours
        }));

        await trx('employees').insert(employeeRows);

        // Fetch back inserted employees
        const insertedEmps = await trx('employees')
          .whereIn('employee_code', chunk.map(s => s.employeeCode))
          .select('id', 'employee_code');

        const idMap = new Map();
        insertedEmps.forEach(e => {
          idMap.set(e.employee_code, e.id);
          insertedEmployeesList.push(e);
        });

        // B. Insert Contracts
        const contractRows = chunk.map(s => {
          const empId = idMap.get(s.employeeCode);
          return {
            employee_id: empId,
            contract_number: `CNT-IND-${String(s.empNum).padStart(3, '0')}`,
            start_date: s.joiningDate,
            end_date: null,
            department_id: s.departmentId,
            job_position_id: s.jobPositionId,
            working_schedule_id: 1,
            salary_structure_id: s.salaryStructureId,
            wage: s.wage,
            employment_type: 'full_time',
            status: 'active'
          };
        });
        await trx('contracts').insert(contractRows);

        // Fetch back contracts
        const insertedCnts = await trx('contracts')
          .whereIn('contract_number', contractRows.map(cr => cr.contract_number))
          .select('id', 'employee_id', 'contract_number', 'wage', 'salary_structure_id');
        insertedCnts.forEach(cnt => insertedContractsList.push(cnt));

        // C. Insert Time Off Allocations
        const allocationRows = [];
        for (const s of chunk) {
          const empId = idMap.get(s.employeeCode);
          // Paid Leave (Type 1): 20 days
          allocationRows.push({
            employee_id: empId,
            time_off_type_id: 1,
            start_date: '2026-01-01',
            end_date: '2026-12-31',
            allocated_amount: 20.00,
            used_amount: randomInt(0, 3),
            status: 'approved',
            approved_by: 1,
            approved_at: '2026-01-01 10:00:00'
          });
          // Sick Leave (Type 2): 10 days
          allocationRows.push({
            employee_id: empId,
            time_off_type_id: 2,
            start_date: '2026-01-01',
            end_date: '2026-12-31',
            allocated_amount: 10.00,
            used_amount: randomInt(0, 2),
            status: 'approved',
            approved_by: 1,
            approved_at: '2026-01-01 10:00:00'
          });
          // Compensatory Off (Type 4): 5 days
          allocationRows.push({
            employee_id: empId,
            time_off_type_id: 4,
            start_date: '2026-01-01',
            end_date: '2026-12-31',
            allocated_amount: 5.00,
            used_amount: 0.00,
            status: 'approved',
            approved_by: 1,
            approved_at: '2026-01-01 10:00:00'
          });
        }
        await trx('time_off_allocations').insert(allocationRows);

        // D. Insert User Accounts
        const userRows = chunk.map(s => {
          const empId = idMap.get(s.employeeCode);
          return {
            employee_id: empId,
            email: s.email,
            password_hash: passwordHash, // '123456'
            role_id: s.roleId,
            is_active: true
          };
        });
        await trx('users').insert(userRows);
      });

      console.log(`   Processed ${Math.min(c + CHUNK_SIZE, employeeSpecs.length)}/${employeeSpecs.length} core employee records...`);
    }

    // 6. SEED SAMPLE PAYROLL RECORDS (Payruns, Payrun Employees, Payslips with Gross/Net Salary, Payslip Lines)
    console.log('\n6. Seeding 12+ Detailed Salary & Net Salary records (Payrun, Payslips, Salary Lines)...');

    // Create a completed monthly Payrun for August 2026
    const [payrunId] = await db('payruns').insert({
      name: 'August 2026 Seed Payroll Cycle',
      salary_structure_id: 1, // Regular Salary Structure
      period_start: '2026-08-01',
      period_end: '2026-08-31',
      status: 'paid',
      created_by: 1,
      computed_at: '2026-08-28 17:00:00',
      validated_at: '2026-08-29 11:30:00',
      paid_at: '2026-08-31 16:00:00'
    });

    // Pick first 12 seeded employees & their contracts for the payrun
    const sampleEmpList = employeeSpecs.slice(0, 12);
    const contractsMap = new Map();
    insertedContractsList.forEach(cnt => contractsMap.set(cnt.employee_id, cnt));

    const payrunEmpRows = [];
    const payslipRows = [];
    const samplePayslipDetails = [];

    for (const s of sampleEmpList) {
      const emp = insertedEmployeesList.find(e => e.employee_code === s.employeeCode);
      const contract = contractsMap.get(emp.id);

      const wage = Number(contract ? contract.wage : s.wage);
      const basic = Math.round(wage * 0.50);
      const hra = Math.round(wage * 0.20);
      const specialAlw = wage - (basic + hra);
      const grossSalary = wage;
      const pfDeduction = Math.round(basic * 0.12);
      const ptDeduction = 200; // Professional Tax
      const totalDeductions = pfDeduction + ptDeduction;
      const netSalary = grossSalary - totalDeductions;

      payrunEmpRows.push({
        payrun_id: payrunId,
        employee_id: emp.id,
        contract_id: contract ? contract.id : 1,
        status: 'paid',
        error_message: null
      });

      payslipRows.push({
        payrun_id: payrunId,
        employee_id: emp.id,
        contract_id: contract ? contract.id : 1,
        salary_structure_id: 1,
        period_start: '2026-08-01',
        period_end: '2026-08-31',
        gross_salary: grossSalary,
        total_deductions: totalDeductions,
        net_salary: netSalary,
        status: 'paid',
        pdf_path: null
      });

      samplePayslipDetails.push({
        employeeCode: s.employeeCode,
        name: `${s.firstName} ${s.lastName}`,
        grossSalary,
        totalDeductions,
        netSalary,
        basic,
        hra,
        specialAlw,
        pfDeduction,
        ptDeduction
      });
    }

    await db('payrun_employees').insert(payrunEmpRows);
    await db('payslips').insert(payslipRows);

    // Fetch back inserted payslips to attach salary rule lines
    const insertedPayslips = await db('payslips').where('payrun_id', payrunId).select('id', 'employee_id', 'gross_salary');
    const payslipLineRows = [];

    for (let i = 0; i < insertedPayslips.length; i++) {
      const ps = insertedPayslips[i];
      const details = samplePayslipDetails[i];

      // 1. Basic Salary (BASIC)
      payslipLineRows.push({
        payslip_id: ps.id,
        salary_rule_id: 1,
        name: 'Basic Salary',
        code: 'BASIC',
        category: 'BASIC',
        sequence: 1,
        amount: details.basic,
        quantity: 1,
        rate: 50.0,
        calculation_details: JSON.stringify({ formula: '50.00% of Wage', amount: details.basic })
      });

      // 2. HRA
      payslipLineRows.push({
        payslip_id: ps.id,
        salary_rule_id: 2,
        name: 'House Rent Allowance (HRA)',
        code: 'HRA',
        category: 'ALW',
        sequence: 2,
        amount: details.hra,
        quantity: 1,
        rate: 20.0,
        calculation_details: JSON.stringify({ formula: '20.00% of Wage', amount: details.hra })
      });

      // 3. Special Allowance (SA)
      payslipLineRows.push({
        payslip_id: ps.id,
        salary_rule_id: 3,
        name: 'Special Allowance',
        code: 'SA',
        category: 'ALW',
        sequence: 3,
        amount: details.specialAlw,
        quantity: 1,
        rate: 30.0,
        calculation_details: JSON.stringify({ formula: '30.00% of Wage', amount: details.specialAlw })
      });

      // 4. Gross Salary (GROSS)
      payslipLineRows.push({
        payslip_id: ps.id,
        salary_rule_id: 4,
        name: 'Gross Salary',
        code: 'GROSS',
        category: 'GROSS',
        sequence: 4,
        amount: details.grossSalary,
        quantity: 1,
        rate: 100.0,
        calculation_details: JSON.stringify({ formula: 'BASIC + HRA + SA', amount: details.grossSalary })
      });

      // 5. Provident Fund (PF)
      payslipLineRows.push({
        payslip_id: ps.id,
        salary_rule_id: 5,
        name: 'Provident Fund (PF)',
        code: 'PF',
        category: 'DED',
        sequence: 5,
        amount: details.pfDeduction,
        quantity: 1,
        rate: 12.0,
        calculation_details: JSON.stringify({ formula: '12.00% of BASIC', amount: details.pfDeduction })
      });

      // 6. Professional Tax (PT)
      payslipLineRows.push({
        payslip_id: ps.id,
        salary_rule_id: 6,
        name: 'Professional Tax',
        code: 'PT',
        category: 'DED',
        sequence: 6,
        amount: details.ptDeduction,
        quantity: 1,
        rate: 100.0,
        calculation_details: JSON.stringify({ formula: 'Fixed PT Slab', amount: details.ptDeduction })
      });

      // 7. Net Salary (NET)
      payslipLineRows.push({
        payslip_id: ps.id,
        salary_rule_id: 7,
        name: 'Net Salary',
        code: 'NET',
        category: 'NET',
        sequence: 7,
        amount: details.netSalary,
        quantity: 1,
        rate: 100.0,
        calculation_details: JSON.stringify({ formula: 'GROSS - Total Deductions', amount: details.netSalary })
      });
    }

    await db('payslip_lines').insert(payslipLineRows);
    console.log(`   ✔ Inserted 1 Payrun, 12 Payrun Employees, 12 Payslips, and ${payslipLineRows.length} Salary Rule Lines!`);

    // 7. SEED 10 SAMPLE TIME OFF REQUESTS
    console.log('\n7. Seeding 10 Sample Time-Off / Leave Requests with Indian context...');
    const leaveReasons = [
      'Family wedding reception in Ahmedabad',
      'Medical checkup and viral fever recovery',
      'Diwali celebration with family in native hometown',
      'Urgent personal bank and documentation work',
      'Sister convocation ceremony in Mumbai',
      'Routine dental surgery appointment',
      'Relocation and house shifting',
      'Festival holiday gathering',
      'Health checkup of parents',
      'Short family weekend trip to Udaipur'
    ];

    const leaveRequestsRows = [];
    for (let i = 0; i < 10; i++) {
      const s = employeeSpecs[i + 5];
      const emp = insertedEmployeesList.find(e => e.employee_code === s.employeeCode);
      const isApproved = i < 7;

      leaveRequestsRows.push({
        employee_id: emp.id,
        time_off_type_id: (i % 2 === 0) ? 1 : 2, // 1: Paid Leave, 2: Sick Leave
        start_date: `2026-08-${String(10 + i).padStart(2, '0')}`,
        end_date: `2026-08-${String(11 + i).padStart(2, '0')}`,
        duration: 2.0,
        reason: leaveReasons[i],
        status: isApproved ? 'approved' : 'pending',
        approved_by: isApproved ? 1 : null,
        approved_at: isApproved ? '2026-08-05 10:00:00' : null
      });
    }
    await db('time_off_requests').insert(leaveRequestsRows);
    console.log('   ✔ Inserted 10 Time-Off Requests.');

    // 8. SEED 10 SAMPLE ATTENDANCE RECORDS
    console.log('\n8. Seeding 10 Sample Attendance Records...');
    const attendanceRows = [];
    for (let i = 0; i < 10; i++) {
      const s = employeeSpecs[i];
      const emp = insertedEmployeesList.find(e => e.employee_code === s.employeeCode);
      const checkInMin = randomInt(5, 30);
      const checkOutMin = randomInt(0, 25);

      attendanceRows.push({
        employee_id: emp.id,
        attendance_date: '2026-09-05',
        check_in: `2026-09-05 09:${String(checkInMin).padStart(2, '0')}:00`,
        check_out: `2026-09-05 18:${String(checkOutMin).padStart(2, '0')}:00`,
        worked_minutes: 480 + checkOutMin - checkInMin,
        status: 'present',
        latitude: 23.1895,
        longitude: 72.6288,
        verification_distance: 42.5
      });
    }
    await db('attendance').insert(attendanceRows);
    console.log('   ✔ Inserted 10 Attendance Records.');

    console.log('\n===============================================================');
    console.log('✅ COMPLETE DATABASE SEEDING FINISHED!');
    console.log('===============================================================');
    console.log(`✔ Employees:                     ${TARGET_EMPLOYEE_COUNT}`);
    console.log(`✔ Contracts (Active):            ${TARGET_EMPLOYEE_COUNT}`);
    console.log(`✔ Leave Allocations:             ${TARGET_EMPLOYEE_COUNT * 3}`);
    console.log(`✔ User Login Accounts:           ${TARGET_EMPLOYEE_COUNT}`);
    console.log(`✔ Payruns:                       1 (August 2026 Paid Cycle)`);
    console.log(`✔ Payslips (Gross/Net Salary):   12 Detailed Payslips`);
    console.log(`✔ Payslip Lines (Basic,HRA,PF):  ${payslipLineRows.length} Line items`);
    console.log(`✔ Time Off Requests:             10 Leave Requests`);
    console.log(`✔ Attendance Logs:               10 GPS Attendance Logs`);
    console.log('---------------------------------------------------------------');
    console.log(`🔑 All employee login passwords:  ${SEED_PASSWORD}`);
    console.log('🛡️  Admin account:                Untouched');
    console.log('===============================================================\n');

    console.log('📋 SAMPLE SALARY ENTRIES (Gross, Deductions & Net Salary):');
    console.table(samplePayslipDetails.slice(0, 5).map(d => ({
      Code: d.employeeCode,
      Name: d.name,
      'Gross (₹)': d.grossSalary.toLocaleString('en-IN'),
      'Basic (₹)': d.basic.toLocaleString('en-IN'),
      'HRA (₹)': d.hra.toLocaleString('en-IN'),
      'PF (₹)': d.pfDeduction.toLocaleString('en-IN'),
      'Net Salary (₹)': d.netSalary.toLocaleString('en-IN')
    })));

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Auto-run if executed directly via node seed.js
if (process.argv[1] && (process.argv[1].endsWith('seed.js') || process.argv[1].includes('seed.js'))) {
  runSeed().then(() => process.exit(0)).catch(() => process.exit(1));
}