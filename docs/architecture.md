# Multi-Tenant Document Repository

## Proof of Concept (PoC) — Refined Architecture

**Frontend:** React + TypeScript + React Router + TanStack Query
**Backend:** FastAPI + SQLAlchemy + Alembic
**Database:** PostgreSQL
**Cache:** Redis (Permission and Identity Caching)
**Authentication:** JWT (Access + Refresh Tokens)
**Authorization:** Multi-Tenant RBAC with Delegated Administration

---

# 1. Goals

Build a secure multi-tenant document repository where:

* A **Super Admin** manages organizations and organization administrators.
* Each **Organization Admin** manages their own repository, editors, and editor permissions.
* Editors manage documents according to permissions granted within their organization.
* Public users can browse published documents.

The architecture must guarantee:

* Complete tenant isolation
* Dynamic permission updates
* Delegated administration
* Scalability toward production

---

# 2. Core Design Principles

## Principle 1 — Tenant Isolation First

Authorization always follows this order:

1. Authenticate user.
2. Determine target organization (see Section 9 for how the target org is determined per request type).
3. Verify active membership in that organization.
4. Resolve permissions.
5. Execute the requested action.

**Tenant isolation is always checked before permissions.**

## Principle 2 — Membership is the Security Boundary

Permissions are never attached directly to users. A user receives permissions through a membership inside an organization.

```text
User
   │
Membership
   │
Organization
```

Every authorization decision starts from the Membership. A membership only counts as valid if its `status` is `ACTIVE` (see Section 6).

## Principle 3 — Roles Define Defaults

Roles define default permissions. Organizations may customize those permissions without modifying the global role definition.

## Principle 4 — Permissions are Resolved Per Request, From the Request's Organization

Permissions are **not** stored inside the JWT, and there is no client-selectable "current organization" concept anywhere in the system.

Every organization-scoped endpoint takes the target `organization_id` from the request itself — either directly from the URL path, or derived by looking up the resource's owning organization.

Benefits:

* Permission changes are immediate.
* No forced logout after permission changes.
* No ambiguity about which organization a request is being authorized against.

---

# 3. High-Level Architecture

```text
React
    │
 JWT Access Token
    │
    ▼
FastAPI
    │
    ├── Authentication Service ──────► Redis (User state cache)
    ├── Authorization Service ───────► Redis (Permission cache)
    ├── Organization Service
    ├── Membership Service
    ├── Role Service
    ├── Permission Service
    ├── Resource Service
    └── Audit Service
             │
             ▼
        PostgreSQL
```

---

# 4. Project Structure

## Backend

```text
backend/
└── app/
    ├── api/
    │   └── v1/
    │       ├── auth.py
    │       ├── organizations.py
    │       ├── memberships.py
    │       ├── roles.py
    │       ├── permissions.py
    │       ├── resources.py
    │       ├── audit.py
    │       └── public.py
    ├── core/
    │   ├── config.py
    │   ├── security.py
    │   ├── auth.py
    │   ├── authorization.py
    │   └── cache.py
    ├── database/
    │   ├── session.py
    │   ├── base.py
    │   ├── migrations/
    │   └── models/
    ├── repositories/
    ├── services/
    ├── schemas/
    ├── utils/
    └── main.py
```

## Frontend

```text
frontend/
├── src/
│   ├── api/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── pages/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── Dockerfile.dev
```

---

# 5. Domain Model

```text
                User
                  │
            Membership
          ┌───────┴────────┐
          │                │
         Role       Organization
          │                │
          └────────┐       │
                   │       │
             Role Permissions
                   │
      Organization Permission Overrides
                   │
               Resources
```

---

# 6. Database Schema

## users

```text
id
name
email
password_hash
is_super_admin       (Boolean)
is_active            (Boolean - global account kill switch)
created_at
updated_at
```

`is_super_admin` is **never** stored in the JWT. It is resolved server-side per request (see Section 11).
If `is_active = false`, authentication middleware immediately rejects the token with a `401 Unauthorized`, regardless of membership status.

## organizations

```text
id
name
slug                 (Unique, for human-readable URLs)
description
created_at
updated_at
```

## memberships

Represents a user's role inside one organization.

```text
id
user_id
organization_id
role_id
status
created_at
updated_at
```

`status` is one of: `ACTIVE`, `SUSPENDED`, `INVITED`.

Only `ACTIVE` memberships are considered by the authorization algorithm (Section 9). `SUSPENDED` or `INVITED` memberships grant no permissions.

