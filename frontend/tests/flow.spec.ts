import { test, expect } from '@playwright/test';

test.describe('ProperSats Core Flow', () => {
  test.beforeEach(async ({ page }) => {
    // In a real E2E, we'd point to the dev server
    await page.goto('http://localhost:5173');
  });

  test('Buyer can view plots and see payment modal', async ({ page }) => {
    await expect(page.getByText('Secure your land with Bitcoin')).toBeVisible();
    
    // Check for plot cards
    const buyButtons = page.getByRole('button', { name: /Buy with Lightning/i });
    await expect(buyButtons.first()).toBeVisible();
    
    // Click Buy (this would trigger backend call)
    await buyButtons.first().click();
    
    // Check for modal
    await expect(page.getByText('Confirm Purchase')).toBeVisible();
  });

  test('Stakeholder Dashboard displays pending escrows', async ({ page }) => {
    // Switch to Dashboard
    await page.getByRole('button', { name: 'Dashboard' }).click();
    
    // Switch role to Surveyor
    await page.getByRole('combobox').selectOption('surveyor');
    
    await expect(page.getByText('Managing escrow for SURVEYOR')).toBeVisible();
  });
});
