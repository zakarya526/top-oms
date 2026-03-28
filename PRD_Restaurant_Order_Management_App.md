# Product Requirements Document (PRD)

## Restaurant Order Management App — MVP

**Product Name:** TBD (working title: *OrderFlow*)
**Platform:** Expo (React Native) — iOS & Android
**Backend:** Supabase (Postgres + Realtime + Auth + Row Level Security)
**Architecture:** Multi-tenant (one restaurant = one tenant)
**Version:** MVP v1.0
**Date:** March 28, 2026
**Reference Tenant:** Taste of Peshawar (72 menu items, 10 categories)

---

## 1. Problem Statement

Restaurant staff currently manage orders manually or through fragmented systems. There is no unified, real-time flow between the waiter taking an order at a table, the kitchen preparing it, and the admin overseeing operations. This leads to delays, miscommunication, and lost orders — especially during peak hours.

## 2. Product Vision (MVP)

A single Expo mobile app where:

- **Waiters** take orders at tables by selecting menu items
- **Kitchen staff** see incoming orders in real-time and update preparation status
- **Admins** manage the restaurant — menu, tables, users, and monitor all orders

All three roles operate within the same app, differentiated by role-based access. Data is isolated per restaurant (multi-tenant), and all order state changes propagate instantly via Supabase Realtime subscriptions.

## 3. User Roles & Permissions

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| **Admin** | Manage menu, tables, users; view all orders; change order status; configure restaurant settings | N/A — full access |
| **Waiter** | Create orders, assign to tables, view own orders, cancel pending orders | Edit menu, manage users, access other waiters' orders |
| **Kitchen** | View incoming orders, update order status (preparing → ready) | Create orders, edit menu, manage users |

## 4. Multi-Tenant Architecture

Each restaurant is a **tenant**. Tenant isolation is enforced at the database level using Supabase Row Level Security (RLS).

- Every table in the database includes a `restaurant_id` foreign key
- RLS policies ensure users can only read/write data belonging to their restaurant
- A user belongs to exactly one restaurant (via `user_profiles.restaurant_id`)
- Restaurant onboarding creates: the restaurant record, an admin user, and seed data (e.g., default table layout)

### Tenant Data Boundaries

Each restaurant has its own isolated:
- Menu items and categories
- Tables
- Orders and order items
- Users (waiters, kitchen staff, admins)

## 5. Core Features (MVP Scope)

### 5.1 Authentication & Onboarding

- **Sign-up / Sign-in** via Supabase Auth (email + password)
- On first login, user is routed based on their `role` in `user_profiles`
- Admin can invite users by creating accounts and assigning roles
- No self-registration for waiters/kitchen — admin creates their accounts

### 5.2 Menu Management (Admin Only)

- **Categories:** CRUD operations on menu categories
- **Menu Items:** CRUD operations on items within categories
- Each item has: `name`, `price`, `category_id`, `description` (optional), `is_available` toggle
- Admin can toggle item availability (e.g., "sold out" during service)
- Menu is read-only for Waiter and Kitchen roles

**Reference Categories (Taste of Peshawar):**

| # | Category | Item Count |
|---|----------|------------|
| 1 | Starters | 8 |
| 2 | Special Offers | 4 |
| 3 | Tawa (Family Sets) | 4 |
| 4 | Vegetarian | 3 |
| 5 | Main Courses | 12 |
| 6 | Sides | 8 |
| 7 | Drinks — Cans | 9 |
| 8 | Drinks — Glass Bottles | 9 |
| 9 | Drinks — Water | 3 |
| 10 | Drinks — Big Bottles | 7 |
| 11 | Drinks — Hot | 4 |
| 12 | Drinks — Lassi / Yogurt | 6 |

**Total:** 72 items across 12 categories

### 5.3 Table Management (Admin Only)

- Admin defines tables for the restaurant (e.g., Table 1–15)
- Each table has: `table_number`, `label` (optional), `capacity` (optional), `status` (available / occupied)
- Table status auto-updates when an active order is assigned to it
- Table becomes "available" again when all orders for that table are completed

### 5.4 Order Flow (Core Feature)

This is the heart of the app. The order lifecycle:

```
[Waiter Creates Order]
        ↓
   Status: PENDING
        ↓
[Kitchen Sees Order — Realtime]
        ↓
   Status: PREPARING
        ↓
[Kitchen Marks Ready]
        ↓
   Status: READY
        ↓
[Waiter Marks Served]
        ↓
   Status: SERVED
        ↓
[Admin/Waiter Marks Completed]
        ↓
   Status: COMPLETED
```

**Order Statuses:**

