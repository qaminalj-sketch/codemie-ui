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

import { test as base, expect, Page } from '@playwright/test'

const MOCK_USER = {
  user_id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  username: 'testuser',
  is_admin: false,
  is_maintainer: false,
  is_auditor: false,
  user_type: 'user',
  applications: [],
  applications_admin: [],
  projects: [],
}

/**
 * Registers route handlers for every API call the bootstrap sequence makes so
 * that tests can render the app without a real backend.  Routes are registered
 * in broad-to-specific order; because Playwright processes routes LIFO
 * (last-in-first-out), the most-specific handlers below always win.
 */
export async function mockBootstrapRoutes(page: Page): Promise<void> {
  // Catch-all fallback — keeps any unhandled bootstrap request from hanging.
  // Registered first so it is processed last (LIFO).
  await page.route('**/api/**', (route) => route.fulfill({ status: 200, json: {} }))

  // Specific bootstrap endpoints (registered after the fallback → tried first).
  await page.route('**/api/v1/config', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/v1/user', (route) => route.fulfill({ json: MOCK_USER }))
  await page.route('**/api/v1/user/data', (route) => route.fulfill({ json: {} }))
  await page.route('**/api/v1/preferences/**', (route) => route.fulfill({ json: {} }))
  await page.route('**/api/v1/user/profile-settings/**', (route) => route.fulfill({ json: {} }))
  await page.route('**/api/v1/assistants/pinned', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/v1/assistants/categories', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/v1/skills/categories', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/v1/chats/**', (route) =>
    route.fulfill({ json: { items: [], total: 0, folders: [] } })
  )
  await page.route('**/api/v1/chats', (route) =>
    route.fulfill({ json: { items: [], total: 0, folders: [] } })
  )
  await page.route('**/api/v1/info', (route) => route.fulfill({ json: {} }))
}

/**
 * Extended Playwright test with auth mocking pre-applied.
 * Use this instead of the base `test` in every E2E spec.
 */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await mockBootstrapRoutes(page)
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture `use`, not a React hook
    await use(page)
  },
})

export { expect }
