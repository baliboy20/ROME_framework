#!/usr/bin/env bash
# Manual end-to-end check for FR-001 workstream 5, against a local wrangler dev
# worker. Uses the sponsor's real reference document rather than a fixture, so
# the reported numbers are the actual ones.
set -euo pipefail

API="${API:-http://localhost:8787}"
SRC="${SRC:-/Users/will/WebstormProjects/SconzApplications/untitled2/book-conf.html}"

TOKEN=$(curl -s -X POST "$API/auth/owner/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@friendsonbikes.uk","password":"admin1234"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')

ID=$(curl -s -X POST "$API/admin/email-templates" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"use_case":"booking_confirmed_paid","name":"Imported confirmation","subject":"You are booked in","body":"Hi {{name}}"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
echo "template id: $ID"

python3 - "$SRC" <<'PY'
import json, sys
html = open(sys.argv[1], encoding='utf-8').read()
json.dump({'html': html}, open('/tmp/fob-import-payload.json', 'w'))
print(f'source document: {len(html):,} bytes')
PY

echo "--- import ---"
curl -s -X POST "$API/admin/email-templates/$ID/import-html" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  --data-binary @/tmp/fob-import-payload.json | python3 -m json.tool

echo "--- stored state ---"
curl -s "$API/admin/email-templates" -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys, json
t = [x for x in json.load(sys.stdin)['templates'] if x['id'] == '$ID'][0]
print('body_source :', t['body_source'])
print('body_html   :', f\"{len(t['body_html'] or ''):,} bytes\")
print('body_blocks :', t['body_blocks'])
"
rm -f /tmp/fob-import-payload.json
echo "$ID"