| Status | Set By | Meaning |
|--------|--------|---------|
| `PENDING` | System (on creation) | Order placed, waiting for kitchen |
| `PREPARING` | Kitchen | Kitchen has acknowledged and started cooking |
| `READY` | Kitchen | Food is ready for pickup/serving |
| `SERVED` | Waiter | Food delivered to the table |
| `COMPLETED` | Admin / Waiter | Order fully done, table can be cleared |
| `CANCELLED` | Waiter / Admin | Order cancelled before completion |

### 5.5 Waiter — Order Creation Flow

1. Waiter selects a **table** from the table list (shows availability)
2. Waiter browses menu by **category tabs/sections**
3. Waiter taps items to add to order, adjusting **quantity** per item
4. Waiter reviews the **order summary** (items, quantities, total)
5. Waiter adds optional **notes** (e.g., "no onions", "extra spicy")
6. Waiter submits order → status becomes `PENDING`
7. Order appears on Kitchen screen **instantly** via Supabase Realtime

**Waiter can also:**
- View their active orders and statuses
- Cancel a `PENDING` order (before kitchen starts preparing)
- Mark a `READY` order as `SERVED`
- Mark a `SERVED` order as `COMPLETED`

### 5.6 Kitchen Display System (KDS)

- Kitchen sees a **live feed** of incoming orders
- Orders appear as cards, sorted by time (oldest first — FIFO)
- Each card shows: table number, order items with quantities, notes, time since order placed
- Kitchen can tap to change status: `PENDING → PREPARING → READY`
- Visual indicators: color-coded by status, flashing/highlight for new orders
- **Auto-refresh via Supabase Realtime** — no manual polling

### 5.7 Admin Dashboard

- **Orders Overview:** Live view of all orders across all tables with status filters
- **Menu Management:** Full CRUD on categories and items
- **Table Management:** Add/edit/remove tables
- **User Management:** Create waiter/kitchen accounts, assign roles, deactivate users
- **Restaurant Settings:** Restaurant name, operating hours (display only in MVP)

## 6. Real-Time Architecture

Supabase Realtime subscriptions power all live updates.

### Channels & Subscriptions

| Channel | Subscribed By | Trigger |
|---------|---------------|---------|
| `orders:restaurant_id` | Kitchen, Admin | New order created, order status changed |
| `order_items:restaurant_id` | Kitchen | Items added to an order |
| `tables:restaurant_id` | Waiter, Admin | Table status changed |

### Implementation Pattern

```
// Pseudocode — Supabase Realtime subscription
supabase
  .channel('orders')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders',
    filter: `restaurant_id=eq.${restaurantId}`
  }, (payload) => {
    // Update local state with new/changed order
  })
  .subscribe()
```

### Key Behaviors

- When a waiter submits an order → kitchen screen updates instantly
- When kitchen changes status → waiter sees the update on their active orders
- When an order is completed → table status flips to "available"
- All subscriptions are scoped to `restaurant_id` for tenant isolation

## 7. Database Schema

### Tables

#### `restaurants`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| name | text | e.g., "Taste of Peshawar" |
| currency | text | e.g., "GBP" |
| created_at | timestamptz | Default: now() |

#### `user_profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | References `auth.users.id` |
| restaurant_id | uuid (FK) | References `restaurants.id` |
| full_name | text | |
| role | enum | `admin`, `waiter`, `kitchen` |
| is_active | boolean | Default: true |
| created_at | timestamptz | |

#### `menu_categories`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| restaurant_id | uuid (FK) | |
| name | text | e.g., "Starters" |
| sort_order | integer | Display ordering |
| created_at | timestamptz | |

#### `menu_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| category_id | uuid (FK) | References `menu_categories.id` |
| restaurant_id | uuid (FK) | Denormalized for RLS |
| name | text | e.g., "Chicken Karahi Boneless" |
| price | decimal(10,2) | e.g., 12.99 |
| description | text | Optional |
| is_available | boolean | Default: true |
| sort_order | integer | |
| created_at | timestamptz | |

#### `tables`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| restaurant_id | uuid (FK) | |
| table_number | integer | |
| label | text | Optional friendly name |
| capacity | integer | Optional |
| status | enum | `available`, `occupied` |
| created_at | timestamptz | |

