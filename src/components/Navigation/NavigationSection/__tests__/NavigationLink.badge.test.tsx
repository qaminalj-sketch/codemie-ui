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

import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { IconType } from '../../constants'
import NavigationLink, { NavigationLinkItem } from '../NavigationLink'

vi.hoisted(() => vi.resetModules())

const { mockAppInfoStore } = vi.hoisted(() => ({
  mockAppInfoStore: { navigationExpanded: false },
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return { ...actual, useMatch: vi.fn(() => null), useMatches: vi.fn(() => []) }
})

vi.mock('valtio', () => ({
  proxy: (obj: any) => obj,
  useSnapshot: vi.fn((store) => store),
  subscribe: vi.fn(),
}))

vi.mock('@/store/appInfo', () => ({
  appInfoStore: mockAppInfoStore,
}))

const cartItem: NavigationLinkItem = {
  label: 'Shopping Cart',
  icon: IconType.DOCUMENT,
  route: '/cart',
  badge: '3',
  persistentBadge: true,
  ariaLabel: 'Shopping Cart, 3 items',
}

const newItem: NavigationLinkItem = {
  label: 'AI Katas',
  icon: IconType.KATA,
  route: '/katas',
  badge: 'NEW',
}

const renderLink = (item: NavigationLinkItem) =>
  render(
    <BrowserRouter>
      <NavigationLink item={item} />
    </BrowserRouter>
  )

describe('NavigationLink badges', () => {
  beforeEach(() => {
    mockAppInfoStore.navigationExpanded = false
  })

  describe('persistent badge', () => {
    it('stays visible over the icon when navigation is collapsed', () => {
      renderLink(cartItem)

      const badge = screen.getByText('3')
      expect(badge).toHaveClass('opacity-100', 'top-0.5', 'right-0.5')
      expect(badge).not.toHaveClass('opacity-0', 'right-[5px]')
    })

    it('sits beside the label when navigation is expanded', () => {
      mockAppInfoStore.navigationExpanded = true
      renderLink(cartItem)

      const badge = screen.getByText('3')
      expect(badge).toHaveClass('opacity-100', 'right-[5px]')
      expect(badge).not.toHaveClass('top-0.5')
    })
  })

  describe('regular badge', () => {
    it('is hidden when navigation is collapsed', () => {
      renderLink(newItem)

      expect(screen.getByText('NEW')).toHaveClass('opacity-0', 'right-[5px]')
    })

    it('is visible when navigation is expanded', () => {
      mockAppInfoStore.navigationExpanded = true
      renderLink(newItem)

      expect(screen.getByText('NEW')).toHaveClass('opacity-100', 'right-[5px]')
    })
  })

  describe('ariaLabel', () => {
    it('uses ariaLabel as the accessible name', () => {
      mockAppInfoStore.navigationExpanded = true
      renderLink(cartItem)

      expect(screen.getByRole('link', { name: 'Shopping Cart, 3 items' })).toBeInTheDocument()
    })

    it('uses ariaLabel as the tooltip when navigation is collapsed', () => {
      renderLink(cartItem)

      expect(screen.getByRole('link')).toHaveAttribute(
        'data-tooltip-content',
        'Shopping Cart, 3 items'
      )
    })

    it('does not set aria-label when ariaLabel is not provided', () => {
      renderLink({ label: 'Chat', icon: IconType.CHAT, route: '/chat' })

      expect(screen.getByRole('link')).not.toHaveAttribute('aria-label')
    })
  })
})