**Uniqueness Constraint:** A user may only hold one membership per organization. This is enforced via a partial unique index in PostgreSQL:

```sql
CREATE UNIQUE INDEX idx_unique_active_membership 
ON memberships (user_id, organization_id) 
WHERE status = 'ACTIVE';
```

*Assigning a role to a user who already has an `ACTIVE` membership in that org results in an `UPDATE` to their existing row (changing `role_id`). If they have an `INVITED` or `SUSPENDED` membership, assigning a role updates that existing row to `ACTIVE` with the new `role_id`.*

## roles

```text
id
name
is_system
rank
created_at
updated_at
```

`rank` is an integer that makes the role hierarchy (Section 7) data-driven. Lower rank = more authority.

**Immutability Rule:** The `rank` column is strictly immutable at the application layer. It can only be set via Alembic database migrations by a system administrator. This prevents privilege escalation via rank mutation.

## permissions

```text
id
name
description
```

Example permissions:

```text
organization.create
organization.update
organization.delete

membership.create
membership.update
membership.delete

permission.manage

resource.create
resource.read
resource.update
resource.delete

resource.download
resource.publish
resource.archive

audit.read
```

*(Note: `role.update` has been intentionally omitted. Role rank is immutable, and role permission overrides are managed via `permission.manage`.)*

## role_permissions

Default permissions.

```text
role_id
permission_id
```

## organization_role_permissions

Organization-specific overrides.

```text
organization_id
role_id
permission_id
allowed
```

**Semantics:** Overrides act as a patch on top of `role_permissions`.
* A permission in defaults with no override retains its default.
* An override with `allowed = true` grants the permission.
* An override with `allowed = false` revokes the default permission.
* A permission in neither defaults nor overrides is *not granted*.

## resources

```text
id
organization_id
title
description
storage_key         (S3/MinIO object key or local file path)
visibility          (PUBLIC | PRIVATE)
created_by
created_at
updated_at
```

## audit_logs

```text
id
organization_id
actor_id
action
entity_type
entity_id
before              (JSONB)
after               (JSONB)
created_at
```

---

# 7. Role Hierarchy

```text
Super Admin          (rank 0)
      │
Organization Admin   (rank 1)
      │
Editor               (rank 2)
```

Rule: A role may only assign roles with a strictly greater rank (strictly less authority) than its own.

| Role                | May Assign                 |
| ------------------- | --------------------------- |
| Super Admin         | Organization Admin, Editor |
| Organization Admin  | Editor                     |
| Editor              | None                       |

**Bootstrapping exception:** Creating an organization's *first* Organization Admin is done by the Super Admin via `POST /organizations/{organization_id}/members`. This is simply the Super Admin exercising their normal "may assign Organization Admin" right on a brand-new organization.

---

# 8. Authorization Architecture

Authentication and authorization are separate concerns.

```python
AuthorizationService.authorize(
    user=current_user,
    organization_id=organization_id,
    permission="resource.update"
)
```

`organization_id` is always resolved by the endpoint *before* calling the service. Endpoints never implement authorization logic themselves.

---

# 9. Tenant Isolation Algorithm

## 9.1 Determining the target organization_id

* **Org-scoped paths** (e.g. `/v1/organizations/{organization_id}/resources`) — read directly from the path.
* **Resource-scoped paths** (e.g. `/v1/resources/{resource_id}/download`) — the resource is fetched by id *first*, and its `organization_id` becomes the target. If no resource exists, return `404 Not Found` immediately.

## 9.2 Algorithm

```text
Authenticate User & Verify is_active = true
        │
        ▼
Resolve is_super_admin (from server-side cache/DB)
        │
        ▼
Is Super Admin?
        │
   Yes──┴──► Allow
        │
       No
        │
Resolve organization_id (per 9.1)
        │
        ▼
Find Membership
WHERE user_id = current_user
AND organization_id = resolved organization_id
AND status = 'ACTIVE'
        │
        ▼
Membership exists?
        │
 No ─────────► 404 Not Found
        │
       Yes
        │
Resolve Effective Permissions (Section 10)
        │
Permission Present?
        │
   No ──────► 404 Not Found
        │
       Yes
        │
       Allow
```

## 9.3 Error code policy

The system uniformly returns **404 Not Found**, never 403, for any authorization failure caused by missing membership or missing permission. This prevents leaking the existence of other tenants' data. `401 Unauthorized` is used for missing/invalid authentication or disabled accounts.

