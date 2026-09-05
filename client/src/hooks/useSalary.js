import { useState, useEffect, useCallback } from 'react';
import salaryService from '../services/salaryService';

/**
 * Custom hooks for Salary Structures, Rules, and Calculation Preview
 */

export function useSalaryStructures(params = {}) {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStructures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await salaryService.getSalaryStructures(params);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to fetch salary structures');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching salary structures');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  return { ...data, loading, error, refetch: fetchStructures };
}

export function useSalaryStructure(id) {
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStructure = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await salaryService.getSalaryStructureById(id);
      if (res.success) {
        setStructure(res.data);
      } else {
        setError(res.message || 'Salary structure not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load salary structure details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStructure();
  }, [fetchStructure]);

  return { structure, loading, error, refetch: fetchStructure };
}

export function useSalaryRules(params = {}) {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await salaryService.getSalaryRules(params);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to fetch salary rules');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching salary rules');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return { ...data, loading, error, refetch: fetchRules };
}

export function useSalaryRule(id) {
  const [rule, setRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRule = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await salaryService.getSalaryRuleById(id);
      if (res.success) {
        setRule(res.data);
      } else {
        setError(res.message || 'Salary rule not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load salary rule details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRule();
  }, [fetchRule]);

  return { rule, loading, error, refetch: fetchRule };
}

export function useSalaryCategories(params = {}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await salaryService.getSalaryRuleCategories(params);
        if (res.success) {
          const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
          setCategories(list);
        }
      } catch (err) {
        console.error('Failed to load salary rule categories', err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, [JSON.stringify(params)]);

  return { categories: Array.isArray(categories) ? categories : [], loading };
}

export function useStructureCalculation(structureId, baseSalary = 50000) {
  const [result, setResult] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);

  const calculate = useCallback(async () => {
    if (!structureId) return;
    try {
      setLoading(true);
      const [calcRes, valRes] = await Promise.all([
        salaryService.previewSalaryStructure(structureId, baseSalary),
        salaryService.validateSalaryStructure(structureId)
      ]);

      if (calcRes.success) setResult(calcRes.data);
      if (valRes.success) setValidation(valRes.data);
    } catch (err) {
      console.error('Failed to run structure calculation preview', err);
    } finally {
      setLoading(false);
    }
  }, [structureId, baseSalary]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return { result, validation, loading, refetch: calculate };
}
