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

import { proxy } from 'valtio'

import { CART_MESSAGES } from '@/constants/shoppingCart'
import { productsStore } from '@/store/products'
import { CartItem } from '@/types/entity/shoppingCart'
import { clearCartStorage, loadCartFromStorage, saveCartToStorage } from '@/utils/cartStorage'
import { isValidProduct, isValidProductId } from '@/utils/cartValidation'
import toaster from '@/utils/toaster'

interface ShoppingCartStoreType {
  items: CartItem[]
  loading: boolean
  readonly total: number
  readonly itemCount: number
  addToCart: (productId: string) => Promise<void>
  increaseExistingItem: (productId: string) => void
  increaseQuantity: (productId: string) => void
  decreaseQuantity: (productId: string) => void
  removeFromCart: (productId: string) => void
  loadCart: () => void
  saveCart: () => void
  clearCart: () => void
}

export const shoppingCartStore = proxy<ShoppingCartStoreType>({
  items: loadCartFromStorage(),
  loading: false,

  /** Sum of all item subtotals (unit price × quantity). */
  get total(): number {
    return this.items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0)
  },

  /** Sum of all item quantities. */
  get itemCount(): number {
    return this.items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0)
  },

  /**
   * Adds an available product with quantity 1, or increments it if already in the cart.
   * Availability is checked against the product catalogue before a new item is added.
   * A success toast confirms either outcome, since the product list has no other feedback.
   */
  async addToCart(productId) {
    if (!isValidProductId(productId)) {
      toaster.error(CART_MESSAGES.INVALID_PRODUCT)
      return
    }

    const listed = productsStore.items.find((product) => product.id === productId)
    if (listed && !listed.available) {
      toaster.error(CART_MESSAGES.UNAVAILABLE_PRODUCT)
      return
    }

    if (this.items.some((item) => item.productId === productId)) {
      this.increaseExistingItem(productId)
      return
    }

    this.loading = true
    try {
      const product = await productsStore.fetchProductById(productId)
      if (!isValidProduct(product) || product.id !== productId) {
        toaster.error(CART_MESSAGES.PRODUCT_LOAD_ERROR)
        return
      }
      if (!product.available) {
        toaster.error(CART_MESSAGES.UNAVAILABLE_PRODUCT)
        return
      }
      // A concurrent click may have added the product while the request was in flight
      if (this.items.some((item) => item.productId === productId)) {
        this.increaseExistingItem(productId)
        return
      }
      this.items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        available: product.available,
      })
      this.saveCart()
      toaster.success(CART_MESSAGES.ADDED_TO_CART(product.name))
    } catch (err) {
      toaster.error(CART_MESSAGES.PRODUCT_LOAD_ERROR)
      console.error('Store Error (addToCart):', err)
    } finally {
      this.loading = false
    }
  },

  /** Increments an item already in the cart from Add to Cart and confirms the new quantity. */
  increaseExistingItem(productId) {
    this.increaseQuantity(productId)
    const item = this.items.find((i) => i.productId === productId)
    if (item) toaster.success(CART_MESSAGES.QUANTITY_INCREASED(item.name, item.quantity))
  },

  increaseQuantity(productId) {
    const item = this.items.find((i) => i.productId === productId)
    if (!item || item.quantity >= Number.MAX_SAFE_INTEGER) return
    item.quantity += 1
    this.saveCart()
  },

  /** Decrements the quantity; an item whose quantity would reach 0 is removed. */
  decreaseQuantity(productId) {
    const idx = this.items.findIndex((i) => i.productId === productId)
    if (idx === -1) return
    if (this.items[idx].quantity <= 1) {
      this.items.splice(idx, 1)
    } else {
      this.items[idx].quantity -= 1
    }
    this.saveCart()
  },

  removeFromCart(productId) {
    this.items = this.items.filter((item) => item.productId !== productId)
    this.saveCart()
  },

  loadCart() {
    this.items = loadCartFromStorage()
  },

  saveCart() {
    saveCartToStorage([...this.items])
  },

  clearCart() {
    this.items = []
    clearCartStorage()
  },
})
