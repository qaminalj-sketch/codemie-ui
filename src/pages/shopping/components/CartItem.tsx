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
import { CartItem as CartItemType } from '@/types/entity/shoppingCart'
import { cn } from '@/utils/utils'

interface CartItemProps {
  item: CartItemType
  onIncrease: (productId: string) => void
  onDecrease: (productId: string) => void
  onRemove: (productId: string) => void
  className?: string
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  className,
}) => {
  const subtotal = (item.price * item.quantity).toFixed(2)
  const decreaseLabel =
    item.quantity > 1
      ? `Decrease quantity of ${item.name}`
      : `Decrease quantity of ${item.name} and remove it from cart`

  return (
    <li
      className={cn(
        'flex flex-wrap items-center gap-4 p-4 rounded-lg border border-border-structural bg-surface-base-secondary',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-text-primary font-medium truncate">{item.name}</h3>
        <p className="text-text-secondary text-sm mt-0.5">${item.price.toFixed(2)} each</p>
      </div>

      <div
        className="flex items-center gap-2 shrink-0"
        role="group"
        aria-label={`Change quantity of ${item.name}`}
      >
        <Button
          type="secondary"
          size={ButtonSize.MEDIUM}
          onClick={() => onDecrease(item.productId)}
          aria-label={decreaseLabel}
        >
          <span aria-hidden="true">−</span>
        </Button>
        <output
          className="w-8 text-center text-text-primary font-medium"
          aria-label={`Quantity of ${item.name}`}
        >
          {item.quantity}
        </output>
        <Button
          type="secondary"
          size={ButtonSize.MEDIUM}
          onClick={() => onIncrease(item.productId)}
          aria-label={`Increase quantity of ${item.name}`}
        >
          <span aria-hidden="true">+</span>
        </Button>
      </div>

      <div className="w-28 text-right shrink-0">
        <span className="block text-xs text-text-secondary">Subtotal</span>
        <span className="text-text-primary font-medium">${subtotal}</span>
      </div>

      <Button
        type="secondary"
        size={ButtonSize.SMALL}
        onClick={() => onRemove(item.productId)}
        aria-label={`Remove ${item.name} from cart`}
      >
        Remove
      </Button>
    </li>
  )
}

export default CartItem
