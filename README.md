# CodeMie UI

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Website](https://img.shields.io/badge/website-codemie.ai-informational)](https://codemie.ai)
[![Docs](https://img.shields.io/badge/docs-docs.codemie.ai-informational)](https://docs.codemie.ai)

**The web interface for CodeMie — Platform for AI-Native Delivery, Modernization, and Business.**

Built with React and TypeScript, teams interact with AI assistants, design multi-agent workflows, manage integrations, configure knowledge bases, and monitor platform activity. Connects to the `codemie` backend via REST API.

🌐 **Website:** [codemie.ai](https://codemie.ai)
📖 **Documentation:** [docs.codemie.ai](https://docs.codemie.ai)
🖥️ **CLI tool:** [codemie-code](https://github.com/codemie-ai/codemie-code)

## Table of Contents

- [Quick Start](#quick-start)
- [What the Platform Enables](#what-the-platform-enables)
- [Technology Stack](#technology-stack)
- [Project Setup](#project-setup)
- [Development Commands](#development-commands)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [AI Code Review](#ai-code-review)
- [Docker Support](#docker-support)
- [Keycloak Theme Development](#keycloak-theme-development)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment — set VITE_API_URL to your backend
cp .env .env.local

# 3. Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## What the Platform Enables

- **AI-Native SDLC & Delivery** — AI agents covering every phase: discovery, architecture, development, testing, and deployment.
- **AI Migration & Modernization** — Legacy system and mainframe modernization powered by AI-driven code analysis and transformation.
- **AI for Business & Operations** — AI assistants for finance, HR, sales, support, and other business functions.

## Technology Stack

| Tool | Version | Purpose |
|------|---------|---------|
| [React](https://react.dev/) | 18.3.x | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | 5.4.x | Type safety |
| [Vite](https://vitejs.dev/) | 5.x | Build tool |
| [Tailwind CSS](https://tailwindcss.com/) | 3.4.x | Styling |
| [PrimeReact](https://primereact.org/) | 10.9.x | UI components |
| [Valtio](https://github.com/pmndrs/valtio) | 2.1.x | State management |
| [React Hook Form](https://react-hook-form.com/) + [Yup](https://github.com/jquense/yup) | 7.x | Form handling |
| [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/react) | — | Testing |
| [React Router](https://reactrouter.com/) | 6.x | Routing |

## Project Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
git clone <repository-url>
cd codemie-ui
npm install
```

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8080
VITE_SUFFIX=/app
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | _(required)_ | Backend API base URL |
| `VITE_SUFFIX` | `''` | URL path prefix for the app |

### Image Allow-List

Controls which external image domains are rendered in LLM/assistant markdown output. Images from domains not on the list are replaced with a "blocked" badge and no `<img>` element is created, preventing data exfiltration via image requests to attacker-controlled servers.

This is **backend customer configuration**, not a UI environment variable — it is served by `GET /v1/config` under the `allowedImageDomains` id and configured per deployment in the backend's `config/customer/customer-config.yaml`:

```yaml
- id: "allowedImageDomains"
  settings:
    enabled: true
    value: "cdn.example.com,.trusted.org"
```

- **Format:** Comma-separated list of hostnames. A leading dot (`.example.com`) allows the apex domain and all its subdomains. Each entry must have at least two labels (e.g. `example.com`, not `com`).
- **Default (empty):** All external images are blocked. Same-origin and backend-origin images are always allowed regardless of this setting.
- **Scope:** The allow-list also applies to the HTML produced by "Copy message", so a message pasted into an email client loads no blocked image either.

## Development Commands

```bash
npm run dev          # Start development server (port 5173)
npm run build        # Production build
npm run build:prod   # Production build (explicit)
npm run preview      # Preview production build locally
```

## Testing

```bash
npm test                     # Run all tests (unit + integration)
npm run test:unit            # Unit tests only
npm run test:integration     # Integration tests only
npm test -- --watch          # Watch mode
npm run test:coverage        # With coverage report
npm run sonar-local          # Run shared local SonarQube check
```

### Sanity UI suite (CodeMie test harness)

Requires `~/.codemie/test-harness.json` and a running backend. The `:mac`/`:win`
variants build the app and serve it with `vite preview` on port 5173 first — faster
and less flaky than testing against the dev server.

```bash
npm run test-harness         # Against whatever already serves port 5173
npm run test-harness:mac     # Build + vite preview, then sanity UI (macOS/Linux)
npm run test-harness:win     # Same flow on Windows (PowerShell)
npm run test-harness:fast    # Same flow via Docker/nginx (compose profile `uitest`)
```

Every variant shuts its server down when the run ends. `:mac` and `:win` exit 0
even when tests fail, so read their output rather than the exit code; `test-harness`
and `:fast` report the real status.

## Code Quality

```bash
npm run lint        # Check with ESLint
npm run lint:fix    # Auto-fix issues
npm run format      # Format with Prettier
```

## Local SonarQube Scan

Use this when you want a local pre-CI SonarQube check against the same remote project that SonarLint connected mode uses:

```bash
npm run sonar-local
```

This command:
- Reads the SonarQube server URL and project key from `.sonarlint/connectedMode.json`
- Reads the current git branch and sends it as `sonar.branch.name`
- Generates coverage by running `npm run test:coverage`
- Runs `sonar-scanner` and waits for the quality gate result
- If the Sonar scan fails, prints the branch quality-gate summary, blocking hotspots, bugs/vulnerabilities, and the unresolved issue list in the same run

Requirements:
- `SONAR_TOKEN` must be set in your environment
- `node` and `npm` must be available on your `PATH`
- Install the scanner with `npm install -D @sonar/scan`
- The repository must be on a named git branch, or `SONAR_BRANCH_NAME` must be set explicitly

Behavior:
- If `SONAR_TOKEN` is missing, the command prints a clear skip message and exits successfully
- If the configured SonarQube server is unreachable, the command prints a clear skip message and exits successfully
- Test failures, invalid Sonar credentials, and Sonar quality gate failures still fail the command after printing Sonar details

This same command is also executed by the Husky pre-commit hook after the existing staged-file, license-header, and secrets checks pass.

## AI Code Review

AI-assisted code review powered by Claude Code. Scans for CRITICAL and MAJOR issues, auto-fixes them, commits, pushes, and approves (or creates) the GitLab MR — fully automated.

### How to run

```
/code-reviewer
@code-reviewer
```

Or say: **"do code review"**, **"review my changes"**

Use `--interactive` for manual control over each step:

```
/code-reviewer --interactive
@code-reviewer --interactive
```

In interactive mode Claude will ask questions one at a time:
- Review depth (Quick scan or Deep review)
- Jira ticket number (`EPMCDME-XXXXX`)
- Goal source (fetch from Jira or enter manually)
- Base branch (default: `main`)

After reviewing, it will present findings and wait for your decision on each fix before applying anything.

### What it does

```
1. Reads ticket from branch name → fetches goal from Jira
2. Finds all changed files vs main
3. Scans for CRITICAL and MAJOR issues (Tailwind, Popup, API patterns, types, security)
4. Saves findings to .codemie/reviews/<TICKET>/review.md  (never committed)
5. Auto-applies all fixes
6. Creates a commit with a review marker
7. Pushes the branch
8. Approves the existing MR — or creates a new one if none exists
```

### Prerequisites: git + glab setup

Both `git` and `glab` (GitLab CLI) must be configured with a personal access token before the reviewer can push and approve MRs.

#### 1. Generate a GitLab Personal Access Token

1. Go to your GitLab profile: **User Settings → Access Tokens** (or visit `https://<your-gitlab>/profile/personal_access_tokens`)
2. Click **Add new token**
3. Set a name (e.g. `codemie-cli`), expiry date, and select scopes: `api`, `read_repository`, `write_repository`
4. Click **Create personal access token** and copy the value — it is shown only once

#### 2. Configure git

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
git config --global credential.helper store
git remote set-url origin https://oauth2:<YOUR_TOKEN>@<your-gitlab-host>/<namespace>/codemie-ui.git
```

Replace `Your Name` and `your@email.com` with your actual name and GitLab email, `<YOUR_TOKEN>` with the token from step 1, and `<your-gitlab-host>/<namespace>` with your actual GitLab host and group path.

#### 3. Configure glab

```bash
glab auth login --hostname <your-gitlab-host> --token <YOUR_TOKEN>
```

Verify it works:

```bash
glab auth status
```

Once both are configured, `/code-reviewer` will push and approve MRs without any extra prompts.

---

## Docker Support

```bash
docker-compose up --build
```

### Multistage Build

Building `Dockerfile` or `multistage.Dockerfile` requires Docker Hub authentication to `dhi.io`:

```bash
docker login dhi.io
docker build . -t codemie-ui:0.12.0 -f multistage.Dockerfile
```

## Keycloak Theme Development

Building or running the Keycloak theme locally requires **Java 17+** and **Maven 3.8+**.

> Not required for regular development (`npm run dev`) or production builds (`npm run build`).

**macOS:**
```bash
brew install openjdk maven
```

**Linux (Debian/Ubuntu):**
```bash
sudo apt install default-jdk maven
```

### Local Keycloak with SSO (Azure Entra ID)

The local Keycloak instance uses `.keycloakify/realm-kc-26.template.json` with `${KC_ENTRA_*}` placeholders. The `start:keycloak` script sources `.env`, replaces the placeholders, and generates `.keycloakify/realm-kc-26.json` before starting Keycloak.

Add to your `.env`:

```env
KC_ENTRA_TENANT_ID=your-tenant-id
KC_ENTRA_CLIENT_ID=your-client-id
KC_ENTRA_CLIENT_SECRET=your-client-secret
```

To get Azure Entra ID credentials: go to [Azure Portal](https://portal.azure.com/) → Microsoft Entra ID → App registrations → New registration. Copy the Application (client) ID, Directory (tenant) ID, and create a client secret under Certificates & secrets.

```bash
source .env && npm run start:keycloak
```

## Project Structure

```
src/
├── components/       # Reusable React components
├── pages/           # Application pages (route components)
├── hooks/           # Custom React hooks
├── store/           # Valtio state management
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
├── constants/       # Application constants
├── assets/          # Static assets (images, fonts, icons)
├── styles/          # Global styles
├── App.tsx          # Root component
├── main.tsx         # Application entry point
└── router.tsx       # React Router configuration
```

## Work Items Feature

The Work Items feature (`src/pages/workItems/`) lets users create and manage platform work items (Tasks, Bugs, Features) with Priority, Status, and Assignee tracking.

### Running Work Items locally

1. Start the dev server and backend as described in [Quick Start](#quick-start).
2. Navigate to `http://localhost:5173/#/work-items` (or click **Work Items** in the sidebar).
3. The feature calls `GET /v1/work-items` (list), `POST /v1/work-items` (create), `PUT /v1/work-items/:id` (edit), and `DELETE /v1/work-items/:id` (delete).
4. If no backend is running, the API calls will fail gracefully — the list shows an inline error message and the form will surface the rejection.

**Key files:**

| File | Purpose |
|---|---|
| `src/store/workItems.ts` | Valtio store — CRUD operations and filters |
| `src/types/entity/workItem.ts` | TypeScript types for `WorkItem` and enums |
| `src/constants/workItems.ts` | Per-field option lists and limits |
| `src/pages/workItems/WorkItemsListPage.tsx` | Route component — list + filter + table |
| `src/pages/workItems/components/WorkItemForm/` | Create / edit modal form |
| `src/pages/workItems/components/WorkItemFilters.tsx` | Sidebar filter dropdowns |

---

## Shopping Cart (EPMCDMETST-66291)

A guest shopping cart that lets users browse products, add them to a cart, manage quantities, and see a running total. Cart contents persist across page navigation via `localStorage`.

### Running Locally

1. Start the dev server and backend as described in [Quick Start](#quick-start).
2. Navigate to `http://localhost:5173/#/products` (or click **Products** in the sidebar) to browse the product catalog.
3. Click **Add to Cart** on any available product — unavailable products show a disabled button and a toast notification if you attempt to add them programmatically.
4. Navigate to `http://localhost:5173/#/cart` (or click **Shopping Cart** in the sidebar) to view and manage your cart.
5. Use **+** / **−** buttons to adjust quantity (decreasing from 1 removes the item) or click **Remove** to delete an item directly.
6. The total amount recalculates automatically. Cart contents survive page refreshes — they are stored in `localStorage` under the key `shopping_cart`.

The feature calls these backend endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/v1/products` | Fetch paginated product list |
| `GET` | `/v1/products/:id` | Validate availability when adding to cart |

If no backend is running, API calls fail gracefully — the product list shows an inline error and a toast is shown when adding fails.

**Key files:**

| File | Purpose |
|---|---|
| `src/store/shoppingCart.ts` | Valtio store — cart actions, `total` getter, localStorage sync |
| `src/store/products.ts` | Valtio store — product catalog fetching |
| `src/types/entity/shoppingCart.ts` | `CartItem` TypeScript interface |
| `src/types/entity/product.ts` | `Product` TypeScript interface |
| `src/constants/shoppingCart.ts` | Storage key, page size, error messages |
| `src/utils/cartStorage.ts` | `localStorage` persistence helpers with graceful fallback |
| `src/pages/shopping/ShoppingCartPage.tsx` | Cart route — item list + summary |
| `src/pages/shopping/ProductListPage.tsx` | Products route — paginated grid with Add to Cart |
| `src/pages/shopping/components/CartItem.tsx` | Single cart row with quantity controls |
| `src/pages/shopping/components/CartSummary.tsx` | Total display and checkout placeholder |
| `src/pages/shopping/components/ProductCard.tsx` | Product card with availability-aware Add to Cart |

---

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a pull request.

We use **trunk-based development** — all pull requests go directly to `main`.

**Branch naming:** `EPMCDME-XX` or `EPMCDME-XX-short-description` — use `<type>/short-description` if no ticket is available (e.g. `fix/login-redirect`)

**Commit format:** `EPMCDME-XX: Capital sentence` (enforced by CI)

## License

CodeMie UI is licensed under the [Apache License 2.0](LICENSE).
