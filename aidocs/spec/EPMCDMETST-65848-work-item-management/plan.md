# Implementation Plan: Platform Activity Management - Work Item CRUD

## 1. Overview

Implement a complete work item management feature in the CodeMie UI application, enabling users to create, view, edit, filter, and sort work items for tracking platform activities. This feature will follow CodeMie's established architectural patterns:
- **Valtio Store** for state management
- **React Hook Form + Yup** for validation
- **Custom fetch wrapper** ('@/utils/api') for API calls
- **PrimeReact ** component library
- **Tailwind CSS** for styling

## 2. User Story

**As a** platform user,  
**I want to** create and manage work items,
**so that** I can track platform activities effectively.

## 3. Acceptance Criteria

1. Users can create/edit work items with **Title, Description, Type, Priority, Status, Assignee, and Tags**
2. Users can view work items in a **list**
3. Users can **filter** by Type, Priority, and Status
4. Users can **sort** by Priority, Created date, and Updated date
5. **Required fields** are validated before submission
6. UI integrates with the existing **REST APIs**

## 4. Research Findings

### Existing Patterns

Based on codebase research, I found the following relevant implementations:

1. **Store Patterns**:
   - `src/store/projects.ts` - Full CRUD with pagination, filters, sorting
   - `src/store/mcp.ts` - Filters + pagination pattern
   - `src/store/schedulers.ts` - Filter options pattern

2. **Form Patterns**:
   - React Hook Form + Yup validation
   - Separate `formSchema.ts` files
   - Custom form hooks for complex logic
   - Controller-based field management

3. **List View Patterns**:
   - PrimeReact DataTable component
   - Server-side pagination
   - Filter sidebar pattern
   - Sorting by columns

### Reusable Components

From `src/components`:
- `Button/Button.tsx` - Standard button component
- `Popup/Popup.tsx` - Modal dialog wrapper
- `form/Input`, `Textarea`, `Select`, `MultiSelect` - Form fields
- `FilterSection` - Sidebar filter container

### Existing Security & Error Handling

- **Automatic toaster notifications** for API errors
- **await response.json()** for response parsing (NOT axios .data)
- **Loading + error states** in every async method
- **Finally blocks** to reset loading state

## 5. Technical Context

### Repository
**codemie-ui** (React 18.3.1, TypeScript 5.8.3, Vite)

### Relevant Technologies
- **Valtio** - State management (proxy based)
- **React Hook Form** 7.x + @hookform/resolvers/yup
- **Yup** - Validation schemas
- **PrimeReact** 10.9.x - UI component library
- **Tailwind CSS** - Utility-first styling
- **Vitest**: Testing framework

### Dependencies & Integrations

1. **Backend API** - Assumed to exist or being developed in parallel
2. **User Store** (`src/store/user.ts`) - Assignee selection
3. **Application Router** - Add new routes for work items

## 6. Proposed Changes

### Backend (API Contract) 
class diagram
    class WorkItemAPI{
        +GET /v1/work-items
        +POST /v1/work-items
        +GET /v1/work-items/:id
        +PUT /v1/work-items/:id
        +DELETE /v1/work-items/:id
    }

### Frontend

#### 1. Types & Constants

**Files to Create:**
- `src/types/entity/workItem.ts`
- `src/constants/workItems.ts`

**Details:**

```typescript
// src/types/entity/workItem.ts

export type WorkItemType = 'Task' | 'Bug' | 'Feature' | 'Improvement'

export type WorkItemPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type WorkItemStatus = 'Open' | 'In Progress' | 'Review' | 'Done' | 'Closed'

export interface WorkItem {
  id: string
  title: string
  description: string
  type: WorkItemType
  priority: WorkItemPriority
  status: WorkItemStatus
  assignee: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface WorkItemRequest {
  title: string
  description?: string
  type: WorkItemType
  priority: WorkItemPriority
  status: WorkItemStatus
  assignee?: string | null
  tags?: string[]
}

export interface WorkItemFilters {
  type?: WorkItemType | null
  priority?: WorkItemPriority | null
  status?: WorkItemStatus | null
  search?: string
}

export type WorkItemSortField = 'priority' | 'createdAt' | 'updatedAt'
export type SortOrder = 'asc' | 'desc'
```

