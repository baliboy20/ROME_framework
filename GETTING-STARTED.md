# Getting Started with ROME (newbie guide)

You have a PRD/BRD and want an app. This is the absolute-beginner path, start to
finish. ROME runs as **one Claude session (the orchestrator, "Roma") that calls
specialist sub-agents and enforces quality with deterministic checks**.

> Framework: ROME v3.x. For concepts see `USER-GUIDE.md`; for
> the engine see `ROME/rome-core/orchestrator/README.md`.

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
4. Open a **Claude Code session on Opus 4.8** in this repo. That session *is* the orchestrator.

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
In your Claude session, say (plain English):
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
