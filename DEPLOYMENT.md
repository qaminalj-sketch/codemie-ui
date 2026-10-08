# Local Deployment (Shopping Cart POC)

This repository (`codemie-ui`) is a **frontend React + TypeScript** application built with **Vite**.
The Shopping Cart POC lives at:

- Products page: `http://localhost:5173/products`
- Cart page: `http://localhost:5173/cart`

> The deployment assistant cannot execute commands on your machine. Human execution is required.

---

## 1) What runs locally

### Architecture
- **Frontend-only** app (Vite dev server)
- Shopping Cart POC uses a **static product catalog** and **sessionStorage** persistence
  - Products: `src/data/products.ts`
  - Cart store: `src/store/shoppingCart.ts`
  - Storage key: `codemie-shopping-cart` (`src/constants/shoppingCart.ts`)

### Backend dependency
- **Not required for Shopping Cart**.
- The broader CodeMie UI expects a backend for many other routes and will proxy `/api` to a backend during development.
  - Vite proxy: `vite.config.ts` (`server.proxy['/api']` → `http://localhost:8080` by default)
  - Runtime API base: `src/utils/api.ts` reads `window._env_.VITE_API_URL` (from `/config.js`) or `import.meta.env.VITE_API_URL`

If you only validate Shopping Cart, you can run UI without any backend and avoid visiting routes that require `/api`.

---

## 2) Prerequisites

- **Node.js**: `>= 18` (repo README states Node >= 18)
- **npm**: `>= 9`

Optional:
- Docker (only if you want to use the docker-based UI test harness mode; not required for standard local dev)

---

## 3) Environment configuration

The repository tracks a non-secret `.env` that defaults the UI API base to `/api`.

- File: `.env`
- Key variables (from `.env`):
  - `VITE_API_URL='/api'`
  - `VITE_ENV='local'`
  - `VITE_SUFFIX=''` (controls Vite `base`; see `vite.config.ts`)

For local dev, you may optionally create `.env.local`:

```bash
cp .env .env.local
```

Most Shopping Cart validation works with the defaults.

If you are running a backend on a different URL/port, you can set:

```env
VITE_DEV_PROXY_TARGET=http://localhost:8080
```

(Vite dev proxy target is read in `vite.config.ts`.)

---

## 4) Install dependencies

```bash
npm install
```

---

## 5) Build & Start

### Development server (recommended)

```bash
npm run dev
```

Expected URL:
- `http://localhost:5173`

### Production build (optional)

```bash
npm run build
npm run preview -- --port 5173 --strictPort
```

---

## 6) Health check

There is an Nginx health endpoint used in container deployments:
- `GET /healthcheck` (see `nginx.conf`)

Note: The Vite dev server does **not** expose `/healthcheck` by default.

For a basic dev-server check:

```bash
curl -I http://localhost:5173/
```

---

## 7) Shopping Cart smoke test (manual)

1. Open `http://localhost:5173/products`
2. Click **Add … to cart** for an available product (e.g., *Mechanical Keyboard*)
3. Navigate to `http://localhost:5173/cart`
4. Verify:
   - Item appears with `Quantity 1`
   - Total matches the product price
5. Increase quantity and verify subtotal/total changes
6. Decrease quantity to remove an item when it reaches 0
7. Click **Clear Cart** and verify empty state
8. Refresh the page and verify cart persistence within the same tab/session (stored in `sessionStorage` under key `codemie-shopping-cart`)

---

## 8) Automated tests

### Unit + integration (Vitest)

```bash
npm test
```

Shopping cart integration test location:
- `src/pages/shopping/__tests__/ShoppingCart.integration.test.tsx`

You can run only unit or only integration:

```bash
npm run test:unit
npm run test:integration
```

### UI sanity suite (optional; requires `uvx` + backend)

The repo has a separate UI harness for the full CodeMie stack:

```bash
npm run test-harness
```

See README section **“Sanity UI suite (CodeMie test harness)”** for prerequisites.

---

## 9) Troubleshooting

- **Port 5173 already in use**:
  - Stop the process using it, or run Vite on another port:
    ```bash
    npm run dev -- --port 5176
    ```

- **Blank page / wrong base path**:
  - Ensure `VITE_SUFFIX` is correct. Vite `base` is set in `vite.config.ts` as `env.VITE_SUFFIX || '/'`.

- **API errors on non-shopping routes**:
  - Many CodeMie routes call `/api/v1/...` and require a backend at the dev proxy target.
  - For Shopping Cart POC validation, stick to `/products` and `/cart`.
