'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { INDUSTRY_CATEGORIES, IndustryKey } from '@/utils/industryCategories';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_tax_deductible: boolean;
}

interface UserProfile {
  email: string;
  created_at: string;
  industry?: string;
  business_name?: string;
  preferences?: any;
}

const INDUSTRIES: { key: IndustryKey; label: string }[] = [
  { key: 'real_estate', label: 'Real Estate' },
  { key: 'construction', label: 'Construction' },
  { key: 'healthcare', label: 'Healthcare' },
  { key: 'consulting', label: 'Consulting' },
  { key: 'retail', label: 'Retail' },
  { key: 'restaurant', label: 'Restaurant / Food Service' },
  { key: 'technology', label: 'Technology' },
  { key: 'transportation', label: 'Transportation / Logistics' },
  { key: 'creative', label: 'Creative / Design' },
  { key: 'legal', label: 'Legal' },
  { key: 'accounting', label: 'Accounting / Finance' },
  { key: 'fitness', label: 'Fitness / Wellness' },
  { key: 'photography', label: 'Photography / Videography' },
  { key: 'other', label: 'Other' },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryKey | ''>('');
  const [businessName, setBusinessName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [preferences, setPreferences] = useState<any>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [creatingCategories, setCreatingCategories] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '💰',
    color: '#3B82F6',
    is_tax_deductible: true,
  });

  useEffect(() => {
    loadProfile();
    loadCategories();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setProfile({
        email: user.email || '',
        created_at: user.created_at,
      });

      // Load user profile with industry
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('industry, business_name, preferences')
        .eq('user_id', user.id)
        .single();

      if (userProfile) {
        setSelectedIndustry((userProfile.industry as IndustryKey) || '');
        setBusinessName(userProfile.business_name || '');
        setPreferences(userProfile.preferences || {});
        const branding = (userProfile.preferences || {}).branding || {};
        setLogoUrl(branding.logo_url || '');
        setCompanyEmail(branding.company_email || '');
        setCompanyPhone(branding.company_phone || '');
        setCompanyAddress(branding.company_address || '');
        setCompanyWebsite(branding.company_website || '');
      }
    }
    setLoading(false);
  }

  async function loadCategories() {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.success && result.data) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';

      // Check if profile exists
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      const branding = {
        logo_url: logoUrl || null,
        company_email: companyEmail || null,
        company_phone: companyPhone || null,
        company_address: companyAddress || null,
        company_website: companyWebsite || null,
      };
      const newPrefs = { ...(preferences || {}), branding };

      if (existing) {
        const { error } = await supabase
          .from('user_profiles')
          .update({ industry: selectedIndustry, business_name: businessName, preferences: newPrefs })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_profiles')
          .insert({ user_id: userId, industry: selectedIndustry, business_name: businessName, preferences: newPrefs });
        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Profile saved successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save profile' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleCreateIndustryCategories() {
    if (!selectedIndustry) return;

    setCreatingCategories(true);
    setMessage(null);

    try {
      const industryCategories = INDUSTRY_CATEGORIES[selectedIndustry];
      if (!industryCategories || industryCategories.length === 0) {
        setMessage({ type: 'error', text: 'No predefined categories for this industry' });
        return;
      }

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: industryCategories }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      await loadCategories();
      setMessage({ type: 'success', text: `Added ${industryCategories.length} industry-specific categories!` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create categories' });
    } finally {
      setCreatingCategories(false);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: [newCategory] }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      setShowAddCategory(false);
      setNewCategory({ name: '', icon: '💰', color: '#3B82F6', is_tax_deductible: true });
      loadCategories();
      setMessage({ type: 'success', text: 'Category added!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to add category' });
    }
  }

  async function handleUpdateCategory(category: Category) {
    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
          is_tax_deductible: category.is_tax_deductible,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setEditingCategory(null);
        loadCategories();
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Delete this category? Expenses using it will not be deleted.')) return;

    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        loadCategories();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  }

  const commonIcons = ['💰', '🍽️', '✈️', '🚗', '🏠', '💡', '📎', '👔', '🛡️', '📢', '🎉', '🎯', '📱', '💻', '🏥', '🎓'];
  const commonColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Teal', value: '#14B8A6' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
            <Link href="/expense-dashboard" className="text-blue-600 hover:text-blue-700">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{profile?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Member Since</label>
              <p className="text-gray-900">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Business Profile Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Business Profile</h2>
          <p className="text-gray-600 mb-6">Select your industry to get relevant expense categories pre-loaded.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your business name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value as IndustryKey)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select your industry...</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind.key} value={ind.key}>{ind.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Email</label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Phone</label>
                <input
                  type="text"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Website</label>
                <input
                  type="url"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
                <textarea
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  rows={3}
                  placeholder="Street, City, State, ZIP"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {selectedIndustry && INDUSTRY_CATEGORIES[selectedIndustry]?.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Available categories for {INDUSTRIES.find(i => i.key === selectedIndustry)?.label}:</h4>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_CATEGORIES[selectedIndustry].map((cat, idx) => (
                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm" style={{ backgroundColor: cat.color + '20', color: cat.color }}>
                      {cat.icon} {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>

              {selectedIndustry && INDUSTRY_CATEGORIES[selectedIndustry]?.length > 0 && (
                <button
                  onClick={handleCreateIndustryCategories}
                  disabled={creatingCategories}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
                >
                  {creatingCategories ? 'Creating...' : `Add ${INDUSTRY_CATEGORIES[selectedIndustry].length} Industry Categories`}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Expense Categories</h2>
            <button
              onClick={() => setShowAddCategory(!showAddCategory)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              {showAddCategory ? 'Cancel' : '+ Add Category'}
            </button>
          </div>

          {showAddCategory && (
            <form onSubmit={handleAddCategory} className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold mb-3">Create New Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Groceries"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Icon</label>
                  <div className="flex gap-2 flex-wrap">
                    {commonIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewCategory({ ...newCategory, icon })}
                        className={`w-10 h-10 text-xl rounded-lg border-2 transition ${
                          newCategory.icon === icon ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {commonColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewCategory({ ...newCategory, color: color.value })}
                        className={`w-10 h-10 rounded-lg border-2 transition ${
                          newCategory.color === color.value ? 'border-gray-900 ring-2 ring-gray-400' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      checked={newCategory.is_tax_deductible}
                      onChange={(e) => setNewCategory({ ...newCategory, is_tax_deductible: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium">Tax Deductible</span>
                  </label>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Add Category
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                {editingCategory?.id === category.id ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      className="px-3 py-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      value={editingCategory.icon}
                      onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                      className="px-3 py-2 border rounded-lg text-center"
                      maxLength={2}
                    />
                    <input
                      type="color"
                      value={editingCategory.color}
                      onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                      className="h-10 w-20 border rounded-lg"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateCategory(editingCategory)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: category.color + '20' }}
                      >
                        {category.icon}
                      </div>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <div className="flex gap-2 text-xs text-gray-500">
                          <span style={{ color: category.color }}>●</span>
                          {category.is_tax_deductible && <span className="text-green-600">Tax Deductible</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
