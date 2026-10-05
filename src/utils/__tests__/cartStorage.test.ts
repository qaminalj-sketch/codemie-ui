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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { CART_STORAGE_KEY } from '@/constants/shoppingCart'
import { CartItem } from '@/types/entity/shoppingCart'
import { clearCartStorage, loadCartFromStorage, saveCartToStorage } from '@/utils/cartStorage'

const item = (overrides: Partial<CartItem> = {}): CartItem => ({
  productId: 'p1',
  name: 'Keyboard',
  price: 25,
  quantity: 2,
  available: true,
  ...overrides,
})

describe('cartStorage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('saves the cart to sessionStorage, not localStorage', () => {
    saveCartToStorage([item()])

    expect(JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY)!)).toEqual([item()])
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull()
  })

  it('loads a previously saved cart', () => {
    saveCartToStorage([item(), item({ productId: 'p2', quantity: 1 })])

    expect(loadCartFromStorage()).toHaveLength(2)
  })

  it('returns an empty cart when nothing is stored', () => {
    expect(loadCartFromStorage()).toEqual([])
  })

  it('clears the stored cart', () => {
    saveCartToStorage([item()])
    clearCartStorage()

    expect(sessionStorage.getItem(CART_STORAGE_KEY)).toBeNull()
  })

  it('returns an empty cart for corrupted JSON', () => {
    sessionStorage.setItem(CART_STORAGE_KEY, '{not json')

    expect(loadCartFromStorage()).toEqual([])
  })

  it('returns an empty cart when stored data is not an array', () => {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ productId: 'p1' }))

    expect(loadCartFromStorage()).toEqual([])
  })

  it('drops items with invalid ids, quantities or prices', () => {
    const stored = [
      item(),
      item({ productId: '../admin' }),
      item({ productId: 'p3', quantity: 0 }),
      item({ productId: 'p4', quantity: -1 }),
      item({ productId: 'p5', quantity: 1.5 }),
      item({ productId: 'p6', price: -10 }),
      { productId: 'p7', name: 'No price', quantity: 1, available: true },
    ]
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(stored))

    expect(loadCartFromStorage()).toEqual([item()])
  })

  it('ignores duplicate product entries', () => {
    sessionStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([item(), item({ name: 'Duplicate', quantity: 5 })])
    )

    expect(loadCartFromStorage()).toEqual([item()])
  })

  it('stores only whitelisted, non-sensitive fields', () => {
    const withExtras = { ...item(), email: 'user@example.com', cardNumber: '4111' } as CartItem
    saveCartToStorage([withExtras])

    const raw = sessionStorage.getItem(CART_STORAGE_KEY)!
    expect(raw).not.toContain('user@example.com')
    expect(Object.keys(JSON.parse(raw)[0]).sort()).toEqual(
      ['available', 'name', 'price', 'productId', 'quantity'].sort()
    )
  })

  it('does not throw when sessionStorage is unavailable', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('SecurityError')
    })

    expect(() => saveCartToStorage([item()])).not.toThrow()
    expect(loadCartFromStorage()).toEqual([])
    expect(() => clearCartStorage()).not.toThrow()
  })
})
