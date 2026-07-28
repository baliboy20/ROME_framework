-- CR-002 (CHG-001) — HTML email bodies on email_templates (REQ-NOTIF10).
-- Additive only: two nullable columns. Existing rows stay NULL (text-only)
-- and keep working unchanged. No backfill, no index change.
-- body_blocks: JSON array — the Owner's block-editor structure (authoring
--   source of truth; the editor round-trips this, never HTML).
-- body_html: the server-rendered, email-safe HTML projection of body_blocks
--   wrapped in the house shell. Regenerated on every create/update that
--   carries body_blocks; never client-supplied.

ALTER TABLE email_templates ADD COLUMN body_blocks TEXT;  -- JSON array, NULL = no HTML version
ALTER TABLE email_templates ADD COLUMN body_html TEXT;    -- rendered projection of body_blocks