```typescript
// src/constants/workItems.ts

export const WORK_ITEM_TYPES = {
  Task: 'Task',
  Bug: 'Bug',
  Feature: 'Feature',
  Improvement: 'Improvement',
} as const

export const WORK_ITEM_PRIORITIES = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
  Critical: 'Critical',
} as const

export const WORK_ITEM_STATUS = {
  Open: 'Open',
  InProgress: 'In Progress',
  Review: 'Review',
  Done: 'Done',
  Closed: 'Closed',
} as const

export const DEFAULT_PAGE = 0
export const DEFAULT_PER_PAGE = 12
```

#### 2. Valtio Store

**File to Create:**: `src/store/workItems.ts`

**Details:**

```typescript
// src/store/workItems.ts

import { proxy } from 'valtio'
import api from '@/utils/api'
import { Pagination } from '@/types/common'
import { 
  WorkItem, 
  WorkItemRequest, 
  WorkItemFilters, 
  WorkItemSortField, 
  SortOrder
} from '@/types/entity/workItem'
import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from '@/constants/workItems'

interface WorkItemsStore {
  workItems: WorkItem[]
  pagination: Pagination
  loading: boolean
  error: string | null
  filters: WorkItemFilters
  indexWorkItems: (
    filters?: WorkItemFilters,
    page?: number,
    perPage?: number,
    sortBy?: WorkItemSortField,
    order?: SortOrder
  ) => Promise<WorkItem[]>
  getWorkItem: (id: string) => Promise<WorkItem>
  createWorkItem: (data: WorkItemRequest) => Promise<WorkItem>
  updateWorkItem: (id: string, data: WorkItemRequest) => Promise<WorkItem>
  deleteWorkItem: (id: string) => Promise<void>
  setFilters: (filters: WorkItemFilters) => void
  resetFilters: () => void
}

const DEFAULT_FILTERS: WorkItemFilters = {
  type: null,
  priority: null,
  status: null,
  search: '',
}

export const workItemsStore = proxy<WorkItemsStore>({
  workItems: [],
  pagination: {
    page: DEFAULT_PAGE,
    perPage: DEFAULT_PER_PAGE,
    totalPages: 0,
    totalCount: 0,
  },
  loading: false,
  error: null,
  filters: DEFAULT_FILTERS,


  async indexWorkItems(
    filters = {},
    page = DEFAULT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    sortBy?: WorkItemSortField,
    order?: SortOrder
  ) {
    this.loading = true
    this.error = null


    try {
      const params: Record<string, string | number> = {
        page,
        per_page: perPage,
      }

      // Add filters
      if (filters.type) params.type = filters.type
      if (filters.priority) params.priority = filters.priority
      if (filters.status) params.status = filters.status
      if (filters.search) params.search = filters.search

      // Add sorting
      if (sortBy) {
        params.sort_by = sortBy
        if (order) params.sort_order = order
      }

      // Build query string
      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          queryParams.append(key, String(value))
        }
      })
      const queryString = queryParams.toString()
      const url = queryString ? `v1/work-items?${queryString} : 'v1/work-items'

      const response = await api.get(url)
      const responseData = await response.json()

      const workItems = responseData.data || []
      const pagination = responseData.pagination || {}

      this.workItems = workItems
      this.pagination = {
        page: pagination.page ?? page,
        perPage: pagination.per_page ?? perPage,
        totalPages: Math.ceil((pagination.total ?? 0) / (pagination.per_page ?? perPage)),
        totalCount: pagination.total ?? 0,
      }

      return workItems
    } catch (error: any) {
      const contextualError = error.response?.data?.message ?? error.message
      this.error = `Failed to load work items: ${contextualError}`
      console.error('Work Items Store Error (indexWorkItems):', error)
      throw error
    } finally {
      this.loading = false
    }
  },

  async getWorkItem(id: string) {
    this.loading = true
    this.error = null

    try {
      const response = await api.get(`v1/work-items/${id}`)
      const data = await response.json()
      return data
    } catch (error: any) {
      const contextualError = error.response?.data?.message ?? error.message
      this.error = `Failed to load work item: ${contextualError}`
      console.error('Work Items Store Error (getWorkItem):', error)
      throw error
    } finally {
      this.loading = false
    }
  },

  async createWorkItem(data: WorkItemRequest) {
    this.loading = true
    this.error = null

    try {
      const response = await api.post('v1/work-items', data, { skipErrorHandling: true })
      const result = await response.json()

      // Add to beginning of list
      this.workItems.unshift(result)
      this.pagination.totalCount += 1

      return result
    } catch (error: any) {
      console.error('Work Items Store Error (createWorkItem):', error)
      throw error
    } finally {
      this.loading = false
    }
  },

  async updateWorkItem(id: string, data: WorkItemRequest) {
    this.loading = true
    this.error = null

    try {
      const response = await api.put(`v1/work-items/${id}`, data, { skipErrorHandling: true })
      const result = await response.json()

      // Update in the list
      const index = this.workItems.findIndex((item) => item.id === id)
      if (index !== -1) {
        this.workItems[index] = result
      }

      return result
    } catch (error: any) {
      console.error('Work Items Store Error (updateWorkItem):', error)
      throw error
    } finally {
      this.loading = false
    }
  },

  async deleteWorkItem(id: string) {
    try {
      await api.delete(`v1/work-items/${id}`)
      this.workItems = this.workItems.filter((item) => item.id !== id)
      this.pagination.totalCount -= 1
    } catch (error: any) {
      console.error('Work Items Store Error (deleteWorkItem):', error)
      throw error
    }
  },

  setFilters(filters: WorkItemFilters) {
    this.filters = { ...this.filters, ...filters }
  },

  resetFilters() {
    this.filters = DEFAULT_FILTERS
  },
})
```

#### 3. Form Validation Schema

**File to Create:**: `src/pages/work-items/formSchema.ts`

**Details:**

```typescript
// src/pages/work-items/formSchema.ts

