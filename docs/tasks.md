# Implementation Tasks: Multi-Tenant Document Repository

This document breaks the Architecture.md into actionable engineering tasks. 
**Convention:** Backend tasks are `BE-###`, Frontend tasks are `FE-###`, and dedicated security/isolation test tasks are `TEST-###`.

---

## Phase 1: Foundation & Core API

**[BE-101] Initialize Backend Project & Database Config**
* **Description:** Set up FastAPI, SQLAlchemy, Alembic, and base configurations.
* **Acceptance Criteria:**
  * FastAPI app boots successfully.
  * Alembic is configured and can run `upgrade head` against an empty PostgreSQL database.
  * API v1 router prefix (`/v1`) is configured.
  * CORS middleware is configured for the frontend origin.
* **Dependencies:** None.
* **Implements:** Architecture Section 4 (Project Structure), Section 16 (Phase 1).

**[BE-102] Define Core Database Models & Migrations**
* **Description:** Create SQLAlchemy models and initial Alembic migration for all Phase 1 tables.
* **Acceptance Criteria:**
  * Models created for: `users`, `organizations`, `roles`, `permissions`, `role_permissions`, `memberships`, `resources`.
  * `users` model includes `is_active` boolean (default True) and `is_super_admin` boolean (default False).
  * `memberships` partial unique index (`WHERE status = 'ACTIVE'`) is implemented in DDL/migration.
  * `roles.rank` is defined as Integer.
  * `resources.visibility` defaults to `PRIVATE`.
* **Dependencies:** BE-101.
* **Implements:** Architecture Section 6 (Database Schema).

**[BE-103] Implement Authentication Service**
* **Description:** Build JWT login, refresh, and logout flows.
* **Acceptance Criteria:**
  * `POST /v1/auth/login` issues access and refresh tokens.
  * JWT access token payload contains *only* `sub` (user_id). It must **not** contain `is_super_admin` or permissions.
  * Password hashing uses Argon2.
  * Auth middleware verifies JWT and checks `users.is_active`. If `false`, returns `401 Unauthorized`.
  * Super admin status is resolved via DB/cache, not JWT.
* **Dependencies:** BE-102.
* **Implements:** Architecture Section 11 (Authentication), Section 18.1, Section 18.2.

**[BE-104] Implement Organizations & Users APIs**
* **Description:** CRUD endpoints for organizations and super-admin user listing.
* **Acceptance Criteria:**
  * `GET/POST/PUT/DELETE /v1/organizations` implemented.
  * Endpoints are globally protected (require auth).
  * Organization creation requires Super Admin status.
  * Cursor-based pagination implemented on `GET /v1/organizations`.
* **Dependencies:** BE-103.
* **Implements:** Architecture Section 12 (API), Section 18.4.

**[BE-105] Implement Memberships API**
* **Description:** Endpoints for managing organization members.
* **Acceptance Criteria:**
  * `GET/POST/PUT/DELETE /v1/organizations/{org_id}/members` implemented.
  * `POST` and `PUT` enforce rank hierarchy (caller rank < target rank).
  * Upsert logic applied: Assigning a role to a user with an existing `ACTIVE` membership updates the `role_id` rather than creating a duplicate.
  * Assigning a role to a user with `SUSPENDED`/`INVITED` membership updates status to `ACTIVE`.
* **Dependencies:** BE-104.
* **Implements:** Architecture Section 12 (Members), Section 18.8.

**[BE-106] Implement Resources CRUD & Public APIs**
* **Description:** Endpoints for managing org-scoped resources and public viewing.
* **Acceptance Criteria:**
  * `GET/POST/PUT/DELETE /v1/organizations/{org_id}/resources` implemented.
  * `GET /v1/public/resources` filters strictly on `visibility = PUBLIC` at the SQL query level.
  * `GET /v1/public/resources/{id}` fetches by ID but strictly verifies `visibility = PUBLIC` before returning.
  * Uses `storage_key` field instead of `file_path`.
* **Dependencies:** BE-104.
* **Implements:** Architecture Section 12 (Resources, Public API), Section 18.10.

