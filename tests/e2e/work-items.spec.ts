// Copyright 2026 EPAM Systems, Inc. ("EPAM")
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * E2E tests for: tests/features/work-items.feature
 *
 * Route under test:
 *   /work-items  →  src/pages/workItems/WorkItemsListPage.tsx
 *
 * The page renders:
 *   - A sidebar (<aside>) with Type / Priority / Status filter dropdowns
 *     (src/pages/workItems/components/WorkItemFilters.tsx)
 *   - A PageLayout with a "Create Work Item" button and a <table>
 *   - A Popup (PrimeReact Dialog) with the work item form
 *     (src/pages/workItems/components/WorkItemForm/index.tsx)
 *
 * API endpoints:
 *   GET  /api/v1/work-items?priority=<val>&page=0&per_page=20  →  list
 *   POST /api/v1/work-items                                    →  create
 */

import { test, expect } from './fixtures/auth'

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

const NOW = '2026-01-15T10:00:00Z'

const ITEM_HIGH: WorkItemShape = {
  id: 'wi-high',
  title: 'Fix critical login bug',
  type: 'Bug',
  priority: 'High',
  status: 'Open',
  createdAt: NOW,
  updatedAt: NOW,
}

const ITEM_MEDIUM: WorkItemShape = {
  id: 'wi-medium',
  title: 'Add dark mode toggle',
  type: 'Feature',
  priority: 'Medium',
  status: 'Open',
  createdAt: NOW,
  updatedAt: NOW,
}

const NEW_ITEM: WorkItemShape = {
  id: 'wi-new',
  title: 'Implement search feature',
  type: 'Task',
  priority: 'High',
  status: 'Open',
  createdAt: NOW,
  updatedAt: NOW,
}

/** Minimal shape needed by WorkItemsListPage's Table */
interface WorkItemShape {
  id: string
  title: string
  type: string
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  assignee?: string
}

function makeListResponse(items: WorkItemShape[], total = items.length) {
  return {
    items,
    pagination: { page: 0, perPage: 20, totalPages: Math.ceil(total / 20), totalCount: total },
  }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function waitForPageReady(page: Parameters<typeof test>[1]['page']) {
  await expect(page.getByRole('heading', { level: 1, name: 'Work Items' })).toBeVisible()
}

// ---------------------------------------------------------------------------
// Scenario: Create a work item
// ---------------------------------------------------------------------------

test('Create a work item — item appears in the work items list', async ({ authedPage: page }) => {
  // Initial list is empty; after creation the list returns the new item.
  let createdItem: WorkItemShape | null = null

  await page.route('**/api/v1/work-items', (route) => {
    if (route.request().method() === 'POST') {
      // Simulate backend creating the item and returning it
      createdItem = NEW_ITEM
      return route.fulfill({ status: 201, json: NEW_ITEM })
    }
    // GET: return the already-created item if available, otherwise empty list
    return route.fulfill({
      json: createdItem ? makeListResponse([createdItem]) : makeListResponse([]),
    })
  })

  // Also handle requests with query params (page=0&per_page=20 etc.)
  await page.route('**/api/v1/work-items?**', (route) => {
    return route.fulfill({
      json: createdItem ? makeListResponse([createdItem]) : makeListResponse([]),
    })
  })

  await page.goto('/work-items')
  await waitForPageReady(page)

  // Open the create form
  // WorkItemsListPage renders a primary "Create Work Item" button in the header
  await page.getByRole('button', { name: 'Create Work Item' }).click()

  // Wait for the PrimeReact Dialog to open (Popup component)
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Create Work Item')).toBeVisible()

  // Fill in the title field.
  // Input component wraps <input> inside a <label>, so getByLabel resolves correctly.
  await dialog.getByLabel('Title').fill(NEW_ITEM.title)

  // Select Priority = "High".
  // The form has three comboboxes in order: Type (0), Priority (1), Status (2).
  // Default values: Task / Medium / Open.
  await dialog.getByRole('combobox').nth(1).click()
  await page.getByRole('option', { name: 'High' }).click()

  // Submit the form ("Create" button inside the dialog)
  await dialog.getByRole('button', { name: 'Create' }).click()

  // Dialog should close after successful submission
  await expect(dialog).not.toBeVisible()

  // The new work item must now appear in the table
  // WorkItemsListPage renders a <table> (src/components/Table)
  const table = page.getByRole('table')
  const newRow = table.getByRole('row').filter({ hasText: NEW_ITEM.title })
  await expect(newRow).toBeVisible()
  await expect(newRow).toContainText(NEW_ITEM.priority)
})

// ---------------------------------------------------------------------------
// Scenario: Filter work items by priority
// ---------------------------------------------------------------------------

test('Filter work items by High priority — only high priority items are shown', async ({
  authedPage: page,
}) => {
  // Mixed list for the initial (unfiltered) fetch
  await page.route('**/api/v1/work-items**', (route) => {
    const url = new URL(route.request().url())
    const priority = url.searchParams.get('priority')

    if (priority === 'High') {
      // After the filter is applied the API is called with priority=High
      return route.fulfill({ json: makeListResponse([ITEM_HIGH]) })
    }

    // Initial unfiltered fetch returns both items
    return route.fulfill({ json: makeListResponse([ITEM_HIGH, ITEM_MEDIUM]) })
  })

  await page.goto('/work-items')
  await waitForPageReady(page)

  // Both items should be visible in the unfiltered state
  const table = page.getByRole('table')
  await expect(table.getByRole('row').filter({ hasText: ITEM_HIGH.title })).toBeVisible()
  await expect(table.getByRole('row').filter({ hasText: ITEM_MEDIUM.title })).toBeVisible()

  // Open the Priority filter dropdown from the sidebar.
  // WorkItemFilters renders: Type (combobox 0), Priority (combobox 1), Status (combobox 2)
  // inside an <aside> element (Sidebar component).
  const sidebar = page.locator('aside')
  await sidebar.getByRole('combobox').nth(1).click()

  // Select "High" from the opened PrimeReact Dropdown panel.
  // The panel is appended to <body> so the option is outside the sidebar.
  await page.getByRole('option', { name: 'High' }).click()

  // After the filter is applied, only the High-priority item must be visible
  await expect(table.getByRole('row').filter({ hasText: ITEM_HIGH.title })).toBeVisible()
  await expect(table.getByRole('row').filter({ hasText: ITEM_MEDIUM.title })).not.toBeVisible()
})
