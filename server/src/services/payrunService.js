import {
  db,
  PayrunModel,
  PayrunEmployeeModel,
  EmployeeModel,
  SalaryStructureModel,
  ContractModel,
} from "../models/index.js";
import contractService from "./contractService.js";
import payrollCalculationService from "./payrollCalculationService.js";

export class PayrunService {
  /**
   * Step 1: Query Eligible Employees for a proposed Payroll Period
   * Evaluates active employees, resolves contracts, and checks duplicate processing.
   *
   * @param {object} params
   * @param {string} params.period_start
   * @param {string} params.period_end
   * @param {number|string} [params.salary_structure_id]
   * @param {number|string} [params.department_id]
   */
  async getEligibleEmployees(params) {
    const { period_start, period_end, salary_structure_id, department_id } =
      params;

    let empQuery = db("employees")
      .leftJoin("departments", "employees.department_id", "departments.id")
      .leftJoin(
        "job_positions",
        "employees.job_position_id",
        "job_positions.id",
      )
      .select(
        "employees.*",
        "departments.name as department_name",
        "job_positions.title as job_position_title",
      );

    if (department_id) {
      empQuery = empQuery.where("employees.department_id", department_id);
    }

    const allEmployees = await empQuery.orderBy("employees.id", "asc");

    const resultEmployees = [];
    let eligibleCount = 0;
    let ineligibleCount = 0;

    for (const emp of allEmployees) {
      let isEligible = true;
      let ineligibilityReason = null;
      let applicableContract = null;

      // Check employment status
      if (emp.employment_status !== "active") {
        isEligible = false;
        ineligibilityReason = `Employee status is '${emp.employment_status}' (must be active)`;
      }

      // Resolve applicable contract if active
      if (isEligible) {
        try {
          applicableContract = await contractService.getApplicableContract(
            emp.id,
            period_start,
            period_end,
          );

          // If a salary structure is selected, check compatibility
          if (salary_structure_id && applicableContract.salary_structure_id) {
            if (
              Number(applicableContract.salary_structure_id) !==
              Number(salary_structure_id)
            ) {
              const struct = await db("salary_structures")
                .where("id", applicableContract.salary_structure_id)
                .first();
              isEligible = false;
              ineligibilityReason = `Contract uses a different Salary Structure (${struct ? struct.name : applicableContract.salary_structure_id})`;
            }
          } else if (
            salary_structure_id &&
            !applicableContract.salary_structure_id
          ) {
            applicableContract.salary_structure_id =
              Number(salary_structure_id);
          }
        } catch (err) {
          isEligible = false;
          ineligibilityReason = err.message;
        }
      }

      // Check Duplicate Payroll Processing in existing VALIDATED or PAID payruns
      if (isEligible) {
        const duplicateRun = await db("payrun_employees")
          .leftJoin("payruns", "payrun_employees.payrun_id", "payruns.id")
          .where("payrun_employees.employee_id", emp.id)
          .whereIn("payruns.status", ["validated", "paid"])
          .where("payruns.period_start", "<=", period_end)
          .where("payruns.period_end", ">=", period_start)
          .select(
            "payruns.id",
            "payruns.name",
            "payruns.status",
            "payruns.period_start",
            "payruns.period_end",
          )
          .first();

        if (duplicateRun) {
          isEligible = false;
          ineligibilityReason = `Already processed in ${duplicateRun.status.toUpperCase()} payrun '${duplicateRun.name}' for overlapping period (${duplicateRun.period_start} to ${duplicateRun.period_end})`;
        }
      }

      if (isEligible) {
        eligibleCount++;
      } else {
        ineligibleCount++;
      }

      resultEmployees.push({
        id: emp.id,
        employee_code: emp.employee_code,
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email,
        department_name: emp.department_name,
        job_position_title: emp.job_position_title,
        is_eligible: isEligible,
        ineligibility_reason: ineligibilityReason,
        contract: applicableContract
          ? {
              id: applicableContract.id,
              contract_number: applicableContract.contract_number,
              wage: Number(applicableContract.wage),
              salary_structure_name: applicableContract.salary_structure_name,
              schedule_name: applicableContract.schedule_name,
            }
          : null,
      });
    }

    return {
      period: { period_start, period_end },
      total_employees: allEmployees.length,
      eligible_count: eligibleCount,
      ineligible_count: ineligibleCount,
      employees: resultEmployees,
    };
  }