**[FE-101] Frontend Scaffolding & Auth Context**
* **Description:** Initialize React app, routing, and login flows.
* **Acceptance Criteria:**
  * React + TypeScript + Vite + React Router + TanStack Query configured.
  * Login page calls `POST /v1/auth/login`.
  * Auth context manages access/refresh tokens.
  * `GET /v1/auth/me` is called on app load to populate user context.
* **Dependencies:** BE-103 (blocked by backend auth API).
* **Implements:** Architecture Section 13 (React Authorization).

---

## Phase 2: Authorization, Caching, & Isolation Tests

**[BE-107] Integrate Redis for Identity & Permission Caching**
* **Description:** Connect FastAPI to Redis and cache user state.
* **Acceptance Criteria:**
  * Redis client initialized and available to services.
  * `is_super_admin` is cached in Redis (`user:{id}:is_super_admin`) with a 5-minute TTL.
  * Invalidating this key is possible via a service method.
* **Dependencies:** BE-103.
* **Implements:** Architecture Section 11, Section 14.

**[BE-108] Implement Authorization Service (Tenant Isolation)**
* **Description:** Build the core authorization algorithm.
* **Acceptance Criteria:**
  * `AuthorizationService.authorize(user, org_id, permission)` is implemented.
  * Returns `True` if Super Admin.
  * Checks for `ACTIVE` membership; returns `False` if missing.
  * Checks resolved permissions; returns `False` if missing.
  * All endpoints utilizing this service return `404 Not Found` (never `403`) when authorization fails.
* **Dependencies:** BE-105, BE-107.
* **Implements:** Architecture Section 8, Section 9.2, Section 18.3, Section 18.13.

**[BE-109] Implement Permission Resolution & Sync Cache Invalidation**
* **Description:** Implement dynamic permission calculation and Redis caching.
* **Acceptance Criteria:**
  * `resolve_permissions(role_id, org_id)` queries defaults + overrides.
  * Result is cached in Redis (`perms:org:{org_id}:role:{role_id}`) with a 30s TTL.
  * `PUT /v1/organizations/{org_id}/roles/{role_id}/permissions` deletes the Redis key strictly *after* the database transaction commits.
* **Dependencies:** BE-107, BE-108.
* **Implements:** Architecture Section 10, Section 14, Section 18.7, Section 18.14.

**[BE-110] Enforce Role Rank Immutability**
* **Description:** Ensure `roles.rank` cannot be mutated via the API.
* **Acceptance Criteria:**
  * No API endpoint accepts `rank` in its payload schema for roles.
  * If an endpoint updates a role, the `rank` field is explicitly excluded from the SQLAlchemy update dictionary.
* **Dependencies:** BE-102.
* **Implements:** Architecture Section 18.6.

**[BE-111] Implement Audit Logging Service**
* **Description:** Write to `audit_logs` on permission/membership changes.
* **Acceptance Criteria:**
  * `audit_logs` model created.
  * `before` and `after` states are written as JSONB.
  * Any `POST/PUT/DELETE` on Memberships or Permissions triggers an audit log entry.
  * `GET /v1/organizations/{org_id}/audit-logs` implemented (requires `audit.read`).
  * `GET /v1/audit-logs` implemented (Super Admin only).
* **Dependencies:** BE-105, BE-109.
* **Implements:** Architecture Section 6 (audit_logs), Section 12 (Audit Log), Section 18.11.

**[BE-112] Implement User Context Permissions Endpoint**
* **Description:** Endpoint for frontend to fetch current user's permissions for an org.
* **Acceptance Criteria:**
  * `GET /v1/organizations/{org_id}/me/permissions` implemented.
  * Requires `ACTIVE` membership (no specific permission needed).
  * Returns an array of permission strings.
* **Dependencies:** BE-109.
* **Implements:** Architecture Section 12 (User Organization Context), Section 13.

**[FE-102] Organization Dashboard & Permissions Context**
* **Description:** Build the organization selection UI and permissions context.
* **Acceptance Criteria:**
  * UI lists user's organizations from `GET /v1/auth/me`.
  * Navigating to an org fetches `GET /v1/organizations/{org_id}/me/permissions`.
  * `can(permission)` React hook/helper is implemented and cached per org context.
  * UI conditionally renders elements based on `can()`.
* **Dependencies:** FE-101, BE-112 (blocked by backend context endpoint).
* **Implements:** Architecture Section 13.

