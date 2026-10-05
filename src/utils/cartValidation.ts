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

import { MAX_PRODUCT_ID_LENGTH } from '@/constants/shoppingCart'
import { Product } from '@/types/entity/product'
import { CartItem } from '@/types/entity/shoppingCart'

// Product IDs are also read back from sessionStorage, so only plain identifier characters
// are accepted (no slashes, dots or query separators).
const PRODUCT_ID_PATTERN = /^[A-Za-z0-9_-]+$/

const isValidPrice = (price: unknown): price is number =>
  typeof price === 'number' && Number.isFinite(price) && price >= 0

export const isValidProductId = (productId: unknown): productId is string =>
  typeof productId === 'string' &&
  productId.length > 0 &&
  productId.length <= MAX_PRODUCT_ID_LENGTH &&
  PRODUCT_ID_PATTERN.test(productId)

export const isValidQuantity = (quantity: unknown): quantity is number =>
  typeof quantity === 'number' && Number.isSafeInteger(quantity) && quantity >= 1

export const isValidProduct = (product: unknown): product is Product => {
  if (!product || typeof product !== 'object') return false
  const { id, name, price, available } = product as Partial<Product>
  return (
    isValidProductId(id) &&
    typeof name === 'string' &&
    isValidPrice(price) &&
    typeof available === 'boolean'
  )
}

export const isValidCartItem = (item: unknown): item is CartItem => {
  if (!item || typeof item !== 'object') return false
  const { productId, name, price, quantity, available } = item as Partial<CartItem>
  return (
    isValidProductId(productId) &&
    typeof name === 'string' &&
    isValidPrice(price) &&
    isValidQuantity(quantity) &&
    typeof available === 'boolean'
  )
}

/** Copies only the whitelisted, non-sensitive cart fields. */
export const toCartItem = ({
  productId,
  name,
  price,
  quantity,
  available,
}: CartItem): CartItem => ({
  productId,
  name,
  price,
  quantity,
  available,
})
