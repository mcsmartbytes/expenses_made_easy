import { test, expect } from '@playwright/test';

test.describe('Authentication Pages', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/auth/login');

    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('signup page loads correctly', async ({ page }) => {
    await page.goto('/auth/signup');

    // Check for signup form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up|create account/i })).toBeVisible();
  });

  test('login form shows validation error for invalid email', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill in invalid email
    await page.locator('input[type="email"]').fill('invalid-email');
    await page.locator('input[type="password"]').fill('password123');

    // Submit form
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Should show validation error or not submit successfully
    // (exact behavior depends on implementation)
    await expect(page).toHaveURL(/login/);
  });

  test('login page has link to signup', async ({ page }) => {
    await page.goto('/auth/login');

    // Look for signup link
    const signupLink = page.getByRole('link', { name: /sign up|create account|register/i });
    await expect(signupLink).toBeVisible();
  });

  test('signup page has link to login', async ({ page }) => {
    await page.goto('/auth/signup');

    // Look for login link
    const loginLink = page.getByRole('link', { name: /sign in|log in|already have/i });
    await expect(loginLink).toBeVisible();
  });
});

test.describe('Protected Routes Redirect', () => {
  test('dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/expense-dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login|signin/);
  });

  test('expenses page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/expenses');

    // Should redirect to login
    await expect(page).toHaveURL(/login|signin/);
  });

  test('reports page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/reports');

    // Should redirect to login
    await expect(page).toHaveURL(/login|signin/);
  });
});
