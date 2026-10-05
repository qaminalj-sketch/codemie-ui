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

import { CART_STORAGE_KEY } from '@/constants/shoppingCart'
import { CartItem } from '@/types/entity/shoppingCart'
import { isValidCartItem, toCartItem } from '@/utils/cartValidation'

// The cart lives in sessionStorage: it survives navigation and reloads within the
// shopping session and is discarded when the tab closes. Only non-sensitive product
// fields (id, name, price, quantity, availability) are ever written.

const sanitizeCartItems = (value: unknown): CartItem[] => {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  return value.filter(isValidCartItem).reduce<CartItem[]>((acc, item) => {
    if (!seen.has(item.productId)) {
      seen.add(item.productId)
      acc.push(toCartItem(item))
    }
    return acc
  }, [])
}

export const saveCartToStorage = (cartItems: CartItem[]): void => {
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(sanitizeCartItems(cartItems)))
  } catch (err) {
    // Graceful fallback: the cart keeps working in memory when storage is unavailable or full
    console.warn('Shopping cart could not be saved to sessionStorage:', err)
  }
}

export const loadCartFromStorage = (): CartItem[] => {
  try {
    const stored = sessionStorage.getItem(CART_STORAGE_KEY)
    return stored ? sanitizeCartItems(JSON.parse(stored)) : []
  } catch {
    // Unavailable storage or corrupted JSON starts an empty cart
    return []
  }
}

export const clearCartStorage = (): void => {
  try {
    sessionStorage.removeItem(CART_STORAGE_KEY)
  } catch {
    // Graceful fallback when sessionStorage is unavailable
  }
}
