# Implementation Plan: Shopping Cart Management

## 1. Overview

Implement a shopping cart system for an e-commerce platform that allows users to add, modify, remove, and review products before completing a purchase. The cart must persist during the user's session and validate product availability before allowing additions.

---

## 2. User Story

**As an** online shopper,  
**I want to** add products to my shopping cart and manage the quantities,  
**so that** I can review my selected products before placing an order.

---

## 3. Acceptance Criteria

1. **AC-1: Add Available Product to Cart**  
   Given an available product exists,  
   When the user adds it to the cart,   
   Then the product appears in the cart with quantity 1 and correct price/subtotal.

2. **AC-2: Prevent Adding Unavailable Product**  
   Given a product is marked as unavailable,   
   When the user attempts to add it to the cart,   
   Then the product is not added and the user receives appropriate feedback.

3. **AC-3: Increase Product Quantity**  
   Given a product is already in the cart,   
   When the user increases the quantity,   
   Then quantity increments and the subtotal updates accordingly.

4. **AC-4: Decrease Product Quantity**  
   Given a product is in the cart with quantity > 1,  
   When the user decreases the quantity,   
   Then quantity decrements and the subtotal updates accordingly.

5. **AC-5: Remove Product from Cart**  
   Given a product is in the cart,   
   When the user removes the product,   
   Then the product is no longer displayed in the cart and the total cart amount updates.

6. **AC-6: Display Cart Details**  
   Given one or more products are in the cart,   
   When the user views the cart,   
   Then the cart displays product name, price, quantity, and subtotal for each item, plus the total cart amount.

7. **AC-7: Cart Persistence During Navigation**  
   Given a user has products in the cart,   
   When the user navigates to other pages/sections and returns to the cart,   
   Then all previously added products and quantities remain intact.

8. **AC-8: Total Cart Amount Calculation**  
   Given multiple products are in the cart,  
   When the cart is viewed,   
   Then the total cart amount equals the sum of all item subtotals.

---

## 4. Research Findings

### Existing Relevant Patterns

Based on the codebase research for the CodeMie UI project, the following patterns and conventions exist:

1. **State Management (Valtio)**  
   - All stores live in `src/store/`
   - Stores are defined using `proxy(s); with TypeScript interfaces
   - Components read state via `useSnapshot(store)`
   - All API calls are made in store methods, never in components
   - Every async store method sets `loading = true`, `error = null`, and uses `finally` to reset `loading`

   Relevant existing stores:
   - `src/store/assistants.ts` — manages AI assistants list
   - `src/store/user.ts` — manages user profile
   - `src/store/chats.ts` — manages chat sessions

2. **API Integration**
   - Custom fetch wrapper: `import api from '@/utils/api'`
   - ALWAYS call `.json()` on responses (not Axios pattern)
   - Error handling: try/catch/finally with automatic toaster notifications
   - DELETE requests skip `.json()` unless body confirmed

3. **Form Validation**
   - React Hook Form + Yup schemas
   - Schemas defined in dedicated `formSchema.ts` files
   - `Yup.InferType<typeof schema>` used for type inference
   - Fields use `Controller`, not `register`
   - Validation messages: `src/constants/validation.ts`

   Example: `src/pages/chat/components/ChatSidebar/FolderList/FolderFormPopup.tsx`

4. **Component Patterns**
   - Components live in `src/components/` or `src/pages/`
   - Modal pattern: use `Popup` component from `@/components/Popup`
   - Form components: `src/components/form/` (e.g., `Input`, `Select`, `Button`)
   - Tailwind CSS with `cn()` utility for conditional classes
   - PrimeReact 10.9.x components
   - No inline styles, no custom CSS files

5. **Complex Forms with Custom Hooks**
   - Extract logic to `useXxxForm.ts` hooks when > 200 lines
   - Hooks include: state, validation, form reset, focus management
   - Hook location: co-located with component or `src/hooks/` for reusable

6. **Error Handling**
   - Store sets `error` string field
   - Components render error using `snapshot.error`
   - Toaster notifications: `import { toaster } from '@/utils/toaster'`
   - Error boundaries: `InteractiveErrorBoundary` exists for specific use cases

### Similar Implementations

While the project is a CodeMie AI platform (no existing e-commerce cart), the patterns are well-established:

- Stateful lists with add/remove/modify operations (assistants, chats, folders)
- Session-based persistence (chat state, user session)
- Form validation with cross-field checks
- Reactive updates with Valtio snapshots

---

## 5. Technical Context

### Repository
- **Frontend**: CodeMie UI (`codemie_ui`)
  - React 18.3.1 / TypeScript 5.8.3 / Vite
  - Valtio for state management
  - React Hook Form + Yup
  - PrimeReact 10.9.x + Tailwind CSS

### Relevant Technologies
- React 18.3.1
- TypeScript 5.8.3
- Valtio (state management)
- React Hook Form + Yup (form validation)
- PrimeReact 10.9.x (UI components)
- Tailwind CSS (styling)
- Custom fetch wrapper (`@/utils/api`)

### Dependencies/Integrations
- Product catalog API (assumed to exist)
  - `GET /products` — list available products
  - `GET /products/:id` — get product details (name, price, availability)
- Session storage for cart persistence (Valtio store will hold in-memory)
- Optionally: Backend cart API for persistence across sessions (not required for MVP)

---

## 6. Proposed Changes

### Frontend (CodeMie UI repository)

**A. State Management (Valtio Store)**

1. **Create `<src/store/cart.ts>`**
   - Store interface:
     ```typescript
     interface CartItem {
       productId: string
       name: string
       price: number
       quantity: number
       isAvailable: boolean
     }

     interface CartStore {
       items: CartItem[]
       loading: boolean
       error: string | null
       total: number  // getter for computed total
       addItem: (productId: string) => Promise<void>
       removeItem: (productId: string) => void
       updateQuantity: (productId: string, quantity: number) => void
       incrementQuantity: (productId: string) => void
       decrementQuantity: (productId: string) => void
       clearCart: () => void
     }
     ```
   - Methods:
     - `addItem()`: fetch product details, validate availability, add to `items` array
     - `removeItem()`: filter out from `items` array
     - `updateQuantity()`: find item by `productId`, update `quantity`
     - `incrementQuantity()`: `updateQuantity(productId, currentQty + 1)`
     - `decrementQuantity()`: `updateQuantity(productId, currentQty - 1)`; if qty == 1, call `removeItem`
     - `clearCart()`: reset `items = []`
   - Getter:
     ```typescript
     get total(): number {
       return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
     }
     ```
   - Error handling: `try/catch/finally` in async methods
   - Toaster notifications for errors (`.toaster.error()`)

**B. UI Components**

1. **Create `<src/pages/cart/CartPage.tsx>`**
   - Main cart page component
   - Uses `useSnapshot(cartStore)` to read `items`, `loading`, `error`, `total`
   - Renders list of `CartItem` components
   - Displays total cart amount
   - Handles empty state ("Your cart is empty")
   - Handles loading state (spinner)
   - Handles error state (error message)

2. **Create `<src/pages/cart/components/CartItem.tsx>`**
   - Displays single cart item
   - Props: `CartItem` object
   - Displays:
     - Product name
     - Product price
     - Quantity with +/- buttons
     - Subtotal (price × quantity)
     - Remove button
   - Event handlers:
     - `handleIncrement`: calls `cartStore.incrementQuantity(productId)`
     - `handleDecrement`: calls `cartStore.decrementQuantity(productId)`
     - `handleRemove`: calls `cartStore.removeItem(productId)`
   - Styling: Tailwind CSS, PrimeReact `Button` component

3. **Create `<src/pages/cart/components/CartSummary.tsx>`**
   - Displays total cart amount
   - Displays item count
   - Optional: "Proceed to Checkout" button (out of scope for MVP)

4. **Update Product Listing Page (or create if doesn't exist)**
   - Add "Add to Cart" button to each product card
   - Button onClick: `cartStore.addItem(productId)`
   - Disable button if product is unavailable
   - Display "Unavailable" label for unavailable products

   **Note**: If product listing doesn't exist, create simple mock product list with:
   - `src/store/products.ts` (Valtio store)
   - `src/pages/products/ProductListPage.tsx` (list view)
   - `src/pages/products/components/ProductCard.tsx` (single product card)

5. **Navigation & Routing**
   - Add `/cart` route in router config (`src/App.tsx` or `src/router`)
   - Add "Cart" link in navigation menu with item count badge

### Backend (Optional, not required for MVP)

For session-persistence only, no backend changes are required. Cart state will live in-memory in Valtio store.

If persistence across sessions is required:

1. **Backend Cart API (future enhancement)**
   - `POST /api/cart/items` — add item to cart
   - `DELETE /api/cart/items/:id` — remove item
   - `PUT /api/cart/items/:id` — update quantity
   - `GET /api/cart` — get current user's cart
   - `DELETE /api/cart` — clear cart

---

## 7. API Contract

**Assumed Product Catalog API**

### GET `/api/products`
Retrieve list of available products.

**Response:**
```json
{
  "products": [
    {
      "id": "987654321",
      "name": "Laptop 15.6\" FHD",
      "price": 899.99,
      "isAvailable": true
    },
    {
      "id": "555555555",
      "name": "Wireless Mouse",
      "price": 29.99,
      "isAvailable": false
    }
  ]
}
```

### GET `/api/products/:id`
Retrieve details for a specific product.

**Response:**
```json
{
  "id": "987654321",
  "name": "Laptop 15.6\" FHD",
  "price": 899.99,
  "isAvailable": true,
  "description": "High-performance laptop..."
}
```

**Error Cases:**
- `404 Not Found`: Product does not exist
- `500 Internal Server Error`: Server error

**Cart API (MVP - in-memory only)**

For MVP, cart state will be managed entirely in the frontend Valtio store. No backend API is required.

---

## 8. Technical Flow

### Adding a Product to Cart

1. User clicks "Add to Cart" button on `ProductCard`
2. `handleAddToCart(productId)` calls `cartStore.addItem(productId)`
3. `addItem()` fetches product details via `GET /api/products/:id`
4. Validate `isAvailable === true`; if false, show toaster error and return
5. Check if product already in cart:
   - If yes: increment quantity
   - If no: add new `CartItem` with `quantity = 1`
6. Update `cartStore.items` array
7. Valtio auto-updates all components using `useSnapshot(cartStore)`
8. `CartPage` re-renders with updated items and total

### Updating Quantity

1. User clicks "+" button on `CartItem`
2. `handleIncrement()` calls `cartStore.incrementQuantity(productId)`
3. `incrementQuantity()` finds item by `productId`
4. Updates `item.quantity += 1`
5. Getter `total` auto-recalculates
5. `CartItem` and `CartSummary` re-render with new quantity/total

### Removing an Item

1. User clicks "Remove" button on `CartItem`
2. `handleRemove()` calls `cartStore.removeItem(productId)`
3. `removeItem()` filters out item from `items` array
4. `CartPage` re-renders without the removed item
5. `CartSummary` updates total

### Cart Persistence During Navigation

1. User navigates from `/cart` to `/products`
2. Valtio store state persists in-memory
3. User navigates back to `/cart`
4. `CartPage` re-mounts, reads `cartStore` via `useSnapshot`
5. All cart items and quantities remain intact

**Note**: In-memory persistence only lasts during the session. Page refresh will clear the cart. For cross-session persistence, implement backend cart API or `localStorage` sync.

---

## 9. Security & Error Handling

### Security

1. **Product Availability Validation**  
   - Frontend validation: `isAvailable` check in `addItem()`
   - Backend should also validate availability (if backend API exists)

2. **Input Validation**  
   - Quantity must be >= 1
   - Price must be <= 0
  - P�duct ID must be valid string

3. **Error Messages**
   - Never expose sensitive data in error messages
   - Use user-friendly messages: "Product is currently unavailable"

4. **XSS Prevention**  
   - All user inputs (product name, description) are rendered safely by React
   - No `dangerouslySetInnerHTML` usage

### Error Handling

1. **Network Errors**  
   - Catch fetch errors in `addItem()`
   - Set `cartStore.error` field
   - Display toaster notification: "unable to add product"
   - Retry button in error state

2. **Product Not Found**  
   - Handle `404` response from product API
   - Display: "Product not found"

3. **Unavailable Product**  
   - If `isAvailable === false`
   - Display toaster: "This product is currently unavailable"
   - Do not add to cart

4. **Empty Cart State**
   - Display: "Your cart is empty"
   - CTA: "Shop Now" button linking to `/products`

5. **Loading State**
   - Show spinner while `cartStore.loading === true`
   - Disable "add to cart" buttons during loading

---

## 10. Testing

### Unit Tests

1. **Cart Store Tests (`cart.test.ts`)**
   - `addItem()`: adds new item with quantity = 1
   - `addItem()`: increments quantity if item already exists
   - `addItem()`: throws error when product unavailable
   - `removeItem()`: removes item from cart
   - `incrementQuantity()`: increments quantity
   - `decrementQuantity()`: decrements quantity
   - `decrementQuantity()`: removes item when quantity == 1
   - `total` getter: calculates correct total

2. **CartItem Component Tests (`CartItem.test.tsx`)**
   - Renders product name, price, quantity
   - Displays correct subtotal (price × quantity)
   - "+" button calls `incrementQuantity`
   - "-" button calls `decrementQuantity`
   - "Remove" button calls `removeItem`

3. **CartPage Component Tests (`CartPage.test.tsx`)**
   - Renders empty state when `items = []`
   - Renders list of `CartItem` components
   - Displays correct total amount
   - Displays loading state
   - Displays error state

### Integration Tests

1. **Add to Cart Flow**
   - Navigate to `/products`
   - Click "Add to Cart" on a product
   - Verify toaster success message
   - Navigate to `/cart`
   - Verify product appears in cart with quantity = 1

2. **Quantity Management Flow**
   - Add product to cart
   - Click "+" button twice
   - Verify quantity = 3, subtotal updates
   - Click "-" button once
   - Verify quantity = 2, subtotal updates

3. **Remove Item Flow**
   - Add two products to cart
   - Click "Remove" on first product
   - Verify it disappears from cart, total updates

4. **Unavailable Product Flow**
   - Attempt to add unavailable product
   - Verify error toaster: shows "Product unavailable"
   - Verify cart remains unchanged

5. **Cart Persistence Flow**
   - Add products to cart
   - Navigate to `/products`
   - Navigate back to `/cart`
   - Verify all items and quantities are intact

### E2E Tests

1. **Full Shopping Cart Journey**
   - User browses products
   - User adds multiple products to cart
   - User updates quantities
   - User removes items
   - User reviews cart
   - Verify total is correct

---

## 11. Dependencies & Assumptions

### Dependencies

1. **Product Catalog API**  
   - Assumed to exist and provide:
     - Product list (`GET /api/products`)
     - Product details (`GET /api/products/:id`)
   - If API doesn't exist, create mock products data in frontend

2. **Session Management**  
   - Valtio store provides in-memory session persistence
   - Cart data lost on page refresh
   - For long-term persistence: add `localStorage` or backend API (future enhancement)

3. **User Authentication**  
   - Not required for MVP
   - Cart is anonymous (no user account linking)
   - Future: link cart to user session/account

### Assumptions

1. **Product Availability Status**  
   - Product API returns `isAvailable: boolean` field
   - Availability status is real-time/near-real-time

2. **Pricing Information**  
   - Product `rice` field is accurate and up-to-date
   - Single currency(USD assumed)
   - No tax/discount calculation (future enhancement)

3. **No Inventory Quantity Limits**  
   - Users can add any quantity of available products
   - No stock quantity validation at cart level
   - Future: add `stock` field and validation

4. **Session-Scoped Persistence**
   - Cart data persists only during the active browser session
   - Page refresh clears the cart
   - No cross-device sync

5. **No Checkout Flow**  
   - Cart management only (no payment integration)
   - "Proceed to Checkout" button is a placeholder

---

## 12. Implementation Sequence

### Phase 1. Core Functionality (4-5 days)

1. Create Valtio cart store (`src/store/cart.ts`)
   - Define `CartItem` and `CartStore` interfaces
   - Implement all store methods
   - Unit tests for store logic

2. Create mock product data (if backend API doesn't exist)
   - Create `src/store/products.ts`
   - Mock products with `id`, `name`, `price`, `isAvailable`

3. Create cart UI components
   - `CartPage` (main page)
   - `CartItem` (each item row)
   - `CartSummary` (total + checkout button)

4. Add cart routing and navigation
   - Add `/cart` route
   - Add "Cart" link in navbar with item count badge

### Phase 2. Product Integration (2-3 days)

5. Create product listing page (if not existing)
   - `ProductListPage` and `ProductCard` components
   - Render list of products
   - "Add to Cart" buttons

6. Integrate "Add to Cart" functionality
   - Connect buttons to `cartStore.addItem()`
   - Disable for unavailable products
   - Toaster notifications for success/error

### Phase 3. Validation & Testing (2-3 days)

7. Implement availability validation
   - Prevent adding unavailable products
   - Error message feedback

8. Implement error handling
   - Network errors
   - Product not found
   - Empty state

   9. Write unit + integration tests
   - Store tests
   - Component tests
   - Full flow integration tests

10. Manual testing
   - Test all acceptance criteria
   - Cross-browser testing
   - Responsive design testing

### Phase 4. Polish & Documentation (1-2 days)

11. UI polish
   - Tailwind CSS styling
   - Responsive layout
   - Accessibility

12. Documentation
   - Code comments
   - README updates
   - API documentation

---

## 13. Summary

This implementation plan provides a complete, fully-functional shopping cart system for the CodeMie UI project. The plan:

- Follows project architectural conventions (Valtio, React Hook Form, Tailwind)
- Implements all 8 acceptance criteria from the Jira story
- Provides clear technical direction for the Design Agent
- Includes comprehensive error handling, validation, and testing strategy
- Provides a phased implementation sequence for delivery

The MVP focuses on session-based, in-memory cart management. Future enhancements can add backend persistence, user account linking, and checkout functionality.
