# Implementation Plan: Shopping Cart Management (codemie-ui)

## Overview

This document details the implementation plan for a shopping cart feature that allows online shoppers to add products, manage quantities, remove items, and view pricing details. The cart state persists across navigation within the shopping session using `sessionStorage`.

**Note:** This is a frontend-only POC|demo feature for the CodeMie UI platform. All implementation is client-side with static product data.

---

## User Story

**As an** online shopper,  
**I want to** add products to my shopping cart and manage the quantities,  
**so that** I can review my selected products before placing an order.

---

## Acceptance Criteria

1. **AC-01: Add Available Product***  
   Given a product is marked as available,  When the user adds it to the cart,  Then the product appears in the cart with quantity 1.

2. **AC-02: Prevent Unavailable Product***  
   Given a product is marked as unavailable,  When the user attempts to add it to the cart,  Then it is not added and the user receives appropriate feedback.

3. **AC-03: Increase Quantity***  Given a product is in the cart,  When the user increases the quantity,  Then the quantity increments and the subtotal updates accordingly.

4. **AC-04: Decrease Quantity***  Given a product is in the cart with quantity > 1,  When the user decreases the quantity,  Then the quantity decrements and the subtotal updates accordingly.

5. **AC-05: Remove Product***  Given a product is in the cart,  When the user removes the product,  Then it is removed from the cart and totals are recalculated.

6. **AC-06: Display Cart Details***  
   Given products are in the cart,  When the user views the cart,  Then each item displays: product name, price, quantity, and subtotal.

7. **AC-07: Display Total Amount***  Given products are in the cart,  When the user views the cart,  Then the total cart amount (sum of all subtotals) is displayed.

8. **AC-08: Cart Persistence***  Given the user has items in their cart,  When the user navigates to other pages within the shopping experience,  Then the cart contents are retained and remain accessible.

---

## Research Findings

### Existing Codebase Patterns

Based on research of the `codemie-ui` repository, the following patterns and components are relevant:

