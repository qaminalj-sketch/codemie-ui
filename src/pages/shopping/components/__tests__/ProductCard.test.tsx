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

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { Product } from '@/types/entity/product'

import ProductCard from '../ProductCard'

const keyboard: Product = { id: 'p1', name: 'Keyboard', price: 25.5, available: true }
const monitor: Product = { id: 'p3', name: 'Monitor', price: 200, available: false }

const renderCard = (product: Product) => {
  const onAddToCart = vi.fn()
  render(<ProductCard product={product} onAddToCart={onAddToCart} />)
  return onAddToCart
}

describe('ProductCard', () => {
  afterEach(cleanup)

  it('renders the Add to Cart action for an available product', () => {
    renderCard(keyboard)

    expect(screen.getByRole('article', { name: 'Keyboard' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Keyboard' })).toBeInTheDocument()
    expect(screen.getByText('$25.50')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Add Keyboard to cart' })
    expect(button).toHaveTextContent('Add to Cart')
    expect(button).not.toHaveAttribute('aria-disabled')
    expect(button).toBeEnabled()
  })

  it('renders the unavailable state for an unavailable product', () => {
    renderCard(monitor)

    const button = screen.getByRole('button', { name: 'Monitor is currently unavailable' })
    expect(button).toHaveTextContent('Unavailable')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveClass('cursor-not-allowed', 'opacity-50')
    expect(screen.queryByRole('button', { name: /Add .* to cart/ })).not.toBeInTheDocument()
  })

  it('keeps the unavailable button focusable instead of natively disabled', () => {
    renderCard(monitor)

    const button = screen.getByRole('button', { name: 'Monitor is currently unavailable' })
    expect(button).not.toBeDisabled()
    button.focus()
    expect(button).toHaveFocus()
  })

  it('neutralises hover and active styling on the unavailable button', () => {
    renderCard(monitor)

    const button = screen.getByRole('button', { name: 'Monitor is currently unavailable' })
    expect(button).toHaveClass(
      'hover:bg-surface-base-secondary',
      'active:bg-surface-base-secondary'
    )
    expect(button).not.toHaveClass('hover:bg-border-structural')
    expect(button).not.toHaveClass('hover:bg-button-primary-bg-hover')
  })

  it('calls the handler with the product id when an available product is clicked', () => {
    const onAddToCart = renderCard(keyboard)

    fireEvent.click(screen.getByRole('button', { name: 'Add Keyboard to cart' }))

    expect(onAddToCart).toHaveBeenCalledWith('p1')
  })

  it('calls the handler for an unavailable product so the store can show the message', () => {
    const onAddToCart = renderCard(monitor)

    fireEvent.click(screen.getByRole('button', { name: 'Monitor is currently unavailable' }))

    expect(onAddToCart).toHaveBeenCalledWith('p3')
  })

  it.each([
    ['Enter', '{Enter}'],
    ['Space', ' '],
  ])('activates with %s for available and unavailable products', async (_key, keys) => {
    const user = userEvent.setup()
    const onAvailable = renderCard(keyboard)
    screen.getByRole('button', { name: 'Add Keyboard to cart' }).focus()
    await user.keyboard(keys)
    expect(onAvailable).toHaveBeenCalledWith('p1')

    cleanup()
    const onUnavailable = renderCard(monitor)
    screen.getByRole('button', { name: 'Monitor is currently unavailable' }).focus()
    await user.keyboard(keys)
    expect(onUnavailable).toHaveBeenCalledWith('p3')
  })
})
