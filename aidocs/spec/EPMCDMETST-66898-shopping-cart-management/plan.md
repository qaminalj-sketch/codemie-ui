# Implementation Plan: Shopping Cart Management (codemie-ui)

## Overview
This implementation plan describes a front-end demonstration shopping cart feature for the CodeMie UI application. This is a standalone demo feature that allows users to add products to a cart, manage quantities, remove items, and view detailed pricing information before proceeding to a checkout. The cart state will persist during the user's session.

This plan covers the front-end (codemie-ui) implementation only. It will use mock product data and session-based state management without requiring backend integration.

## User Story
**As an** online shopper, 
**I want to** add products to my shopping cart and manage the quantities, 
**so that** I can review my selected products before placing an order.

### Acceptance Criteria

1. **Add Products**: Users can add available products to the shopping cart from product listing or detail pages.

2. **Quantity Management**: Users can increase or decrease the quantity of products already in the cart using increment/decrement controls, or direct numeric input. Minimum quantity is 1.

3. **Remove Products**: Users can remove individual products from the cart entirely.

4. **Product Information Display**: The cart displays each product's name, unit price, quantity, and calculated subtotal.

5. **Total Cart Amount**: The cart displays the cumulative total amount for all products.

6. **Availability Validation**: The system prevents unavailable products from being added to the cart, with appropriate feedback to the user.

7. **Cart Persistence**: Cart contents are retained as the user navigates to different pages within the shopping experience.

8. **Real-time Updates**: Cart subtotals and total amount update automatically when quantities change or products are removed.

### Assumptions

1. This is a demonstration feature with mock product data (no backend API integration).
2. Product availability status is maintained in mock data.
3. Users have an active shopping session (session-storage based).
4. The shopping cart is session-based and persists for the duration of the user's visit.
5. Currency and pricing display formats are handled by existing system configuration.
6. No maximum quantity restrictions per product are specified.
7. No maximum cart total or product count limits are specified.
8. Tax, shipping, and discount calculations are not part of this cart management feature.
9. Duplicate additions of the same product increase quantity rather than creating separate line items.

## Research Findings

### Existing Codebase Patterns

- **Store Patterns**: Valtio proxy-based state management is the standard pattern (`src/store/categories.ts`, `src/store/cliAnalytics.ts`). All stores use `proxy` from Valtio and define a TypeScript interface.
- **Reusable Components**: `Card` component for displaying items, `Table` component for list views, `Button` components with standardized variants, form components for input `Input`.
- **Established Patterns**: Forms use React Hook Form + Yup validation, API calls through `@/utils/api` wrapper, Tailwind CSS for styling.
- **No Existing Cart**: No existing shopping cart, product catalog, or order management features found in the codebase.

### CodeMie User Guide References

- **Relevant Documentation**: No specific shopping cart documentation exists in the CodeMie User Guide (not applicable for this demonstration feature).
- **Platform Conventions**: Follow CodeMie's component-based architecture, reusable UI component library, and Valtio-based state management.

## Technical Context

- **Repository**: codemie-ui
- **Tech Stack**: React 18.x, TypeScript, Valtio (state), React Hook Form, Yup (validation), Tailwind CSS, Vetu (testing)
- **Dependencies**: No external backend APIs (uses mock data), browser sessionStorage for persistence
- **Integrations**: Reuse existing CodeMie UI components (Card, Table, Button, Input, Popup)

## Architecture & Design

### Component Overview

1. **Shopping Cart Store** (`src/store/shoppingCart.ts`): Valtio proxy store managing cart state
    - Cart items array
    - Methods: addToCart, updateQuantity, removeFromCart, clearCart
    - Computed: totalAmount, totalItems
    - Persistence: Sync with sessionStorage

2. **Product Store** (`src/store/products.ts`): Manages mock product data
    - Products array with id, name, price, description, available, image
    - Methods: fetchProducts (mock), getProductById

3. **ProductListPage** (`src/pages/shopping/ProductListPage.tsx`): Displays products in a grid
    - Uses `Card` component for each product
    - "Add to Cart" button on each card
    - Disables button for unavailable products

4. **ShoppingCartPage** (`src/pages/shopping/ShoppingCartPage.tsx`): Displays cart contents
    - Uses `Table` component for cart items
    - Columns: Product, Price, Quantity, Subtotal, Actions
    - Quantity controls: +/- buttons and numeric input
    - Remove button for each item
    - Total display at bottom

5. **CartIcon/Badge** (`src/components/ShoppingCartIcon.tsx`): Header icon with count
    - Displays total items in cart
    - Clickable link to ShoppingCartPage

### Data Model