  /**
   * Step 2: Create Payrun in DRAFT status with selected eligible employees
   *
   * @param {number|string} userId - Creator user ID
   * @param {object} payload
   */
  async createPayrun(userId, payload) {
    const {
      name,
      salary_structure_id,
      period_start,
      period_end,
      employee_ids,
    } = payload;

    // 1. Verify Structure if provided
    if (salary_structure_id) {
      const structure =
        await SalaryStructureModel.findById(salary_structure_id);
      if (!structure || !structure.is_active) {
        const error = new Error(
          `Salary structure with ID ${salary_structure_id} does not exist or is inactive`,
        );
        error.statusCode = 400;
        error.code = "INVALID_SALARY_STRUCTURE";
        throw error;
      }
    }

    // 2. Validate all selected employees and resolve their contracts
    const validatedEmployees = [];
    const validationErrors = [];

    for (const empId of employee_ids) {
      const emp = await EmployeeModel.findById(empId);
      if (!emp) {
        validationErrors.push(`Employee ID ${empId} does not exist`);
        continue;
      }

      try {
        const contract = await contractService.getApplicableContract(
          empId,
          period_start,
          period_end,
        );

        // Duplicate check
        const duplicate = await db("payrun_employees")
          .leftJoin("payruns", "payrun_employees.payrun_id", "payruns.id")
          .where("payrun_employees.employee_id", empId)
          .whereIn("payruns.status", ["validated", "paid"])
          .where("payruns.period_start", "<=", period_end)
          .where("payruns.period_end", ">=", period_start)
          .select("payruns.name", "payruns.status")
          .first();

        if (duplicate) {
          validationErrors.push(
            `Employee ${emp.first_name} ${emp.last_name} (${emp.employee_code}) is already in ${duplicate.status} payrun '${duplicate.name}' for this period`,
          );
          continue;
        }

        validatedEmployees.push({
          employee_id: empId,
          contract_id: contract.id,
        });
      } catch (err) {
        validationErrors.push(
          `Employee ${emp.first_name} ${emp.last_name} (${emp.employee_code}): ${err.message}`,
        );
      }
    }

    if (validationErrors.length > 0) {
      const error = new Error(
        `Cannot create payrun due to employee validation errors: ${validationErrors.join("; ")}`,
      );
      error.statusCode = 400;
      error.code = "EMPLOYEE_ELIGIBILITY_ERROR";
      error.errors = validationErrors;
      throw error;
    }

    if (validatedEmployees.length === 0) {
      const error = new Error("No valid employees selected to create payrun");
      error.statusCode = 400;
      error.code = "NO_VALID_EMPLOYEES";
      throw error;
    }

    // 3. Create Payrun and Payrun Employees in a Transaction
    let payrunId;
    await db.transaction(async (trx) => {
      const [newId] = await trx("payruns").insert({
        name: name.trim(),
        salary_structure_id: salary_structure_id || null,
        period_start,
        period_end,
        status: "draft",
        created_by: userId,
      });

      payrunId = newId;

      const payrunEmployeeRows = validatedEmployees.map((ve) => ({
        payrun_id: payrunId,
        employee_id: ve.employee_id,
        contract_id: ve.contract_id,
        status: "pending",
      }));

      await trx("payrun_employees").insert(payrunEmployeeRows);
    });

    return await this.getPayrunById(payrunId);
  }

