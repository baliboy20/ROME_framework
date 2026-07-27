# Getting Started with ROME (newbie guide)

You have a PRD/BRD and want an app. This is the absolute-beginner path, start to
finish. ROME runs as **one Claude session (the orchestrator, "Roma") that calls
specialist sub-agents and enforces quality with deterministic checks**.

> Framework: ROME v3.x. For concepts see `USER-GUIDE.md`; for
> the engine see `ROME/rome-core/orchestrator/README.md`.

> **Where does the Claude session run?** Always `ROME_framework/` — the folder
> you cloned in step 0.1 — never `my-app/` itself. `my-app/` is just a subfolder
> created inside it (step 1). Open the session there once and stay there for
> every step below (0.4 through 5); every path in this guide (`my-app/...`,
> `ROME/...`) is written relative to `ROME_framework/`.

---

## Step 0 — One-time setup
1. Get the framework:
   ```bash
   git clone https://github.com/baliboy20/ROME_framework.git
   cd ROME_framework
   ```
2. Install the one dependency the AORDL validator needs:
   ```bash
   cd ROME/rome-core/lib && npm install && cd -
   ```
3. Sanity check (optional):
   ```bash
   node ROME/rome-core/orchestrator/tests/run.cjs   # should be all green
   ```
4. Open a **Claude Code session on Opus 4.8** with `ROME_framework/` (the folder from step 1, where you just ran `npm install`) as its working directory. That session *is* the orchestrator — keep it there for every step below; `my-app/` is created as a subfolder of it, and all paths in this guide (`my-app/...`, `ROME/...`) are relative to it.

## Steps 0.2, 0.3, 1, 2 — automated
After step 0.1 (clone + `cd ROME_framework`), if you already have your PRD/BRD
file(s) ready, one command does the dependency install, the sanity check,
project scaffolding, and staging your inputs:
```bash
./bootstrap.sh my-app --intent greenfield -- path/to/prd.md
```
(Flags before `--` pass through to `rome-start.cjs`; files after `--` are staged
into `my-app/_user_input/raw-requirements/`. Add `--skip-check` to skip the
sanity check. Run it from the `ROME_framework/` root — where it lives.) It
prints step 0.4 and Step 3 for you to do by hand: opening the Claude Code
session and pasting the launch line — those are chat actions, not shell ones.

On a pristine clone (clean tree, no local commits ahead of upstream), it also
removes the dev-only folders you don't need to build an app: `ROME_architect/`,
`ROME_framework_maintenance/`, `testapps/`, `test-project-to-validate-framework-v1/`.
It automatically skips this on a maintainer's working copy (dirty tree or
commits ahead) — use `--skip-prune` to opt out explicitly, or `--force-prune`
to override the check.

Otherwise, follow the manual steps below.

## Step 1 — Create your project
```bash
node ROME/rome-core/orchestrator/rome-start.cjs my-app --intent greenfield --ts "$(date -u +%FT%TZ)"
```
- `my-app` = any folder name.
- `--intent greenfield` for a brand-new app; use `refinement` / `extension` / `migration` if changing an existing system.
- Optional flags — add them **without brackets**; type only the ones you want:
  - `--prototype` (adds a UI mock-up + sponsor approval step; if you stage
    wireframes or images, Surveyor recommends this automatically — v3.1)
  - `--no-intake` (skip the input check — only if your inputs are clean and complete)
  - `--budget 400000` (token ceiling)
