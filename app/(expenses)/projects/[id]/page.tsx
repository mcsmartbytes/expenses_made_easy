'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface CategoryBreakdown {
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  vendor: string | null;
  is_business: boolean;
  categories: { name: string; icon: string; color: string } | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  client_name: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
  total_spent: number;
  expense_count: number;
  expenses: Expense[];
  by_category: CategoryBreakdown[];
  budget_remaining: number | null;
  budget_percentage: number | null;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProject();
  }, [resolvedParams.id]);

  async function loadProject() {
    try {
      const res = await fetch(`/api/projects/${resolvedParams.id}`);
      const data = await res.json();

      if (data.success) {
        setProject(data.data);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this project? Expenses will be unlinked but not deleted.')) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/projects?id=${resolvedParams.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        router.push('/projects');
      } else {
        alert('Failed to delete project');
      }
    } catch (error) {
      alert('Error deleting project');
    } finally {
      setDeleting(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    try {
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resolvedParams.id, status: newStatus }),
      });
      const data = await res.json();

      if (data.success) {
        setProject((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation variant="expenses" />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">Loading project...</p>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation variant="expenses" />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">Project not found</p>
          <Link href="/projects" className="block text-center text-blue-600 mt-4">
            Back to Projects
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="expenses" />
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/projects" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back to Projects
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <select
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`px-3 py-1 text-sm rounded-full font-medium border-0 cursor-pointer ${
                  project.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : project.status === 'completed'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            {project.client_name && (
              <p className="text-gray-600 mt-1">Client: {project.client_name}</p>
            )}
            {project.description && (
              <p className="text-gray-500 mt-2">{project.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Link
              href={`/expenses/new?job_id=${project.id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              + Add Expense
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className="text-2xl font-bold text-gray-900">
              ${project.total_spent.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Budget</p>
            <p className="text-2xl font-bold text-gray-900">
              {project.budget ? `$${project.budget.toLocaleString()}` : 'Not set'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Remaining</p>
            <p className={`text-2xl font-bold ${
              project.budget_remaining !== null && project.budget_remaining < 0
                ? 'text-red-600'
                : 'text-green-600'
            }`}>
              {project.budget_remaining !== null
                ? `$${project.budget_remaining.toLocaleString()}`
                : '—'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Expenses</p>
            <p className="text-2xl font-bold text-gray-900">{project.expense_count}</p>
          </div>
        </div>

        {/* Budget Progress */}
        {project.budget && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Budget Usage</span>
              <span className="font-medium">{project.budget_percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  project.budget_percentage && project.budget_percentage > 100
                    ? 'bg-red-500'
                    : project.budget_percentage && project.budget_percentage > 80
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(project.budget_percentage || 0, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
            {project.by_category.length === 0 ? (
              <p className="text-gray-500 text-sm">No expenses yet</p>
            ) : (
              <div className="space-y-3">
                {project.by_category.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span className="text-sm text-gray-700">{cat.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${cat.total.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{cat.count} expense{cat.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Expenses */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Expenses</h2>
              <Link href={`/expenses?job_id=${project.id}`} className="text-sm text-blue-600 hover:text-blue-700">
                View All →
              </Link>
            </div>
            {project.expenses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No expenses linked to this project yet.</p>
                <Link
                  href={`/expenses/new?job_id=${project.id}`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add First Expense
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {project.expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {expense.categories?.icon || '📦'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{expense.description}</p>
                        <p className="text-sm text-gray-500">
                          {expense.vendor && `${expense.vendor} · `}
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${parseFloat(String(expense.amount)).toLocaleString()}</p>
                      <p className={`text-xs ${expense.is_business ? 'text-green-600' : 'text-gray-500'}`}>
                        {expense.is_business ? 'Business' : 'Personal'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Project Details */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Project Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Start Date</p>
              <p className="font-medium">
                {project.start_date
                  ? new Date(project.start_date).toLocaleDateString()
                  : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">End Date</p>
              <p className="font-medium">
                {project.end_date
                  ? new Date(project.end_date).toLocaleDateString()
                  : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Created</p>
              <p className="font-medium">
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-medium capitalize">{project.status}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
