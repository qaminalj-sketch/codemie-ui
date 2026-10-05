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

import { CART_MESSAGES, CART_STORAGE_KEY } from '@/constants/shoppingCart'
import { productsStore } from '@/store/products'
import { shoppingCartStore } from '@/store/shoppingCart'
import { Product } from '@/types/entity/product'
import toaster from '@/utils/toaster'

const keyboard: Product = { id: 'p1', name: 'Keyboard', price: 25.5, available: true }
const mouse: Product = { id: 'p2', name: 'Mouse', price: 10, available: true }
const monitor: Product = { id: 'p3', name: 'Monitor', price: 200, available: false }

const fetchProductById = () => vi.spyOn(productsStore, 'fetchProductById')

const mockProductResponse = (product: unknown) => {
  fetchProductById().mockResolvedValueOnce(product as Product)
}

const storedItems = () => JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY) ?? '[]')

describe('shoppingCartStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    shoppingCartStore.items = []
    shoppingCartStore.loading = false
    productsStore.items = []
  })

  afterEach(() => {
    if (vi.isMockFunction(productsStore.fetchProductById)) {
      vi.mocked(productsStore.fetchProductById).mockRestore()
    }
  })

  describe('addToCart', () => {
    it('adds an available product with quantity 1', async () => {
      mockProductResponse(keyboard)

      await shoppingCartStore.addToCart('p1')

      expect(productsStore.fetchProductById).toHaveBeenCalledWith('p1')
      expect(shoppingCartStore.items).toEqual([
        { productId: 'p1', name: 'Keyboard', price: 25.5, quantity: 1, available: true },
      ])
      expect(shoppingCartStore.loading).toBe(false)
      expect(toaster.success).toHaveBeenCalledOnce()
      expect(toaster.success).toHaveBeenCalledWith(CART_MESSAGES.ADDED_TO_CART('Keyboard'))
    })

    it('increases the quantity when the same product is added again', async () => {
      mockProductResponse(keyboard)
      await shoppingCartStore.addToCart('p1')

      await shoppingCartStore.addToCart('p1')

      expect(shoppingCartStore.items).toHaveLength(1)
      expect(shoppingCartStore.items[0].quantity).toBe(2)
      expect(productsStore.fetchProductById).toHaveBeenCalledTimes(1)
      expect(toaster.success).toHaveBeenLastCalledWith(
        CART_MESSAGES.QUANTITY_INCREASED('Keyboard', 2)
      )
    })

    it('does not create duplicates when the same product is added concurrently', async () => {
      mockProductResponse(keyboard)
      mockProductResponse(keyboard)

      await Promise.all([shoppingCartStore.addToCart('p1'), shoppingCartStore.addToCart('p1')])

      expect(shoppingCartStore.items).toHaveLength(1)
      expect(shoppingCartStore.items[0].quantity).toBe(2)
      expect(vi.mocked(toaster.success).mock.calls).toEqual([
        [CART_MESSAGES.ADDED_TO_CART('Keyboard')],
        [CART_MESSAGES.QUANTITY_INCREASED('Keyboard', 2)],
      ])
    })

    it('rejects an unavailable product and shows an error', async () => {
      mockProductResponse(monitor)

      await shoppingCartStore.addToCart('p3')

      expect(shoppingCartStore.items).toEqual([])
      expect(toaster.error).toHaveBeenCalledWith(CART_MESSAGES.UNAVAILABLE_PRODUCT)
      expect(toaster.success).not.toHaveBeenCalled()
    })

    it('rejects a product listed as unavailable without looking it up', async () => {
      productsStore.items = [monitor]
      fetchProductById()

      await shoppingCartStore.addToCart('p3')

      expect(productsStore.fetchProductById).not.toHaveBeenCalled()
      expect(shoppingCartStore.items).toEqual([])
      expect(toaster.error).toHaveBeenCalledWith(CART_MESSAGES.UNAVAILABLE_PRODUCT)
    })

    it.each(['', '../secret', 'a/b'])('rejects invalid product id "%s"', async (id) => {
      fetchProductById()

      await shoppingCartStore.addToCart(id)

      expect(productsStore.fetchProductById).not.toHaveBeenCalled()
      expect(shoppingCartStore.items).toEqual([])
      expect(toaster.error).toHaveBeenCalledWith(CART_MESSAGES.INVALID_PRODUCT)
    })

    it('rejects a malformed product response', async () => {
      mockProductResponse({ id: 'p1', name: 'Keyboard', price: 'free', available: true })

      await shoppingCartStore.addToCart('p1')

      expect(shoppingCartStore.items).toEqual([])
      expect(toaster.error).toHaveBeenCalledWith(CART_MESSAGES.PRODUCT_LOAD_ERROR)
    })

    it('shows an error and leaves the cart unchanged when the product is not in the catalogue', async () => {
      vi.spyOn(console, 'error').mockImplementationOnce(() => {})

      await shoppingCartStore.addToCart('unknown-product')

      expect(shoppingCartStore.items).toEqual([])
      expect(shoppingCartStore.loading).toBe(false)
      expect(toaster.error).toHaveBeenCalledWith(CART_MESSAGES.PRODUCT_LOAD_ERROR)
      expect(toaster.success).not.toHaveBeenCalled()
    })
  })

  describe('quantity changes', () => {
    beforeEach(() => {
      shoppingCartStore.items = [
        { productId: 'p1', name: 'Keyboard', price: 25.5, quantity: 2, available: true },
      ]
    })

    it('increases quantity and subtotal', () => {
      shoppingCartStore.increaseQuantity('p1')

      expect(shoppingCartStore.items[0].quantity).toBe(3)
      expect(shoppingCartStore.total).toBeCloseTo(76.5)
      // Only Add to Cart confirms with a toast; the cart page's own controls do not
      expect(toaster.success).not.toHaveBeenCalled()
    })

    it('decreases quantity and subtotal', () => {
      shoppingCartStore.decreaseQuantity('p1')

      expect(shoppingCartStore.items[0].quantity).toBe(1)
      expect(shoppingCartStore.total).toBeCloseTo(25.5)
    })

    it('removes the item when quantity reaches 0', () => {
      shoppingCartStore.decreaseQuantity('p1')
      shoppingCartStore.decreaseQuantity('p1')

      expect(shoppingCartStore.items).toEqual([])
    })

    it('ignores unknown product ids', () => {
      shoppingCartStore.increaseQuantity('missing')
      shoppingCartStore.decreaseQuantity('missing')

      expect(shoppingCartStore.items[0].quantity).toBe(2)
    })
  })

  describe('remove and clear', () => {
    beforeEach(() => {
      shoppingCartStore.items = [
        { productId: 'p1', name: 'Keyboard', price: 25.5, quantity: 3, available: true },
        { productId: 'p2', name: 'Mouse', price: 10, quantity: 1, available: true },
      ]
      shoppingCartStore.saveCart()
    })

    it('removes an item completely regardless of quantity', () => {
      shoppingCartStore.removeFromCart('p1')

      expect(shoppingCartStore.items.map((i) => i.productId)).toEqual(['p2'])
      expect(storedItems()).toHaveLength(1)
    })

    it('clears all items and the stored cart', () => {
      shoppingCartStore.clearCart()

      expect(shoppingCartStore.items).toEqual([])
      expect(sessionStorage.getItem(CART_STORAGE_KEY)).toBeNull()
    })
  })

  describe('totals', () => {
    it('total is the sum of all subtotals and itemCount the sum of quantities', () => {
      shoppingCartStore.items = [
        { productId: 'p1', name: 'Keyboard', price: 25.5, quantity: 2, available: true },
        { productId: 'p2', name: 'Mouse', price: 10, quantity: 3, available: true },
      ]

      expect(shoppingCartStore.total).toBeCloseTo(81)
      expect(shoppingCartStore.itemCount).toBe(5)
    })

    it('empty cart has zero total and item count', () => {
      expect(shoppingCartStore.total).toBe(0)
      expect(shoppingCartStore.itemCount).toBe(0)
    })
  })

  describe('sessionStorage persistence', () => {
    it('persists every change to sessionStorage', async () => {
      mockProductResponse(mouse)
      await shoppingCartStore.addToCart('p2')
      expect(storedItems()).toEqual([
        { productId: 'p2', name: 'Mouse', price: 10, quantity: 1, available: true },
      ])

      shoppingCartStore.increaseQuantity('p2')
      expect(storedItems()[0].quantity).toBe(2)

      shoppingCartStore.decreaseQuantity('p2')
      expect(storedItems()[0].quantity).toBe(1)
    })

    it('restores the cart from sessionStorage when the store is created', async () => {
      sessionStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify([
          { productId: 'p2', name: 'Mouse', price: 10, quantity: 4, available: true },
        ])
      )
      vi.resetModules()

      const { shoppingCartStore: freshStore } = await import('@/store/shoppingCart')

      expect(freshStore.items).toHaveLength(1)
      expect(freshStore.items[0].quantity).toBe(4)
    })

    it('reloads the cart with loadCart', () => {
      sessionStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify([
          { productId: 'p1', name: 'Keyboard', price: 25.5, quantity: 2, available: true },
        ])
      )

      shoppingCartStore.loadCart()

      expect(shoppingCartStore.items[0].productId).toBe('p1')
    })
  })
})
