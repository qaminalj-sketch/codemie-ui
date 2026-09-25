# Technical Design — Shopping Cart Management

**Story**: EPMCDMETST*66607  
**Title**: Shopping cart management: add/manage products, validate availability, show totals, persist across session  
**Author**: Design Architecture Agent  
**Date**: 2024-12-19  
**Status**: Draft

---

## 1. Story Details

### Jira Story Key
EPMCDMETST-66607

### Story Title
Shopping cart management: add/manage products, validate availability, show totals, persist across session

### Objective
Enable online shoppers to add products to a shopping cart, manage quantities, review totals, and have their cart persist across navigation within the shopping session.

### Acceptance Criteria

**AC1**: Given a product is available, when user adds it, then it appears in cart with qty=1 and totals update.

**AC2**: Given a product is unavailable, when user attempts to add, then it is not added and a message is shown.

**AC3**: Given a product is in cart, when user increases qty, then qty increments and subtotal/total recalc.

**AC4**: Given qty>1, when user decreases qty, then qty decrements and subtotal/total recalc.

**AC5**: Given a product is in cart, when user removes it, then it disappears and totals recalc.

**AC6**: Given user views cart, then show name, unit price, qty, subtotal per item and total amount.

**AC7**: Given user navigates between pages, then cart contents persist within the session.

---

## 2. Scope

### In Scope

- **Cart State Management**: Create Valtio store for cart state with items, quantities, and totals
- **Add to Cart**: Validate product availability before adding with qty=1
- **Quantity Management**: Increase/decrease quantity with minimum qty=1; remove item if decreased to 0
- **Remove from Cart**: Remove individual items from cart
- **Cart Display**: Show product name, unit price, quantity, subtotal per item, and total amount
- **Real-time Calculations**: Automatic recalculation of subtotals and totals on quantity changes
- **Session Persistence**: Persist cart contents via Valtio store across navigation (optional API backend)
- **Availability Validation**: Prevent adding unavailable products with user feedback
- **Toast Notifications**: User feedback for validation failures and cart operations

### Out of Scope

- Checkout process and payment integration
- P�duct catalog/listing pages (products assumed to be available elsewhere)
- Multi-currency support
- Discount codes or promotions
- Shipping calculations
- Tax calculations
- Cart sharing across devices/sessions
- Product recommendations
- Recently viewed items
- Wishlist functionality
- Stock quantity checks beyond availability flag

---

## 3. Existing Architecture

This section describes only the repository architecture relevant to implementing the shopping cart feature.

### State Management Pattern

The application uses **Valtio** for state management:

- **Store location**: `src/store/` — do not create nested folders
- **Pattern**: `proxy<StoreType>({...})` — auto-reactive global state
- **Component consumption**: `useSnapshot(store)` creates frozen read-only snapshots
- **API calls**: All API calls happen inside store methods only, never in components
- **Response parsing**: Always use `await response.json()` (not Axios `.data` pattern)

**Reference pattern from existing stores** (`src/store/assistants.ts`):

```typescript
import { proxy } from 'valtio'
import api from '@/utils/api'

interface AssistantsStoreType {
  assistants: Assistant[]
  loading: boolean
  error: string | null
  indexAssistants: (filters?: Record<string, any>) => Promise<void>
}

export const assistantsStore = proxy<AssistantsStoreType>({
  assistants: [],
  loading: false,
  error: null,

  async indexAssistants(filters = {}) {
    this.loading = true
    this.error = null
    try {
      const response = await api.get('v1/assistants', { params: filters })
      const data = await response.json()
      this.assistants = data.assistants
    } catch (error: any) {
      this.error = error.message
      console.error('Store Error (indexAssistants)', error)
    } finally {
      this.loading = false
    }
  },
})
```

### Component Organization

**Feature folder convention** (`src/pages/<feature>/`):

```
src/pages/cart/
  ShoppingCartPage.tsx       # Main cart view page
  components/
    CartItem.tsx
    CartItemList.tsx
    CartSummary.tsx
  __tests__/
    ShoppingCartPage.test.tsx
```

### Routing

Routes defined in `src/router.tsx`:

- Route IDs stored as constants in `src/constants/routes.ts`
- Routes grouped by feature as `const <feature>Routes: RouteObject[]`
- Spread into root `children` array

### User Feedback Pattern

**Toast notifications** via `src/utils/toaster.ts`:

```typescript
import { toaster } from '@/utils/toaster'

// Success
toaster.success('Product added to cart')

// Error
toaster.error('Product is unavailable')

// Warning
toaster.warning('Cart is empty')
```