**[FE-103] Members Management UI**
* **Description:** UI for listing, adding, and editing organization members.
* **Acceptance Criteria:**
  * Calls `GET /v1/organizations/{org_id}/members`.
  * Add/Edit member forms call `POST/PUT` endpoints.
  * UI restricts available roles in the dropdown based on standard rank rules (UI hint only, backend enforces).
* **Dependencies:** FE-102, BE-105.
* **Implements:** Architecture Section 12 (Members).

**[TEST-101] Tenant Isolation Integration Tests (implemented)**
* **Description:** Dedicated tests verifying cross-tenant boundaries.
* **Acceptance Criteria:**
  * Test: Editor (Org A) reads Resource (Org A) -> `200 OK`.
  * Test: Editor (Org A) reads Resource (Org B) -> `404 Not Found`.
  * Test: Editor (Org A) downloads Resource (Org B) via `/v1/resources/{id}/download` -> `404 Not Found`.
  * Test: User with `SUSPENDED` membership in Org A accesses Org A -> `404 Not Found`.
  * Test: User with `is_active = false` hits any endpoint -> `401 Unauthorized`.
* **Dependencies:** BE-108, BE-114 (download endpoint implemented in BE-114). Tests run against Docker Compose services.
* **Implements:** Architecture Section 15 (Tenant Isolation Tests), Section 18.3, Section 18.9, Section 18.13.

**[TEST-102] Role Hierarchy & Audit Log Tests (implemented)**
* **Description:** Dedicated tests for rank enforcement and audit logging.
* **Acceptance Criteria:**
  * Test: Org Admin (Org A) assigns Org Admin role -> `404 Not Found` (or 400 depending on implementation flag).
  * Test: Org Admin (Org A) assigns Editor role -> `200 OK`.
  * Test: Super Admin assigns first Org Admin to a brand-new org -> `200 OK`.
  * Test: PUT permissions verifies `audit_logs` row is created with correct `before`/`after` JSONB.
* **Dependencies:** BE-110, BE-111.
* **Implements:** Architecture Section 15, Section 18.4, Section 18.5, Section 18.11.

**[TEST-103] Permission Cache & Override Tests (implemented)**
* **Description:** Dedicated tests for Redis caching and sync invalidation.
* **Acceptance Criteria:**
  * Test: User's permission is cached.
  * Test: PUT permissions removes user's ability to use that permission on next request (without TTL expiry).
  * Test: DB transaction rollback on PUT permissions does *not* invalidate the cache.
* **Dependencies:** BE-109.
* **Implements:** Architecture Section 15, Section 18.7, Section 18.14.

---

## Phase 3: UI Polish & File Handling

**[BE-113] Implement File Upload to Local Storage**
* **Description:** Handle multipart uploads and save to local disk (simulating S3).
* **Acceptance Criteria:**
  * `POST /v1/organizations/{org_id}/resources` handles `multipart/form-data`.
  * File is saved to a local volume; `storage_key` is generated and saved to DB.
* **Dependencies:** BE-106.
* **Implements:** Architecture Section 16 (Phase 3).

**[BE-114] Implement Secure File Download Streaming**
* **Description:** Stream files via the secure download endpoint.
* **Acceptance Criteria:**
  * `GET /v1/resources/{resource_id}/download` implemented.
  * Fetches resource first; returns `404` if missing.
  * Runs full Tenant Isolation algorithm (requires `resource.download`).
  * Streams file using `FileResponse`.
* **Dependencies:** BE-108, BE-113.
* **Implements:** Architecture Section 12 (Downloads), Section 18.9.

**[FE-104] Permission-Aware UI & Mutation 404 Handling**
* **Description:** Refine frontend to handle stale permission states gracefully.
* **Acceptance Criteria:**
  * `can()` hook is used to hide/modify UI elements.
  * If a `POST/PUT/DELETE` request returns `404 Not Found`, the frontend intercepts it and refetches `GET /v1/organizations/{org_id}/me/permissions` to update UI context.
* **Dependencies:** FE-102.
* **Implements:** Architecture Section 13, Section 18.12.

**[FE-105] Resource Management UI & Upload/Download**
* **Description:** UI for managing documents.
* **Acceptance Criteria:**
  * List view calls `GET /v1/organizations/{org_id}/resources`.
  * Upload form posts to `POST .../resources` via TanStack Query mutation.
  * Download button hits `GET /v1/resources/{id}/download` and triggers browser download.
