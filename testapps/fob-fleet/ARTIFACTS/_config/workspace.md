# FOB Fleet — workspace config (slice, stack A)
- Runtime: Node (CommonJS), no external deps.
- Layout: SOURCE/{schema,service,ui}/ each with index.js + test.cjs.
- Test: `node test.cjs` per component (exit 0 = pass).
- Secrets: none in source; none required for this slice.