### Existing Reusable Components

From `src/components/`:

- **Button**: Primary, secondary, text variants; loading state support
- **Popup**: Modal wrapper (never use PrimeReact Dialog directly)
- **Spinner**: Loading indicator; `inline` prop for inline usage
- **Input / Textarea**: Form inputs with error state
- Tailwind CSS only — do not use custom CSS or inline styles

---

## 4. Proposed Solution

### High-Level Approach

Implement a shopping cart feature using the existing Valtio state management pattern with optional API backend integration. The solution follows the established architecture:

1. **Cart Store** (`src/store/cart.ts`): Valtio proxy holding cart items, quantities, totals, and cart operations
2. **Cart Components** (`src/pages/cart/components/`): React components for cart display and item management
3. **Cart Page** (`src/pages/cart/ShoppingCartPage.tsx`): Dedicated cart view route
4. **Session Persistence**: Cart state persists via Valtio global store across navigation (optional API backend)
5. **Product Availability Check**: Validate `product.availability` flag before allowing add-to-cart
6. **Real-time Calculations**: Automatic subtotal/total recalculation on quantity changes

### Architecture Decision: Optional Backend API

This is a **demo/SDLC workflow** implementation. The solution supports:

- **Option A (Recommended)**: Client-side only (Valtio store) — no backend required
- **Option B**: Backend API integration (as described in `plan.md`) — optional enhancement

For the demo, we'll implement **Option A** (client-side only) to eliminate backend dependencies. The store design supports easy migration to API-backed state if needed later.

---

## 5. Components / Modules

### New Files

#### **Store**

**`src/store/cart.ts`**

Valtio store managing cart state:

```typescript
interface CartStoreType {
  items: CartItem[]                      // Array of cart items
  loading: boolean                     // Loading state for async operations
  error: string | null                 // Error message
  addItem: (product: Product) => void    // Add product to cart
  removeItem: (productId: string) => void // Remove product from cart
  increaseQuantity: (productId: string) => void // Increase qty by 1
  decreaseQuantity: (productId: string) => void // Decrease qty by 1
  clearCart: () => void                  // Empty cart
  getSubtotal: (productId: string) => number // Calculate item subtotal
  getTotal: () => number                 // Calculate cart total
}

interface CartItem {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  availability: boolean // Copied from product for validation
}
```

**Responsibilities**:

- Maintain cart items array with quantities
- Validate product availability before adding
- Enforce minimum quantity = 1 (remove item if decreased to 0)
- Calculate subtotals (unitPrice × quantity) and total (sum of subtotals)
- Show toast notifications for validation failures and cart operations

#### **Types**

**`src/types/entity/cart.ts`**

Type definitions:

```typescript
export interface Product {
  id: string
  name: string
  price: number
  availability: boolean
  description?: string
  imageUrl?: string
}

export interface CartItem {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  availability: boolean
}
```

#### **Components**

**`src/pages/cart/components/CartItem.tsx`**

Individual cart item row:

- Displays product name, unit price, quantity, subtotal
- Quantity controls: increase (+), decrease (-), remove (×) buttons
- Disables controls during loading
- Shows availability indicator (visual feedback if product becomes unavailable)
- Calls `cartStore.increaseQuantity`, `cartStore.decreaseQuantity`, `cartStore.removeItem`

**`src/pages/cart/components/CartItemList.tsx`**

List container for cart items:

- Renders list of `CartItem` components
- Handles empty state when `items.length === 0`
- Subscribes to `cartStore` via `useSnapshot`

**`src/pages/cart/components/CartSummary.tsx`**

Cart totals summary:

- Displays total amount (sum of all item subtotals)
- Shows item count
- Can include "Proceed to Checkout" button placeholder (out of scope for this story)

#### **Pages**

**`src/pages/cart/ShoppingCartPage.tsx`**

Route-level cart view page:

- Mounts `<CartItemList />` and `<CartSummary />` components
- Breadcrumb or back navigation to shopping pages
- Page title: "Sdopping Cart"

**Optional**: If products are displayed elsewhere (e.g., ProductListPage), add "Add to Cart" button that calls `cartStore.addItem(product)`.

#### **Routes**

**`src/router.tsx`** addition:

```typescript
const cartRoutes: RouteObject[] = [
  {
    path: '/cart',
    element: <ShoppingCartPage />,
    // ErrorBoundary, auth guards as needed
  },
]

// Spread into root children array
```

**`src/constants/routes.ts`** addition:

```typescript
export const SHOPPING_CART = 'shopping-cart'
```

---

