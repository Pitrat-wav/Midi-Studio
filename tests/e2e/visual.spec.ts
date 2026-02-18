import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          transition: none !important;
          animation: none !important;
        }
      `,
    });
  });

  test('should match the initial landing page snapshot', async ({ page }) => {
    await page.goto('/');

    // Wait for the initialization screen
    const initScreen = page.locator('.init-screen');
    await expect(initScreen).toBeVisible({ timeout: 10000 });

    // Take a screenshot of the init screen
    await expect(page).toHaveScreenshot('landing-page.png', {
      maxDiffPixelRatio: 0.1,
    });
  });

  test('should match the main UI overlay snapshot', async ({ page }) => {
    await page.goto('/');
    
    // Launch the app
    await page.click('button.init-button');
    
    // Wait for the main app container
    await expect(page.locator('.app-3d')).toBeVisible({ timeout: 30000 });
    
    // Wait for the overlay to appear
    const overlay = page.locator('.control-overlay');
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // Ensure it doesn't disappear (the app auto-hides it after 3s)
    // We can hover over it to keep it, or just take the screenshot quickly
    // Or we can assert it is visible before screenshot
    
    // Take a screenshot of the overlay specifically
    await expect(overlay).toHaveScreenshot('main-overlay.png', {
      maxDiffPixelRatio: 0.1,
      timeout: 5000,
    });
  });
});
