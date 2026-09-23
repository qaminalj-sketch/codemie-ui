# Implementation Plan: Platform Activity Management (Work Item CRUD)

## Overview
Implement a complete work item management feature in the codemie-ui application, enabling users to create, view, edit, filter, and sort work items for tracking platform activities.

## User Story
**As a** platform user,  
**I want to** create and manage work items,  
**so that** I can track platform activities effectively.

## Acceptance Criteria
1. Users can create/edit work items with Title, Description, Type, Priority, Status, Assignee, and Tags
2. Users can view work items in a list
3. Users can filter by Type, Priority, and Status
4. Users can sort by Priority, Created date, and Updated date
5. Required fields are validated before submission
6. UI integrates with existing REST APIs

## Data Model

**WorkItem**
- `id`: string (UUID, auto-generated)
- `title`: string (required, max 200 chars)
- `description`: string (optional, max 5000 chars)
- `type`: enum (Bug, Feature, Task, Improvement)
- `priority`: enum (Low, Medium, High, Critical)
- `status`: enum (Open, In Progress, Review, Done, Closed)
- `assignee`: string (user ID/email, optional)
- `tags`: string[] (optional, max 10 tags)
- `createdAt`: timestamp (auto-generated)
- `updatedAt`: timestamp (auto-updated)
- `createdBy`: string (user ID, auto-captured)

## API Endpoints

- `POST /api/work-items` — Create new work item
- `GET /api/work-items` — List work items with filters/sort (query params: type, priority, status, sortBy, order, page, limit)
- `GET /api/work-items/:id` — Get single work item
- `PUT /api/work-items/:id` — Update work item
- `PATCH /api/work-items/:id/status` — Update status only
- `DELETE /api/work-items/:id` — Delete work item (soft delete)

## Front-end Components Needed

**Pages**
- `WorkItemListPage.tsx` — Main list view with filters and sorting controls

**Components**
- `WorkItemForm.tsx` — Create/edit form with validation
- `WorkItemCard.tsx` — Individual work item display card
- `WorkItemFilters.tsx` — Filter controls (Type, Priority, Status)
- `WorkItemSort.tsx` — Sort dropdown (Priority, Created, Updated)
- `WorkItemTable.tsx` — Tabular list view alternative
- `TagInput.tsx` — Multi-tag input component
- `StatusBadge.tsx` — Status display badge
- `PriorityIcon.tsx` — Priority indicator

**Hooks**
- `useWorkItems.ts` — Fetch, filter, and sort work items
- `useWorkItemForm.ts` — Form state and validation logic

**Services**
- `workItemService.ts` — API client for work item endpoints

**Types**
- `workItem.types.ts` — TypeScript interfaces and enums

## File/Folder Structure

```
src/
├── pages/
│   └── work-items/
│       ├─— WorkItemListPage.tsx
│       └── WorkItemDetailPage.tsx
├── components/
│   └─— work-items/
│       ├── WorkItemForm.tsx
│       ├─— WorkItemCard.tsx
│       ├── WorkItemFilters.tsx
│       ├── WorkItemSort.tsx
│       ├─— WorkItemTable.tsx
│       ├── TagInput.tsx
│       ├── StatusBadge.tsx
│       └── PriorityIcon.tsx
├── hooks/
│   └── work-items/
│       ├─— useWorkItems.ts
│       └─— useWorkItemForm.ts
├── services/
│   └── workItemService.ts
├─— types/
│   └── workItem.types.ts
└─— constants/
    └── workItems.ts (enums, validation rules)
```

## Implementation Sequence

1. **Define Types & Constants** — Create TypeScript interfaces, enums for Type/Priority/Status, validation schemas
2. **API Service Layer** — Implement workItemService.ts with all CRUD + list/filter/sort methods
3. **Custom Hooks** — Build useWorkItems (data fetching, caching) and useWorkItemForm (validation, submission)
4. **UI Components (Atomic)** — StatusBadge, PriorityIcon, TagInput (reusable pieces)
5. **WorkItemForm** — Create/edit form with validation and error handling
6. **WorkItemCard & Table** — Display components for list views
7. **Filters & Sort Controls** — WorkItemFilters and WorkItemSort components
8. **WorkItemListPage** — Assemble all components, wire filters/sort to API
9. **Routing & Navigation** — Add routes, nav menu entries
10. **Testing** — Unit tests for hooks/services, integration tests for form submission and list filtering
11. **Documentation** — Update user guide with work item management instructions