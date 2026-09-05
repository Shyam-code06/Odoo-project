-- =============================================================================
-- Odoo Clone Database Schema
-- Database: odoo_db
-- Run via: mysql -u root -p < database.sql
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `odoo_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `odoo_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Table: roles
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Employee, HR Manager, Admin, etc.',
  `description` TEXT NULL COMMENT 'Role description',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Table: working_schedules
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `working_schedules`;
CREATE TABLE `working_schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT 'Full Time, Part Time, etc.',
  `description` TEXT NULL COMMENT 'Schedule description',
  `timezone` VARCHAR(50) NOT NULL DEFAULT 'UTC' COMMENT 'Schedule timezone',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether usable',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table: schedule_days
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `schedule_days`;
CREATE TABLE `schedule_days` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `schedule_id` INT NOT NULL COMMENT 'Parent schedule',
  `day_of_week` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL COMMENT 'Monday-Sunday',
  `start_time` TIME NOT NULL COMMENT 'Starting time',
  `end_time` TIME NOT NULL COMMENT 'Ending time',
  `break_minutes` INT NOT NULL DEFAULT 0 COMMENT 'Break duration in minutes',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_schedule_days_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `working_schedules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_schedule_days_schedule_id` (`schedule_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table: salary_rule_categories
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `salary_rule_categories`;
CREATE TABLE `salary_rule_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT 'Category Name (Basic, Allowance, Gross, Deduction, Net)',
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique Code (BASIC, ALW, GROSS, DED, NET)',
  `parent_id` INT NULL COMMENT 'Parent category for hierarchy',
  `description` TEXT NULL COMMENT 'Category description',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_salary_rule_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `salary_rule_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Table: salary_structures
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `salary_structures`;
CREATE TABLE `salary_structures` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL COMMENT 'Regular Salary, Executive Salary, etc.',
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Structure code',
  `description` TEXT NULL COMMENT 'Description',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Table: salary_rules
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `salary_rules`;
CREATE TABLE `salary_rules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `salary_structure_id` INT NOT NULL COMMENT 'Parent structure',
  `category_id` INT NOT NULL COMMENT 'Rule category',
  `name` VARCHAR(150) NOT NULL COMMENT 'Basic Salary, HRA, PF, etc.',
  `code` VARCHAR(50) NOT NULL COMMENT 'Rule code',
  `sequence` INT NOT NULL DEFAULT 1 COMMENT 'Execution order',
  `calculation_type` ENUM('fixed', 'percentage', 'formula') NOT NULL DEFAULT 'fixed' COMMENT 'Fixed, percentage, formula',
  `value` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Rule value where applicable',
  `condition_expression` TEXT NULL COMMENT 'Optional condition',
  `formula_expression` TEXT NULL COMMENT 'Calculation formula',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether rule executes',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_salary_rules_structure` FOREIGN KEY (`salary_structure_id`) REFERENCES `salary_structures` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_salary_rules_category` FOREIGN KEY (`category_id`) REFERENCES `salary_rule_categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_salary_rules_structure` (`salary_structure_id`),
  INDEX `idx_salary_rules_category` (`category_id`),
  INDEX `idx_salary_rules_sequence` (`sequence`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Table: departments
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL COMMENT 'Engineering, HR, Finance, etc.',
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Department code',
  `description` TEXT NULL COMMENT 'Description',
  `manager_id` INT NULL COMMENT 'Department manager (FK -> employees)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_departments_manager` (`manager_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Table: job_positions
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `job_positions`;
CREATE TABLE `job_positions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL COMMENT 'Software Engineer, HR Manager, etc.',
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Position code',
  `department_id` INT NULL COMMENT 'Position\'s department',
  `description` TEXT NULL COMMENT 'Position description',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_job_positions_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_job_positions_department` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. Table: employees
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Human-readable employee ID',
  `first_name` VARCHAR(100) NOT NULL COMMENT 'First name',
  `last_name` VARCHAR(100) NOT NULL COMMENT 'Last name',
  `email` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Employee email',
  `phone` VARCHAR(30) NULL COMMENT 'Phone number',
  `date_of_birth` DATE NULL COMMENT 'DOB',
  `address` TEXT NULL COMMENT 'Address',
  `department_id` INT NULL COMMENT 'Employee\'s department',
  `job_position_id` INT NULL COMMENT 'Employee\'s position',
  `manager_id` INT NULL COMMENT 'Reporting manager',
  `joining_date` DATE NOT NULL COMMENT 'Date joined',
  `employment_status` ENUM('active', 'inactive', 'terminated', 'on_leave') NOT NULL DEFAULT 'active' COMMENT 'Active, inactive, terminated, etc.',
  `working_schedule_id` INT NULL COMMENT 'Default schedule',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_employees_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_employees_position` FOREIGN KEY (`job_position_id`) REFERENCES `job_positions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_employees_manager` FOREIGN KEY (`manager_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_employees_schedule` FOREIGN KEY (`working_schedule_id`) REFERENCES `working_schedules` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_employees_code` (`employee_code`),
  INDEX `idx_employees_email` (`email`),
  INDEX `idx_employees_dept` (`department_id`),
  INDEX `idx_employees_position` (`job_position_id`),
  INDEX `idx_employees_manager` (`manager_id`),
  INDEX `idx_employees_status` (`employment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add circular foreign key for departments.manager_id -> employees.id
ALTER TABLE `departments`
  ADD CONSTRAINT `fk_departments_manager` FOREIGN KEY (`manager_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- 10. Table: users
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NULL UNIQUE COMMENT 'Employee associated with account; nullable',
  `email` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Login email',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Hashed password',
  `role_id` INT NOT NULL COMMENT 'Application role',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether login is enabled',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10b. Table: refresh_tokens
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT 'Token owner (FK -> users)',
  `token_hash` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Hashed refresh token or JTI hash',
  `expires_at` DATETIME NOT NULL COMMENT 'Expiration timestamp',
  `is_revoked` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether token is revoked',
  `revoked_at` DATETIME NULL COMMENT 'When token was revoked',
  `replaced_by_hash` VARCHAR(255) NULL COMMENT 'Rotated token replacement hash',
  `user_agent` VARCHAR(255) NULL COMMENT 'Client User-Agent info',
  `ip_address` VARCHAR(45) NULL COMMENT 'Client IP address',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_refresh_tokens_hash` (`token_hash`),
  INDEX `idx_refresh_tokens_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. Table: contracts
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `contracts`;
CREATE TABLE `contracts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL COMMENT 'Contract owner',
  `contract_number` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Contract identifier',
  `start_date` DATE NOT NULL COMMENT 'Contract start',
  `end_date` DATE NULL COMMENT 'Contract end (nullable)',
  `department_id` INT NULL COMMENT 'Department during contract',
  `job_position_id` INT NULL COMMENT 'Position during contract',
  `working_schedule_id` INT NULL COMMENT 'Schedule during contract',
  `salary_structure_id` INT NULL COMMENT 'Salary structure',
  `wage` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Base wage',
  `employment_type` ENUM('full_time', 'part_time', 'contract', 'internship') NOT NULL DEFAULT 'full_time' COMMENT 'Full-time, part-time, etc.',
  `status` ENUM('draft', 'active', 'expired', 'terminated', 'cancelled') NOT NULL DEFAULT 'draft' COMMENT 'Draft, active, expired, etc.',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_contracts_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_contracts_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_contracts_position` FOREIGN KEY (`job_position_id`) REFERENCES `job_positions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_contracts_schedule` FOREIGN KEY (`working_schedule_id`) REFERENCES `working_schedules` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_contracts_structure` FOREIGN KEY (`salary_structure_id`) REFERENCES `salary_structures` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_contracts_employee` (`employee_id`),
  INDEX `idx_contracts_number` (`contract_number`),
  INDEX `idx_contracts_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. Table: attendance
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL COMMENT 'Employee',
  `attendance_date` DATE NOT NULL COMMENT 'Attendance date',
  `check_in` DATETIME NULL COMMENT 'Check-in timestamp',
  `check_out` DATETIME NULL COMMENT 'Check-out timestamp',
  `worked_minutes` INT NOT NULL DEFAULT 0 COMMENT 'Calculated working time in minutes',
  `status` ENUM('present', 'absent', 'late', 'half_day', 'on_leave') NOT NULL DEFAULT 'present' COMMENT 'Present, absent, late, etc.',
  `corrected_by` INT NULL COMMENT 'Person who corrected record (FK -> users)',
  `correction_reason` TEXT NULL COMMENT 'Why correction was made',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_attendance_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_attendance_corrected_by` FOREIGN KEY (`corrected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  UNIQUE KEY `uk_employee_attendance_date` (`employee_id`, `attendance_date`),
  INDEX `idx_attendance_date` (`attendance_date`),
  INDEX `idx_attendance_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. Table: time_off_types
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `time_off_types`;
CREATE TABLE `time_off_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT 'Paid Leave, Sick Leave, etc.',
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Leave code',
  `unit` ENUM('days', 'hours') NOT NULL DEFAULT 'days' COMMENT 'Days / Hours',
  `requires_allocation` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether entitlement is needed',
  `requires_approval` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether approval is required',
  `is_paid` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Paid or unpaid',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether available',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 14. Table: time_off_allocations
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `time_off_allocations`;
CREATE TABLE `time_off_allocations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL COMMENT 'Employee',
  `time_off_type_id` INT NOT NULL COMMENT 'Leave type',
  `start_date` DATE NOT NULL COMMENT 'Allocation validity start',
  `end_date` DATE NOT NULL COMMENT 'Allocation validity end',
  `allocated_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Total allocated',
  `used_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Amount consumed',
  `status` ENUM('pending', 'approved', 'rejected', 'draft') NOT NULL DEFAULT 'pending' COMMENT 'Pending, approved, rejected',
  `approved_by` INT NULL COMMENT 'Approver (FK -> users)',
  `approved_at` DATETIME NULL COMMENT 'Approval time',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_allocations_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_allocations_type` FOREIGN KEY (`time_off_type_id`) REFERENCES `time_off_types` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_allocations_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_allocations_emp` (`employee_id`),
  INDEX `idx_allocations_type` (`time_off_type_id`),
  INDEX `idx_allocations_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 15. Table: time_off_requests
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `time_off_requests`;
CREATE TABLE `time_off_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL COMMENT 'Requesting employee',
  `time_off_type_id` INT NOT NULL COMMENT 'Leave type',
  `allocation_id` INT NULL COMMENT 'Allocation used',
  `start_date` DATE NOT NULL COMMENT 'Leave start',
  `end_date` DATE NOT NULL COMMENT 'Leave end',
  `duration` DECIMAL(10, 2) NOT NULL COMMENT 'Number of days/hours',
  `reason` TEXT NULL COMMENT 'Leave reason',
  `status` ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT 'Pending, approved, rejected',
  `approved_by` INT NULL COMMENT 'Approver (FK -> users)',
  `approved_at` DATETIME NULL COMMENT 'Approval time',
  `rejected_reason` TEXT NULL COMMENT 'Reason for rejection',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_time_off_emp` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_time_off_type` FOREIGN KEY (`time_off_type_id`) REFERENCES `time_off_types` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_time_off_allocation` FOREIGN KEY (`allocation_id`) REFERENCES `time_off_allocations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_time_off_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_time_off_emp` (`employee_id`),
  INDEX `idx_time_off_type` (`time_off_type_id`),
  INDEX `idx_time_off_status` (`status`),
  INDEX `idx_time_off_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 16. Table: payruns
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `payruns`;
CREATE TABLE `payruns` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT 'e.g. PAYRUN-2026-09',
  `salary_structure_id` INT NULL COMMENT 'Structure used',
  `period_start` DATE NOT NULL COMMENT 'Payroll start',
  `period_end` DATE NOT NULL COMMENT 'Payroll end',
  `status` ENUM('draft', 'computed', 'validated', 'paid', 'cancelled') NOT NULL DEFAULT 'draft' COMMENT 'Draft, computed, validated, paid',
  `created_by` INT NULL COMMENT 'Creator (FK -> users)',
  `computed_at` DATETIME NULL COMMENT 'Computation time',
  `validated_at` DATETIME NULL COMMENT 'Validation time',
  `paid_at` DATETIME NULL COMMENT 'Payment/finalization time',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payruns_structure` FOREIGN KEY (`salary_structure_id`) REFERENCES `salary_structures` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_payruns_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_payruns_period` (`period_start`, `period_end`),
  INDEX `idx_payruns_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 17. Table: payrun_employees
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `payrun_employees`;
CREATE TABLE `payrun_employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payrun_id` INT NOT NULL COMMENT 'Payrun',
  `employee_id` INT NOT NULL COMMENT 'Employee',
  `contract_id` INT NULL COMMENT 'Contract selected for this run',
  `status` ENUM('pending', 'computed', 'error', 'paid') NOT NULL DEFAULT 'pending' COMMENT 'Pending, computed, error, etc.',
  `error_message` TEXT NULL COMMENT 'Employee-specific payroll error',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payrun_emp_payrun` FOREIGN KEY (`payrun_id`) REFERENCES `payruns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_payrun_emp_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_payrun_emp_contract` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  UNIQUE KEY `uk_payrun_employee` (`payrun_id`, `employee_id`),
  INDEX `idx_payrun_emp_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 18. Table: payslips
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `payslips`;
CREATE TABLE `payslips` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payrun_id` INT NULL COMMENT 'Parent payrun',
  `employee_id` INT NOT NULL COMMENT 'Employee',
  `contract_id` INT NULL COMMENT 'Contract used',
  `salary_structure_id` INT NULL COMMENT 'Structure snapshot/reference',
  `period_start` DATE NOT NULL COMMENT 'Payroll period start',
  `period_end` DATE NOT NULL COMMENT 'Payroll period end',
  `gross_salary` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Gross salary',
  `total_deductions` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Total deductions',
  `net_salary` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Net salary',
  `status` ENUM('draft', 'generated', 'validated', 'paid', 'cancelled') NOT NULL DEFAULT 'draft' COMMENT 'Generated, paid, etc.',
  `pdf_path` VARCHAR(255) NULL COMMENT 'Generated PDF location',
  `email_sent_at` DATETIME NULL COMMENT 'Email delivery time',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payslips_payrun` FOREIGN KEY (`payrun_id`) REFERENCES `payruns` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_payslips_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_payslips_contract` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_payslips_structure` FOREIGN KEY (`salary_structure_id`) REFERENCES `salary_structures` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_payslips_payrun` (`payrun_id`),
  INDEX `idx_payslips_employee` (`employee_id`),
  INDEX `idx_payslips_period` (`period_start`, `period_end`),
  INDEX `idx_payslips_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 19. Table: payslip_lines
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `payslip_lines`;
CREATE TABLE `payslip_lines` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payslip_id` INT NOT NULL COMMENT 'Parent payslip',
  `salary_rule_id` INT NULL COMMENT 'Rule responsible',
  `name` VARCHAR(150) NOT NULL COMMENT 'Basic Salary, HRA, PF, etc.',
  `code` VARCHAR(50) NOT NULL COMMENT 'Rule code snapshot',
  `category` VARCHAR(50) NOT NULL COMMENT 'Basic, allowance, deduction, etc.',
  `sequence` INT NOT NULL DEFAULT 1 COMMENT 'Calculation order',
  `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Calculated amount',
  `quantity` DECIMAL(10, 2) NOT NULL DEFAULT 1.00 COMMENT 'Quantity if applicable',
  `rate` DECIMAL(10, 2) NOT NULL DEFAULT 100.00 COMMENT 'Percentage/rate',
  `calculation_details` JSON NULL COMMENT 'Explanation/context of calculation',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payslip_lines_payslip` FOREIGN KEY (`payslip_id`) REFERENCES `payslips` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_payslip_lines_rule` FOREIGN KEY (`salary_rule_id`) REFERENCES `salary_rules` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_payslip_lines_payslip` (`payslip_id`),
  INDEX `idx_payslip_lines_rule` (`salary_rule_id`),
  INDEX `idx_payslip_lines_seq` (`sequence`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- INITIAL SEED DATA
-- =============================================================================

-- 1. Roles
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'Admin', 'System Administrator with full access'),
(2, 'HR Manager', 'HR Manager with full access to HR, Employees, Contracts, and Payroll'),
(3, 'Department Manager', 'Manager with approval rights over their department team'),
(4, 'Employee', 'Standard employee with self-service portal access');

-- 2. Working Schedules
INSERT INTO `working_schedules` (`id`, `name`, `description`, `timezone`, `is_active`) VALUES
(1, 'Standard 40 Hours', 'Standard Monday to Friday 9:00 AM - 5:00 PM', 'UTC', TRUE),
(2, 'Part Time 20 Hours', 'Part-time schedule Monday to Wednesday', 'UTC', TRUE);

-- 3. Schedule Days
INSERT INTO `schedule_days` (`schedule_id`, `day_of_week`, `start_time`, `end_time`, `break_minutes`) VALUES
(1, 'Monday', '09:00:00', '17:00:00', 60),
(1, 'Tuesday', '09:00:00', '17:00:00', 60),
(1, 'Wednesday', '09:00:00', '17:00:00', 60),
(1, 'Thursday', '09:00:00', '17:00:00', 60),
(1, 'Friday', '09:00:00', '17:00:00', 60),
(2, 'Monday', '09:00:00', '16:00:00', 60),
(2, 'Tuesday', '09:00:00', '16:00:00', 60),
(2, 'Wednesday', '09:00:00', '15:00:00', 60);

-- 4. Salary Rule Categories
INSERT INTO `salary_rule_categories` (`id`, `name`, `code`, `parent_id`, `description`) VALUES
(1, 'Basic', 'BASIC', NULL, 'Basic Salary Component'),
(2, 'Allowance', 'ALW', NULL, 'Allowances and Bonuses'),
(3, 'Gross', 'GROSS', NULL, 'Gross Salary before Deductions'),
(4, 'Deduction', 'DED', NULL, 'Statutory and voluntary deductions'),
(5, 'Net', 'NET', NULL, 'Final Net Payable Salary');

-- 5. Salary Structures
INSERT INTO `salary_structures` (`id`, `name`, `code`, `description`, `is_active`) VALUES
(1, 'Regular Salary Structure', 'REG_SAL', 'Standard monthly salary structure for regular full-time employees', TRUE),
(2, 'Executive Salary Structure', 'EXEC_SAL', 'Salary structure for executive roles with additional allowances', TRUE);

-- 6. Salary Rules
INSERT INTO `salary_rules` (`id`, `salary_structure_id`, `category_id`, `name`, `code`, `sequence`, `calculation_type`, `value`, `condition_expression`, `formula_expression`, `is_active`) VALUES
(1, 1, 1, 'Basic Salary', 'BASIC', 1, 'percentage', 50.00, NULL, 'contract.wage * 0.50', TRUE),
(2, 1, 2, 'House Rent Allowance (HRA)', 'HRA', 2, 'percentage', 20.00, NULL, 'contract.wage * 0.20', TRUE),
(3, 1, 2, 'Special Allowance', 'SA', 3, 'percentage', 30.00, NULL, 'contract.wage * 0.30', TRUE),
(4, 1, 3, 'Gross Salary', 'GROSS', 10, 'formula', 0.00, NULL, 'BASIC + HRA + SA', TRUE),
(5, 1, 4, 'Provident Fund (PF)', 'PF', 20, 'percentage', 12.00, NULL, 'BASIC * 0.12', TRUE),
(6, 1, 4, 'Professional Tax', 'PT', 21, 'fixed', 200.00, NULL, '200', TRUE),
(7, 1, 5, 'Net Salary', 'NET', 100, 'formula', 0.00, NULL, 'GROSS - (PF + PT)', TRUE);

-- 7. Time Off Types
INSERT INTO `time_off_types` (`id`, `name`, `code`, `unit`, `requires_allocation`, `requires_approval`, `is_paid`, `is_active`) VALUES
(1, 'Paid Leave', 'PL', 'days', TRUE, TRUE, TRUE, TRUE),
(2, 'Sick Leave', 'SL', 'days', TRUE, TRUE, TRUE, TRUE),
(3, 'Unpaid Leave', 'UL', 'days', FALSE, TRUE, FALSE, TRUE),
(4, 'Compensatory Off', 'COMP', 'days', TRUE, TRUE, TRUE, TRUE);

-- 8. Departments
INSERT INTO `departments` (`id`, `name`, `code`, `description`, `manager_id`) VALUES
(1, 'Engineering', 'ENG', 'Software development and infrastructure', NULL),
(2, 'Human Resources', 'HR', 'People operations and talent acquisition', NULL),
(3, 'Finance', 'FIN', 'Finance, accounting, and payroll', NULL),
(4, 'Sales & Marketing', 'SALES', 'Business development and client relations', NULL);

-- 9. Job Positions
INSERT INTO `job_positions` (`id`, `title`, `code`, `department_id`, `description`) VALUES
(1, 'Engineering Manager', 'ENG_MGR', 1, 'Leads the engineering team'),
(2, 'Senior Software Engineer', 'SR_SWE', 1, 'Develops core backend and frontend systems'),
(3, 'Junior Software Engineer', 'JR_SWE', 1, 'Assists in software development'),
(4, 'HR Manager', 'HR_MGR', 2, 'Manages all HR processes and payroll'),
(5, 'HR Executive', 'HR_EXEC', 2, 'Assists in onboarding and daily HR operations'),
(6, 'Finance Director', 'FIN_DIR', 3, 'Oversees corporate financial strategy');

-- 10. Employees
INSERT INTO `employees` (`id`, `employee_code`, `first_name`, `last_name`, `email`, `phone`, `date_of_birth`, `address`, `department_id`, `job_position_id`, `manager_id`, `joining_date`, `employment_status`, `working_schedule_id`) VALUES
(1, 'EMP001', 'Admin', 'User', 'admin@odoo.local', '+1234567890', '1985-05-15', '100 Silicon Blvd, Suite 400', 1, 1, NULL, '2020-01-01', 'active', 1),
(2, 'EMP002', 'Sarah', 'Connor', 'sarah.hr@odoo.local', '+1234567891', '1988-08-20', '200 Market Street, Apt 12', 2, 4, 1, '2021-03-15', 'active', 1),
(3, 'EMP003', 'John', 'Doe', 'john.doe@odoo.local', '+1234567892', '1992-11-10', '300 Tech Park, Building B', 1, 2, 1, '2022-06-01', 'active', 1);

-- Update department managers
UPDATE `departments` SET `manager_id` = 1 WHERE `id` = 1;
UPDATE `departments` SET `manager_id` = 2 WHERE `id` = 2;

-- 11. Users (Password hashes default to bcrypt hashed 'admin123' / '$2b$10$w8T.N0HekD.u9Fz8mX7zK.v1J9l0N4t0i9d5c8K7m6Y5r3a1b9e2y' or demo password)
INSERT INTO `users` (`id`, `employee_id`, `email`, `password_hash`, `role_id`, `is_active`) VALUES
(1, 1, 'admin@odoo.local', '$2a$12$e8YkYk4U/eW38L5Y1fB0E.L.a1C1i1z5Zq5gDqP6X6zO.g2u6iI7K', 1, TRUE),
(2, 2, 'sarah.hr@odoo.local', '$2a$12$e8YkYk4U/eW38L5Y1fB0E.L.a1C1i1z5Zq5gDqP6X6zO.g2u6iI7K', 2, TRUE),
(3, 3, 'john.doe@odoo.local', '$2a$12$e8YkYk4U/eW38L5Y1fB0E.L.a1C1i1z5Zq5gDqP6X6zO.g2u6iI7K', 4, TRUE);

-- 12. Contracts
INSERT INTO `contracts` (`id`, `employee_id`, `contract_number`, `start_date`, `end_date`, `department_id`, `job_position_id`, `working_schedule_id`, `salary_structure_id`, `wage`, `employment_type`, `status`) VALUES
(1, 1, 'CNT-2020-001', '2020-01-01', NULL, 1, 1, 1, 2, 120000.00, 'full_time', 'active'),
(2, 2, 'CNT-2021-002', '2021-03-15', NULL, 2, 4, 1, 1, 85000.00, 'full_time', 'active'),
(3, 3, 'CNT-2022-003', '2022-06-01', NULL, 1, 2, 1, 1, 75000.00, 'full_time', 'active');

-- 13. Time Off Allocations
INSERT INTO `time_off_allocations` (`id`, `employee_id`, `time_off_type_id`, `start_date`, `end_date`, `allocated_amount`, `used_amount`, `status`, `approved_by`, `approved_at`) VALUES
(1, 1, 1, '2026-01-01', '2026-12-31', 20.00, 0.00, 'approved', 1, NOW()),
(2, 1, 2, '2026-01-01', '2026-12-31', 10.00, 0.00, 'approved', 1, NOW()),
(3, 2, 1, '2026-01-01', '2026-12-31', 20.00, 2.00, 'approved', 1, NOW()),
(4, 3, 1, '2026-01-01', '2026-12-31', 20.00, 1.00, 'approved', 2, NOW());
