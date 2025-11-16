#!/bin/bash

# Expense Tracker - Deploy New Features Script
# This script creates/updates all files needed for OCR and Profile features

set -e  # Exit on error

echo "🚀 Deploying Expense Tracker New Features..."
echo ""

# Check we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from your expenses_made_easy project root"
    exit 1
fi

echo "✅ Found project root"
echo ""

# Create app/api/ocr-receipt directory
echo "📁 Creating OCR API endpoint..."
mkdir -p app/api/ocr-receipt

# Create OCR API route
cat > app/api/ocr-receipt/route.ts << 'EOFOCR'
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('receipt') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Call OpenAI GPT-4 Vision API
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this receipt image and extract the following information in JSON format:
                {
                  "vendor": "merchant/vendor name",
                  "amount": "total amount as a number (no currency symbols)",
                  "date": "date in YYYY-MM-DD format",
                  "description": "brief description of purchase",
                  "items": ["list of purchased items if visible"]
                }

                If any field is not clearly visible, use null. Be precise with the amount and date.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to process receipt with AI' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Could not parse receipt data' },
        { status: 500 }
      );
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      data: extractedData,
    });

  } catch (error: any) {
    console.error('OCR processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process receipt' },
      { status: 500 }
    );
  }
}
EOFOCR

echo "✅ Created app/api/ocr-receipt/route.ts"
echo ""

# Create app/profile directory
echo "📁 Creating Profile page..."
mkdir -p app/profile

# Download or create profile page
echo "Creating app/profile/page.tsx..."

cat > app/profile/page.tsx << 'EOFPROFILE'
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

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
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
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
    }
    setLoading(false);
  }

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (data) setCategories(data);
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('categories').insert({
      ...newCategory,
      user_id: user.id,
    });

    if (!error) {
      setShowAddCategory(false);
      setNewCategory({ name: '', icon: '💰', color: '#3B82F6', is_tax_deductible: true });
      loadCategories();
    }
  }

  async function handleUpdateCategory(category: Category) {
    const { error } = await supabase
      .from('categories')
      .update({
        name: category.name,
        icon: category.icon,
        color: category.color,
        is_tax_deductible: category.is_tax_deductible,
      })
      .eq('id', category.id);

    if (!error) {
      setEditingCategory(null);
      loadCategories();
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Delete this category? Expenses using it will not be deleted.')) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (!error) {
      loadCategories();
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
EOFPROFILE

echo "✅ Created app/profile/page.tsx"
echo ""
echo "🎉 All new files created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Review the changes: git status"
echo "2. Commit and push: git add . && git commit -m 'Add OCR and profile features' && git push origin main"
echo ""
echo "🔑 OpenAI API key is already in Vercel!"
echo "✅ Done!"