#### `orders`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| restaurant_id | uuid (FK) | |
| table_id | uuid (FK) | References `tables.id` |
| waiter_id | uuid (FK) | References `user_profiles.id` |
| status | enum | `pending`, `preparing`, `ready`, `served`, `completed`, `cancelled` |
| notes | text | Optional general notes |
| total_amount | decimal(10,2) | Calculated from order items |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `order_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| order_id | uuid (FK) | References `orders.id` |
| menu_item_id | uuid (FK) | References `menu_items.id` |
| restaurant_id | uuid (FK) | Denormalized for RLS |
| item_name | text | Snapshot at order time |
| item_price | decimal(10,2) | Snapshot at order time |
| quantity | integer | |
| notes | text | Item-level notes (e.g., "extra spicy") |
| created_at | timestamptz | |

> **Note:** `item_name` and `item_price` are snapshotted from `menu_items` at order creation time. This ensures order history remains accurate even if menu prices change later.

### Row Level Security (RLS) — Core Policy Pattern

```sql
-- Example: orders table RLS
CREATE POLICY "Users can only access their restaurant's orders"
ON orders
FOR ALL
USING (
  restaurant_id = (
    SELECT restaurant_id FROM user_profiles
    WHERE id = auth.uid()
  )
);
```

Apply similar policies to all tenant-scoped tables.

## 8. Screen Map

### Waiter Screens
1. **Login** — Email + password
2. **Table Selection** — Grid/list of tables with availability status
3. **Menu Browser** — Categories as tabs, items as cards with +/- quantity
4. **Order Summary** — Review items, quantities, total, add notes → Submit
5. **My Orders** — List of waiter's active orders with status badges
6. **Order Detail** — Full order view with status timeline

### Kitchen Screens
1. **Login** — Email + password
2. **Order Queue** — Live feed of orders as cards (FIFO), color-coded by status
3. **Order Detail** — Expanded view with items, quantities, notes, status actions

### Admin Screens
1. **Login** — Email + password
2. **Dashboard Home** — Summary: active orders count, occupied tables, pending orders
3. **Orders Overview** — All orders with filters (status, table, date)
4. **Order Detail** — Full order view with ability to change status
5. **Menu Management** — Category list → Item list → Add/Edit item form
6. **Table Management** — Table list → Add/Edit table form
7. **User Management** — User list → Add user form (name, email, role)
8. **Restaurant Settings** — Basic restaurant info

## 9. Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Expo (React Native) with Expo Router |
| State Management | Zustand or React Context (lightweight for MVP) |
| Backend / Database | Supabase (Postgres) |
| Auth | Supabase Auth (email/password) |
| Real-Time | Supabase Realtime (Postgres Changes) |
| Tenant Isolation | Supabase RLS (Row Level Security) |
| Styling | NativeWind (Tailwind for React Native) or StyleSheet |

## 10. Suggested Project Structure

```
app/
├── (auth)/
│   ├── login.tsx
│   └── _layout.tsx
├── (waiter)/
│   ├── tables.tsx
│   ├── menu/[tableId].tsx
│   ├── order-summary.tsx
│   ├── my-orders.tsx
│   ├── order/[orderId].tsx
│   └── _layout.tsx
├── (kitchen)/
│   ├── queue.tsx
│   ├── order/[orderId].tsx
│   └── _layout.tsx
├── (admin)/
│   ├── dashboard.tsx
│   ├── orders.tsx
│   ├── order/[orderId].tsx
│   ├── menu/
│   │   ├── index.tsx
│   │   └── [categoryId].tsx
│   ├── tables.tsx
│   ├── users.tsx
│   ├── settings.tsx
│   └── _layout.tsx
├── _layout.tsx
└── index.tsx              # Role-based redirect after auth

lib/
├── supabase.ts            # Supabase client init
├── hooks/
│   ├── useOrders.ts       # Realtime order subscription
│   ├── useMenu.ts
│   ├── useTables.ts
│   └── useAuth.ts
├── stores/
│   └── orderStore.ts      # Zustand store for active order building
├── types/
│   └── database.ts        # TypeScript types matching DB schema
└── utils/
    └── formatCurrency.ts
```

## 11. Seed Data — Taste of Peshawar

The MVP will be seeded with the full Taste of Peshawar menu (72 items, 12 categories) as the reference tenant. A seed script should:

1. Create the "Taste of Peshawar" restaurant record (currency: GBP)
2. Create 12 menu categories with correct `sort_order`
3. Insert all 72 menu items with prices in GBP
4. Create default tables (e.g., Tables 1–10)
5. Create one admin user

## 12. Out of Scope (Post-MVP)

These are explicitly excluded from MVP and will be considered in future iterations:

- Payment processing / billing
- Analytics & reporting dashboards
- Receipt printing / PDF generation
- Customer-facing ordering (QR code at table)
- Push notifications
- Order modification after submission (cancel and re-create for MVP)
- Inventory / stock management
- Multi-language support
- Offline mode / local caching
- Delivery / takeaway order flow

## 13. Success Criteria (MVP)

The MVP is considered successful when:

1. A waiter can log in, select a table, build an order from the menu, and submit it
2. The kitchen screen shows the order within 2 seconds of submission
3. Kitchen can move order through `PENDING → PREPARING → READY`
4. Waiter sees status updates in real-time on their active orders
5. Admin can manage the full menu, tables, and user accounts
6. Two different restaurants (tenants) cannot see each other's data
7. The app runs smoothly on both iOS and Android via Expo

---

*This PRD is a living document. Scope adjustments should be discussed before implementation begins.*
