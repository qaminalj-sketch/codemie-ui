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

import React from 'react'

import Button from '@/components/Button'
import { ButtonSize } from '@/constants'
import { cn } from '@/utils/utils'

interface CartSummaryProps {
  total: number
  itemCount: number
  onClear: () => void
  className?: string
}

const CartSummary: React.FC<CartSummaryProps> = ({ total, itemCount, onClear, className }) => (
  <section
    aria-label="Cart summary"
    className={cn(
      'flex flex-wrap items-center justify-between gap-4 p-6 rounded-lg border border-border-structural bg-surface-base-secondary mt-4',
      className
    )}
  >
    <div className="flex flex-col">
      <span className="text-sm text-text-secondary">
        {itemCount} {itemCount === 1 ? 'item' : 'items'}
      </span>
      <span className="text-xl font-semibold text-text-primary" aria-live="polite">
        Total: ${total.toFixed(2)}
      </span>
    </div>
    <div className="flex items-center gap-2">
      <Button type="secondary" size={ButtonSize.MEDIUM} onClick={onClear}>
        Clear Cart
      </Button>
      <Button type="primary" size={ButtonSize.MEDIUM}>
        Proceed to Checkout
      </Button>
    </div>
  </section>
)

export default CartSummary