import * as yup from 'yup'

export const workItemFormSchema = yup.object({
  title: yup.string().required('Title is required').max(200, 'Title must be less than 200 characters'),
  description: yup.string().max(5000, 'Description must be less than 5000 characters').nullable(),
  type: yup.string().oneOf(['Task', 'Bug', 'Feature', 'Improvement'], 'Invalid type').required('Type is required'),
  priority: yup.string().oneOf(['Low', 'Medium', 'High', 'Critical'], 'Invalid priority').required('Priority is required'),
  status: yup.string().oneOf(['Open', 'In Progress', 'Review', 'Done', 'Closed'], 'Invalid status').required('Status is required'),
  assignee: yup.string().nullable(),
  tags: yup.array().of(yup.string().required()).max(10, 'Maximum 10 tags allowed').nullable(),
})

export type WorkItemFormData = yup.InferType<typeof workItemFormSchema>
```

#### 4. Work Items List Page

**File to Create:**: `src/pages/work-items/WorkItemsListPage.tsx`

**Details:** Main page component that orchestrates the work item list view, filters, sorting, and pagination.

```typescript
// Basic structure for WorkItemsListPage.tsx

import React, { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import { workItemsStore } from '@/store/workItems'
import DataTable from '@/components/DataTable'
import Button from '@/components/Button'
import WorkItemForm from './WorkItemForm'
import WorkItemFilters from './WorkItemFilters'
import StatusBadge from '@/components/work-items/StatusBadge'
import PriorityIcon from '@/components/work-items/PriorityIcon'

const WorkItemsListPage = () => {
  const { workItems, loading, pagination, filters } = useSnapshot(workItemsStore)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<WorkItem | null>(null)
  const [sortField, setSortField] = useState<WorkItemSortField>('priority')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  useEffect(() => {
    workItemsStore.indexWorkItems(filters, pagination.page, pagination.perPage, sortField, sortOrder)
  }, [filters, pagination.page, pagination.perPage, sortField, sortOrder])

  return (
    <div className='container'>
      <div className='header'>
        <h1>Work Items</h1>
        <Button onClick={() => setShowForm(true)}>Create Work Item</Button>
      </div>
      
      <WorkItemFilters />
      
      <DataTable
        data={workItems}
        loading={loading}
        columns={columns}
        pagination={pagination}
        onSort={(field, order) => {
          setSortField(field)
          setSortOrder(order)
        }}
      />
      
      {showForm && (
        <WorkItemForm
          visible={showForm}
          onHide={() => {
            setShowForm(false)
            setEditItem(null)
          }}
          item={editItem}
        />
      )}
    </div>
  )
}

export default WorkItemsListPage
```

#### 5. Work Item Form Component

**File to Create:**: `src/pages/work-items/WorkItemForm.tsx`

**Details:** Form for creating/editing work items with React Hook Form + Yup validation. Uses Popup component for modal display.

#### 6. Work Item Filters Component

**File to Create:**: `src/pages/work-items/WorkItemFilters.tsx`

**Details:** Sidebar filters for Type, Priority, Status, and Search. Follows FilterSection pattern.

#### 7. Status Badge & Priority Icon

**Files to Create:**
- `src/components/work-items/StatusBadge.tsx`
- `src/components/work-items/PriorityIcon.tsx`

**Details:** Reusable presentation components for displaying status and priority.

## 7. API Contract

### Assumptions

- **Backend API is being developed in parallel** or **already exists**
- If not, the backend team needs to implement the following endpoints:

### Endpoints

1. **GET /v1/work-items**
   - Query params: `page`, `per_page`, `type`, `priority`, `status`, `search`, `sort_by`, `sort_order`
   - Response:
     ```json
     {
       "data": [...work items],
       "pagination": {
         "page": 0,
         "per_page": 12,
         "total": 100
       }
     }
     ```

2. **POST /v1/work-items**
   - Body: `WorkItemRequest`
   - Response: `WorkItem`

3. **GET /v1/work-items/:id**
   - Response: `WorkItem`

4. **PUT /v1/work-items/:id**
   - Body: `WorkItemRequest`
   - Response: `WorkItem`

5. **DELETE /v1/work-items/:id**
   - Response: 204 No Content

## 8. Technical Flow

1. **User opens Work Items Page** – WorkItemsListPage renders
2. **useEffect fires** ₓ `indexWorkItems()` called on workItemsStore
3. **API Request** ₓ `GET /v1/work-items` with filters/sort/pagination
4. **Store Updates** ₓ `workItems` and `pagination` state updated
5. **DataTable Renders** ₓ Work items displayed in table
6. **User Applies Filters** ₓ `setFilters()` called – triggers `indexWorkItems()` again
7. **User Clicks Create** ₓ `showForm` set to true ₓ WorkItemForm modal opens
8. **User Submits Form** ₓ `createWorkItem()` – `POST /v1/work-items`
9. **New Item Added** – Store updates list ₓ DataTable re-renders

## 9. Security & Error Handling

1. **Automatic Error Toasts**: The `api` wrapper automatically shows toaster notifications on API errors
2. **Form Validation**: Yup schema validates all fields before submission
3. **Loading States**: Disable submit buttons and show spinners during API calls
4. **Error States**: Display error messages from store.error
5. **Authentication**: API wrapper automatically handles authentication tokens

## 10. Testing

1. **Unit Tests**:
   - Store methods (`indexWorkItems`, `createWorkItem`, etc.)
   - Validation schema (Yup)
   - Form hooks

2. **Integration Tests** following Vitest patterns:
   - `WorkItemsListPage.integration.test.tsx`
   - `WorkItemForm.integration.test.tsx`

3**Test Cases**:
   - Load work items list
   - Apply filters (type, priority, status)
   - Change sorting (priority, createdAt, updatedAt)
   - Create new work item
   - Edit existing work item
   - Delete work item
   - Validation errors (empty title, invalid type, etc.)
   - Empty state (no work items)
   - Pagination

## 11. Dependencies & Assumptions

### Dependencies

1. **Backend API**: Backend must implement the Work Item API endpoints described in Section 7
2. **User Store**: For user list (assignee selection) - already exists

### Assumptions

1. Backend API returns paginated responses in the same format as other CodeMie APIs (projects, mcp, etc.)
2. Users are authenticated via the existing auth system
3. Permissions are handled by the backend (no role-based UI filtering needed)
4. Tags are free-form text (no predefined tag list)
5. Assignee is a user ID/email (no user object returned by the API)

## 12. Notes for Design Agent

1. **Follow CodeMie patterns** from `src/store/projects.ts`, `src/store/mcp.ts`
2. **Use PrimeReact components** (DataTable, Dropdown, MultiSelect, etc.)
3. **Follow form patterns** from `.ai-run/guides/patterns/form-patterns.md`
4. **Use cn() for classNames** from `@/utils/utils`
5. **Max 300 lines per file** – extract custom hooks and sub-components if needed
6. **Use `useSnapshot`** to read store state, **call store methods** to mutate
7. **Never call `api.*` directly from components** – always go through store methods
8. **Always use `await response.json()`**, not `.response.data` (Axios pattern)
9. **Use `FilterSection`** component for sidebar filters
10. **Follow integration test patterns** from existing tests in `__tests__` directories