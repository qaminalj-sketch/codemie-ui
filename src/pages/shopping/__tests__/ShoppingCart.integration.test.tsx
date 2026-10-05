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
//

import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { CART_MESSAGES, CART_STORAGE_KEY } from '@/constants/shoppingCart'
import { productsStore } from '@/store/products'
import { shoppingCartStore } from '@/store/shoppingCart'
import { renderPage } from '@/test-utils/integration'
import toaster from '@/utils/toaster'

// Pin the static catalogue so the flow does not depend on the POC's sample data
vi.mock('@/data/products', () => ({
  PRODUCTS: [
    { id: 'p1', name: 'Keyboard', price: 25.5, available: true },
    { id: 'p2', name: 'Mouse', price: 10, available: true },
    { id: 'p3', name: 'Monitor', price: 200, available: false },
  ],
}))

const getCartRow = (name: string) =>
  screen.getByRole('heading', { name }).closest('li') as HTMLElement

const addFromProductsPage = async (...names: string[]) => {
  renderPage('/products')
  for (const name of names) {
    // eslint-disable-next-line no-await-in-loop -- sequential clicks required for UI interaction
    await userEvent.click(await screen.findByRole('button', { name: `Add ${name} to cart` }))
  }
  await waitFor(() => expect(shoppingCartStore.loading).toBe(false))
  cleanup()
}

describe('Shopping cart — Integration', () => {
  beforeEach(() => {
    shoppingCartStore.clearCart()
    vi.mocked(toaster.error).mockClear()
    vi.mocked(toaster.success).mockClear()
    // Stores are module singletons; stale products would render before the refetch spinner
    productsStore.items = []
  })

  afterEach(cleanup)

  it('adds an available product with quantity 1 and keeps it after navigating to the cart', async () => {
    await addFromProductsPage('Keyboard')

    expect(toaster.success).toHaveBeenCalledWith(CART_MESSAGES.ADDED_TO_CART('Keyboard'))
    renderPage('/cart')

    const row = await waitFor(() => getCartRow('Keyboard'))
    expect(within(row).getByText('$25.50 each')).toBeInTheDocument()
    expect(within(row).getByRole('status', { name: 'Quantity of Keyboard' })).toHaveTextContent('1')
    expect(within(row).getByText('$25.50', { exact: true })).toBeInTheDocument()
    expect(JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY)!)).toHaveLength(1)
  })

  it('increments quantity when the same product is added again', async () => {
    await addFromProductsPage('Keyboard', 'Keyboard')

    expect(toaster.success).toHaveBeenLastCalledWith(
      CART_MESSAGES.QUANTITY_INCREASED('Keyboard', 2)
    )
    renderPage('/cart')

    const row = await waitFor(() => getCartRow('Keyboard'))
    expect(within(row).getByRole('status', { name: 'Quantity of Keyboard' })).toHaveTextContent('2')
    expect(within(row).getByText('$51.00')).toBeInTheDocument()
  })

  it('prevents adding an unavailable product and shows a message', async () => {
    renderPage('/products')

    const button = await screen.findByRole('button', { name: 'Monitor is currently unavailable' })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(button)

    expect(toaster.error).toHaveBeenCalledWith(CART_MESSAGES.UNAVAILABLE_PRODUCT)
    expect(toaster.success).not.toHaveBeenCalled()
    expect(shoppingCartStore.items).toEqual([])
  })

  it('shows the unavailable message when the unavailable button is activated by keyboard', async () => {
    renderPage('/products')

    const button = await screen.findByRole('button', { name: 'Monitor is currently unavailable' })
    button.focus()
    await userEvent.keyboard('{Enter}')

    expect(toaster.error).toHaveBeenCalledWith(CART_MESSAGES.UNAVAILABLE_PRODUCT)
    expect(shoppingCartStore.items).toEqual([])
  })

  it('updates quantity, subtotal and total, and removes an item at quantity 0', async () => {
    await addFromProductsPage('Keyboard', 'Mouse')
    renderPage('/cart')
    await waitFor(() => getCartRow('Keyboard'))

    expect(screen.getByText('Total: $35.50')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity of Keyboard' }))
    expect(within(getCartRow('Keyboard')).getByText('$51.00')).toBeInTheDocument()
    expect(screen.getByText('Total: $61.00')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity of Keyboard' }))
    expect(within(getCartRow('Keyboard')).getByText('$25.50', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('Total: $35.50')).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'Decrease quantity of Mouse and remove it from cart' })
    )
    expect(screen.queryByRole('heading', { name: 'Mouse' })).not.toBeInTheDocument()
    expect(screen.getByText('Total: $25.50')).toBeInTheDocument()
  })

  it('removes an item completely with Remove', async () => {
    await addFromProductsPage('Keyboard', 'Keyboard', 'Mouse')
    renderPage('/cart')
    await waitFor(() => getCartRow('Keyboard'))

    await userEvent.click(screen.getByRole('button', { name: 'Remove Keyboard from cart' }))

    expect(screen.queryByRole('heading', { name: 'Keyboard' })).not.toBeInTheDocument()
    expect(screen.getByText('Total: $10.00')).toBeInTheDocument()
  })

  it('clears the cart and shows the empty state', async () => {
    await addFromProductsPage('Keyboard', 'Mouse')
    renderPage('/cart')
    await waitFor(() => getCartRow('Keyboard'))

    await userEvent.click(screen.getByRole('button', { name: 'Clear Cart' }))

    expect(screen.getByRole('status', { name: 'Shopping cart is empty' })).toBeInTheDocument()
    expect(sessionStorage.getItem(CART_STORAGE_KEY)).toBeNull()
  })

  it('supports keyboard operation of quantity controls', async () => {
    await addFromProductsPage('Mouse')
    renderPage('/cart')
    await waitFor(() => getCartRow('Mouse'))

    screen.getByRole('button', { name: 'Increase quantity of Mouse' }).focus()
    await userEvent.keyboard('{Enter}')

    expect(screen.getByRole('status', { name: 'Quantity of Mouse' })).toHaveTextContent('2')
    expect(screen.getByRole('list', { name: 'Cart items' })).toBeInTheDocument()
  })
})
