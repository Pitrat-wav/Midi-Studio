import { test, expect } from '@playwright/test';

test.describe('App Critical Path', () => {
  test('should load the app and launch the studio', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Check for the initialization screen
    const initScreen = page.locator('.init-screen');
    await expect(initScreen).toBeVisible({ timeout: 10000 });

    // Check for the Launch Studio button
    const launchButton = page.locator('button.init-button');
    await expect(launchButton).toBeVisible();
    await expect(launchButton).toHaveText('Launch Studio');

    // Click Launch Studio
    await launchButton.click();

    // Wait for the main 3D app container to appear
    // The spinner might show up first, so we wait for the .app-3d container
    const appContainer = page.locator('.app-3d');
    await expect(appContainer).toBeVisible({ timeout: 30000 }); // Give it time to initialize audio/3D

    // Check for a key UI element in the main view (e.g., the play button)
    const playButton = page.locator('.play-button');
    await expect(playButton).toBeVisible();
  });
});