## 6. Data Model

### CartItem

Represents a single item in the shopping cart:

```typescript
interface CartItem {
  productId: string      // Unique product identifier
  productName: string    // Product display name
  unitPrice: number      // Price per unit
  quantity: number       // Number of units (min: 1)
  availability: boolean  // Availability flag (copied from product)
}
```

**Fields**:

- `productId`: Primary key; used to find/update/remove item
- `productName`: Display name; shown in cart UI
- `unitPrice`: Price per unit; used in subtotal calculation
- `quantity`: Number of units; min = 1; if decreased to 0, item is removed
- `availability`: Availability flag; copied from product at add-time; used for validation and visual feedback

**Validation Rules**:

- `quantity >= 1` (enforced by `decreaseQuantity` removing item at qty=0)
- Only products with `availability: true` can be added

---

## 7. Data Flow

### Add Product to Cart

```
User clicks "Add to Cart" on ProductCard/ProductPage
  ↓
cartStore.addItem(product)
  ↓
Validate: product.availability === true
  ↓ (if false)
  toaster.error('Product is unavailable')
  return
  ↓ (if true)
Check if product already in cart (by productId)
  ↓ (if yes)
  increaseQuantity(productId)
  ↓ (if no)
  items.push({ productId, productName, unitPrice, quantity: 1, availability: true })
  ↓
toaster.success('Product added to cart')
```

### Increase Quantity

```
User clicks "+" button on CartItem
  ↓
cartStore.increaseQuantity(productId)
  ↓
Find item by productId
  ↓
item.quantity += 1
  ↓
Recalculate subtotal and total (getters)
  ↓
UI re-renders with updated quantity and totals (via useSnapshot reactivity)
```

### Decrease Quantity

```
User clicks "-" button on CartItem
  ↓
cartStore.decreaseQuantity(productId)
  ↓
Find item by productId
  ↓
if (item.quantity > 1)
  item.quantity -= 1
else
  removeItem(productId) // Removes item if qty would become 0
  ↓
Recalculate subtotal and total
  ↓
UI re-renders
```

### Remove Item

```
User clicks "×" (remove) button on CartItem
  ↓
cartStore.removeItem(productId)
  ↓
items = items.filter(item => item.productId !== productId)
  ↓
toaster.success('Product removed from cart')
  ↓
UI re-renders
```

### Cart Persistence Across Navigation

```
User navigates from ProductListPage to ProductDetailPage
  ↓
Cart state remains in Valtio cartStore (global state)
  ↓
User navigates to ShoppingCartPage
  ↓
useSnapshot(cartStore) reads current cart.items
  ↓
Cart displays all items added during session
```

**Note**: This is in-memory persistence across navigation. If page is refreshed, cart state is lost (unless API backend or `sessionStorage` is added).

---

## 8. Validation and Error Handling

### Product Availability Validation

**Rule**: Only products with `availability: true` can be added to cart.

**Enforcement**:

```typescript
// In cartStore.addItem
if (!product.availability) {
  toaster.error('This product is currently unavailable')
  return
}
```

**Error Scenario**: User clicks "Add to Cart" on unavailable product

**User Feedback**: Toast notification: "This product is currently unavailable"

**Recovery**: User cannot add unavailable product; no cart state change

### Quantity Minimum Validation

**Rule**: Quantity must be >= 1. If decreased to 0, item is removed.

**Enforcement**:

```typescript
// In cartStore.decreaseQuantity
if (item.quantity > 1) {
  item.quantity -= 1
} else {
  this.removeItem(productId) // Automatic removal at qty=0
}
```

**User Feedback**: Item disappears from cart; toast notification: "Product removed from cart"

### Empty Cart State

**Scenario**: User views cart when `items.length === 0`

**UI Behavior**:

- Show message: "Your cart is empty"
- Hide cart summary and item list
- Optionally show "Continue Shopping" link/button

### Error Handling Summary

**Error Scenarios**:

1. **Product Unavailable**: Show toast: "Product is not available"
2. **Empty Cart**: Display empty state message: "Your cart is empty"

---

## 9. Security

### Input Validation

**Concern**: Product data injected into cart could be malicious.

**Mitigation**:

- `productId`, `productName`, `unitPrice` are copied from Product object (trusted source)
- No user input for product data (only quantity operations: +1, -1, remove)
- Quantity is always a positive integer managed by store methods

**No XSS risk**: Product names rendered as text content, not `dangerouslySetInnerHTML`.

### No Authentication Requirement for Demo

**Assumption**: This is a demo implementation. Cart is stored in memory only (no user isolation required).

