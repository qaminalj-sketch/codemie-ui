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

import { Product } from '@/types/entity/product'

/**
 * Static product catalogue for the front-end-only shopping cart POC (EPMCDMETST-66906).
 * There is no products backend; both available and unavailable entries are included so
 * adding (AC-01) and the unavailable-product guard (AC-07) can be exercised.
 */
export const PRODUCTS: readonly Product[] = [
  {
    id: 'prod-keyboard',
    name: 'Mechanical Keyboard',
    price: 89.99,
    available: true,
    description: 'Tenkeyless keyboard with tactile switches',
  },
  {
    id: 'prod-mouse',
    name: 'Wireless Mouse',
    price: 29.5,
    available: true,
    description: 'Ergonomic mouse with silent clicks',
  },
  {
    id: 'prod-monitor',
    name: '27" 4K Monitor',
    price: 349,
    available: false,
    description: 'IPS panel with USB-C power delivery',
  },
  {
    id: 'prod-headset',
    name: 'Noise-Cancelling Headset',
    price: 129.95,
    available: true,
    description: 'Over-ear headset with boom microphone',
  },
  {
    id: 'prod-webcam',
    name: 'HD Webcam',
    price: 59,
    available: false,
    description: '1080p webcam with privacy shutter',
  },
  {
    id: 'prod-dock',
    name: 'USB-C Docking Station',
    price: 149.99,
    available: true,
    description: 'Dual display output with 100W charging',
  },
]
