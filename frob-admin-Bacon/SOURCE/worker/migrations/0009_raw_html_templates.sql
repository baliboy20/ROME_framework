-- FR-001 workstream 5 — import a complete HTML document as a template.
--
-- This AMENDS CR-002 (CHG-001), which established that `body_html` is always a
-- server-rendered projection of `body_blocks` and can never be client input.
-- That rule now holds for block templates only. Sponsor-decided 2026-07-28.
--
-- body_source discriminates the two authoring modes:
--   'blocks' — CR-002 behaviour, unchanged. body_html is rendered from
--              body_blocks through the canonical renderer + house shell, and a
--              client-supplied body_html is still rejected outright.
--   'raw'    — the Owner supplied a complete HTML document. It REPLACES the
--              house shell: FOB's header, footer and deliverability invariants
--              do not apply, because the document brings its own.
--
-- Defaulting to 'blocks' means every existing template keeps exactly the
-- behaviour and guarantees it has today. Raw is opt-in, per template, and
-- visible in the record rather than inferred from whether body_blocks is null.
--
-- No sanitisation is applied to raw HTML (sponsor decision). The trust boundary
-- is "the Owner is trusted". Note this makes the admin app's live preview an
-- execution surface for Owner-supplied markup unless it is rendered isolated —
-- recorded here because the constraint lives with the data, not just the UI.

ALTER TABLE email_templates
  ADD COLUMN body_source TEXT NOT NULL DEFAULT 'blocks'
  CHECK (body_source IN ('blocks', 'raw'));
