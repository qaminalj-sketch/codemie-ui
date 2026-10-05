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

import { PRODUCTS_PER_PAGE } from '@/constants/shoppingCart'
import { PRODUCTS } from '@/data/products'
import { Product } from '@/types/entity/product'

interface ProductsPagination {
  page: number
  perPage: number
  total: number
}

interface ProductsStoreType {
  items: Product[]
  pagination: ProductsPagination
  loading: boolean
  error: string | null
  fetchProducts: (page?: number) => Promise<void>
  fetchProductById: (id: string) => Promise<Product>
}

const DEFAULT_PAGE = 0

// The shopping cart POC is front-end only: products come from the static catalogue in
// `@/data/products`. The async signatures are kept so a real API can replace it later.

export const productsStore = proxy<ProductsStoreType>({
  items: [],
  pagination: {
    page: DEFAULT_PAGE,
    perPage: PRODUCTS_PER_PAGE,
    total: 0,
  },
  loading: false,
  error: null,

  async fetchProducts(page = DEFAULT_PAGE) {
    this.loading = true
    this.error = null
    try {
      const start = page * this.pagination.perPage
      this.items = PRODUCTS.slice(start, start + this.pagination.perPage)
      this.pagination.total = PRODUCTS.length
      this.pagination.page = page
    } catch (err: any) {
      this.error = err.message ?? 'Failed to load products'
      console.error('Store Error (fetchProducts):', err)
    } finally {
      this.loading = false
    }
  },

  async fetchProductById(id) {
    const product = PRODUCTS.find((item) => item.id === id)
    if (!product) throw new Error(`Product not found: ${id}`)
    return { ...product }
  },
})
