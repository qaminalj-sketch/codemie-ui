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

import { describe, it, expect, beforeEach, vi } from 'vitest'

import { PRODUCTS_PER_PAGE } from '@/constants/shoppingCart'
import { PRODUCTS } from '@/data/products'
import { productsStore } from '@/store/products'
import api from '@/utils/api'
import { isValidProduct } from '@/utils/cartValidation'

describe('static product catalogue', () => {
  it('contains only valid products with unique ids', () => {
    expect(PRODUCTS.every(isValidProduct)).toBe(true)
    expect(new Set(PRODUCTS.map((product) => product.id)).size).toBe(PRODUCTS.length)
  })

  it('includes both available and unavailable products', () => {
    expect(PRODUCTS.some((product) => product.available)).toBe(true)
    expect(PRODUCTS.some((product) => !product.available)).toBe(true)
  })
})

describe('productsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    productsStore.items = []
    productsStore.pagination.page = 0
    productsStore.pagination.total = 0
    productsStore.pagination.perPage = PRODUCTS_PER_PAGE
  })

  describe('fetchProducts', () => {
    it('loads the static catalogue without calling the API', async () => {
      await productsStore.fetchProducts()

      expect(api.get).not.toHaveBeenCalled()
      expect(productsStore.items).toEqual(PRODUCTS.slice(0, PRODUCTS_PER_PAGE))
      expect(productsStore.pagination.total).toBe(PRODUCTS.length)
      expect(productsStore.loading).toBe(false)
      expect(productsStore.error).toBeNull()
    })

    it('returns the requested page of the catalogue', async () => {
      productsStore.pagination.perPage = 2

      await productsStore.fetchProducts(1)

      expect(productsStore.items).toEqual(PRODUCTS.slice(2, 4))
      expect(productsStore.pagination.page).toBe(1)
      expect(productsStore.pagination.total).toBe(PRODUCTS.length)
    })

    it('returns an empty page past the end of the catalogue', async () => {
      productsStore.pagination.perPage = 2

      await productsStore.fetchProducts(PRODUCTS.length)

      expect(productsStore.items).toEqual([])
    })
  })

  describe('fetchProductById', () => {
    it('resolves a product from the catalogue as a copy', async () => {
      const [first] = PRODUCTS

      const product = await productsStore.fetchProductById(first.id)

      expect(product).toEqual(first)
      expect(product).not.toBe(first)
    })

    it('rejects an id that is not in the catalogue', async () => {
      await expect(productsStore.fetchProductById('missing')).rejects.toThrow(
        'Product not found: missing'
      )
    })
  })
})
