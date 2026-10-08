import { expect, test, type Page } from '@playwright/test';

async function createWorkout(page: Page, repSeconds = '10') {
  await page.getByRole('button', { name: 'New workout', exact: true }).click();
  await page.getByLabel('Workout name', { exact: true }).fill('Quick flow');
  await page.getByLabel('Exercise 1 name', { exact: true }).fill('Squats');
  await page.getByLabel('Exercise 1 sets', { exact: true }).fill('2');
  await page.getByLabel('Exercise 1 reps per set', { exact: true }).fill('2');
  await page.getByLabel('Exercise 1 rep time', { exact: true }).fill(repSeconds);
  await page.getByLabel('Exercise 1 rest time', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Save workout', exact: true }).click();
}

test('create, persist, edit, run, pause, navigate, exit and delete a workout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await createWorkout(page);
  await expect(page.getByRole('button', { name: 'Open Quick flow', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Edit Quick flow', exact: true }).click();
  await page.getByLabel('Workout name', { exact: true }).fill('Evening flow');
  await page.getByRole('button', { name: 'Save workout', exact: true }).click();
  await page.getByRole('button', { name: 'Open Evening flow', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Squats', exact: true })).toBeVisible();
  await expect(page.getByRole('timer')).toHaveText('00:10');
  await expect(page.getByRole('button', { name: 'Previous rep', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const pausedTime = await page.getByRole('timer').textContent();
  await page.waitForTimeout(1100);
  await expect(page.getByRole('timer')).toHaveText(pausedTime!);
  await page.getByRole('button', { name: 'Next rep', exact: true }).click();
  await expect(page.getByRole('timer')).toHaveText('00:10');
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Previous rep', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Previous rep', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Exit workout', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Exit workout', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Exit workout', exact: true }).click();
  await page.getByRole('button', { name: 'Delete Evening flow', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete workout', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open Evening flow', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Open Evening flow', exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('automatically transitions through rest, sets, and completion', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.goto('/');
  await createWorkout(page, '2');
  await page.getByRole('button', { name: 'Open Quick flow', exact: true }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.clock.runFor(2000);
  await expect(page.getByRole('timer')).toHaveAttribute('aria-label', 'Rest time remaining');
  await page.clock.runFor(4000);
  await expect(page.getByRole('timer')).toHaveAttribute('aria-label', 'Rep time remaining');
  await expect(page.getByRole('group', { name: 'Set 2 of 2', exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Rep 1 of 2', exact: true })).toBeVisible();
  await page.clock.runFor(5000);
  await expect(page.getByRole('heading', { name: 'Workout complete', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Restart workout', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
  await expect(page.getByRole('timer')).toHaveText('00:02');
  await expect(page.getByRole('button', { name: 'Previous rep', exact: true })).toBeDisabled();
});

test('invalid saved data is recoverable and remains untouched until saving', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('tempo.workouts.v1', 'broken'));
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('could not be loaded');
  expect(await page.evaluate(() => localStorage.getItem('tempo.workouts.v1'))).toBe('broken');
  await createWorkout(page);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Open Quick flow', exact: true })).toBeVisible();
});

test('uses shadcn components and stays dark even with a light system preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass('dark');
  await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(9, 9, 11)');
  await expect(page.locator('body')).toHaveCSS('color-scheme', 'dark');
  await expect(page.getByRole('button', { name: 'New workout', exact: true })).toHaveAttribute('data-slot', 'button');
  await expect(page.locator('[data-slot="card"]').first()).toBeVisible();
  await createWorkout(page);
  await expect(page.locator('[data-sonner-toast]').first()).toBeVisible();
  await expect(page.locator('[data-sonner-toaster]')).toHaveAttribute('data-sonner-theme', 'dark');
  await page.getByRole('button', { name: 'Edit Quick flow', exact: true }).click();
  await expect(page.getByLabel('Workout name', { exact: true })).toHaveAttribute('data-slot', 'input');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(9, 9, 11)');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Delete Quick flow', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveAttribute('data-slot', 'dialog-content');
  await expect(page.getByRole('dialog')).toHaveCSS('background-color', 'rgb(24, 24, 27)');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open Quick flow', exact: true }).click();
  await expect(page.locator('.runner')).toHaveCSS('background-color', 'rgb(9, 9, 11)');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('.runner')).toHaveCSS('background-color', 'rgb(9, 9, 11)');
});

test('confirmation traps keyboard focus and Escape resumes a running workout', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Full body workout', exact: true }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Exit workout', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await expect(page.locator('.timer-phase-label')).toHaveText('PAUSED');
  for (let index = 0; index < 4; index++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  // Radix defers restoring focus until after the dialog unmounts.
  await page.clock.runFor(1);
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exit workout', exact: true })).toBeFocused();
  await page.clock.runFor(1000);
  await expect(page.getByRole('timer')).toHaveText('00:19');
});

test('opening a workout waits for Start and canceling exit does not start it', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Full body workout', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next rep', exact: true })).toBeDisabled();
  await expect(page.locator('.timer-phase-label')).toHaveText('READY');
  await page.clock.runFor(60000);
  await expect(page.getByRole('timer')).toHaveText('00:20');
  await expect(page.getByRole('group', { name: 'Set 1 of 3', exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Rep 1 of 6', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Exit workout', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
  await page.clock.runFor(60000);
  await expect(page.getByRole('timer')).toHaveText('00:20');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.clock.runFor(2000);
  await expect(page.getByRole('timer')).toHaveText('00:18');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  await page.clock.runFor(30000);
  await expect(page.getByRole('timer')).toHaveText('00:18');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.getByRole('button', { name: 'Next rep', exact: true }).click();
  await page.getByRole('button', { name: 'Previous rep', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toHaveCount(0);
});
