import { test, expect } from '@playwright/test';

test.describe('StudyLock App', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // ===== Page Load =====

  test('should load the main page', async ({ page }) => {
    await expect(page).toHaveTitle(/StudyLock/);
  });

  test('should display header with logo and online count', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'StudyLock' })).toBeVisible();
    await expect(page.getByText(/online/)).toBeVisible();
  });

  // ===== Study Room Canvas =====

  test('should render the study room canvas', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    // Canvas should have non-zero dimensions
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);
  });

  test('should show loading state then canvas', async ({ page }) => {
    // Canvas should eventually be visible (after assets load)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('should display floor name and user count', async ({ page }) => {
    await expect(page.locator('h2').getByText('1F Classic Library')).toBeVisible();
    await expect(page.getByText(/on this floor/)).toBeVisible();
  });

  // ===== Zoom Controls =====

  test('should have zoom in and zoom out buttons', async ({ page }) => {
    const zoomIn = page.getByRole('button', { name: '+' });
    const zoomOut = page.getByRole('button', { name: '-' });
    await expect(zoomIn).toBeVisible();
    await expect(zoomOut).toBeVisible();
  });

  test('zoom buttons should be clickable', async ({ page }) => {
    const zoomIn = page.getByRole('button', { name: '+' });
    await zoomIn.click();
    // Should not crash
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  // ===== Timer =====

  test('should display timer in idle state', async ({ page }) => {
    await expect(page.getByText('25:00')).toBeVisible();
    await expect(page.getByText('▶ Start')).toBeVisible();
  });

  test('should start timer on click', async ({ page }) => {
    await page.getByText('▶ Start').click();
    // Timer should switch to focus mode
    await expect(page.getByText('Focusing')).toBeVisible();
    // Should show pause and break buttons
    await expect(page.getByText('⏸ Pause')).toBeVisible();
    await expect(page.getByText('☕ Break')).toBeVisible();
  });

  test('should pause timer', async ({ page }) => {
    await page.getByText('▶ Start').click();
    await page.getByText('⏸ Pause').click();
    await expect(page.getByText('▶ Resume')).toBeVisible();
  });

  test('should reset timer', async ({ page }) => {
    await page.getByText('▶ Start').click();
    await page.getByRole('button', { name: '↺' }).click();
    await expect(page.getByText('25:00')).toBeVisible();
    await expect(page.getByText('Ready')).toBeVisible();
  });

  test('break button should switch to cafe or garden', async ({ page }) => {
    await page.getByText('▶ Start').click();
    await page.getByText('☕ Break').click();
    // Should show break room
    await expect(page.getByText('On Break')).toBeVisible();
    await expect(page.getByText('📚 Back to Study')).toBeVisible();
    // Room should be cafe or garden
    const cafeVisible = await page.getByText('Cafe Lounge').isVisible().catch(() => false);
    const gardenVisible = await page.getByText('Outdoor Garden').isVisible().catch(() => false);
    expect(cafeVisible || gardenVisible).toBeTruthy();
  });

  test('back to study should return to library', async ({ page }) => {
    await page.getByText('▶ Start').click();
    await page.getByText('☕ Break').click();
    await page.getByText('📚 Back to Study').click();
    await expect(page.locator('h2').getByText('1F Classic Library')).toBeVisible();
    await expect(page.getByText('Focusing')).toBeVisible();
  });

  // ===== Sound System =====

  test('should display sound options', async ({ page }) => {
    await expect(page.getByText('Sound')).toBeVisible();
    await expect(page.getByText('Lofi')).toBeVisible();
    await expect(page.getByText('Rain')).toBeVisible();
    await expect(page.getByText('Ocean')).toBeVisible();
    await expect(page.getByText('Birds')).toBeVisible();
    await expect(page.getByText('Fire')).toBeVisible();
    await expect(page.getByText('Cabin')).toBeVisible();
  });

  test('should show mini player when sound selected', async ({ page }) => {
    await page.getByText('Lofi').click();
    // Mini player should appear with controls
    await expect(page.getByText('⏸')).toBeVisible();
    await expect(page.getByText('◀◀')).toBeVisible();
    await expect(page.getByText('▶▶')).toBeVisible();
  });

  test('should toggle sound off when clicking same option', async ({ page }) => {
    await page.getByText('Rain').click();
    // Mini player visible
    await expect(page.getByRole('button', { name: '⏸' })).toBeVisible();
    // Click again to deselect
    await page.getByText('Rain').click();
    // Mini player should disappear
    await expect(page.getByRole('button', { name: '⏸' })).not.toBeVisible();
  });

  test('mute button should work', async ({ page }) => {
    await expect(page.getByText('🔊')).toBeVisible();
    await page.getByText('🔊').click();
    await expect(page.getByText('🔇')).toBeVisible();
  });

  // ===== Room Navigation =====

  test('should display floor list', async ({ page }) => {
    await expect(page.getByText('Floors')).toBeVisible();
    await expect(page.getByRole('button', { name: /1F Classic Library/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /14F Dark Room/ })).toBeVisible();
  });

  test('should switch rooms when clicking floor', async ({ page }) => {
    await page.getByText(/2F Modern Study/).click();
    await expect(page.locator('h2').getByText(/2F Modern Study/)).toBeVisible();
  });

  test('should show different floor themes', async ({ page }) => {
    // Start on 1F
    await expect(page.locator('h2').getByText(/1F Classic Library/)).toBeVisible();
    // Switch to 5F
    await page.getByText(/5F Night Owl/).click();
    await expect(page.locator('h2').getByText(/5F Night Owl/)).toBeVisible();
    // Canvas should still render
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('break rooms should be disabled when not on break', async ({ page }) => {
    // Cafe and Garden buttons should be disabled
    const cafeBtn = page.getByRole('button', { name: /Cafe Lounge/ });
    await expect(cafeBtn).toBeDisabled();
    const gardenBtn = page.getByRole('button', { name: /Outdoor Garden/ });
    await expect(gardenBtn).toBeDisabled();
  });

  test('study floors should be disabled during break', async ({ page }) => {
    await page.getByText('▶ Start').click();
    await page.getByText('☕ Break').click();
    // Regular floor buttons should be disabled
    const floor1 = page.getByRole('button', { name: /1F Classic Library/ });
    await expect(floor1).toBeDisabled();
  });

  // ===== Responsive =====

  test('should display footer text', async ({ page }) => {
    await expect(page.getByText('No login required')).toBeVisible();
    await expect(page.getByText('studylock.dev')).toBeVisible();
  });
});
