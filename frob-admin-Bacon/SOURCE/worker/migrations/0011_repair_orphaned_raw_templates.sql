-- FR-001 defect repair (2026-07-29) — templates left claiming raw HTML with no HTML.
--
-- Saving an imported template without first closing the editor sent
-- `body_blocks: null`, which the PATCH handler treated as "clear both columns".
-- The just-imported document was destroyed, and because `body_source` was never
-- reset the row was left as body_source='raw' with body_html NULL: a raw-HTML
-- template holding no HTML, which silently falls back to plain text and shows
-- 0 bytes in the editor.
--
-- The cause is fixed in three places (client payload, editor state, and a
-- server-side guard that ignores a null clear against a raw row). This repairs
-- rows already in that state.
--
-- The lost HTML cannot be recovered — it was overwritten, not archived. The
-- honest repair is to put the row back into a coherent state so the editor and
-- the send path agree: a template with no HTML is a BLOCKS template that has
-- none, which is exactly what text-only means.
UPDATE email_templates
   SET body_source = 'blocks'
 WHERE body_source = 'raw'
   AND (body_html IS NULL OR body_html = '');