---

# 10. Permission Resolution

Permissions are computed dynamically, scoped to one `(user, organization)` pair at a time, utilizing Redis for caching.

```python
def resolve_permissions(role_id: int, organization_id: int) -> set[str]:
    cache_key = f"perms:org:{organization_id}:role:{role_id}"
    
    # 1. Check Redis
    cached = redis.get(cache_key)
    if cached:
        return set(json.loads(cached))

    # 2. DB Fallback
    effective = set(default_role_permissions(role_id))
    overrides = get_organization_overrides(organization_id, role_id)
    for override in overrides:
        if override.allowed:
            effective.add(override.permission)
        else:
            effective.discard(override.permission)

    # 3. Populate Redis (30s TTL safety net)
    redis.set(cache_key, json.dumps(list(effective)), ex=30)
    return effective
```

---

# 11. Authentication

JWT contains **only** identity information.

```json
{
  "sub": 42
}
```

Permissions, `is_super_admin`, and "current organization" are **never** stored in the token.

**Server-Side Identity Resolution:**
Upon receiving a JWT, the authentication middleware extracts `sub` (user_id) and queries Redis/DB for the user's `is_super_admin` and `is_active` flags. 

* If `is_active` is false, return `401 Unauthorized`.
* `is_super_admin` is cached in Redis (key: `user:{id}:is_super_admin`) with a 5-minute TTL. When a user is promoted/demoted, this cache key is synchronously deleted.

**Token strategy:**
* Short-lived access token
* Refresh token
* Password hashing with Argon2
* Login rate limiting

---

# 12. API (v1)

All endpoints are prefixed with `/v1`.

## Authentication

```text
POST /v1/auth/login
POST /v1/auth/refresh
POST /v1/auth/logout
GET  /v1/auth/me
```

`GET /v1/auth/me` returns the authenticated user's identity and their memberships (organization, role, status). It does not return resolved permissions.

## User Organization Context

```text
GET /v1/organizations/{organization_id}/me/permissions
```

Returns the caller's effective permissions for the specified organization. Requires an `ACTIVE` membership in that organization. The frontend caches this per-org context.

## Organizations

Super Admin only.

```text
GET    /v1/organizations
POST   /v1/organizations
PUT    /v1/organizations/{organization_id}
DELETE /v1/organizations/{organization_id}
```

*(Note: `GET /v1/organizations` is cross-org and governed by the super-admin check, bypassing the standard tenant-isolation algorithm).*

## Members

```text
GET    /v1/organizations/{organization_id}/members
POST   /v1/organizations/{organization_id}/members
GET    /v1/organizations/{organization_id}/members/{member_id}
PUT    /v1/organizations/{organization_id}/members/{member_id}
DELETE /v1/organizations/{organization_id}/members/{member_id}
```

`POST` and `PUT` enforce the rank rule (Section 7). `PUT` allows updating `role_id` or `status` (e.g., suspending a member).

## Roles

```text
GET /v1/organizations/{organization_id}/roles
```

## Permissions

```text
GET /v1/organizations/{organization_id}/roles/{role_id}/permissions
PUT /v1/organizations/{organization_id}/roles/{role_id}/permissions
```

Requires `permission.manage`. `PUT` synchronously invalidates the Redis permission cache for that org/role (see Section 14).

## Resources

```text
GET    /v1/organizations/{organization_id}/resources
POST   /v1/organizations/{organization_id}/resources
GET    /v1/organizations/{organization_id}/resources/{resource_id}
PUT    /v1/organizations/{organization_id}/resources/{resource_id}
DELETE /v1/organizations/{organization_id}/resources/{resource_id}
```

## Downloads

```text
GET /v1/resources/{resource_id}/download
```

1. Fetch resource by `id`. If missing, `404`.
2. Read `organization_id` off the resource.
3. Run full tenant isolation algorithm (Section 9) requiring `resource.download`.
4. Stream file from storage using `storage_key`.

## Audit Log

```text
GET /v1/organizations/{organization_id}/audit-logs
GET /v1/audit-logs?organization_id={id}   (Super Admin only)
```

## Public API

```text
GET /v1/public/resources
GET /v1/public/resources/{resource_id}
```

Bypasses tenant isolation. Filters strictly on `visibility = PUBLIC` at the SQL query level.

---

# 13. React Authorization

After login, `GET /v1/auth/me` returns identity and memberships only.

When the user navigates into a specific organization's pages, the frontend fetches effective permissions via `GET /v1/organizations/{org}/me/permissions`. This is cached in a React context keyed by `organization_id`.