  /**
   * List Payruns with search, status filter, date range, pagination, and sorting
   *
   * @param {object} params
   */
  async getPayruns(params = {}) {
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const search = params.search ? params.search.trim() : null;

    let query = db("payruns")
      .leftJoin(
        "salary_structures",
        "payruns.salary_structure_id",
        "salary_structures.id",
      )
      .leftJoin("users as creator", "payruns.created_by", "creator.id");

    if (params.status) {
      query = query.where("payruns.status", params.status.trim().toLowerCase());
    }

    if (params.period_start) {
      query = query.where("payruns.period_start", ">=", params.period_start);
    }

    if (params.period_end) {
      query = query.where("payruns.period_end", "<=", params.period_end);
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .where("payruns.name", "like", `%${search}%`)
          .orWhere("salary_structures.name", "like", `%${search}%`);
      });
    }

    const countResult = await query
      .clone()
      .count("payruns.id as total")
      .first();
    const total = countResult ? parseInt(countResult.total, 10) : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const rows = await query
      .select(
        "payruns.*",
        "salary_structures.name as salary_structure_name",
        "salary_structures.code as salary_structure_code",
        "creator.email as creator_email",
      )
      .orderBy("payruns.id", "desc")
      .limit(limit)
      .offset(offset);

    // Attach employee counts for each payrun
    const payrunIds = rows.map((r) => r.id);
    let countsMap = {};
    if (payrunIds.length > 0) {
      const counts = await db("payrun_employees")
        .whereIn("payrun_id", payrunIds)
        .groupBy("payrun_id")
        .select(
          "payrun_id",
          db.raw("COUNT(id) as total_employees"),
          db.raw(
            "SUM(CASE WHEN status = 'computed' THEN 1 ELSE 0 END) as computed_count",
          ),
          db.raw(
            "SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count",
          ),
          db.raw(
            "SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count",
          ),
        );

      countsMap = counts.reduce((acc, c) => {
        acc[c.payrun_id] = {
          total_employees: parseInt(c.total_employees, 10) || 0,
          computed_count: parseInt(c.computed_count, 10) || 0,
          error_count: parseInt(c.error_count, 10) || 0,
          paid_count: parseInt(c.paid_count, 10) || 0,
        };
        return acc;
      }, {});
    }

    const formattedData = rows.map((r) => ({
      ...r,
      employee_counts: countsMap[r.id] || {
        total_employees: 0,
        computed_count: 0,
        error_count: 0,
        paid_count: 0,
      },
    }));

    return {
      data: formattedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get Payrun details by ID with joined employees and summary
   *
   * @param {number|string} id
   */
  async getPayrunById(id) {
    const payrun = await db("payruns")
      .leftJoin(
        "salary_structures",
        "payruns.salary_structure_id",
        "salary_structures.id",
      )
      .leftJoin("users as creator", "payruns.created_by", "creator.id")
      .where("payruns.id", id)
      .select(
        "payruns.*",
        "salary_structures.name as salary_structure_name",
        "salary_structures.code as salary_structure_code",
        "creator.email as creator_email",
      )
      .first();

    if (!payrun) {
      const error = new Error(`Payrun with ID ${id} not found`);
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    const employees = await db("payrun_employees")
      .leftJoin("employees", "payrun_employees.employee_id", "employees.id")
      .leftJoin("departments", "employees.department_id", "departments.id")
      .leftJoin(
        "job_positions",
        "employees.job_position_id",
        "job_positions.id",
      )
      .leftJoin("contracts", "payrun_employees.contract_id", "contracts.id")
      .leftJoin("payslips", function () {
        this.on("payslips.payrun_id", "=", "payrun_employees.payrun_id")
          .andOn("payslips.employee_id", "=", "payrun_employees.employee_id");
      })
      .where("payrun_employees.payrun_id", id)
      .select(
        "payrun_employees.*",
        "employees.first_name",
        "employees.last_name",
        "employees.employee_code",
        "employees.email as employee_email",
        "departments.name as department_name",
        "job_positions.title as job_position_title",
        "contracts.contract_number",
        "contracts.wage",
        "payslips.id as payslip_id",
        "payslips.gross_salary",
        "payslips.total_deductions",
        "payslips.net_salary",
        "payslips.status as payslip_status",
      )
      .orderBy("payrun_employees.id", "asc");

    const summary = {
      total_employees: employees.length,
      pending_count: employees.filter((e) => e.status === "pending").length,
      computed_count: employees.filter((e) => e.status === "computed").length,
      error_count: employees.filter((e) => e.status === "error").length,
      paid_count: employees.filter((e) => e.status === "paid").length,
    };

    return {
      ...payrun,
      summary,
      employees,
    };
  }

  /**
   * Add employees to an existing DRAFT payrun
   *
   * @param {number|string} payrunId
   * @param {number[]} employeeIds
   */
  async addEmployeesToPayrun(payrunId, employeeIds) {
    const payrun = await PayrunModel.findById(payrunId);
    if (!payrun) {
      const error = new Error(`Payrun with ID ${payrunId} not found`);
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (payrun.status !== "draft") {
      const error = new Error(
        `Cannot add employees to a payrun with status '${payrun.status}' (must be 'draft')`,
      );
      error.statusCode = 400;
      error.code = "INVALID_PAYRUN_STATUS";
      throw error;
    }

    const existingEmployees = await db("payrun_employees")
      .where({ payrun_id: payrunId })
      .select("employee_id");

    const existingIds = new Set(existingEmployees.map((e) => e.employee_id));

    const toAdd = [];
    for (const empId of employeeIds) {
      if (existingIds.has(empId)) continue; // skip duplicates in same payrun

      const contract = await contractService.getApplicableContract(
        empId,
        payrun.period_start,
        payrun.period_end,
      );

      toAdd.push({
        payrun_id: payrunId,
        employee_id: empId,
        contract_id: contract.id,
        status: "pending",
      });
    }

    if (toAdd.length > 0) {
      await db("payrun_employees").insert(toAdd);
    }

    return await this.getPayrunById(payrunId);
  }

  /**
   * Remove an employee from a DRAFT payrun
   *
   * @param {number|string} payrunId
   * @param {number|string} employeeId
   */
  async removeEmployeeFromPayrun(payrunId, employeeId) {
    const payrun = await PayrunModel.findById(payrunId);
    if (!payrun) {
      const error = new Error(`Payrun with ID ${payrunId} not found`);
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (payrun.status !== "draft") {
      const error = new Error(
        `Cannot remove employees from a payrun with status '${payrun.status}' (must be 'draft')`,
      );
      error.statusCode = 400;
      error.code = "INVALID_PAYRUN_STATUS";
      throw error;
    }

    await db("payrun_employees")
      .where({ payrun_id: payrunId, employee_id: employeeId })
      .del();

    return await this.getPayrunById(payrunId);
  }

  /**
   * Action: Compute Payrun
   * Executes Phase 9 Payroll Calculation Engine for each assigned employee.
   *
   * @param {number|string} payrunId
   */
  async computePayrun(payrunId) {
    const payrun = await PayrunModel.findById(payrunId);
    if (!payrun) {
      const error = new Error(`Payrun with ID ${payrunId} not found`);
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (!["draft", "computed"].includes(payrun.status)) {
      const error = new Error(
        `Payrun in status '${payrun.status}' cannot be computed (must be 'draft' or 'computed')`,
      );
      error.statusCode = 400;
      error.code = "INVALID_PAYRUN_STATUS";
      throw error;
    }

    const assignedEmployees = await db("payrun_employees").where({
      payrun_id: payrunId,
    });
    if (assignedEmployees.length === 0) {
      const error = new Error(
        "Cannot compute payrun with 0 assigned employees",
      );
      error.statusCode = 400;
      error.code = "EMPTY_PAYRUN";
      throw error;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const pe of assignedEmployees) {
      try {
        await payrollCalculationService.calculateEmployeePayroll({
          employee_id: pe.employee_id,
          period_start: payrun.period_start,
          period_end: payrun.period_end,
          salary_structure_id: payrun.salary_structure_id,
          contract_id: pe.contract_id,
        });

        await db("payrun_employees").where({ id: pe.id }).update({
          status: "computed",
          error_message: null,
          updated_at: db.fn.now(),
        });

        successCount++;
      } catch (err) {
        await db("payrun_employees").where({ id: pe.id }).update({
          status: "error",
          error_message: err.message,
          updated_at: db.fn.now(),
        });

        errorCount++;
      }
    }

    await db("payruns").where({ id: payrunId }).update({
      status: "computed",
      computed_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

    return await this.getPayrunById(payrunId);
  }

  /**
   * Action: Validate Payrun
   * Validates that all employees computed successfully and no duplicate overlaps exist.
   *
   * @param {number|string} payrunId
   */
  async validatePayrun(payrunId) {
    const payrun = await PayrunModel.findById(payrunId);
    if (!payrun) {
      const error = new Error(`Payrun with ID ${payrunId} not found`);
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (payrun.status === "validated" || payrun.status === "paid") {
      const existingPayslips = await db("payslips")
        .leftJoin("employees", "payslips.employee_id", "employees.id")
        .where({ payrun_id: payrunId })
        .select(
          "payslips.*",
          "employees.first_name as employee_first_name",
          "employees.last_name as employee_last_name",
          "employees.employee_code"
        );
      const fullPayrun = await this.getPayrunById(payrunId);
      return {
        ...fullPayrun,
        generated_count: existingPayslips.length,
        payslips: existingPayslips
      };
    }

    if (payrun.status !== "computed") {
      const error = new Error(
        `Payrun must be in 'computed' status to be validated (current status: '${payrun.status}')`,
      );
      error.statusCode = 400;
      error.code = "PAYRUN_NOT_COMPUTED";
      throw error;
    }

    const employees = await db("payrun_employees").where({
      payrun_id: payrunId,
    });
    if (employees.length === 0) {
      const error = new Error(
        "Cannot validate payrun with 0 assigned employees",
      );
      error.statusCode = 400;
      error.code = "EMPTY_PAYRUN";
      throw error;
    }

    const failedEmployees = employees.filter((e) => e.status !== "computed");
    if (failedEmployees.length > 0) {
      const error = new Error(
        `Payrun validation failed: ${failedEmployees.length} employee(s) have calculation errors or are not computed. Please resolve errors and recompute.`,
      );
      error.statusCode = 400;
      error.code = "PAYRUN_VALIDATION_FAILED";
      error.failed_count = failedEmployees.length;
      throw error;
    }

    // Duplicate Check across other validated/paid payruns
    const employeeIds = employees.map((e) => e.employee_id);
    const duplicates = await db("payrun_employees")
      .leftJoin("payruns", "payrun_employees.payrun_id", "payruns.id")
      .leftJoin("employees", "payrun_employees.employee_id", "employees.id")
      .whereIn("payrun_employees.employee_id", employeeIds)
      .whereNot("payruns.id", payrunId)
      .whereIn("payruns.status", ["validated", "paid"])
      .where("payruns.period_start", "<=", payrun.period_end)
      .where("payruns.period_end", ">=", payrun.period_start)
      .select(
        "employees.first_name",
        "employees.last_name",
        "employees.employee_code",
        "payruns.name",
        "payruns.status",
      );

    if (duplicates.length > 0) {
      const dupNames = duplicates
        .map(
          (d) => `${d.first_name} ${d.last_name} in '${d.name}' (${d.status})`,
        )
        .join("; ");
      const error = new Error(
        `Payrun validation failed due to overlapping payroll periods for: ${dupNames}`,
      );
      error.statusCode = 409;
      error.code = "DUPLICATE_PAYROLL_PROCESSING";
      throw error;
    }

    // Persist Payrun Validation & Payslip generation in a single ACID transaction
    const createdPayslips = [];

    await db.transaction(async (trx) => {
      // 1. Update Payrun Status
      await trx("payruns").where({ id: payrunId }).update({
        status: "validated",
        validated_at: db.fn.now(),
        updated_at: db.fn.now(),
      });

      // 2. Remove any pre-existing payslips for this payrun to ensure idempotence and prevent duplicates
      const existing = await trx("payslips").where({ payrun_id: payrunId }).select("id");
      if (existing.length > 0) {
        const ids = existing.map((p) => p.id);
        await trx("payslip_lines").whereIn("payslip_id", ids).del();
        await trx("payslips").where({ payrun_id: payrunId }).del();
      }

      // 3. Generate authoritative payslip and payslip lines for each computed employee
      for (const pe of employees) {
        const calculation = await payrollCalculationService.calculateEmployeePayroll({
          employee_id: pe.employee_id,
          period_start: payrun.period_start,
          period_end: payrun.period_end,
          salary_structure_id: payrun.salary_structure_id,
          contract_id: pe.contract_id
        });

        const [payslipId] = await trx("payslips").insert({
          payrun_id: payrunId,
          employee_id: pe.employee_id,
          contract_id: pe.contract_id,
          salary_structure_id: calculation.salary_structure.id,
          period_start: payrun.period_start,
          period_end: payrun.period_end,
          gross_salary: calculation.gross_salary,
          total_deductions: calculation.total_deductions,
          net_salary: calculation.net_salary,
          status: "generated",
          pdf_path: null
        });

        const lineRows = calculation.rule_lines.map((rl) => ({
          payslip_id: payslipId,
          salary_rule_id: rl.rule_id,
          name: rl.name,
          code: rl.code,
          category: rl.category_code || rl.category_name || "ALW",
          sequence: rl.sequence || 1,
          amount: rl.amount,
          quantity: rl.quantity || 1.0,
          rate: rl.rate || 100.0,
          calculation_details: JSON.stringify({
            details: rl.calculation_details,
            formula: rl.formula_expression,
            condition: rl.condition_expression,
            condition_met: rl.condition_met
          })
        }));

        if (lineRows.length > 0) {
          await trx("payslip_lines").insert(lineRows);
        }

        createdPayslips.push({
          id: payslipId,
          employee_id: pe.employee_id,
          gross_salary: calculation.gross_salary,
          total_deductions: calculation.total_deductions,
          net_salary: calculation.net_salary,
          status: "generated"
        });
      }
    });

    const updatedPayrun = await this.getPayrunById(payrunId);

    return {
      ...updatedPayrun,
      generated_count: createdPayslips.length,
      payslips: createdPayslips
    };
  }

  /**
   * Action: Mark Payrun Paid
   *
   * @param {number|string} payrunId
   */
  async markPayrunPaid(payrunId) {
    const payrun = await PayrunModel.findById(payrunId);
    if (!payrun) {
      const error = new Error(`Payrun with ID ${payrunId} not found`);
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (payrun.status === "paid") {
      return await this.getPayrunById(payrunId);
    }

    if (payrun.status !== "validated") {
      const error = new Error(
        `Only a validated payrun can be marked paid (current status: '${payrun.status}')`,
      );
      error.statusCode = 400;
      error.code = "PAYRUN_NOT_VALIDATED";
      throw error;
    }

    await db.transaction(async (trx) => {
      await trx("payruns").where({ id: payrunId }).update({
        status: "paid",
        paid_at: db.fn.now(),
        updated_at: db.fn.now(),
      });

      await trx("payrun_employees").where({ payrun_id: payrunId }).update({
        status: "paid",
        updated_at: db.fn.now(),
      });

      await trx("payslips").where({ payrun_id: payrunId }).update({
        status: "paid",
        updated_at: db.fn.now(),
      });
    });

    return await this.getPayrunById(payrunId);
  }

  /**
   * Action: Cancel Payrun
   *
   * @param {number|string} payrunId
   */
  async cancelPayrun(payrunId) {
    const payrun = await PayrunModel.findById(payrunId);
    if (!payrun) {
      const error = new Error(`Payrun with ID ${payrunId} not found`);
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (payrun.status === "paid") {
      const error = new Error("A paid payrun cannot be cancelled");
      error.statusCode = 400;
      error.code = "CANNOT_CANCEL_PAID_PAYRUN";
      throw error;
    }

    await db.transaction(async (trx) => {
      await trx("payruns").where({ id: payrunId }).update({
        status: "cancelled",
        updated_at: db.fn.now(),
      });

      await trx("payslips").where({ payrun_id: payrunId }).update({
        status: "cancelled",
        updated_at: db.fn.now(),
      });
    });

    return await this.getPayrunById(payrunId);
  }

  /**
   * Delete Payrun (Permitted only if draft or cancelled)
   *
   * @param {number|string} payrunId
   */
  async deletePayrun(payrunId) {
    const payrun = await PayrunModel.findById(payrunId);
    if (!payrun) {
      const error = new Error(`Payrun with ID ${payrunId} not found`);
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (!["draft", "cancelled"].includes(payrun.status)) {
      const error = new Error(
        `Cannot delete a payrun in '${payrun.status}' status (only 'draft' or 'cancelled' payruns can be deleted)`,
      );
      error.statusCode = 400;
      error.code = "CANNOT_DELETE_ACTIVE_PAYRUN";
      throw error;
    }

    await db.transaction(async (trx) => {
      const existingPayslips = await trx("payslips").where({ payrun_id: payrunId }).select("id");
      if (existingPayslips.length > 0) {
        const ids = existingPayslips.map((p) => p.id);
        await trx("payslip_lines").whereIn("payslip_id", ids).del();
        await trx("payslips").where({ payrun_id: payrunId }).del();
      }
      await trx("payrun_employees").where({ payrun_id: payrunId }).del();
      await trx("payruns").where({ id: payrunId }).del();
    });

    return true;
  }
}

export default new PayrunService();
