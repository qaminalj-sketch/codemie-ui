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
import { Product } from '@/types/entity/product'
import { cn } from '@/utils/utils'

interface ProductCardProps {
  product: Product
  onAddToCart: (productId: string) => void
  className?: string
}

// aria-disabled is used instead of native `disabled` on purpose: a disabled button cannot be
// focused or activated, so the unavailable-product message (AC-07) would never be reachable.
// The button stays focusable and Enter/Space/click still call onAddToCart, where the cart store
// rejects the product and shows the toast. Hover/active styles are neutralised so it looks inert.
const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, className }) => (
  <article
    aria-label={product.name}
    className={cn(
      'flex flex-col gap-3 p-4 rounded-lg border border-border-structural bg-surface-base-secondary',
      className
    )}
  >
    <div className="flex-1">
      <h3 className="text-text-primary font-medium">{product.name}</h3>
      {product.description && (
        <p className="text-text-secondary text-sm mt-1 line-clamp-2">{product.description}</p>
      )}
    </div>

    <div className="flex items-center justify-between mt-auto">
      <span className="text-text-primary font-semibold">${product.price.toFixed(2)}</span>
      <Button
        type={product.available ? 'primary' : 'base'}
        size={ButtonSize.SMALL}
        aria-disabled={!product.available || undefined}
        className={cn(
          !product.available &&
            'cursor-not-allowed opacity-50 hover:bg-surface-base-secondary active:bg-surface-base-secondary'
        )}
        onClick={() => onAddToCart(product.id)}
        aria-label={
          product.available
            ? `Add ${product.name} to cart`
            : `${product.name} is currently unavailable`
        }
      >
        {product.available ? 'Add to Cart' : 'Unavailable'}
      </Button>
    </div>
  </article>
)

export default ProductCard
