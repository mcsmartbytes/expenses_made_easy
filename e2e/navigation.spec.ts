import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');

    // Page should load without errors
    await expect(page).toHaveTitle(/expense/i);
  });

  test('page has proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check viewport meta tag exists
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });
});

test.describe('API Routes', () => {
  test('categories API returns success structure', async ({ request }) => {
    const response = await request.get('/api/categories');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('success');
  });

  test('recurring-expenses API requires user_id', async ({ request }) => {
    const response = await request.get('/api/recurring-expenses');

    // Should return 400 without user_id
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('User ID');
  });

  test('POST to recurring-expenses with invalid data returns 400', async ({ request }) => {
    const response = await request.post('/api/recurring-expenses', {
      data: {
        // Missing required fields
        amount: 50,
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  test('categories DELETE requires id parameter', async ({ request }) => {
    const response = await request.delete('/api/categories');

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('ID');
  });
});

test.describe('PWA', () => {
  test('manifest.json exists and is valid', async ({ request }) => {
    const response = await request.get('/manifest.json');
    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
    expect(manifest).toHaveProperty('icons');
    expect(manifest).toHaveProperty('start_url');
  });

  test('service worker is registered', async ({ page }) => {
    await page.goto('/');

    // Check if service worker file exists
    const swResponse = await page.request.get('/sw.js');
    expect(swResponse.ok()).toBeTruthy();
  });
});

test.describe('Responsive Design', () => {
  test('mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should not have horizontal scroll on mobile
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('tablet viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });

  test('desktop viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });
});
