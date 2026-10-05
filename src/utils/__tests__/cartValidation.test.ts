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

import { describe, it, expect } from 'vitest'

import { isValidProduct, isValidProductId, isValidQuantity } from '@/utils/cartValidation'

describe('cartValidation', () => {
  it.each(['p1', 'abc-123', 'A_b', '42'])('accepts product id %s', (id) => {
    expect(isValidProductId(id)).toBe(true)
  })

  it.each(['', ' ', '../x', 'a/b', 'a?b=1', 'x'.repeat(129), 42, null, undefined])(
    'rejects product id %s',
    (id) => {
      expect(isValidProductId(id)).toBe(false)
    }
  )

  it.each([1, 2, 100])('accepts quantity %s', (quantity) => {
    expect(isValidQuantity(quantity)).toBe(true)
  })

  it.each([0, -1, 1.5, NaN, Infinity, '1', null])('rejects quantity %s', (quantity) => {
    expect(isValidQuantity(quantity)).toBe(false)
  })

  it('validates product shape', () => {
    expect(isValidProduct({ id: 'p1', name: 'Mouse', price: 10, available: true })).toBe(true)
    expect(isValidProduct({ id: 'p1', name: 'Mouse', price: -1, available: true })).toBe(false)
    expect(isValidProduct({ id: 'p1', name: 'Mouse', price: 10 })).toBe(false)
    expect(isValidProduct(null)).toBe(false)
  })
})