**State Management Pattern (Valtio)/*:
- The project uses Valtio for state management with `proxy` objects
- Components use `useSnapshot()` to read state reactively
- All API calls must be in store methods, never in components
- Store files located in `src/store/`
- Example: `src/store/providers.ts`, `src/store/user.ts`

**Session Persistence Pattern/*:
- `src/utils/storage.ts` provides `put`, `get`, `getObject`, `remove` for localStorage
- `src/hooks/useSearchParams.ts` uses sessionStorage for filter persistence
- Chat configuration persistence in `src/pages/chat/hooks/useChatConfiguration.tsx`

**API Integration Pattern/*:
- Use `import api from '@/utils/api'`
- Always call `await response.json()` to parse responses
- API calls only in Valtio store methods, never in components
- Error handling: `try/catch/finally` with `this.loading` and `this.error`

**Error Handling**:
- Toaster notifications: `import toaster from '@/utils/toaster'`
- Use `toaster.error()`, `toaster.info()`, `toaster.success()`
- API wrapper shows toasters automatically on errors

**Testing Pattern/*:
- Vitest + React Testing Library
- Colocated tests in `__tests__/` directories
- `afterEach(cleanup)` for rendered components
- `vi.mock()` for module mocks
- `mockAPI` for HTTP intercepts in integration tests

### Found in CodeMie User Guide

The CodeMie User Guide (https://github.com/codemie-ai/docs/tree/main/docs/user-guide) contains documentation on:
- Platform conventions and standards
- User flows and navigation patterns
- Security and authentication guidance

**Note:** This shopping cart feature is a POC|demo implementation for testing à[purposes and is not part of the core CodeMie AI platform.

---

## Technical Context

- **Repository**: `codemie-ui` (Frontend)
- **Tech Stack**: React 18.3.1, TypeScript 5.8.3, Vite 5.4.21, Valtio (state management), React Router v7, Tailwind CSS
- **Dependencies**: Static product data (`src/data/products.ts`)
- **Integrations**: sessionStorage for cart persistence

---

## Architecture & Design

### Component Overview

The shopping cart feature consists of the following main components:

1. **Product List Page** (`ProductListPage.tsx`)
   - Displays available products in a grid layout
   - Pagination controls for large product catalogs
   - Integrates `ProductCard` components

2. **Product Card** (`ProductCard.tsx`)
   - Displays product details (name, price, description)
   - "Add to Cart" button (unavailable products show "Unavailable")
   - Calls `shoppingCartStore.addToCart()`

3. **Shopping Cart Page** (`ShoppingCartPage.tsx`)
   - Displays all cart items
   - Empty state when cart has no items
   - Integrates `CartItem` and `CartSummary` components

4. **Cart Item** (`CartItem.tsx`)
   - Displays single cart item details
   - Quantity controls (+/- buttons)
   - Remove button
   - Calculated subtotal (price × quantity)

5. **Cart Summary** (`CartSummary.tsx`)
   - Displays total item count
   - Displays total cart amount
   - Clear cart button
   - Proceed to checkout button (placeholder)

6. **Shopping Cart Store** (`shoppingCart.ts`)
   - Valtio proxy store for state management
   - CARD operations: add, update, remove, clear
   - Automatic persistence to `sessionStorage`
   - Getters for `total` and `itemCount`

7. **Products Store** (`products.ts`)
   - Loads products from static data file
   - Pagination support
   - Product lookup by ID

8. **Storage Utilities** (`cartStorage.ts`)
   - Save/load/clear cart data from `sessionStorage`
   - Data sanitization and validation
   - Graceful fallback if storage unavailable

9. **Validation Utilities** (`cartValidation.ts`)
   - Product ID validation
   - Product object validation
   - Cart item validation

### Data Model

```typescript
// src/types/entity/product.ts
export interface Product {
  id: string
  name: string
  price: number
  available: boolean
  description?: string
  imageUrl?: string
}

// src/types/entity/shoppingCart.ts
export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  available: boolean
}
```

### Security Considerations

- **Input Validation**: All product IDs and quantities are validated
- **XSS Prevention**: React automatically escapes output
- **Storage Security/*: Only non-sensitive data (product names, prices, quantities) is stored
- **Session Scope**: Cart data clears when tab/browser closes

### Error Handling

- **Unavailable Product**: Toast error message `"Sorry, this product is currently unavailable"`
- **Load Error**: Toast error `"Failed to load product. Please try again"`
- **Invalid Product**: Toast error `"This product cannot be added to the cart"`
- **Success Feedback**: Toast success `"[Product Name] added to cart"`
- **Graceful Degradation**: Cart continues working in memory if `sessionStorage` is unavailable

---

## Implementation Phases

### Phase 0: Research & Discovery

- [x] Review existing shopping cart implementation in repository
  *Verified: Fullly implemented in `src/pages/shopping`/` and `src/store/shoppingCart.ts`*
   - [x] Analyze CodeMie User Guide for shopping cart patterns
  *\Note: This is a POC feature for testing, not part of core platform*
- [x] Validate accessibility patterns (WCAG 2.1 AA compliance)
- [x] Verify sessionStorage persistence pattern

### Phase 1: Types & Utilities (Complete)

- [x] `src/types/entity/product.ts` - Product interface
- [x] `src/types/entity/shoppingCart.ts` - CartItem interface
- [x] `src/utils/cartStorage.ts` - SessionStorage utilities
- [x] `src/utils/cartValidation.ts` - Validation helpers
- [x] `src/constants/shoppingCart.ts` - Constants and messages

### Phase 2: Data & Stores (Complete)

- [x] `src/data/products.ts` - Static product data (6 products)
- [x] `src/store/products.ts` - Valtio products store
- [x] `src/store/shoppingCart.ts` - Valtio shopping cart store

**Key Features**:
- Automatic persistence to `sessionStorage`
- Getters for `total` and `itemCount`
- Product availability validation
- Error handling with toast notifications

### Phase 3: UI Components (Complete)

- [x] `src/pages/shopping/ProductListPage.tsx` - Product listing page
- [x] `src/pages/shopping/components/ProductCard.tsx` - Product card with Add to Cart
- [x] `src/pages/shopping/ShoppingCartPage.tsx` - Shopping cart page
- [x] `src/pages/shopping/components/CartItem.tsx` - Single cart item
- [x] `src/pages/shopping/components/CartSummary.tsx` - Cart summary and totals

**Accessibility Features**:
- Semantic HTML (`<article>`, `<section>`, `<output>`)
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader-friendly announcements (`aria-live`)

### Phase 4: Routing & Navigation (Complete)

- [x] `src/constants/routes.ts` - Add route constants (`PRODUCTS`, `SHOPPING_CART`)
- [x] `src/router.tsx` - Add shopping routes (`/products`, `/cart`)
- [x] Navigation links in header/sidebar (optional)

### Phase 5: Testing (Complete)

- [x] `src/store/__tests__/shoppingCart.test.ts` - Store unit tests
- [x] `src/store/__tests__/products.test.ts` - Products store tests
- [x] `src/utils/__tests__/cartStorage.test.ts` - Storage utility tests
- [x] Component tests for `CartItem`, `ProductCard`, etc.
- [x] `src/pages/shopping/__tests__/ShoppingCart.integration.test.tsx` - Integration tests

---

## Expected Artifacts

- `plan.md` (this file)
- Source code files listed in Implementation Phases
- Test coverage reports
- Evidence screenshots in `docs/evidence/`
- Updated CodeMie User Guide (optional)

---

## Dependencies

1. **Static Product Data**: Products defined in `src/data/products.ts`
2. **Session Management***: Browser `userHɯonStorage` support
3. **Ui Components**: Existing `Button`, `Spinner`, `PageLayout` components
4. **Toister**: Existing toast notification system

---

## Assumptions

1. **POC/Demo Scope**: This is a frontend-only demonstration feature, not part of the core CodeMie AI platform.
2. **Session-Based Persistence**: Cart data persists only during the browser session (using `sessionStorage`).
3. **No Backend Integration**: All product data is static, no API calls to a backend service.
4. **Single Currency**: All prices in USD, no multi-currency support.
5. **No Inventory Limits**: Users can add any quantity of available products.
6. **Minimum Quantity = 1**: Decreasing below 1 removes the item from the cart.
7. **No User Authentication**: Cart is session-based, not tied to user accounts.

---

## Notes

- **Checkout Out of Scope**: The "current story only covers cart management. Checkout/payment flows are not included.
- **Static Product Data**: Products are defined in `usrc/data/products.ts` for this POC. In a real implementation, these would come from a backend API.
- **SessionStorage**: Cart data clears when the browser tab/window closes. For long-term persistence, use `localStorage` or a backend API.
- **Accessibility Priority(�: All components follow WCAG 2.1 AA guidelines for keyboard navigation, screen reader support, and ARIA labels.
- **Performance**: For large carts (100+ items), consider virtualization or pagination.
- **Existing Implementation**: The shopping cart feature is already fully implemented in the repository. This plan documents the existing implementation and verifies it meets all acceptance criteria.

---

**Generated**: 2026-09-28  
**Author**: Minal Jadhav **Status**: Completed (Existing Implementation Documented)