**Staleness handling:** If a mutating endpoint (POST/PUT/DELETE) returns a `404 Not Found` (which, per Section 9.3, covers missing permissions), the frontend intercepts this and refetches the organization's permissions to update the UI accurately. Read endpoint `404`s are treated as genuinely missing resources.

```tsx
const { can } = usePermissions(orgId);
{can("resource.delete") && <DeleteButton />}
```

The backend always performs the final authorization check.

---

# 14. Permission Cache Invalidation

To support multi-instance deployment without violating Principle 4, Redis is the mandatory cache layer.

**Write Path:**
When `PUT /v1/organizations/{org}/roles/{role_id}/permissions` is called:

```python
async def update_role_permissions(...):
    async with db.transaction():
        # 1. Delete existing overrides
        # 2. Insert new overrides
        await db.commit()
        
    # 3. Invalidate cache strictly AFTER commit
    await redis.delete(f"perms:org:{org_id}:role:{role_id}")
```

**Why after commit?** If invalidated before commit and the commit fails, the next request rebuilds the cache with the *old* data. Invalidating after commit guarantees the cache is cleared only when the new truth is persisted. A 30s TTL acts purely as a safety net.

---

# 15. Testing Strategy

## Unit Tests
* Permission resolver and override patching logic.
* Role hierarchy / rank comparison.
* Authorization service (including resource-lookup-then-authorize path).

## Integration Tests
For every endpoint: Super Admin, Org Admin, Editor, Anonymous.
Assert `404` (not `403`) for authorization failures.

## Tenant Isolation & Security Tests
* Editor (Org A) reads Resource (Org B) → `404`
* Editor (Org A) downloads Resource (Org B) via `/v1/resources/{id}/download` → `404`
* Org Admin (Org A) assigns Org Admin role → `404` (rank check fails)
* Org Admin (Org A) assigns Editor role → `200`
* Super Admin assigns first Org Admin to new org → `200`
* User with `SUSPENDED` membership in Org A accesses Org A → `404`
* User with `is_active = false` accesses any endpoint → `401`
* Upsert membership: User with `ACTIVE` membership in Org A is assigned a new role → `200`, row is updated (no duplicate).

---

# 16. Development Phases

## Phase 1
* API v1 routing & CORS
* Authentication (with `is_active` checks)
* Organizations, Memberships (with unique constraints), Users
* Resources (using `storage_key`)
* Alembic migrations
* Cursor-based pagination on all list endpoints

## Phase 2
* Redis integration (identity + permission cache)
* Authorization Service (Section 9)
* Permission resolver & synchronous invalidation (Section 14)
* Rank-based role assignment guard
* Audit logging
* Integration tests

## Phase 3
* Organization permission editor UI
* React permission-aware UI
* File upload and download streaming

## Phase 4
* Full-text search
* Soft delete (with audit log snapshotting)
* S3/MinIO integration
* Performance optimization

---

# 17. Future Enhancements
* Custom organization-defined roles (enforced `rank > 1`)
* ABAC (Attribute-Based Access Control)
* Document approval workflows & version history
* Elasticsearch/OpenSearch integration
* Background processing
* MFA & SSO (OIDC/SAML)
* Organization branding

---

# 18. Security Invariants

1. Every protected request authenticates the user and verifies `users.is_active = true`.
2. `is_super_admin` is never trusted from the JWT; it is resolved server-side per request.
3. Every organization-scoped request verifies an `ACTIVE` membership before checking permissions.
4. Only Super Admin may create organizations or assign Organization Admin roles (via the normal membership endpoint).
5. Role assignment is governed by `roles.rank`: a caller may only assign a role with strictly greater rank.
6. The `roles.rank` column is immutable at the application layer.
7. Permissions are resolved dynamically on every request, scoped to a single `(user, organization)` pair.
8. A user may only hold one `ACTIVE` membership per organization, enforced by DB constraint.
9. Files are downloaded exclusively through `/v1/resources/{resource_id}/download`, which resolves org ownership before streaming.
10. Public endpoints filter `visibility = PUBLIC` at the query level.
11. All membership/permission changes are recorded in the audit log, which requires `audit.read` to view.
12. Frontend authorization is for usability only; the backend is the source of truth.
13. **All authorization failures return `404 Not Found` uniformly**, never `403`.
14. Permission cache invalidation on write is synchronous via Redis, executed strictly after database commit.