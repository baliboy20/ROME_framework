# FOB Booking Admin — component library extensions

Eleven token-driven components extending the bound **FOB Booking Admin** design system
(`FOBBookingAdmin_27b13c`). Each is a sibling Design Component styled entirely with FOB
`var(--*)` tokens — no invented colours, type, or spacing. They were extracted from the
patterns hand-built across the admin console (`Admin System.dc.html`) and guide app
(`Guide App.dc.html`).

These live alongside — not inside — the compiled `_ds_bundle.js`. The bundle's 7 core
components (Button, Card, DataTable, Field, FilterChip, Modal, StatusPill) are unchanged;
these are additive.

## Using them

Import as a sibling DC from a file **in this `components/` folder** (dc-import resolves by
basename against the importing file's own directory):

```html
<dc-import name="StatCard" value="11" label="In service" tone="lime" hint-size="100%,110px"></dc-import>
```

To use from a file at the project root, either place the consumer in `components/` or copy
the component next to it. Always set `hint-size`.

> **Gotcha:** `name` is dc-import's own file-selector attribute — never name a prop `name`.
> `SignatureField` uses `signatory` for exactly this reason.

## The components

### Admin console
| Component | Purpose | Key props |
|---|---|---|
| `StatCard` | Big-number metric tile with a status dot | `value`, `label`, `tone` (lime/orange/cyan/pink/neutral) |
| `ReadinessBadge` | ✓ / ~ / ✗ sub-state pill | `state` (ok/partial/miss), `label` |
| `TreeNav` | Collapsible grouped nav treeview + 68px icon-rail mode | `groups`, `active`, `collapsed`, `onSelect` |
| `TransferList` | Two-column assign/unassign with coverage counter | `items` (`{id,status,reason}`), `assigned`, `need`, `onChange` |
| `CalendarMonth` | Month grid with tone-coded day events | `year`, `month` (0-indexed), `events` (`{day,label,sub,tone}`), `onSelect` |

### Guide app
| Component | Purpose | Key props |
|---|---|---|
| `StepRow` | Playbook step: number/tick, title, status chip | `num`, `title`, `sub`, `status` (todo/current/done), `onClick` |
| `ProgressBar` | n/max fill; `onDark` variant for gradient headers | `value`, `max`, `label`, `onDark` |
| `ChecklistRow` | Tap-to-tick row, optional sub + chip | `label`, `sub`, `chip`, `checked`, `onChange` |
| `SignatureField` | Tap-to-sign declaration pad | `signatory`, `label`, `placeholder`, `signed`, `onSign` |
| `CategoryChips` | Single-select chip row | `options` (string[]), `value`, `onChange` |
| `StarRating` | 1–5 star input | `value`, `count`, `onChange` |

Stateful components (`TreeNav`, `TransferList`, `ChecklistRow`, `SignatureField`,
`CategoryChips`, `StarRating`) work uncontrolled out of the box and become controlled when
you pass the value prop + the change callback.

## Gallery

`Gallery.dc.html` (in this folder) mounts every component with live sample data — open it to
browse and interact with the set.
