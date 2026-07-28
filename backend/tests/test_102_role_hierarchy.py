"""
TEST-102 — Role Hierarchy & Audit Log Tests

Verifies rank-based assignment (Section 18.5) and audit logging (Section 18.11).
"""

import pytest


class TestRoleHierarchy:
    """Rank enforcement on membership assignment."""

    def test_org_admin_cannot_assign_org_admin(self, client, org_admin_headers, seeded_org_id):
        """Org Admin (Org A) assigns Org Admin role → 404.

        Org Admin has rank=1. Org Admin role has rank=1. Caller rank must be
        strictly less than target rank, so rank=1 cannot assign rank=1.
        """
        r = client.post(
            f"/organizations/{seeded_org_id}/members",
            headers=org_admin_headers,
            json={"user_id": 3, "role_id": 1},  # user 3 is Editor, trying to make them Org Admin
        )
        assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text}"

    def test_org_admin_can_assign_editor(self, client, org_admin_headers, seeded_org_id):
        """Org Admin (Org A) assigns Editor role → 200 OK.

        Org Admin has rank=1. Editor role has rank=2. Caller rank (1) < target rank (2). OK.
        Creates a temp user, assigns Editor, then cleans up.
        """
        token = _login("admin@test.com", "admin123")
        r = client.post(
            "/organizations",
            headers={"Authorization": f"Bearer {token}"},
            json={"name": "Temp Org", "slug": "temp-org-role"},
        )
        assert r.status_code in (200, 201), f"Expected 2xx, got {r.status_code}: {r.text}"
        temp_org = r.json()
        temp_org_id = temp_org["id"]

        r = client.post(
            f"/organizations/{temp_org_id}/members",
            headers={"Authorization": f"Bearer {token}"},
            json={"user_id": 3, "role_id": 2},
        )
        assert r.status_code in (200, 201)

        # Now org admin from seeded org has no power here. Instead, test within
        # the seeded org: create a temp user, add as editor.

        r = client.post(
            f"/organizations/{seeded_org_id}/members",
            headers=org_admin_headers,
            json={"user_id": 1, "role_id": 2},
        )
        assert r.status_code in (200, 201), f"Expected 2xx, got {r.status_code}: {r.text}"

        # Cleanup — demote/remove
        member_id = r.json()["id"]
        r = client.delete(
            f"/organizations/{seeded_org_id}/members/{member_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 204

        # Cleanup temp org
        client.delete(f"/organizations/{temp_org_id}", headers={"Authorization": f"Bearer {token}"})

    def test_super_admin_assigns_first_org_admin(self, client, admin_headers):
        """Super Admin assigns first Org Admin to a brand-new org → 200 OK."""
        # Create new org
        r = client.post("/organizations", headers=admin_headers, json={"name": "Fresh Org", "slug": "fresh-org"})
        assert r.status_code in (200, 201)
        new_org = r.json()
        new_org_id = new_org["id"]

        r = client.post(
            f"/organizations/{new_org_id}/members",
            headers=admin_headers,
            json={"user_id": 2, "role_id": 1},
        )
        assert r.status_code in (200, 201), f"Expected 2xx, got {r.status_code}: {r.text}"

        # Cleanup
        member_id = r.json()["id"]
        client.delete(f"/organizations/{new_org_id}/members/{member_id}", headers=admin_headers)
        client.delete(f"/organizations/{new_org_id}", headers=admin_headers)


class TestAuditLog:
    """Audit logging on permission and membership changes."""

    def test_put_permissions_creates_audit_log(self, client, admin_headers, seeded_org_id):
        """PUT permissions creates audit_logs row with correct before/after JSONB."""
        # Make a permission change
        r = client.put(
            f"/organizations/{seeded_org_id}/roles/2/permissions",
            headers=admin_headers,
            json=[{"permission_id": 4, "allowed": False}],
        )
        assert r.status_code == 200

        # Check audit log
        r = client.get(f"/organizations/{seeded_org_id}/audit-logs", headers=admin_headers)
        assert r.status_code == 200
        logs = r.json()
        perm_logs = [log for log in logs if log["entity_type"] == "role_permissions"]
        assert len(perm_logs) >= 1, f"No role_permissions audit logs found: {logs}"

        latest = perm_logs[-1]
        assert latest["action"] == "update"
        assert "before" in latest
        assert "after" in latest

        # Restore
        r = client.put(
            f"/organizations/{seeded_org_id}/roles/2/permissions",
            headers=admin_headers,
            json=[],
        )
        assert r.status_code == 200

    def test_membership_change_creates_audit_log(self, client, admin_headers, seeded_org_id):
        """PUT member creates audit_logs row with correct before/after JSONB."""
        r = client.get(f"/organizations/{seeded_org_id}/members", headers=admin_headers)
        members = r.json()
        editor_member = next(m for m in members if m["user_id"] == 3)
        member_id = editor_member["id"]

        # Ensure baseline state is role_id=2 (editor)
        if editor_member["role_id"] != 2:
            r = client.put(
                f"/organizations/{seeded_org_id}/members/{member_id}",
                headers=admin_headers,
                json={"role_id": 2},
            )
            assert r.status_code == 200

        # Change role to 1 (Org Admin)
        r = client.put(
            f"/organizations/{seeded_org_id}/members/{member_id}",
            headers=admin_headers,
            json={"role_id": 1},
        )
        assert r.status_code == 200

        # Check audit log — find the update that set role_id=1 with before.role_id=2
        r = client.get(f"/organizations/{seeded_org_id}/audit-logs", headers=admin_headers)
        logs = r.json()
        role_change_logs = [
            log for log in logs
            if log["entity_type"] == "membership"
            and log["entity_id"] == member_id
            and log["action"] == "update"
            and log["after"].get("role_id") == 1
            and log["before"].get("role_id") == 2
        ]
        assert len(role_change_logs) >= 1, (
            f"No membership update audit log with before.role_id=2 -> after.role_id=1 found. "
            f"All membership logs for member {member_id}: "
            f"{[l for l in logs if l['entity_type'] == 'membership' and l['entity_id'] == member_id]}"
        )

        # Restore
        r = client.put(
            f"/organizations/{seeded_org_id}/members/{member_id}",
            headers=admin_headers,
            json={"role_id": 2},
        )
        assert r.status_code == 200


def _login(email: str, password: str) -> str:
    import httpx
    from conftest import BASE_URL
    r = httpx.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200
    return r.json()["access_token"]
