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
 * E2E tests for: tests/features/shopping-cart.feature
 *
 * Routes under test:
 *   /products  →  src/pages/shopping/ProductListPage.tsx
 *   /cart      →  src/pages/shopping/ShoppingCartPage.tsx
 *
 * Cart state is persisted to localStorage under the key 'shopping_cart'
 * (see src/constants/shoppingCart.ts and src/utils/cartStorage.ts).
 * Adding an item calls GET /api/v1/products/:id to fetch product details before
 * inserting the CartItem (see src/store/shoppingCart.ts).
 */

import { test, expect } from './fixtures/auth'

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

const PRODUCT_A = {
  id: 'prod-a',
  name: 'Widget Alpha',
  description: 'A reliable widget',
  price: 12.99,
  available: true,
}

const PRODUCT_B = {
  id: 'prod-b',
  name: 'Gadget Beta',
  description: 'A handy gadget',
  price: 8.5,
  available: true,
}

/** CartItem shape stored in localStorage (src/types/entity/shoppingCart.ts) */
const cartItemA = {
  productId: PRODUCT_A.id,
  name: PRODUCT_A.name,
  price: PRODUCT_A.price,
  quantity: 1,
  available: true,
}

const cartItemB = {
  productId: PRODUCT_B.id,
  name: PRODUCT_B.name,
  price: PRODUCT_B.price,
  quantity: 2,
  available: true,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Waits for the app-level spinner to disappear and the page heading to appear. */
async function waitForPageReady(page: Parameters<typeof test>[1]['page'], heading: string) {
  // The App component shows a Spinner (aria-label="Loading") until the user
  // and config are both loaded.  The page heading confirms the route rendered.
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
}

// ---------------------------------------------------------------------------
// Scenario: Add product to cart
// ---------------------------------------------------------------------------

test('Add product to cart — product appears in cart and count increases by 1', async ({
  authedPage: page,
}) => {
  // Mock: list of products
  await page.route('**/api/v1/products**', (route) =>
    route.fulfill({
      json: { items: [PRODUCT_A, PRODUCT_B], total: 2 },
    })
  )

  // Mock: single product fetch (triggered by shoppingCartStore.addToCart)
  await page.route(`**/api/v1/products/${PRODUCT_A.id}`, (route) =>
    route.fulfill({ json: PRODUCT_A })
  )

  await page.goto('/products')
  await waitForPageReady(page, 'Products')

  // Verify the product card is visible
  await expect(page.getByText(PRODUCT_A.name)).toBeVisible()

  // Click "Add to Cart" for Widget Alpha
  await page.getByRole('button', { name: `Add ${PRODUCT_A.name} to cart` }).click()

  // Navigate to the cart page to verify the item was added
  await page.goto('/cart')
  await waitForPageReady(page, 'Shopping Cart')

  // The product should now appear as a CartItem
  await expect(page.getByText(PRODUCT_A.name)).toBeVisible()

  // There should be exactly one cart item row (quantity badge reads "1")
  await expect(page.getByLabel(`Quantity: 1`)).toBeVisible()
})

// ---------------------------------------------------------------------------
// Scenario: Remove product from cart
// ---------------------------------------------------------------------------

test('Remove product from cart — cart becomes empty', async ({ authedPage: page }) => {
  // Seed cart with one item via localStorage before the app initialises its
  // Valtio store (loadCartFromStorage runs on module import).
  await page.addInitScript((cartItem) => {
    try {
      localStorage.setItem('shopping_cart', JSON.stringify([cartItem]))
    } catch {
      // ignore in environments that block localStorage writes
    }
  }, cartItemA)

  await page.goto('/cart')
  await waitForPageReady(page, 'Shopping Cart')

  // The item must be present before we remove it
  await expect(page.getByText(PRODUCT_A.name)).toBeVisible()

  // Click the "Remove" button for this cart item
  await page.getByRole('button', { name: `Remove ${PRODUCT_A.name} from cart` }).click()

  // The empty-cart placeholder should now be shown
  // (ShoppingCartPage renders role="status" aria-label="Shopping cart is empty")
  await expect(page.getByRole('status', { name: 'Shopping cart is empty' })).toBeVisible()
  await expect(page.getByText('Your cart is empty.')).toBeVisible()
})

// ---------------------------------------------------------------------------
// Scenario: View cart total
// ---------------------------------------------------------------------------

test('View cart total — correct total price is shown', async ({ authedPage: page }) => {
  // Seed cart with two items: cartItemA (qty 1 × $12.99) + cartItemB (qty 2 × $8.50)
  // Expected total: 12.99 + 2 × 8.50 = 12.99 + 17.00 = $29.99
  await page.addInitScript(
    (items) => {
      try {
        localStorage.setItem('shopping_cart', JSON.stringify(items))
      } catch {
        // ignore
      }
    },
    [cartItemA, cartItemB]
  )

  await page.goto('/cart')
  await waitForPageReady(page, 'Shopping Cart')

  // Both items must be visible
  await expect(page.getByText(PRODUCT_A.name)).toBeVisible()
  await expect(page.getByText(PRODUCT_B.name)).toBeVisible()

  // CartSummary renders: "Total: $<amount>" (src/pages/shopping/components/CartSummary.tsx)
  const expectedTotal = (
    cartItemA.price * cartItemA.quantity +
    cartItemB.price * cartItemB.quantity
  ).toFixed(2)
  await expect(page.getByText(`Total: $${expectedTotal}`)).toBeVisible()
})
