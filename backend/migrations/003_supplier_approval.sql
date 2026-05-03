-- =============================================================
--  Migration 003: Supplier approval workflow
--  Adds is_approved column on users. Existing rows default to TRUE
--  so current accounts keep working; new supplier signups are
--  inserted with FALSE by the application and require an admin
--  to flip the flag via POST /admin/users/{id}/approve.
-- =============================================================

BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT TRUE;

COMMIT;
