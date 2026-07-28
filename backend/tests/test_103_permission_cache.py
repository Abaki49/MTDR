"""
TEST-103 — Permission Cache & Override Tests

Verifies Redis caching behavior and sync invalidation (Section 15, Section 18.7, Section 18.14).
"""

import httpx
import pytest
from conftest import BASE_URL


class TestPermissionCache:
    """Redis caching and invalidation for resolved permissions."""

    def test_permission_is_cached(self, client, admin_headers, seeded_org_id):
        """Permission result is cached after first resolution.

        After calling /me/permissions, the backend caches the result in Redis.
        A second call returns the same data (cache hit).
        """
        r1 = client.get(f"/organizations/{seeded_org_id}/me/permissions", headers=admin_headers)
        assert r1.status_code == 200
        perms1 = r1.json()["permissions"]

        r2 = client.get(f"/organizations/{seeded_org_id}/me/permissions", headers=admin_headers)
        assert r2.status_code == 200
        perms2 = r2.json()["permissions"]

        assert perms1 == perms2, "Cached permissions differ between calls"

    def test_put_permissions_invalidates_cache(self, client, admin_headers, seeded_org_id):
        """PUT permissions invalidates cache: Editor's next attempt returns 404.

        - Editor (role 2) has resource.create by default.
        - Admin removes resource.create (permission_id=6) via PUT override.
        - Editor's next POST to create a resource returns 404.
        - Admin restores the override.
        - Editor can create again.
        """
        # Remove resource.create from Editor role
        r = client.put(
            f"/organizations/{seeded_org_id}/roles/2/permissions",
            headers=admin_headers,
            json=[{"permission_id": 6, "allowed": False}],
        )
        assert r.status_code == 200

        # Editor should now get 404 on resource.create
        editor_token = _login("member@test.com", "member123")
        r = client.post(
            f"/organizations/{seeded_org_id}/resources",
            headers={"Authorization": f"Bearer {editor_token}"},
            json={"title": "Should Fail", "storage_key": "fail/test.txt"},
        )
        assert r.status_code == 404, f"Expected 404 after permission revocation, got {r.status_code}: {r.text}"

        # Restore — clear overrides
        r = client.put(
            f"/organizations/{seeded_org_id}/roles/2/permissions",
            headers=admin_headers,
            json=[],
        )
        assert r.status_code == 200

        # Editor can create again
        r = client.post(
            f"/organizations/{seeded_org_id}/resources",
            headers={"Authorization": f"Bearer {editor_token}"},
            json={"title": "Should Succeed", "storage_key": "success/test.txt"},
        )
        assert r.status_code == 201, f"Expected 201 after restore, got {r.status_code}: {r.text}"

        # Cleanup
        resource_id = r.json()["id"]
        client.delete(f"/organizations/{seeded_org_id}/resources/{resource_id}", headers=admin_headers)

    def test_db_rollback_does_not_invalidate_cache(self, client, admin_headers, seeded_org_id):
        """DB transaction rollback on PUT permissions does NOT invalidate cache.

        After a failing PUT (invalid permission_id), the cache should remain
        unchanged from before the attempt.
        """
        # Warm the cache
        r = client.get(f"/organizations/{seeded_org_id}/me/permissions", headers=admin_headers)
        assert r.status_code == 200
        perms_before = r.json()["permissions"]

        # Attempt to PUT with an invalid permission_id → triggers rollback
        r = client.put(
            f"/organizations/{seeded_org_id}/roles/2/permissions",
            headers=admin_headers,
            json=[{"permission_id": 99999, "allowed": False}],
        )
        assert r.status_code == 404, f"Expected 404 for invalid permission_id, got {r.status_code}"

        # Permissions should be unchanged
        r = client.get(f"/organizations/{seeded_org_id}/me/permissions", headers=admin_headers)
        assert r.status_code == 200
        perms_after = r.json()["permissions"]
        assert perms_before == perms_after, "Permissions changed despite rollback"


def _login(email: str, password: str) -> str:
    r = httpx.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200
    return r.json()["access_token"]