* **Dependencies:** FE-104, BE-113, BE-114 (blocked by file backend APIs).
* **Implements:** Architecture Section 16 (Phase 3).

**[FE-106] Organization Permission Editor UI**
* **Description:** UI for Org Admins to manage permission overrides.
* **Acceptance Criteria:**
  * View lists roles and their default/overridden permissions (`GET .../permissions`).
  * Toggle/Checkbox UI calls `PUT .../permissions`.
  * UI only renders if user `can("permission.manage")`.
* **Dependencies:** FE-104, BE-109 (blocked by permission backend APIs).
* **Implements:** Architecture Section 12 (Permissions), Section 16 (Phase 3).

---

## Phase 4: Scalability & Operations

**[BE-115] Implement Soft Delete for Resources**
* **Description:** Replace hard deletes with soft deletes and snapshot state to audit log.
* **Acceptance Criteria:**
  * `resources` table gets `deleted_at` timestamp.
  * `DELETE /v1/organizations/{org_id}/resources/{id}` sets `deleted_at` instead of dropping the row.
  * All `GET` queries filter `deleted_at IS NULL`.
  * Soft delete action snapshots the entity state into `audit_logs.before`.
* **Dependencies:** BE-111, BE-106.
* **Implements:** Architecture Section 16 (Phase 4).

**[BE-116] S3/MinIO Object Storage Adapter**
* **Description:** Replace local disk storage with S3/MinIO.
* **Acceptance Criteria:**
  * File upload streams to S3-compatible bucket.
  * File download streams from S3-compatible bucket.
  * `storage_key` correctly references the S3 object path.
  * Local disk fallback is removed.
* **Dependencies:** BE-113, BE-114.
* **Implements:** Architecture Section 16 (Phase 4), Section 17.

**[BE-117] Full-Text Search Integration**
* **Description:** Add PostgreSQL full-text search or Elasticsearch for resources.
* **Acceptance Criteria:**
  * `GET /v1/organizations/{org_id}/resources` supports a `?search=` query parameter.
  * Search applies to title/description.
  * Search results are strictly scoped to the target organization (no cross-tenant search leaks).
* **Dependencies:** BE-106.
* **Implements:** Architecture Section 16 (Phase 4), Section 17.

**[FE-107] Search & Pagination UI**
* **Description:** Frontend integration for search inputs and cursor pagination controls.
* **Acceptance Criteria:**
  * Search bar added to resource list view.
  * "Load More" or pagination controls handle cursor tokens from list APIs.
* **Dependencies:** BE-117, FE-105.
* **Implements:** Architecture Section 16 (Phase 4).

---

## Ambiguities & Underspecified Items Flagged

1. **[BE-105] Memberships API - PUT Semantics:** The Architecture (Section 12) lists `PUT /members/{member_id}` but does not specify if the endpoint accepts `role_id`, `status`, or both. **Assumption:** The dev team should implement it to accept both, allowing an Org Admin to suspend (change status) or promote/demote (change role_id) a member. 
2. **[BE-106] Public API - Pagination:** Architecture specifies cursor-based pagination on list endpoints in Phase 1, but Phase 4 mentions Pagination again. **Assumption:** Phase 1 implements standard cursor pagination. Phase 4 is specifically for the Search + Pagination UI integration on the frontend, while the backend already supports it.
3. **[FE-104] 404 Refetch Logic:** Architecture (Section 13) says to refetch permissions on `404`. **Assumption:** A `404` on a resource ID (e.g., `GET /resources/123`) could mean the resource doesn't exist, or the user lacks permissions. The frontend cannot distinguish these. The dev team should *only* trigger the permission refetch on `404`s from mutating endpoints (POST/PUT/DELETE) to org-scoped routes, and display a generic "Not Found" on GET 404s.
4. **[TEST-102] Rank Check Failure Code:** Architecture Section 15 expects `404 Not Found` for a failed rank check (e.g., Org Admin assigning Org Admin). **Assumption:** The dev team should ensure the Membership Service explicitly returns the 404 status code here to align with the global error policy, rather than a 400 Bad Request.