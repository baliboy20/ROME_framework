# Getting Started with ROME (newbie guide)

You have a PRD/BRD and want an app. This is the absolute-beginner path, start to
finish. ROME runs as **one Claude session (the orchestrator, "Roma") that calls
specialist sub-agents and enforces quality with deterministic checks**.

> Framework: ROME v2.x ("Tiberius" line). For concepts see `USER-GUIDE.md`; for
> the engine see `ROME/rome-core/orchestrator/README.md`.

---

## Step 0 — One-time setup
1. Get the framework:
   ```bash
   git clone <the rome_assistants repo>
   cd rome_assistants
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
  - `--prototype` (adds a UI mock-up + approval step)
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

`rome-start` deliberately does **not** judge your inputs yet — it sets up the
folders and stops. The input specialist (**Surveyor**) reads what you actually
stage here in the next step and decides whether it's good enough to build from.
If you leave this folder empty or your inputs are inadequate, the framework will
**refuse to proceed** and ask you to clarify — it no longer rubber-stamps an empty
folder (PROP-047). If you write a note like `**Status:** PROPOSED` on a document,
Surveyor reads it and checks with you before building on it. (Confident your inputs
are clean and complete? `rome-start … --no-intake` skips the check.)

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