If API backend is added later, user authentication will be handled by the existing API client.

---

## 10. Dependencies

### Internal Dependencies

- **`src/utils/toaster.ts`**: Toast notifications for user feedback
- **`src/components/Button`**: Buttons for cart actions (increase, decrease, remove, clear)
- **`src/components/Spinner`**: Loading state indicator (if cart operations are async)
- **Valtio**: `proxy`, `useSnapshot` from `valtio` package

### External Dependencies

- **`valtio`**: Already in project dependencies
- **`react`**, **`react-dom`**: Already in project
- **PrimeReact components** (if needed for icons, buttons, empty state): Already in project

**No new package installations required.**

### Product Data Source Assumption

**Critical Dependency**: The solution assumes a `Product` type and availability flag exist somewhere in the application:

- **Option A**: Products passed as props from a ProductListPage or ProductDetailPage
- (option B**: Mock product data for demo purposes

**Action Required**: Identify or create the product data source. For this demo, we'll use mock product data.

---

## 11. Acceptance Criteria Mapping

| AC | Solution Component | Implementation |
|---|---|---|
| **AC1**: Product with `availability: true` — add to cart with qty=1, totals update | `cartStore.addItem` | Validates `product.availability`, pushes `CartItem` with `quantity: 1`, recalculates total via `getTotal()` getter |
| **AC2**: Product with `availability: false` → not added, message shown | `cartStore.addItem` | Checks `!product.availability`, shows `toaster.error('Product is unavailable')`, returns early without adding |
| **AC3**: Increase qty → qty increments, subtotal/total recalc | `cartStore.increaseQuantity` | `item.quantity += 1`, `getSubtotal(productId)` and `getTotal()` recompute automatically via getters, UI re-renders via `useSnapshot` |
| **AC4**: Decrease qty (qty > 1) → qty decrements, subtotal/total recalc | `cartStore.decreaseQuantity` | `item.quantity -= 1` if `qty > 1`, else calls `removeItem`, totals recompute |
| **AC5**: Remove product → disappears, totals recalc | `cartStore.removeItem` | `items.filter(...)` removes item, totals recompute, toast notification |
| **AC6**: View cart ‒ show name, unit price, qty, subtotal per item, total | `CartItem`, `CartSummary` components | `CartItem` displays all fields; `CartSummary` displays `cartStore.getTotal()` |
| **AC7**: Navigate between pages → cart persists | `cartStore` (global Valtio store) | Cart state lives in global store (persists in memory across navigation) |

---

## 12. Implementation Considerations

### Recommended Implementation Sequence

1. **Types** (`src/types/entity/cart.ts`, `src/types/entity/product.ts`): Define `Product`, `CartItem` interfaces
2. **Store** (`src/store/cart.ts`): Implement Valtio cart store with all methods
3. **Cart Item Component** (`CartItem.tsx`): Render individual cart item with controls
4. **Cart Summary Component** (`CartSummary.tsx`): Render totals
5. **Cart List Component** (`CartItemList.tsx`): Orchestrate item list and empty state
6. **Cart Page** (`ShoppingCartPage.tsx`): Route-level page
7. **Routes** (`src/router.tsx`, `src/constants/routes.ts`): Add cart route
8. **Integration Point** (ProductCard or ProductPage): Add "Add to Cart" button calling `cartStore.addItem(product)`
9. **Tests**: Unit tests for cart store logic; component tests for cart UI; integration test for full cart workflow

### Important Technical Considerations

#### Product Availability Synchronization

**Issue**: Cart stores `availability: boolean` at add-time. If product availability changes later, cart item's flag is stale.

**Solutions**:

- **Option A** (Demo-appropriate): Accept stale data; re-validate at checkout (out of scope)
- **Option B**: On cart page mount, re-validate all items against product store; show warning for unavailable items

**Recommendation**: Use Option A for this story (stale data acceptable). Document as future enhancement.

#### Decimal Price Precision

**Issue**: JavaScript floating-point arithmetic may cause precision errors (e.g., `0.1 + 0.2 = 0.30000000000000004`).

**Solution**: Use integer cents for all price calculations:

```typescript
// Store prices as cents (integer)
unitPriceInCents: number

// Display as dollars with fixed precision
const displayPrice = (priceInCents: number) => (priceInCents / 100).toFixed(2)
```

**Recommendation**: If prices are already floats in product data, accept the limitation for this demo. Production would use integer cents or a decimal library (e.g., `decimal.js`).

### Files Likely to Change

**New Files**:

- `src/store/cart.ts`
- `src/types/entity/cart.ts`
- `src/types/entity/product.ts` (if not exists)
- `src/pages/cart/ShoppingCartPage.tsx`
- `src/pages/cart/components/CartItem.tsx`
- `src/pages/cart/components/CartItemList.tsx`
- `src/pages/cart/components/CartSummary.tsx`
- `src/store/__tests__/cart.test.ts`
- `src/pages/cart/__tests__/ShoppingCartPage.test.tsx`

**Modified Files**:

- `src/router.tsx` (add cart route)
- `src/constants/routes.ts` (add `SHOPPING_CART` constant)
- `src/store/index.ts` (export `cartStore`)
- `src/pages/products/ProductCard.tsx` or `ProductDetailPage.tsx` (add "Add to Cart" button) — if these exist

**No Changes Required**:

- `src/utils/toaster.ts` (already supports needed operations)
- Any backend files (this is a client-side only feature)

### Testing Considerations

**Unit Tests**:

- `cart.test.ts`:
  - Test `addItem` with available product (AC1)
  - Test `addItem` with unavailable product (AC2)
  - Test `increaseQuantity` (AC3)
  - Test `decreaseQuantity` with qty > 1 (AC4)
  - Test `decreaseQuantity` with qty = 1 (should remove item)
  - Test `removeItem` (AC5)
  - Test `getSubtotal` and `getTotal` calculations (AC6)
  - Test adding duplicate product (should increase qty, not duplicate)

**Component Tests**:

- `CartItem.test.tsx`:
  - Render item with name, price, qty, subtotal (AC6)
  - Click "+" button calls `increaseQuantity`
  - Click "-" button calls `decreaseQuantity`
  - Click "×" button calls `removeItem`

- `CartItemList.test.tsx`:
  - Render list of items
  - Show empty state when `items.length === 0`

- `CartSummary.test.tsx`:
  - Display cart summary with correct total

**Integration Test**:

- `ShoppingCartPage.integration.test.tsx`:
  - Add product to cart → navigate to cart page → verify item displayed (AC7)
  - Increase qty → verify subtotal and total update (AC3, AC6)
  - Remove item → verify item disappears and totals recalc (AC5)

 **Mocking**:

- Mock `toaster` utility in unit tests (`vi.mock('@/utils/toaster')`)
- Mock product data for tests

---

## 13. Assumptions

1. **Product data source exists**: Products with `id`, `name`, `price`, `availability` fields are available from a store, API, or props.

2. **No backend API**: Cart state is purely client-side (Valtio). No `POST /cart`, `PUT /cart/:id`, etc.

3. **Availability flag is boolean**: Products have a simple `availability: true/false` flag, not stock quantities.

4. **Single currency**: All prices in same currency; no multi-currency support.

5. **No product variants**: Each product has one SKU; no size/color variants.

6. **Session = in-memory**: Cart persists across navigation via Valtio global store; "session" means until page refresh.

7. **No concurrent cart updates**: Single-user, single-device use case; no conflict resolution for multi-device carts.

8. **Prices are in dollars (or primary currency unit)**: Calculations assume decimal prices (e.g., 19.99, not cents).

9. **Demo-appropriate validation**: No extensive edge-case handling (e.g., negative prices, non-numeric quantities); basic validation only.

---

## 14. Future Enhancements (Out of Scope)

- **Checkout Flow**: Proceed to checkout, payment integration
- (bGckend Integration**: Sync cart to backend API; server-side validation
- **Stock Quantity Checks**: Validate requested quantity against available stock
- **Product Variants**: Size, color, SKU selection
- **Discount Codes**: Apply promo codes to cart total
- **Shipping & Tax**: Calculate shipping cost and tax
- **Multi-Currency Support**: Display prices in user's currency
- **Cart Sharing**: Share cart across devices for logged-in users
- **Recently Viewed Items**: Suggest products based on view history
- **Wishlist/Save for Later**: Move items to wishlist instead of removing
- **Cart Expiration**: Auto-clear cart after X days of inactivity
- **Real-time Availability Sync**: WebSocket or polling to update availability flags

---

## Conclusion

This technical design provides a complete, practical solution for implementing shopping cart management using the existing Valtio state management pattern. The design is focused on the approved User Story scope and reuses established repository architecture without introducing unnecessary complexity.

**Next Steps**:

1. Review and approve this design document
2. Create detailed implementation tasks based on the recommended sequence
3. Implement cart store with tests
4. Implement cart UI components with tests
5. Add "Add to Cart" button integration point (or create mock product list)
6. Verify all acceptance criteria with integration tests