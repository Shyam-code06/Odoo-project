import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';
import salaryService from '../../../services/salaryService';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Table } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Pagination } from '../../../components/ui/Pagination';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../components/ui/Toast';

import {
  FolderKanban,
  Plus,
  Search,
  ListOrdered,
  Edit2,
  Trash2,
  X,
  Save
} from 'lucide-react';

export default function SalaryRuleCategoriesPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const canCreate = hasPermission(PERMISSIONS.SALARY_RULE_CATEGORIES_CREATE);
  const canEdit = hasPermission(PERMISSIONS.SALARY_RULE_CATEGORIES_EDIT);
  const canDelete = hasPermission(PERMISSIONS.SALARY_RULE_CATEGORIES_DELETE);

  const [queryParams, setQueryParams] = useState({
    search: '',
    sortBy: 'name',
    sortDirection: 'asc',
    page: 1,
    pageSize: 10,
  });

  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Category Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Deletion Dialog State
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await salaryService.getSalaryRuleCategories(queryParams);
      if (res.success) {
        // If data is array (old format), handle array gracefully
        if (Array.isArray(res.data)) {
          setData({ items: res.data, total: res.data.length, page: 1, pageSize: 10, totalPages: 1 });
        } else {
          setData(res.data);
        }
      } else {
        setError(res.message || 'Failed to fetch salary rule categories');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching categories');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(queryParams)]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSearchChange = (e) => {
    setQueryParams((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', code: '', description: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      code: cat.code || '',
      description: cat.description || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Category Name is required';
    if (!formData.code.trim()) errs.code = 'Category Code is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
      };

      const res = editingCategory
        ? await salaryService.updateSalaryRuleCategory(editingCategory.id, payload)
        : await salaryService.createSalaryRuleCategory(payload);

      if (res.success) {
        toast.success(res.message);
        setIsModalOpen(false);
        fetchCategories();
      } else {
        toast.error(res.message || 'Operation failed');
      }
    } catch (err) {
      toast.error(err.message || 'Error saving category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    try {
      setIsDeleting(true);
      const res = await salaryService.deleteSalaryRuleCategory(categoryToDelete.id);
      if (res.success) {
        toast.success(res.message);
        fetchCategories();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.message || 'Error deleting category');
    } finally {
      setIsDeleting(false);
      setCategoryToDelete(null);
    }
  };

  const totalCategories = data.total || data.items.length;
  const totalAssignedRules = data.items.reduce((acc, c) => acc + (c.ruleCount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Salary Rule Categories"
        description="Configure rule categories (Basic, Allowances, Gross, Deductions, Net, Contributions) used to classify salary rules."
        action={
          canCreate && (
            <Button
              variant="primary"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Rule Category</span>
            </Button>
          )
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Rule Categories</p>
            <h4 className="text-2xl font-bold text-slate-800">{totalCategories}</h4>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <ListOrdered className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned Salary Rules</p>
            <h4 className="text-2xl font-bold text-slate-800">{totalAssignedRules}</h4>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by category name, code..."
            value={queryParams.search}
            onChange={handleSearchChange}
            className="pl-9 text-sm"
          />
        </div>

        <div className="w-44">
          <Select
            value={queryParams.sortBy}
            onChange={(e) => setQueryParams((prev) => ({ ...prev, sortBy: e.target.value }))}
            options={[
              { value: 'name', label: 'Sort by Name' },
              { value: 'code', label: 'Sort by Code' },
            ]}
            className="text-sm"
          />
        </div>
      </Card>

      {/* Content Table */}
      {loading ? (
        <LoadingState message="Loading salary rule categories..." />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchCategories} />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No salary rule categories found"
          description={queryParams.search ? 'No categories match your search query.' : 'Configure your organization\'s first rule category.'}
          action={
            canCreate ? (
              <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
                Create Rule Category
              </Button>
            ) : null
          }
        />
      ) : (
        <Card className="border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden">
          <Table>
            <Table.Header>
              <Table.Row className="bg-slate-50/80">
                <Table.HeaderCell>Category Name</Table.HeaderCell>
                <Table.HeaderCell>Code</Table.HeaderCell>
                <Table.HeaderCell>Description</Table.HeaderCell>
                <Table.HeaderCell>Associated Rules</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {data.items.map((cat) => (
                <Table.Row key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                  <Table.Cell>
                    <span className="font-semibold text-slate-800 text-xs block">{cat.name}</span>
                  </Table.Cell>

                  <Table.Cell>
                    <Badge variant="outline" className="font-mono text-xs bg-slate-50 text-slate-700">
                      {cat.code}
                    </Badge>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="text-xs text-slate-500 line-clamp-1 max-w-md">
                      {cat.description || '—'}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <Badge variant="secondary" className="text-[11px]">
                      {cat.ruleCount || 0} Rules
                    </Badge>
                  </Table.Cell>

                  <Table.Cell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(cat)}
                          title="Edit Category"
                          className="p-1 h-8 w-8 text-slate-500 hover:text-orange-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}

                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCategoryToDelete(cat)}
                          title="Delete Category"
                          className="p-1 h-8 w-8 text-slate-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {data.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100">
              <Pagination
                currentPage={data.page}
                totalPages={data.totalPages}
                onPageChange={(newPage) => setQueryParams((prev) => ({ ...prev, page: newPage }))}
              />
            </div>
          )}
        </Card>
      )}

      {/* Category Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Salary Rule Category' : 'New Salary Rule Category'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Category Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Basic Salary"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Category Code <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. BASIC"
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              error={formErrors.code}
              helperText="Unique uppercase identifier (e.g. BASIC, ALW, GROSS, DED, NET)"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe the purpose of this rule category..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 transition-colors"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting} className="gap-1.5">
              <Save className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Rule Category"
        message={`Are you sure you want to delete category "${categoryToDelete?.name}"? Action will fail if any salary rules are assigned to this category.`}
        confirmText="Delete Category"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