- Example with options (note: no `[ ]` — those mean "optional" in docs, don't type them):
  ```bash
  node ROME/rome-core/orchestrator/rome-start.cjs my-app --intent greenfield --ts "$(date -u +%FT%TZ)" --prototype --budget 400000
  ```
- This creates `my-app/`, **vendors a frozen framework copy into `my-app/.rome/`** (so the project is self-contained), writes `my-app/ARTIFACTS/_orchestration/state.json`, and prints your **next action**.

## Step 2 — Add your PRD/BRD
Put your documents here:
```
my-app/_user_input/raw-requirements/
```
(Just drop in your `*.md` PRD/BRD files.)

**Writing the PRD/BRD first?** Use the authoring guide at the repo root —
`REQUIREMENTS-AUTHORING-GUIDE.md`. Paste it into the Claude session where you
draft your requirements: specs written to it convert into the framework's formal
requirements almost mechanically, pass validation first time, and skip the
clarification round-trips. Hand-drawn screen sketches are welcome too — photograph
them, add the small text annotation file the guide describes (`WF-*`), and stage
them here; they become the layout contract AND switch the prototype step on.

`rome-start` deliberately does **not** judge your inputs yet — it sets up the
folders and stops. The input specialist (**Surveyor**) reads what you actually
stage here in the next step and decides whether it's good enough to build from.
If you leave this folder empty or your inputs are inadequate, the framework will
**refuse to proceed** and ask you to clarify — it no longer rubber-stamps an empty
folder (PROP-047). If you write a note like `**Status:** PROPOSED` on a document,
Surveyor reads it and checks with you before building on it. (Confident your inputs
are clean and complete? `rome-start … --no-intake` skips the check.)

**Building something with several modules?** Order your inputs into **stages** —
`raw-requirements/stage-0/` (shared plumbing: login, database schema, design
system), `stage-1/` (the thin slice you want demoable first — that IS your MVP),
`stage-2/` and up (the rest). Each stage is built as its own increment, in your
order; Surveyor checks the ordering is consistent and asks you which shared
subsystems to implement now vs stub with a deadline. When one increment is
delivered, grow the project with `rome-increment.cjs my-app --stage N --ts …` —
it never erases the previous increment's record (PROP-048/049).

## Step 3 — Run it
In that same Claude session — still with `ROME_framework/` as its working
directory, never `cd`'d into `my-app/` — say (plain English):
> "You are Roma, the ROME orchestrator. Run the project at `my-app/` following `ROME/agents/roma/modes/orchestrator.md`. Begin."

Roma then walks the phases automatically — requirements → analysis → design →
(optional prototype) → config → code generation — dispatching specialist
sub-agents (Talib, PMA, Clara, Lucien, the generators) and asking **Sarah** to
approve each quality gate. It can't skip a gate or approve unbuilt code: the
guard requires real evidence (validation passes, code builds + tests pass, no
secrets, traceability complete) before advancing.

## Step 4 — Answer its questions
When Roma needs a decision (or your input is unclear), it asks you a focused
question in the chat. Answer it. It will **not** guess on inadequate input.

## Step 5 — Collect your app
When it finishes, your application is in:
```
my-app/SOURCE/
```
with full traceability (every requirement → code → test) and an audit trail of
how it was built.

---

## Coming back to change something

Your app is built and delivered — and now you've found a bug, want a tweak, or
your requirements changed. You do NOT start over, and you do NOT go through the
whole pipeline again.

1. **Open the session in the same place as always** — `ROME_framework/`, never
   inside `my-app/`. (If you open it in `my-app/` by mistake, a note there
   redirects you. If you've moved `my-app/` somewhere else entirely, open the
   session in the project folder itself — its built-in `.rome/` copy takes over.)
2. **Say what you want in plain words:**
   > "You are Roma. The project at `my-app/` is built. The login button crashes
   > on empty input — fix it."
3. **Roma checks the records first.** It looks up which requirement, files, and
   tests your issue touches, tells you what kind of change it is — a bug fix, a
   small tweak, a changed requirement, a new feature, or a bigger restructure —
   and what it will touch. You confirm.
4. **Only the necessary work runs.** A bug fix goes straight to fix → test →
   one quality gate. A changed requirement redoes only what traces from it. A
   new feature becomes a new increment. Nothing else is disturbed, and every
   change is recorded.

Found several things while testing? Just list them — Roma queues each one,
tells you what type it is, and you choose the order. The queue survives between
sessions, so nothing gets lost.

**Project built with an older ROME?** Ask Roma to "check for an upgrade" — it
shows what a newer framework would change, what it needs from you, and whether
upgrading or a fresh re-intake is the better deal. You decide; everything is
reversible.

---

## Two things every newbie should know

1. **If your PRD is big, slice it.** Don't build a whole multi-feature product at
   once. Tell the session *"first just do intake and tell me the plan,"* then pick
   **one capability** to build first. Add more later (the framework supports
   incremental change).

2. **Pick a buildable tech stack.** ROME actually *runs and tests* the generated
   code before delivery — so a mainstream stack (e.g. Node/TypeScript) gives you a
   clean "it really works" guarantee.

## One-liner
Setup once → `rome-start my-app` → drop PRD in `_user_input/` → tell the session
*"run it as Roma"* → answer its questions → collect `my-app/SOURCE/`.

## Roles & models (FYI)
The orchestrator (Roma) and the gate (Sarah) and architect (PMA) run best on
**Opus**; the producers/generators on **Sonnet**; intake on **Haiku**. See
`ROME/rome-core/docs/standards/agent-roles-standard.md`.