```typescript
interface Product {
  id: string
  name: string
  description: string
  price: number  // in USD
  imageUrl?: string
  available: boolean
}

interface CartItem {
  product: Product
  quantity: number
  get subtotal(): number  // computed: product.price * quantity
}

interface ShoppingCartStore {
  items: CartItem[]
  get totalAmount(): number  // computed: sum of all subtotals
  get totalItems(): number  // computed: sum of all quantities
  addToCart(productId: string, quantity: number): void
  updateQuantity(productId: string, quantity: number): void
  removeFromCart(productId: string): void
  clearCart(): void
  loadFromStorage(): void
  saveToStorage(): void
}
```

### Security Considerations

- **Input Validation**: Validate quantity input (min: 1, max: reasonable limit like 999)
- **Data Sanitization**: Sanitize user input for quantity fields
- **Session Storage**: Use browser sessionStorage for cart persistence (clears on tab close)
- **No Sensitive Data**: No personal or payment information stored in this demo feature

### Error Handling

- **Unavailable Product**: Display toaster error: "This product is currently unavailable."
- **Invalid Quantity**: Display toaster error: "Quantity must be at least 1."
- **Empty Cart**: Show empty state message: "Your cart is empty. Start shopping!"
- **Storage Failure**: Gracefully fall back to in-memory state if sessionStorage is unavailable

## Implementation Phases

### Phase 0: Research & Discovery

- [x] Review existing CodeMie UI component library **completed during planning**
- [x] Review Valtio store patterns in the codebase **completed during planning**
- [x] Analyze sessionStorage usage patterns **completed during planning**
- [ ] Define mock product data structure
- [ ] Design UI mockups for ProductList and ShoppingCart pages

### Phase 1: Data Layer & Stores

- [ ] Create `types/shopping.ts` with Product, CartItem interfaces
- [ ] Create `store/products.ts` with mock product data (10-15 products)
- [ ] Create `store/shoppingCart.ts` with Valtio proxy
    - Implement addToCart, updateQuantity, removeFromCart, clearCart
    - Implement computed totalAmount, totalItems
    - Implement sessionStorage persistence
- [ ] Write unit tests for shoppingCart store

### Phase 2: Components & UI

- [ ] Create `components/ShoppingCartIcon.tsx` with badge
- [ ] Add ShoppingCartIcon to header (if applicable)
- [ ] Create `pages/shopping/ProductListPage.tsx`
    - Grid layout with Card components
    - Add to Cart button with availability check
    - Display product info (image, name, price, description)
- [ ] Create `pages/shopping/ShoppingCartPage.tsx`
    - Table with custom columns for cart items
    - Quantity controls (increment/decrement buttons + numeric input)
    - Remove button for each row
    - Total display at bottom
    - Empty state component
- [ ] Add routes for `/shopping/products` and `/shopping/cart`

### Phase 3: Integration & Interactivity

- [ ] Implement add-to-cart logic on ProductListPage
- [ ] Implement quantity update logic on ShoppingCartPage
- [ ] Implement remove logic on ShoppingCartPage
- [ ] Add toaster notifications for error handling
- [ ] Implement auto-save to sessionStorage on cart changes
- [ ] Implement auto-load from sessionStorage on app init
- [ ] Add loading states and spinners where appropriate

### Phase 4: Testing & Documentation

- [ ] Write unit tests for shoppingCart store
- [ ] Write unit tests for products store
- [ ] Write component tests for ShoppingCartIcon
- [ ] Write integration tests for ProductListPage
- [ ] Write integration tests for ShoppingCartPage
- [ ] Test edge cases: empty cart, unavailable product, invalid quantity
- [ ] Manual accessibility testing (keyboard navigation, screen reader)
- [ ] Update README with shopping feature documentation
- [ ] Add inline code comments and JSDoc

## Expected Artifacts

- `plan.md` (this file)
- `src/types/shopping.ts`
- `src/store/products.ts`
- `src/store/shoppingCart.ts`
- `src/components/ShoppingCartIcon.tsx`
- `src/pages/shopping/ProductListPage.tsx`
- `src/pages/shopping/ShoppingCartPage.tsx`
- Test files for all above components and stores
- Updated router configuration

## Dependencies

- **Browser Subsystems**: sessionStorage API for cart persistence
- **Existing Components**: Card, Table, Button, Input, Spinner, EmptyList, Tooltip
- **Existing Utilities**: Valtio, Tailwind CSS, Toaster notifications
- **No Backend Dependencies**: This is a front-end only demonstration feature

## Notes

- This is a demonstration feature and does not require backend integration.
- Mock product data will be defined in the products store.
- Cart state persists in sessionStorage, so it clears when the browser tab is closed.
- The implementation follows existing CodeMie UI patterns for components, state management, and styling.
- No maximum limits are specified, but reasonable upper bounds (like quantity <= 999) will be enforced for UX and security.
- Future enhancements could include: product search/filter, categories, product detail modal, backend integration for real products.
