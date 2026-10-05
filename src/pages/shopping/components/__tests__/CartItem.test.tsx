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
import { describe, it, expect, vi, afterEach } from 'vitest'

import { CartItem as CartItemType } from '@/types/entity/shoppingCart'

import CartItem from '../CartItem'

const item: CartItemType = {
  productId: 'p1',
  name: 'Keyboard',
  price: 25.5,
  quantity: 2,
  available: true,
}

const renderItem = (overrides: Partial<CartItemType> = {}) => {
  const handlers = { onIncrease: vi.fn(), onDecrease: vi.fn(), onRemove: vi.fn() }
  render(
    <ul>
      <CartItem item={{ ...item, ...overrides }} {...handlers} />
    </ul>
  )
  return handlers
}

describe('CartItem', () => {
  afterEach(cleanup)

  it('displays name, unit price, quantity and subtotal', () => {
    renderItem()

    expect(screen.getByRole('heading', { name: 'Keyboard' })).toBeInTheDocument()
    expect(screen.getByText('$25.50 each')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Quantity of Keyboard' })).toHaveTextContent('2')
    expect(screen.getByText('Subtotal')).toBeInTheDocument()
    expect(screen.getByText('$51.00')).toBeInTheDocument()
  })

  it('renders as a list item', () => {
    renderItem()

    expect(screen.getByRole('listitem')).toBeInTheDocument()
  })

  it('exposes labelled, keyboard-operable buttons', () => {
    renderItem()

    const buttons = [
      screen.getByRole('button', { name: 'Decrease quantity of Keyboard' }),
      screen.getByRole('button', { name: 'Increase quantity of Keyboard' }),
      screen.getByRole('button', { name: 'Remove Keyboard from cart' }),
    ]
    buttons.forEach((button) => {
      expect(button.tagName).toBe('BUTTON')
      expect(button).toHaveAttribute('type', 'button')
    })
    expect(screen.getByRole('group', { name: 'Change quantity of Keyboard' })).toBeInTheDocument()
  })

  it('announces that decreasing a single item removes it', () => {
    renderItem({ quantity: 1 })

    expect(
      screen.getByRole('button', {
        name: 'Decrease quantity of Keyboard and remove it from cart',
      })
    ).toBeInTheDocument()
  })

  it('calls handlers with the product id', () => {
    const { onIncrease, onDecrease, onRemove } = renderItem()

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity of Keyboard' }))
    fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity of Keyboard' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove Keyboard from cart' }))

    expect(onIncrease).toHaveBeenCalledWith('p1')
    expect(onDecrease).toHaveBeenCalledWith('p1')
    expect(onRemove).toHaveBeenCalledWith('p1')
  })
})
