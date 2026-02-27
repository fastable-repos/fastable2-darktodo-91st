import { test, expect } from '@playwright/test'
import { captureScreenshot, assertNoConsoleErrors } from './helpers'

test.beforeEach(async ({ page }) => {
  // Clear localStorage before each test for a clean slate
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

// ─── Happy path: Add a todo ───────────────────────────────────────────────────
test('Happy path: add a todo by pressing Enter', async ({ page }) => {
  const checkErrors = assertNoConsoleErrors(page)

  const input = page.getByTestId('todo-input')
  await input.fill('Buy groceries')
  await input.press('Enter')

  const items = page.getByTestId('todo-item')
  await expect(items).toHaveCount(1)
  await expect(items.first()).toContainText('Buy groceries')

  // checkbox is unchecked (no strikethrough)
  const span = items.first().locator('span')
  await expect(span).not.toHaveClass(/line-through/)

  // delete button is present
  await expect(items.first().getByTestId('delete-button')).toBeVisible()

  checkErrors()
})

test('Happy path: add a todo by clicking Add button', async ({ page }) => {
  const input = page.getByTestId('todo-input')
  await input.fill('Read a book')
  await page.getByTestId('add-button').click()

  await expect(page.getByTestId('todo-item')).toHaveCount(1)
  await expect(page.getByTestId('todo-item').first()).toContainText('Read a book')
})

// ─── Happy path: Mark complete ────────────────────────────────────────────────
test('Happy path: mark a todo as complete', async ({ page }) => {
  // Add two todos
  const input = page.getByTestId('todo-input')
  await input.fill('Task one')
  await input.press('Enter')
  await input.fill('Task two')
  await input.press('Enter')

  // Active count should be 2
  await expect(page.getByTestId('active-count')).toHaveText('2 items left')

  // Click the checkbox of the first todo
  await page.getByTestId('todo-checkbox').first().click()

  // Text should be struck through
  const firstItemSpan = page.getByTestId('todo-item').first().locator('span')
  await expect(firstItemSpan).toHaveClass(/line-through/)

  // Count should decrement to 1
  await expect(page.getByTestId('active-count')).toHaveText('1 item left')
})

// ─── Happy path: Delete a todo ────────────────────────────────────────────────
test('Happy path: delete a todo', async ({ page }) => {
  const input = page.getByTestId('todo-input')
  await input.fill('Delete me')
  await input.press('Enter')

  await expect(page.getByTestId('todo-item')).toHaveCount(1)

  await page.getByTestId('delete-button').first().click()

  await expect(page.getByTestId('todo-item')).toHaveCount(0)
  await expect(page.getByTestId('empty-state')).toBeVisible()
})

// ─── Happy path: Dark/light mode toggle ──────────────────────────────────────
test('Happy path: toggle dark mode on and off', async ({ page }) => {
  const app = page.getByTestId('app')
  const toggle = page.getByTestId('theme-toggle')

  // Default is dark mode
  await expect(app).toHaveAttribute('data-darkmode', 'true')

  // Switch to light mode
  await toggle.click()
  await expect(app).toHaveAttribute('data-darkmode', 'false')

  // Switch back to dark mode
  await toggle.click()
  await expect(app).toHaveAttribute('data-darkmode', 'true')
})

// ─── Filter behavior ─────────────────────────────────────────────────────────
test('Filter: Active and Completed filters work correctly', async ({ page }) => {
  const input = page.getByTestId('todo-input')

  // Add three todos
  await input.fill('Active task 1')
  await input.press('Enter')
  await input.fill('Active task 2')
  await input.press('Enter')
  await input.fill('Done task')
  await input.press('Enter')

  // Complete the third todo
  await page.getByTestId('todo-checkbox').nth(2).click()

  // All filter — see all 3
  await page.getByTestId('filter-all').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(3)

  // Active filter — see only 2 incomplete
  await page.getByTestId('filter-active').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(2)
  await expect(page.getByTestId('todo-item').first()).toContainText('Active task 1')

  // Completed filter — see only the done one
  await page.getByTestId('filter-completed').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(1)
  await expect(page.getByTestId('todo-item').first()).toContainText('Done task')

  // Back to All
  await page.getByTestId('filter-all').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(3)
})

// ─── Edge case: Empty input ────────────────────────────────────────────────────
test('Edge case: submitting an empty input adds no todo', async ({ page }) => {
  // Press Enter with no text
  await page.getByTestId('todo-input').press('Enter')
  await expect(page.getByTestId('todo-item')).toHaveCount(0)

  // Click Add with blank text
  await page.getByTestId('add-button').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(0)

  // Empty state message should be visible
  await expect(page.getByTestId('empty-state')).toBeVisible()
})

// ─── Edge case: Clear Completed ───────────────────────────────────────────────
test('Edge case: clear completed removes only completed todos', async ({ page }) => {
  const input = page.getByTestId('todo-input')

  // Add three todos
  await input.fill('Keep me 1')
  await input.press('Enter')
  await input.fill('Delete me 1')
  await input.press('Enter')
  await input.fill('Delete me 2')
  await input.press('Enter')

  // Complete todos 2 and 3
  await page.getByTestId('todo-checkbox').nth(1).click()
  await page.getByTestId('todo-checkbox').nth(2).click()

  await expect(page.getByTestId('todo-item')).toHaveCount(3)

  // Clear completed
  await page.getByTestId('clear-completed').click()

  // Only 1 active todo remains
  await expect(page.getByTestId('todo-item')).toHaveCount(1)
  await expect(page.getByTestId('todo-item').first()).toContainText('Keep me 1')
})

// ─── Data persistence ─────────────────────────────────────────────────────────
test('Data persistence: todos and dark mode survive page refresh', async ({ page }) => {
  const input = page.getByTestId('todo-input')

  // Add a todo
  await input.fill('Persisted task')
  await input.press('Enter')

  // Enable light mode (toggle away from default dark)
  await page.getByTestId('theme-toggle').click()
  await expect(page.getByTestId('app')).toHaveAttribute('data-darkmode', 'false')

  // Reload the page
  await page.reload()

  // Todo should still be there
  await expect(page.getByTestId('todo-item')).toHaveCount(1)
  await expect(page.getByTestId('todo-item').first()).toContainText('Persisted task')

  // Light mode should be preserved
  await expect(page.getByTestId('app')).toHaveAttribute('data-darkmode', 'false')
})

// ─── Screenshots ──────────────────────────────────────────────────────────────
test('Screenshot: dark mode main screen', async ({ page }) => {
  const input = page.getByTestId('todo-input')

  // Seed some todos
  await input.fill('Buy groceries')
  await input.press('Enter')
  await input.fill('Read a book')
  await input.press('Enter')
  await input.fill('Go for a run')
  await input.press('Enter')

  // Complete one
  await page.getByTestId('todo-checkbox').nth(1).click()

  // Should be in dark mode by default
  await expect(page.getByTestId('app')).toHaveAttribute('data-darkmode', 'true')

  await captureScreenshot(page, 'dark-mode-main')
})

test('Screenshot: light mode active filter view', async ({ page }) => {
  const input = page.getByTestId('todo-input')

  // Switch to light mode
  await page.getByTestId('theme-toggle').click()

  // Add todos
  await input.fill('Active task')
  await input.press('Enter')
  await input.fill('Another active')
  await input.press('Enter')
  await input.fill('Completed task')
  await input.press('Enter')

  // Complete the last one
  await page.getByTestId('todo-checkbox').nth(2).click()

  // Filter to Active
  await page.getByTestId('filter-active').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(2)

  await captureScreenshot(page, 'light-mode-active-filter')
})

test('Screenshot: empty state', async ({ page }) => {
  // No todos — app should show empty state message
  await expect(page.getByTestId('empty-state')).toBeVisible()
  await expect(page.getByTestId('empty-state')).toContainText('No todos yet')

  await captureScreenshot(page, 'empty-state')
})
