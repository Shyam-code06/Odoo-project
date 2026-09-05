/**
 * Salary Service Layer
 * API-ready master service managing Salary Structures, Categories, Rules, and Live Preview.
 */

import { employeeService } from './employeeService';
import {
  salaryStructureAdapter,
  salaryRuleCategoryAdapter,
  salaryRuleAdapter,
} from '../adapters/salaryAdapter';
import {
  calculateSalaryStructure,
  validateStructureDependencies,
  getPayrollCalculationDefinition,
} from '../utils/salaryCalculationEngine';
import { apiClient } from './apiClient';

export const salaryService = {
  // ==========================================
  // 1. SALARY STRUCTURES MANAGEMENT
  // ==========================================

  getSalaryStructures: async (params = {}) => {
    // 1. Attempt live HTTP REST API call via apiClient
    try {
      const apiRes = await apiClient.get('/salary-structures', params);
      if (apiRes?.success && apiRes?.data) {
        const rawRules = employeeService._getRawSalaryRules() || [];
        const rawStructs = Array.isArray(apiRes.data)
          ? apiRes.data
          : apiRes.data.structures || [];
        const structs = rawStructs.map((s) =>
          salaryStructureAdapter.toUIModel(s, rawRules)
        );

        const total = apiRes.pagination?.total || structs.length;
        const page = apiRes.pagination?.page || params.page || 1;
        const pageSize = apiRes.pagination?.limit || params.pageSize || 10;
        const totalPages = apiRes.pagination?.totalPages || Math.ceil(total / pageSize) || 1;

        return {
          success: true,
          data: {
            items: structs,
            total,
            page,
            pageSize,
            totalPages,
            metrics: {
              total: structs.length,
              active: structs.filter((s) => s.isActive).length,
              inactive: structs.filter((s) => !s.isActive).length,
              totalRules: rawRules.length,
            },
          },
        };
      }
    } catch (err) {
      console.warn('[salaryService] Live getSalaryStructures failed, using local store:', err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawRules = employeeService._getRawSalaryRules() || [];
        const rawStructs = employeeService._getRawSalaryStructures() || [];
        let structs = rawStructs.map((s) => salaryStructureAdapter.toUIModel(s, rawRules));

        // Search (Name, Code, Description)
        if (params.search) {
          const q = params.search.toLowerCase().trim();
          structs = structs.filter(
            (s) =>
              (s.name && s.name.toLowerCase().includes(q)) ||
              (s.code && s.code.toLowerCase().includes(q)) ||
              (s.description && s.description.toLowerCase().includes(q))
          );
        }

        // Active Status Filter
        if (params.isActive !== undefined && params.isActive !== '') {
          const val = params.isActive === 'true' || params.isActive === true;
          structs = structs.filter((s) => s.isActive === val);
        }

        // Summary Metrics
        const allRawStructs = rawStructs.map((s) => salaryStructureAdapter.toUIModel(s, rawRules));
        const metrics = {
          total: allRawStructs.length,
          active: allRawStructs.filter((s) => s.isActive).length,
          inactive: allRawStructs.filter((s) => !s.isActive).length,
          totalRules: rawRules.length,
        };

        // Sorting
        const sortBy = params.sortBy || 'name';
        const sortDirection = params.sortDirection === 'desc' ? -1 : 1;
        structs.sort((a, b) => {
          let valA = a[sortBy] ?? '';
          let valB = b[sortBy] ?? '';
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          if (valA < valB) return -1 * sortDirection;
          if (valA > valB) return 1 * sortDirection;
          return 0;
        });

        // Pagination
        const page = parseInt(params.page, 10) || 1;
        const pageSize = parseInt(params.pageSize, 10) || 10;
        const totalItems = structs.length;
        const totalPages = Math.ceil(totalItems / pageSize) || 1;
        const paginatedData = structs.slice((page - 1) * pageSize, page * pageSize);

        resolve({
          success: true,
          data: {
            items: paginatedData,
            total: totalItems,
            page,
            pageSize,
            totalPages,
            metrics,
          },
        });
      }, 150);
    });
  },

  getSalaryStructureById: async (id) => {
    try {
      const apiRes = await apiClient.get(`/salary-structures/${id}`);
      if (apiRes?.success && apiRes?.data) {
        const rawRules = employeeService._getRawSalaryRules() || [];
        const rawCategories = employeeService._getRawSalaryRuleCategories() || [];
        const rawStructs = [apiRes.data];
        const uiStruct = salaryStructureAdapter.toUIModel(apiRes.data, apiRes.data.rules || rawRules);
        const attachedRules = (apiRes.data.rules || rawRules.filter((r) => r.salary_structure_id === id))
          .map((r) => salaryRuleAdapter.toUIModel(r, rawStructs, rawCategories))
          .filter(Boolean)
          .sort((a, b) => a.sequence - b.sequence);

        return {
          success: true,
          data: {
            ...uiStruct,
            rules: attachedRules,
          },
        };
      }
    } catch (err) {
      console.warn('[salaryService] Live getSalaryStructureById failed, using local store:', err.message);
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawStructs = employeeService._getRawSalaryStructures() || [];
        const rawStruct = rawStructs.find((s) => s.id === id);
        if (!rawStruct) {
          resolve({
            success: false,
            message: `Salary Structure with ID ${id} not found.`,
          });
          return;
        }

        const rawRules = employeeService._getRawSalaryRules() || [];
        const uiStruct = salaryStructureAdapter.toUIModel(rawStruct, rawRules);

        // Fetch attached rules in sequence order
        const rawCategories = employeeService._getRawSalaryRuleCategories() || [];
        const attachedRules = rawRules
          .filter((r) => r.salary_structure_id === id)
          .map((r) => salaryRuleAdapter.toUIModel(r, rawStructs, rawCategories))
          .filter(Boolean)
          .sort((a, b) => a.sequence - b.sequence);

        resolve({
          success: true,
          data: {
            ...uiStruct,
            rules: attachedRules,
          },
        });
      }, 150);
    });
  },

  createSalaryStructure: async (structData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawStructs = [...(employeeService._getRawSalaryStructures() || [])];

        const name = structData.name ? structData.name.trim() : '';
        const code = structData.code ? structData.code.trim().toUpperCase() : '';

        if (!name) {
          resolve({ success: false, message: 'Salary Structure name is required.' });
          return;
        }
        if (!code) {
          resolve({ success: false, message: 'Salary Structure code is required.' });
          return;
        }

        const codeExists = rawStructs.some((s) => s.code.toUpperCase() === code);
        if (codeExists) {
          resolve({ success: false, message: `Salary Structure code '${code}' already exists.` });
          return;
        }

        const newId = `struct-${Date.now()}`;
        const apiPayload = {
          id: newId,
          name,
          code,
          description: structData.description ? structData.description.trim() : '',
          is_active: structData.isActive ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        rawStructs.unshift(apiPayload);
        employeeService._setRawSalaryStructures(rawStructs);

        resolve({
          success: true,
          data: salaryStructureAdapter.toUIModel(apiPayload),
          message: 'Salary Structure created successfully.',
        });
      }, 200);
    });
  },

  updateSalaryStructure: async (id, structData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawStructs = [...(employeeService._getRawSalaryStructures() || [])];
        const index = rawStructs.findIndex((s) => s.id === id);
        if (index === -1) {
          resolve({ success: false, message: `Salary Structure with ID ${id} not found.` });
          return;
        }

        const name = structData.name ? structData.name.trim() : '';
        const code = structData.code ? structData.code.trim().toUpperCase() : '';

        if (!name) {
          resolve({ success: false, message: 'Salary Structure name is required.' });
          return;
        }
        if (!code) {
          resolve({ success: false, message: 'Salary Structure code is required.' });
          return;
        }

        const codeExists = rawStructs.some((s) => s.id !== id && s.code.toUpperCase() === code);
        if (codeExists) {
          resolve({ success: false, message: `Salary Structure code '${code}' is used by another structure.` });
          return;
        }

        const updatedApiPayload = {
          ...rawStructs[index],
          name,
          code,
          description: structData.description !== undefined ? structData.description.trim() : rawStructs[index].description,
          is_active: structData.isActive !== undefined ? Boolean(structData.isActive) : rawStructs[index].is_active,
          updated_at: new Date().toISOString(),
        };

        rawStructs[index] = updatedApiPayload;
        employeeService._setRawSalaryStructures(rawStructs);

        resolve({
          success: true,
          data: salaryStructureAdapter.toUIModel(updatedApiPayload),
          message: 'Salary Structure updated successfully.',
        });
      }, 200);
    });
  },

  activateSalaryStructure: async (id) => {
    return salaryService.toggleStructureActive(id, true);
  },

  deactivateSalaryStructure: async (id) => {
    return salaryService.toggleStructureActive(id, false);
  },

  toggleStructureActive: async (id, targetState) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawStructs = [...(employeeService._getRawSalaryStructures() || [])];
        const index = rawStructs.findIndex((s) => s.id === id);
        if (index === -1) {
          resolve({ success: false, message: `Salary Structure with ID ${id} not found.` });
          return;
        }

        const nextState = targetState !== undefined ? targetState : !rawStructs[index].is_active;
        rawStructs[index] = {
          ...rawStructs[index],
          is_active: nextState,
          updated_at: new Date().toISOString(),
        };

        employeeService._setRawSalaryStructures(rawStructs);

        resolve({
          success: true,
          data: salaryStructureAdapter.toUIModel(rawStructs[index]),
          message: `Salary Structure ${nextState ? 'activated' : 'deactivated'} successfully.`,
        });
      }, 200);
    });
  },

  deleteSalaryStructure: async (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawStructs = employeeService._getRawSalaryStructures() || [];
        const rawRules = employeeService._getRawSalaryRules() || [];

        const hasRules = rawRules.some((r) => r.salary_structure_id === id);
        if (hasRules) {
          // Deactivate instead of destructive delete when rules exist
          const index = rawStructs.findIndex((s) => s.id === id);
          if (index !== -1) {
            rawStructs[index].is_active = false;
            employeeService._setRawSalaryStructures(rawStructs);
          }
          resolve({
            success: true,
            message: 'Salary Structure deactivated to preserve historical rules.',
          });
          return;
        }

        const filtered = rawStructs.filter((s) => s.id !== id);
        employeeService._setRawSalaryStructures(filtered);

        resolve({
          success: true,
          message: 'Salary Structure deleted successfully.',
        });
      }, 200);
    });
  },

  // ==========================================
  // 2. SALARY RULES MANAGEMENT
  // ==========================================

  getSalaryRules: async (params = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawStructs = employeeService._getRawSalaryStructures() || [];
        const rawCategories = employeeService._getRawSalaryRuleCategories() || [];
        let rules = (employeeService._getRawSalaryRules() || [])
          .map((r) => salaryRuleAdapter.toUIModel(r, rawStructs, rawCategories))
          .filter(Boolean);

        // Filter by Salary Structure
        if (params.salaryStructureId) {
          rules = rules.filter((r) => r.salaryStructureId === params.salaryStructureId);
        }

        // Filter by Category
        if (params.categoryId) {
          rules = rules.filter((r) => r.categoryId === params.categoryId);
        }

        // Filter by Calculation Type
        if (params.calculationType) {
          rules = rules.filter((r) => r.calculationType === params.calculationType.toLowerCase());
        }

        // Filter by Active status
        if (params.isActive !== undefined && params.isActive !== '') {
          const val = params.isActive === 'true' || params.isActive === true;
          rules = rules.filter((r) => r.isActive === val);
        }

        // Search (Name, Code, Structure Name)
        if (params.search) {
          const q = params.search.toLowerCase().trim();
          rules = rules.filter(
            (r) =>
              (r.name && r.name.toLowerCase().includes(q)) ||
              (r.code && r.code.toLowerCase().includes(q)) ||
              (r.salaryStructure && r.salaryStructure.name && r.salaryStructure.name.toLowerCase().includes(q)) ||
              (r.structureName && r.structureName.toLowerCase().includes(q))
          );
        }

        // Summary Metrics
        const allUIRules = (employeeService._getRawSalaryRules() || [])
          .map((r) => salaryRuleAdapter.toUIModel(r, rawStructs, rawCategories))
          .filter(Boolean);

        const scopedRules = params.salaryStructureId
          ? allUIRules.filter((r) => r.salaryStructureId === params.salaryStructureId)
          : allUIRules;

        const metrics = {
          total: scopedRules.length,
          active: scopedRules.filter((r) => r.isActive).length,
          fixedCount: scopedRules.filter((r) => r.calculationType === 'fixed').length,
          percentageCount: scopedRules.filter((r) => r.calculationType === 'percentage').length,
          formulaCount: scopedRules.filter((r) => r.calculationType === 'formula').length,
        };

        // Sorting (default to sequence ASC)
        const sortBy = params.sortBy || 'sequence';
        const sortDirection = params.sortDirection === 'desc' ? -1 : 1;
        rules.sort((a, b) => {
          let valA = a[sortBy] ?? '';
          let valB = b[sortBy] ?? '';
          if (sortBy === 'sequence') {
            return (Number(a.sequence) - Number(b.sequence)) * sortDirection;
          }
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          if (valA < valB) return -1 * sortDirection;
          if (valA > valB) return 1 * sortDirection;
          return 0;
        });

        // Pagination
        const page = parseInt(params.page, 10) || 1;
        const pageSize = parseInt(params.pageSize, 10) || 10;
        const totalItems = rules.length;
        const totalPages = Math.ceil(totalItems / pageSize) || 1;
        const paginatedData = rules.slice((page - 1) * pageSize, page * pageSize);

        resolve({
          success: true,
          data: {
            items: paginatedData,
            total: totalItems,
            page,
            pageSize,
            totalPages,
            metrics,
          },
        });
      }, 150);
    });
  },

  getSalaryRuleById: async (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawRules = employeeService._getRawSalaryRules() || [];
        const rawRule = rawRules.find((r) => r.id === id);
        if (!rawRule) {
          resolve({ success: false, message: `Salary Rule with ID ${id} not found.` });
          return;
        }

        const rawStructs = employeeService._getRawSalaryStructures() || [];
        const rawCategories = employeeService._getRawSalaryRuleCategories() || [];
        const uiRule = salaryRuleAdapter.toUIModel(rawRule, rawStructs, rawCategories);

        resolve({
          success: true,
          data: uiRule,
        });
      }, 150);
    });
  },

  createSalaryRule: async (ruleData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const {
          salaryStructureId,
          categoryId,
          name,
          code,
          sequence,
          calculationType,
          value,
          conditionExpression,
          formulaExpression,
          isActive,
        } = ruleData;

        if (!salaryStructureId) {
          resolve({ success: false, message: 'Please select a Salary Structure.' });
          return;
        }
        if (!categoryId) {
          resolve({ success: false, message: 'Please select a Rule Category.' });
          return;
        }
        if (!name || !name.trim()) {
          resolve({ success: false, message: 'Rule name is required.' });
          return;
        }
        if (!code || !code.trim()) {
          resolve({ success: false, message: 'Rule code is required.' });
          return;
        }

        const normalizedCode = code.trim().toUpperCase();
        const rawRules = [...(employeeService._getRawSalaryRules() || [])];

        // Unique Code check within structure
        const codeExists = rawRules.some(
          (r) =>
            r.salary_structure_id === salaryStructureId &&
            r.code.toUpperCase() === normalizedCode
        );
        if (codeExists) {
          resolve({
            success: false,
            message: `Rule code '${normalizedCode}' already exists within this Salary Structure.`,
          });
          return;
        }

        // Calculation type validation
        if (calculationType === 'fixed' || calculationType === 'percentage') {
          if (value === undefined || value === null || value === '' || isNaN(Number(value))) {
            resolve({ success: false, message: `Value is required for ${calculationType} calculation type.` });
            return;
          }
        }
        if (calculationType === 'formula' && (!formulaExpression || !formulaExpression.trim())) {
          resolve({ success: false, message: 'Formula expression is required for formula calculation type.' });
          return;
        }

        const newId = `rule-${Date.now()}`;
        const apiPayload = {
          id: newId,
          ...salaryRuleAdapter.toAPIModel({
            salaryStructureId,
            categoryId,
            name,
            code: normalizedCode,
            sequence: Number(sequence) || 10,
            calculationType,
            value,
            conditionExpression,
            formulaExpression,
            isActive: isActive ?? true,
          }),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        rawRules.push(apiPayload);
        employeeService._setRawSalaryRules(rawRules);

        const rawStructs = employeeService._getRawSalaryStructures() || [];
        const rawCategories = employeeService._getRawSalaryRuleCategories() || [];

        resolve({
          success: true,
          data: salaryRuleAdapter.toUIModel(apiPayload, rawStructs, rawCategories),
          message: 'Salary Rule created successfully.',
        });
      }, 200);
    });
  },

  updateSalaryRule: async (id, ruleData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawRules = [...(employeeService._getRawSalaryRules() || [])];
        const index = rawRules.findIndex((r) => r.id === id);
        if (index === -1) {
          resolve({ success: false, message: `Salary Rule with ID ${id} not found.` });
          return;
        }

        const existing = rawRules[index];
        const {
          salaryStructureId,
          categoryId,
          name,
          code,
          sequence,
          calculationType,
          value,
          conditionExpression,
          formulaExpression,
          isActive,
        } = ruleData;

        const normalizedCode = code ? code.trim().toUpperCase() : existing.code;
        const targetStructureId = salaryStructureId || existing.salary_structure_id;

        // Unique Code Check within structure (excluding current rule)
        const codeExists = rawRules.some(
          (r) =>
            r.id !== id &&
            r.salary_structure_id === targetStructureId &&
            r.code.toUpperCase() === normalizedCode
        );
        if (codeExists) {
          resolve({
            success: false,
            message: `Rule code '${normalizedCode}' is used by another rule in this Salary Structure.`,
          });
          return;
        }

        const updatedApiPayload = {
          ...existing,
          ...salaryRuleAdapter.toAPIModel({
            salaryStructureId: targetStructureId,
            categoryId: categoryId || existing.category_id,
            name: name ? name.trim() : existing.name,
            code: normalizedCode,
            sequence: sequence !== undefined ? Number(sequence) : existing.sequence,
            calculationType: calculationType || existing.calculation_type,
            value: value !== undefined ? value : existing.value,
            conditionExpression:
              conditionExpression !== undefined ? conditionExpression : existing.condition_expression,
            formulaExpression:
              formulaExpression !== undefined ? formulaExpression : existing.formula_expression,
            isActive: isActive !== undefined ? Boolean(isActive) : existing.is_active,
          }),
          updated_at: new Date().toISOString(),
        };

        rawRules[index] = updatedApiPayload;
        employeeService._setRawSalaryRules(rawRules);

        const rawStructs = employeeService._getRawSalaryStructures() || [];
        const rawCategories = employeeService._getRawSalaryRuleCategories() || [];

        resolve({
          success: true,
          data: salaryRuleAdapter.toUIModel(updatedApiPayload, rawStructs, rawCategories),
          message: 'Salary Rule updated successfully.',
        });
      }, 200);
    });
  },

  reorderRules: async (structureId, orderedRuleIds = []) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawRules = [...(employeeService._getRawSalaryRules() || [])];

        // Reassign sequence in increments of 10
        orderedRuleIds.forEach((ruleId, idx) => {
          const ruleIndex = rawRules.findIndex((r) => r.id === ruleId);
          if (ruleIndex !== -1) {
            rawRules[ruleIndex] = {
              ...rawRules[ruleIndex],
              sequence: (idx + 1) * 10,
              updated_at: new Date().toISOString(),
            };
          }
        });

        employeeService._setRawSalaryRules(rawRules);

        const rawStructs = employeeService._getRawSalaryStructures() || [];
        const rawCategories = employeeService._getRawSalaryRuleCategories() || [];
        const updatedStructureRules = rawRules
          .filter((r) => r.salary_structure_id === structureId)
          .map((r) => salaryRuleAdapter.toUIModel(r, rawStructs, rawCategories))
          .filter(Boolean)
          .sort((a, b) => a.sequence - b.sequence);

        resolve({
          success: true,
          data: updatedStructureRules,
          message: 'Salary rules reordered successfully.',
        });
      }, 200);
    });
  },

  activateSalaryRule: async (id) => {
    return salaryService.toggleRuleActive(id, true);
  },

  deactivateSalaryRule: async (id) => {
    return salaryService.toggleRuleActive(id, false);
  },

  toggleRuleActive: async (id, targetState) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawRules = [...(employeeService._getRawSalaryRules() || [])];
        const index = rawRules.findIndex((r) => r.id === id);
        if (index === -1) {
          resolve({ success: false, message: `Salary Rule with ID ${id} not found.` });
          return;
        }

        const nextState = targetState !== undefined ? targetState : !rawRules[index].is_active;
        rawRules[index] = {
          ...rawRules[index],
          is_active: nextState,
          updated_at: new Date().toISOString(),
        };

        employeeService._setRawSalaryRules(rawRules);

        const rawStructs = employeeService._getRawSalaryStructures() || [];
        const rawCategories = employeeService._getRawSalaryRuleCategories() || [];

        resolve({
          success: true,
          data: salaryRuleAdapter.toUIModel(rawRules[index], rawStructs, rawCategories),
          message: `Salary Rule ${nextState ? 'activated' : 'deactivated'} successfully.`,
        });
      }, 200);
    });
  },

  deleteSalaryRule: async (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawRules = employeeService._getRawSalaryRules() || [];
        const filtered = rawRules.filter((r) => r.id !== id);
        employeeService._setRawSalaryRules(filtered);

        resolve({ success: true, message: 'Salary Rule deleted successfully.' });
      }, 200);
    });
  },

  // ==========================================
  // 3. CATEGORIES & CALCULATION ENGINE
  // ==========================================

  getSalaryRuleCategories: async (params = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawRules = employeeService._getRawSalaryRules() || [];
        const rawCategories = employeeService._getRawSalaryRuleCategories() || [];
        let cats = rawCategories.map((c) => salaryRuleCategoryAdapter.toUIModel(c, rawRules)).filter(Boolean);

        if (params.search) {
          const q = params.search.toLowerCase().trim();
          cats = cats.filter(
            (c) =>
              (c.name && c.name.toLowerCase().includes(q)) ||
              (c.code && c.code.toLowerCase().includes(q)) ||
              (c.description && c.description.toLowerCase().includes(q))
          );
        }

        const sortBy = params.sortBy || 'name';
        const sortDirection = params.sortDirection === 'desc' ? -1 : 1;
        cats.sort((a, b) => {
          let valA = a[sortBy] ?? '';
          let valB = b[sortBy] ?? '';
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          if (valA < valB) return -1 * sortDirection;
          if (valA > valB) return 1 * sortDirection;
          return 0;
        });

        const page = parseInt(params.page, 10) || 1;
        const pageSize = parseInt(params.pageSize, 10) || 10;
        const totalItems = cats.length;
        const totalPages = Math.ceil(totalItems / pageSize) || 1;
        const paginatedData = cats.slice((page - 1) * pageSize, page * pageSize);

        resolve({
          success: true,
          data: {
            items: paginatedData,
            total: totalItems,
            page,
            pageSize,
            totalPages,
          },
        });
      }, 100);
    });
  },

  getSalaryRuleCategoryById: async (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawRules = employeeService._getRawSalaryRules() || [];
        const rawCategories = employeeService._getRawSalaryRuleCategories() || [];
        const cat = rawCategories.find((c) => c.id === id);
        if (!cat) {
          resolve({ success: false, message: `Category with ID ${id} not found.` });
          return;
        }
        resolve({
          success: true,
          data: salaryRuleCategoryAdapter.toUIModel(cat, rawRules),
        });
      }, 100);
    });
  },

  createSalaryRuleCategory: async (categoryData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const name = categoryData.name ? categoryData.name.trim() : '';
        const code = categoryData.code ? categoryData.code.trim().toUpperCase() : '';

        if (!name) {
          resolve({ success: false, message: 'Category name is required.' });
          return;
        }
        if (!code) {
          resolve({ success: false, message: 'Category code is required.' });
          return;
        }

        const rawCategories = [...(employeeService._getRawSalaryRuleCategories() || [])];
        const exists = rawCategories.some((c) => c.code.toUpperCase() === code);
        if (exists) {
          resolve({ success: false, message: `Category code '${code}' already exists.` });
          return;
        }

        const newId = `cat-${Date.now()}`;
        const newCat = {
          id: newId,
          name,
          code,
          description: categoryData.description ? categoryData.description.trim() : '',
        };

        rawCategories.push(newCat);
        employeeService._setRawSalaryRuleCategories(rawCategories);

        const rawRules = employeeService._getRawSalaryRules() || [];
        resolve({
          success: true,
          data: salaryRuleCategoryAdapter.toUIModel(newCat, rawRules),
          message: 'Salary Rule Category created successfully.',
        });
      }, 150);
    });
  },

  updateSalaryRuleCategory: async (id, categoryData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawCategories = [...(employeeService._getRawSalaryRuleCategories() || [])];
        const idx = rawCategories.findIndex((c) => c.id === id);
        if (idx === -1) {
          resolve({ success: false, message: `Category with ID ${id} not found.` });
          return;
        }

        const name = categoryData.name ? categoryData.name.trim() : rawCategories[idx].name;
        const code = categoryData.code ? categoryData.code.trim().toUpperCase() : rawCategories[idx].code;

        const exists = rawCategories.some((c) => c.id !== id && c.code.toUpperCase() === code);
        if (exists) {
          resolve({ success: false, message: `Category code '${code}' is used by another category.` });
          return;
        }

        rawCategories[idx] = {
          ...rawCategories[idx],
          name,
          code,
          description: categoryData.description !== undefined ? categoryData.description.trim() : rawCategories[idx].description,
        };

        employeeService._setRawSalaryRuleCategories(rawCategories);

        const rawRules = employeeService._getRawSalaryRules() || [];
        resolve({
          success: true,
          data: salaryRuleCategoryAdapter.toUIModel(rawCategories[idx], rawRules),
          message: 'Salary Rule Category updated successfully.',
        });
      }, 150);
    });
  },

  deleteSalaryRuleCategory: async (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawRules = employeeService._getRawSalaryRules() || [];
        const isUsed = rawRules.some((r) => r.category_id === id || r.categoryId === id);
        if (isUsed) {
          resolve({
            success: false,
            message: 'Cannot delete category because it is currently assigned to one or more salary rules.',
          });
          return;
        }

        const rawCategories = employeeService._getRawSalaryRuleCategories() || [];
        const filtered = rawCategories.filter((c) => c.id !== id);
        employeeService._setRawSalaryRuleCategories(filtered);

        resolve({
          success: true,
          message: 'Salary Rule Category deleted successfully.',
        });
      }, 150);
    });
  },

  previewSalaryStructure: async (structureId, baseSalaryInput = 50000) => {
    return salaryService.previewCalculation(structureId, baseSalaryInput);
  },

  previewCalculation: async (structureId, baseSalaryInput = 50000) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawStructs = employeeService._getRawSalaryStructures() || [];
        const rawStruct = rawStructs.find((s) => s.id === structureId);
        if (!rawStruct) {
          resolve({
            success: false,
            message: `Salary Structure with ID ${structureId} not found.`,
          });
          return;
        }

        const rawRules = employeeService._getRawSalaryRules() || [];
        const rawCategories = employeeService._getRawSalaryRuleCategories() || [];

        const uiRules = rawRules
          .filter((r) => r.salary_structure_id === structureId)
          .map((r) => salaryRuleAdapter.toUIModel(r, rawStructs, rawCategories))
          .filter(Boolean);

        const calculationResult = calculateSalaryStructure(
          rawStruct,
          uiRules,
          baseSalaryInput
        );

        resolve({
          success: true,
          data: calculationResult,
        });
      }, 150);
    });
  },

  validateSalaryStructure: async (structureId) => {
    return salaryService.validateStructure(structureId);
  },

  validateStructure: async (structureId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawRules = employeeService._getRawSalaryRules() || [];
        const rawCategories = employeeService._getRawSalaryRuleCategories() || [];
        const rawStructs = employeeService._getRawSalaryStructures() || [];

        const uiRules = rawRules
          .filter((r) => r.salary_structure_id === structureId)
          .map((r) => salaryRuleAdapter.toUIModel(r, rawStructs, rawCategories))
          .filter(Boolean);

        const validation = validateStructureDependencies(uiRules);

        resolve({
          success: true,
          data: validation,
        });
      }, 100);
    });
  },
};

export default salaryService;
