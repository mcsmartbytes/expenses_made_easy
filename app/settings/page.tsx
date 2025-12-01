'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { supabase } from '@/utils/supabase';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [mileageAutoStartSpeed, setMileageAutoStartSpeed] = useState(5);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_profiles')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      if (data?.preferences?.mileage_auto_start_speed) {
        setMileageAutoStartSpeed(data.preferences.mileage_auto_start_speed);
      }
      if (data?.preferences?.theme) {
        setTheme(data.preferences.theme);
      }
      if (data?.preferences?.primary_color) {
        setPrimaryColor(data.preferences.primary_color);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id, preferences')
        .eq('user_id', user.id)
        .single();

      const updatedPreferences = {
        ...(existingProfile?.preferences || {}),
        mileage_auto_start_speed: mileageAutoStartSpeed,
        theme,
        primary_color: primaryColor,
      };

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('user_profiles')
          .update({ preferences: updatedPreferences })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            preferences: updatedPreferences,
          });

        if (error) throw error;
      }

      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">Loading settings...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Customize your app preferences</p>
        </div>

        {/* Mileage Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Mileage Tracker Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-Start Speed Threshold
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Mileage tracking will automatically start when your vehicle reaches this speed.
              </p>

              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="10"
                  step="1"
                  value={mileageAutoStartSpeed}
                  onChange={(e) => setMileageAutoStartSpeed(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex items-center gap-2 min-w-[100px]">
                  <input
                    type="number"
                    min="5"
                    max="10"
                    value={mileageAutoStartSpeed}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 5 && val <= 10) {
                        setMileageAutoStartSpeed(val);
                      }
                    }}
                    className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center"
                  />
                  <span className="text-gray-700 font-medium">mph</span>
                </div>
              </div>

              <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                <span>5 mph (More sensitive)</span>
                <span>10 mph (Less sensitive)</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Current setting: {mileageAutoStartSpeed} mph</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Lower values start tracking sooner (e.g., 5 mph = starts in parking lots).
                Higher values reduce false starts (e.g., 10 mph = highway driving only).
              </p>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={() => setTheme('light')} />
                  <span>Light</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={() => setTheme('dark')} />
                  <span>Dark</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div className="flex gap-2 flex-wrap">
                {['#3B82F6','#EF4444','#10B981','#8B5CF6','#F97316','#EC4899','#F59E0B','#14B8A6'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPrimaryColor(c)}
                    className={`w-8 h-8 rounded-full border-2 ${primaryColor === c ? 'border-blue-600' : 'border-gray-300'}`}
                    style={{ backgroundColor: c }}
                    aria-label={`Select ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          {message && (
            <p
              className={`text-sm font-medium ${
                message.includes('Error') ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {message}
            </p>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/mileage"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Back to Mileage Tracker
          </Link>
        </div>
      </main>
    </div>
  );
}
