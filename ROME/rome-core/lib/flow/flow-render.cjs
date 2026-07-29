#!/usr/bin/env node
/**
 * flow-render — Mermaid diagram FROM a FLOW artifact (ROME-PROP-057 §3.3).
 * The diagram is a VIEW: generated, displayed (Seez), never hand-edited —
 * picture and record cannot drift.
 *
 * usage: flow-render.cjs <FLOW-file.yaml> [-o out.mmd]   (default: stdout)
 */
'use strict';
const fs = require('fs');
const { yaml, renderMermaid } = require('./flow-lib.cjs');

const file = process.argv[2];
if (!file) { console.error('usage: flow-render.cjs <FLOW-file.yaml> [-o out.mmd]'); process.exit(2); }
const i = process.argv.indexOf('-o');
const mmd = renderMermaid(yaml.load(fs.readFileSync(file, 'utf8')));
if (i >= 0) { fs.writeFileSync(process.argv[i + 1], mmd + '\n'); console.log(`flow-render: wrote ${process.argv[i + 1]}`); }
else console.log(mmd);
