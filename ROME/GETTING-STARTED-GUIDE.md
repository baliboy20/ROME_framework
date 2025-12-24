# ROME Framework: The Dummies Guide to Building Apps

**A Beginner's Step-by-Step Guide to Using ROME for Application Development**

| Field | Value |
|-------|-------|
| **Document UID** | ROME-GUIDE-001 |
| **Version** | 1.0 |
| **Date** | 2025-12-24T00:00:00Z |
| **Status** | Active |
| **Document Type** | Getting Started Guide |
| **Audience** | Beginners, Non-Technical Sponsors, First-Time ROME Users |

---

## What is ROME?

ROME (Requirements-to-Operations Methodology Environment) is a structured framework that helps you build complete applications from start to finish using AI assistants (Claude Code instances). Think of it as a **factory assembly line for software** where each step is handled by a specialized AI "robot."

**In Plain English:** You describe what you want (requirements), and ROME guides multiple AI assistants through a proven process to design and build your app.

---

## Why Use ROME?

**Without ROME:**
- "Build me a todo app" → Unpredictable results, inconsistent quality
- No clear way to track what's been built
- Hard to make changes later
- Difficult to understand how pieces fit together

**With ROME:**
- Clear requirements → Verified design → Working code
- Every decision is documented and traceable
- Quality checks at each step
- Multiple AI specialists working together (not just one doing everything)

---

## The Big Picture: ROME's 6 Phases

```
P0: BOOTUP          → Set up project folders and structure
    ↓
P1: AORDL           → Write clear, testable requirements
    ↓
P2: ANALYSIS        → Break requirements into features
    ↓
P3: DESIGN          → Design how the app will work
    ↓
P4: CONFIGURATION   → Set up development environment
    ↓
P5: GENERATION      → Build the actual code
    ↓
DELIVERY            → Deploy and run your app
```

Each phase has:
- **Specific AI robots** that know exactly what to do
- **Quality gates** to check the work before moving forward
- **Clear inputs** (what you need to start)
- **Clear outputs** (what you'll have when done)

---

## Prerequisites: What You Need Before Starting

### 1. Technical Setup

**Required Software:**
- **Claude Code** (Anthropic's CLI tool for Claude)
- **Git** (version control)
- **Node.js** (for skills system)
- **Terminal/Command line** access

**Optional but Recommended:**
- **VS Code** or similar code editor
- **Docker** (if building web apps)
- **Flutter/Dart** (if building mobile apps)

### 2. ROME Framework Setup

**Step 1: Get ROME Framework**
```bash
# Clone or download the ROME framework
git clone <rome-framework-repo>
cd ROME

# Install skills system dependencies
cd skills
npm install
cd ..
```

**Step 2: Verify Installation**
```bash
# Check that key files exist
ls life-cycle/P01-aordl/operations-guidelines.md
ls robot-templates/talib/CLAUDE.md
ls skills/lib/SkillRegistry.js
```

### 3. What You Should Have Ready

Before starting your project:
- [ ] **App idea** (even if vague - "I want a recipe app")
- [ ] **Target platform** (web, mobile, desktop)
- [ ] **Basic features list** (login, search, save favorites, etc.)
- [ ] **User roles** (who will use it? admin, regular user, guest)

**Don't worry if you don't have all the details!** ROME helps you figure them out.

---

## Phase 0: BOOTUP - Setting Up Your Project (10 minutes)

**What happens:** Bootstrap robot creates your project structure.

### Step-by-Step

**1. Create Project Directory**
```bash
mkdir my-recipe-app
cd my-recipe-app
```

**2. Launch Bootstrap Robot**
```bash
# From your ROME framework location
cd path/to/ROME/robot-templates/bootstrap

# Start Claude Code in this directory
claude-code
```

**3. Tell Bootstrap to Set Up Project**
```
You: "Bootstrap a new ROME project called 'recipe-app' at /path/to/my-recipe-app with ROME framework at /path/to/ROME"
```

**4. What Bootstrap Creates:**
```
my-recipe-app/
├── ROME/              (symlink to framework)
├── ARTIFACTS/         (stores all design docs)
│   ├── dev/
│   │   ├── requirements/
│   │   ├── analysis/
│   │   ├── design/
│   │   └── config/
├── SOURCE/            (your app code goes here)
├── robots/            (AI workspaces)
│   ├── talib/
│   ├── pma/
│   ├── sarah/
│   └── ...
└── .rome-project.json (project config)
```

**5. Verify Success**
```bash
cd my-recipe-app
ls -la ROME  # Should show symlink to framework
cat .rome-project.json  # Should show project config
```

**✅ P0 Complete!** Your project structure is ready.

---

## Phase 1: AORDL - Writing Requirements (1-3 days)

**What happens:** Talib robot helps you write clear, testable requirements.

**AORDL = Actor-Oriented Requirement Description Language** (fancy name for "really clear requirements")

### Why AORDL Instead of "Just Tell Me What You Want"?

**Bad Requirement:**
> "Users should be able to search for recipes"

**AORDL Requirement:**
```yaml
ID: REQ-001
Actor: RegisteredUser
Intent: search_recipes_by_ingredients
Preconditions:
  - User is logged in
  - At least one ingredient entered
Outcomes:
  - Display list of recipes containing ingredients
  - Sort by relevance
  - Show max 20 results per page
Invariants:
  - Search is case-insensitive
  - Must complete in < 2 seconds
```

**Why this is better:** Testable, specific, clear success criteria.

### Step-by-Step

**1. Switch to Talib's Workspace**
```bash
cd robots/talib
claude-code
```

**2. Start Writing Requirements**
```
You: "I want to build a recipe app. Users should be able to search for recipes, save favorites, and rate recipes."
```

**Talib will:**
- Ask clarifying questions ("Who are the users? Registered or guests?")
- Help break down vague ideas into specific requirements
- Use AORDL template for each requirement
- Save requirements as `REQ-001.yaml`, `REQ-002.yaml`, etc.

**3. Review Generated Requirements**
```
You: "Show me the requirements you've created"
```

Talib will list requirements with IDs and summaries.

**4. Iterate Until Clear**
```
You: "REQ-003 is too vague. Can we make the 'save favorite' requirement more specific?"
```

Talib will refine the requirement.

**5. Request GATE-P1 Validation**
```
You: "I think we have all requirements. Request GATE-P1 validation."
```

**Talib will:**
- Report to Roma (orchestrator)
- Roma assigns Sarah (quality auditor)
- Sarah validates AORDL requirements against 8 validation criteria
- Sarah approves or requests fixes

**6. Repeat Until GATE-P1 Passes**

Common issues Sarah catches:
- ❌ UI-specific language ("button", "dropdown") → Should be implementation-agnostic
- ❌ Vague actors ("user") → Should be specific ("RegisteredUser", "GuestUser")
- ❌ Missing invariants → Need data constraints
- ❌ Untestable outcomes → Need measurable criteria

**✅ P1 Complete!** When Sarah approves GATE-P1, you have:
- `ARTIFACTS/dev/requirements/REQ-001.yaml` through `REQ-NNN.yaml`
- `ARTIFACTS/dev/requirements/requirements-catalog.md`
- `ARTIFACTS/dev/requirements/phase1-handover.md`

**How Long:** 1-3 days depending on app complexity.

---

## Phase 2: ANALYSIS - Breaking Down Requirements (1-2 days)

**What happens:** Talib analyzes requirements and creates features, user stories, and data models.

### Step-by-Step

**1. Talib Auto-Transitions to P2**
```
Talib: "GATE-P1 approved. Starting P2 analysis..."
```

**2. What Talib Does (Mostly Automatic)**

For each requirement (REQ-001, REQ-002, etc.):
- Extracts **entities** (Recipe, User, Rating, Ingredient)
- Extracts **invariants** (email must be valid, rating 1-5, etc.)
- Creates **features** (FUNC-001: Recipe Search, FUNC-002: Favorites)
- Writes **user stories** ("As a RegisteredUser, I want to search recipes by ingredients so that I can find recipes I can make")
- Builds **data dictionary** (all data types and validations)

**3. Review Analysis Outputs**
```
You: "Show me the data dictionary"
You: "Show me the features for recipe search"
You: "How many entities did you find?"
```

**4. Request GATE-P2 Validation**
```
You: "Analysis looks good. Request GATE-P2 validation."
```

**Sarah validates:**
- ✅ All requirements traced to features (REQ-001 → FUNC-001)
- ✅ Data dictionary complete and consistent
- ✅ User stories testable
- ✅ Entities normalized (no duplication)

**✅ P2 Complete!** You have:
- `ARTIFACTS/dev/analysis/data-dictionary.yaml` (ALL your data types)
- `ARTIFACTS/dev/analysis/REQ-001-analysis.json` (breakdown of each requirement)
- `ARTIFACTS/dev/requirements/requirements-matrix.md` (REQ→FUNC traceability)

**How Long:** 1-2 days (mostly automated, quick review).

---

## Phase 3: DESIGN - Designing the App (2-5 days)

**What happens:** PMA (Project Manager/Architect) designs how the app will work.

### Step-by-Step

**1. Switch to PMA's Workspace**
```bash
cd ../pma
claude-code
```

**2. PMA Auto-Starts P3**
```
PMA: "GATE-P2 approved. Starting P3 design phase..."
```

**3. What PMA Designs (You Guide)**

**Tech Stack Selection:**
```
You: "This is a mobile app. I want to use Flutter."

PMA will:
- Confirm Flutter is appropriate
- Select backend tech (Node.js/Express, Python/Flask, etc.)
- Select database (PostgreSQL, MongoDB, etc.)
- Document in tech-stack.md
```

**Use Cases:**
```
You: "Design the use cases for recipe search"

PMA will:
- Create UC-001: Search Recipes by Ingredients
- Map to REQ-001 (traceability)
- Define step-by-step flow
- Define success/failure scenarios
```

**API Design:**
```
PMA will:
- Design RESTful endpoints (/api/recipes/search, /api/favorites, etc.)
- Define request/response schemas
- Map endpoints to use cases
- Document in api-design.md
```

**Database Design:**
```
PMA will:
- Design tables/collections from data dictionary
- Define relationships (User → Favorites → Recipe)
- Create schema diagrams
- Document in database-schema.md
```

**4. Optional: Activate Clara (UX Designer)**
```
You: "I want professional UI designs. Can we activate Clara?"

PMA: "Requesting Clara assignment from Roma..."
Roma: "Clara assigned to P3."

Clara will:
- Create design system (colors, typography, spacing)
- Create wireframes for all screens
- Design user flows (login → search → results → details)
- Create accessibility guidelines
- Document in design-system.md, wireframes/, user-flows.md
```

**5. Review Design Documents**
```
You: "Show me the API design for recipe search"
You: "Show me the database schema"
You: "Show me the use case for adding favorites"
```

**6. Iterate on Design**
```
You: "The recipe search API should support pagination. Can we add that?"
PMA: "Adding pagination parameters to /api/recipes/search endpoint..."
```

**7. Request GATE-P3 Validation**
```
You: "Design is complete. Request GATE-P3 validation."
```

**Sarah validates:**
- ✅ All features traced to use cases (FUNC-001 → UC-001)
- ✅ API design complete and consistent
- ✅ Database schema matches data dictionary
- ✅ Tech stack documented and justified
- ✅ Use cases trace back to requirements

**✅ P3 Complete!** You have:
- `ARTIFACTS/dev/design/use-cases.md` (complete app flows)
- `ARTIFACTS/dev/design/api-design.md` (all API endpoints)
- `ARTIFACTS/dev/design/database-schema.md` (database structure)
- `ARTIFACTS/dev/design/tech-stack.md` (technology choices)
- `ARTIFACTS/dev/design/actionlist.md` (work assignments for P5)
- Optional: `design-system.md`, `wireframes/`, `user-flows.md` (if Clara activated)

**How Long:** 2-5 days depending on complexity and iterations.

---

## Phase 4: CONFIGURATION - Setting Up Dev Environment (1 day)

**What happens:** Lucien (DevOps Engineer) scaffolds workspaces and configures infrastructure.

### Step-by-Step

**1. Switch to Lucien's Workspace**
```bash
cd ../lucien
claude-code
```

**2. Lucien Auto-Starts P4**
```
Lucien: "GATE-P3 approved. Starting P4 configuration phase..."
```

**3. What Lucien Configures (Mostly Automatic)**

**Workspace Scaffolding:**
```
Lucien will create:
SOURCE/
├── recipe-app-mobile/    (Flutter app)
│   ├── lib/
│   ├── test/
│   └── pubspec.yaml
├── recipe-api/           (Backend API)
│   ├── src/
│   ├── tests/
│   └── package.json
└── shared/               (Shared types/models)
```

**Environment Configuration:**
```
Lucien creates:
- .env.development (dev settings)
- .env.staging (staging settings)
- .env.production (prod settings)
- docker-compose.yml (local dev setup)
```

**Database Setup:**
```
Lucien creates:
- Database connection config
- Migration structure
- Initial schema templates
```

**CI/CD Pipeline:**
```
Lucien creates:
- .github/workflows/ci.yml (automated tests)
- Build scripts
- Deployment scripts
```

**4. Review Configuration**
```
You: "Show me the workspace structure"
You: "Show me the database configuration"
```

**5. Request GATE-P4 Validation**
```
You: "Configuration looks good. Request GATE-P4 validation."
```

**Sarah validates:**
- ✅ Workspaces scaffolded correctly
- ✅ Environment configs complete
- ✅ Database setup ready
- ✅ CI/CD pipeline configured

**✅ P4 Complete!** You have:
- `SOURCE/` with scaffolded workspaces
- `ARTIFACTS/dev/config/phase4-handover.md` (handover document)
- All environment configurations
- Ready-to-code project structure

**How Long:** 1 day (mostly automated).

---

## Phase 5: GENERATION - Building the Code (3-10 days)

**What happens:** Three specialist robots build your app in parallel.

**The Team:**
- **Ashok** (Database Engineer) → Builds data layer
- **Reena** (Backend Engineer) → Builds API layer
- **Charlie** (Frontend Developer) → Builds UI layer

### Step-by-Step

**1. Roma Orchestrates P5 Execution**
```
Roma: "GATE-P4 approved. Assigning P5 robots..."
Roma: "Ashok → Data Layer"
Roma: "Reena → Backend API (depends on Ashok)"
Roma: "Charlie → Frontend UI (depends on Reena)"
```

**2. Ashok Builds Database Layer (Day 1)**

```bash
cd ../ashok
claude-code
```

**What Ashok Does:**
```
You: "Build the database layer for the recipe app"

Ashok will:
- Create migrations (001_create_users.sql, 002_create_recipes.sql, etc.)
- Create ORM models (User.ts, Recipe.ts, Rating.ts)
- Create seed data (sample recipes, test users)
- Create database tests
- Document setup in README.md
```

**3. Reena Builds Backend API (Days 2-4)**

```bash
cd ../reena
claude-code
```

**What Reena Does:**
```
You: "Build the API layer for the recipe app"

Reena will:
- Implement controllers (RecipeController, UserController, FavoriteController)
- Implement services (business logic)
- Implement middleware (authentication, validation, logging)
- Implement routes (/api/recipes/search, /api/favorites, etc.)
- Write API tests (unit + integration)
- Document API in README.md
```

**Check Progress:**
```
You: "Show me the recipe search endpoint implementation"
You: "Show me the authentication middleware"
You: "Run the API tests"
```

**4. Charlie Builds Frontend UI (Days 2-5)**

```bash
cd ../charlie
claude-code
```

**What Charlie Does:**
```
You: "Build the Flutter UI for the recipe app"

Charlie will:
- Implement screens (LoginScreen, RecipeSearchScreen, RecipeDetailScreen, FavoritesScreen)
- Implement widgets (RecipeCard, SearchBar, RatingStars)
- Implement state management (BLoC, Provider, or Riverpod)
- Implement API integration (calling Reena's endpoints)
- Implement navigation (routing between screens)
- Write widget tests
- Follow Clara's design system (if available)
```

**Check Progress:**
```
You: "Show me the recipe search screen"
You: "Show me the favorite button implementation"
You: "Run the widget tests"
```

**5. Integration & Testing (Days 6-8)**

**Test End-to-End Flows:**
```
You: "Test the complete flow: login → search → view recipe → add to favorites"
```

**Fix Issues:**
```
You: "The favorite button doesn't update immediately. Can we fix that?"
Charlie: "Adding optimistic UI update to favorite toggle..."
```

**6. Request GATE-P5 Validation**
```
You: "All features implemented and tested. Request GATE-P5 validation."
```

**Sarah validates:**
- ✅ All use cases implemented (UC-001 through UC-NNN)
- ✅ All API endpoints working
- ✅ All UI screens complete
- ✅ Tests passing (unit + integration + widget)
- ✅ Code quality standards met
- ✅ End-to-end traceability (REQ → FUNC → UC → Code)

**✅ P5 Complete!** You have:
- Working database with schema and seed data
- Working backend API with all endpoints
- Working frontend UI with all screens
- Comprehensive test suites
- Complete documentation

**How Long:** 3-10 days depending on app complexity.

---

## Phase 6: DELIVERY - Deploying Your App (1-2 days)

**What happens:** Deploy and run your app.

### Step-by-Step

**1. Local Deployment (Testing)**
```bash
# Start database
docker-compose up -d postgres

# Run migrations
cd SOURCE/recipe-api
npm run migrate

# Start backend
npm run dev

# Start frontend (new terminal)
cd ../recipe-app-mobile
flutter run
```

**2. Production Deployment**

**Using Lucien's deployment scripts:**
```bash
cd robots/lucien
claude-code
```

```
You: "Deploy the recipe app to production"

Lucien will:
- Build production Docker images
- Deploy to cloud provider (AWS, GCP, Azure, etc.)
- Set up production database
- Configure domain and SSL
- Set up monitoring and logging
```

**✅ DELIVERY Complete!** Your app is live!

---

## Real-World Example: Building a Todo App

Let's walk through a complete example with a simple todo app.

### P0: Bootup (10 minutes)
```bash
mkdir my-todo-app
cd path/to/ROME/robot-templates/bootstrap
claude-code
```
```
You: "Bootstrap a new ROME project called 'todo-app' at /Users/me/my-todo-app"
Bootstrap: "Creating project structure..."
Bootstrap: "✅ Project ready. Start with Talib for P1."
```

### P1: AORDL Requirements (2 hours)
```bash
cd /Users/me/my-todo-app/robots/talib
claude-code
```

```
You: "I want to build a todo app. Users should be able to create tasks, mark them complete, and delete them."

Talib: "Let me help you write AORDL requirements. First, who are the users?"

You: "Just one type of user - anyone who signs up."

Talib: "Creating REQ-001 for user registration..."
Talib: "Creating REQ-002 for creating tasks..."
Talib: "Creating REQ-003 for marking tasks complete..."
Talib: "Creating REQ-004 for deleting tasks..."

You: "Show me REQ-002"

Talib: "REQ-002: Create Task
Actor: RegisteredUser
Intent: create_new_task
Preconditions: User is authenticated
Inputs: task_title (string, max 200 chars), task_description (optional)
Outcomes: Task created with status 'pending', unique ID assigned
Invariants: Title required, non-empty, max 200 chars"

You: "Perfect. Request GATE-P1 validation."

Talib: "Requesting Roma to assign Sarah for GATE-P1..."
Sarah: "Validating 4 requirements against 8 AORDL criteria..."
Sarah: "✅ GATE-P1 APPROVED. No issues found."
```

### P2: Analysis (1 hour)
```
Talib: "Starting P2 analysis..."
Talib: "Extracted entities: User, Task"
Talib: "Created features: FUNC-001 (User Management), FUNC-002 (Task Management)"
Talib: "Created data dictionary with 2 entities, 8 fields"
Talib: "Request GATE-P2 validation."

Sarah: "✅ GATE-P2 APPROVED."
```

### P3: Design (3 hours)
```bash
cd ../pma
claude-code
```

```
PMA: "Starting P3 design..."

You: "This is a web app. Use React for frontend and Node.js for backend."

PMA: "Creating tech-stack.md..."
PMA: "Creating use-cases.md (UC-001: Create Task, UC-002: Complete Task, etc.)..."
PMA: "Creating api-design.md (POST /api/tasks, PATCH /api/tasks/:id, DELETE /api/tasks/:id)..."
PMA: "Creating database-schema.md (users table, tasks table)..."

You: "Request GATE-P3 validation."

Sarah: "✅ GATE-P3 APPROVED."
```

### P4: Configuration (1 hour)
```bash
cd ../lucien
claude-code
```

```
Lucien: "Starting P4 configuration..."
Lucien: "Creating workspaces: SOURCE/todo-web, SOURCE/todo-api"
Lucien: "Scaffolding React app with Vite..."
Lucien: "Scaffolding Express API..."
Lucien: "Creating Docker Compose config..."
Lucien: "Request GATE-P4 validation."

Sarah: "✅ GATE-P4 APPROVED."
```

### P5: Generation (2 days)
```bash
# Day 1 - Database
cd ../ashok
claude-code
```

```
You: "Build the database layer"

Ashok: "Creating migrations..."
Ashok: "Creating ORM models (User, Task)..."
Ashok: "Creating seed data (5 sample users, 10 sample tasks)..."
Ashok: "✅ Database layer complete."
```

```bash
# Day 1-2 - Backend API
cd ../reena
claude-code
```

```
You: "Build the API layer"

Reena: "Implementing /api/tasks endpoints..."
Reena: "Implementing authentication middleware (JWT)..."
Reena: "Writing API tests (15 tests)..."
Reena: "✅ API layer complete. All tests passing."
```

```bash
# Day 2 - Frontend
cd ../charlie
claude-code
```

```
You: "Build the React frontend"

Charlie: "Implementing TaskList component..."
Charlie: "Implementing TaskForm component..."
Charlie: "Implementing authentication flow..."
Charlie: "Implementing state management with Redux..."
Charlie: "✅ Frontend complete."

You: "Request GATE-P5 validation."

Sarah: "Running full validation..."
Sarah: "✅ GATE-P5 APPROVED. All 4 use cases implemented and tested."
```

### Delivery (1 hour)
```bash
# Start app locally
cd /Users/me/my-todo-app
docker-compose up
```

Open browser to `http://localhost:3000` → **Todo app is running!**

---

## Tips for Success

### 1. Start Small
**Don't start with:**
> "I want to build the next Facebook"

**Start with:**
> "I want to build a simple photo-sharing app where users can upload photos and comment on them"

### 2. Trust the Process
- Each phase builds on the previous one
- Quality gates catch problems early
- Don't skip phases (they save time later)

### 3. Be Specific in P1
**Vague:**
> "Users should be able to search"

**Specific:**
> "RegisteredUsers should be able to search products by name, category, and price range, returning max 20 results sorted by relevance"

### 4. Review Each Phase Output
Don't just rubber-stamp. Actually review:
- Requirements (P1): "Does this match what I want?"
- Analysis (P2): "Is the data model correct?"
- Design (P3): "Will this API work for my use case?"
- Code (P5): "Does this feature actually work?"

### 5. Iterate When Needed
```
You: "Actually, I want to change how favorites work. Can we update REQ-005?"
Talib: "Yes, updating REQ-005 and re-running GATE-P1 validation..."
```

ROME allows changes at any phase - earlier is better than later.

### 6. Use Skills for Speed
```
You: "Use the /execute-full-pipeline skill to run P2 through P5"
```

Skills automate common workflows (but only use after you understand the basics).

### 7. Ask Questions
The robots are there to help:
```
You: "What's the difference between Actor and Intent in AORDL?"
You: "Why did Sarah reject my requirement?"
You: "How do I test this API endpoint?"
You: "What's the best way to handle authentication for a mobile app?"
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Skipping AORDL Validation
```
You: "The requirements look fine to me. Let's skip GATE-P1 and move to P2."
```
**Result:** Vague requirements → bad design → wrong code → wasted time

**Fix:** Always run quality gates. Sarah catches issues you'll miss.

### ❌ Mistake 2: Too Many Requirements at Once
```
You: "Here are 50 requirements for my app..."
```
**Result:** Overwhelming, hard to track, likely to fail validation

**Fix:** Start with 5-10 core requirements. Add more in iterations.

### ❌ Mistake 3: Ignoring Traceability
```
You: "I don't care about REQ-001 → FUNC-001 → UC-001 mapping. Just build it."
```
**Result:** Can't track what was built, can't update later, can't verify completion

**Fix:** Trust the traceability system. It's there for a reason.

### ❌ Mistake 4: Not Reading Phase Handover Documents
```
Lucien: "P4 complete. See phase4-handover.md for workspace details."
You: (doesn't read it)
You: "Where do I find the API code?"
```
**Fix:** Read handover documents. They tell you exactly what was built and where.

### ❌ Mistake 5: Changing Requirements in P5
```
You: (in P5) "Actually, let's completely change how search works"
```
**Result:** Code doesn't match design, quality gates fail, wasted P5 work

**Fix:** Go back to P1, update requirements, re-run P2-P4 validation, then update P5.

---

## Troubleshooting

### Issue: "Sarah rejected my requirements at GATE-P1"
**Cause:** Requirements contain UI language, vague actors, or untestable outcomes

**Fix:**
1. Read Sarah's feedback carefully
2. Update requirements based on specific issues
3. Remove UI terms (button → action, dropdown → selection)
4. Make actors specific (User → RegisteredUser, AdminUser)
5. Make outcomes measurable

### Issue: "Ashok says the database schema doesn't match the data dictionary"
**Cause:** PMA's design doesn't align with Talib's analysis

**Fix:**
1. Check data-dictionary.yaml from P2
2. Compare with database-schema.md from P3
3. Ask PMA to regenerate schema based on data dictionary
4. Re-run GATE-P3 validation

### Issue: "Charlie's UI doesn't match the API"
**Cause:** Frontend built before backend was complete, or API changed

**Fix:**
1. Check api-design.md (source of truth)
2. Verify Reena implemented all endpoints correctly
3. Ask Charlie to regenerate API integration code
4. Test end-to-end flow

### Issue: "I want to add a new feature mid-project"
**Process:**
1. Go to P1: Add new requirement (REQ-NNN)
2. Run GATE-P1 validation
3. Let Talib analyze in P2 (updates data dictionary)
4. Run GATE-P2 validation
5. Ask PMA to update design in P3 (adds use case, API endpoints)
6. Run GATE-P3 validation
7. Ask Lucien to update config in P4 (if needed)
8. Build in P5 (Ashok/Reena/Charlie implement new feature)

Don't skip steps - it breaks traceability.

---

## Next Steps After Your First App

### 1. Try Different App Types
- **CRUD App:** Simple data management (todo, contacts, inventory)
- **Social App:** User interactions (posts, comments, likes)
- **E-commerce:** Products, cart, checkout
- **SaaS Tool:** Multi-tenant, subscriptions, dashboards

### 2. Experiment with Clara
```
You: "Activate Clara for professional UI design"
```
See how UX design integration works.

### 3. Use Advanced Skills
```
You: "Use /execute-full-pipeline to automate P2-P5"
You: "Use /optimize-data-model to improve database performance"
```

### 4. Customize Robots
Read robot CLAUDE.md files to understand what each robot can do, then customize their behavior.

### 5. Build Real Projects
ROME is production-ready. Use it for real client projects or side projects.

---

## Glossary: ROME Terms Explained

| Term | What It Means |
|------|---------------|
| **AORDL** | Actor-Oriented Requirement Description Language - A format for writing super clear requirements |
| **Actor** | Who does the action (RegisteredUser, AdminUser, GuestUser) |
| **Intent** | What the actor wants to accomplish (search_recipes, add_to_cart) |
| **Invariant** | A rule that's always true (email must be valid, price > 0) |
| **Outcome** | What happens when the action succeeds |
| **Gate** | Quality check between phases (GATE-P1, GATE-P2, etc.) |
| **Robot** | An AI specialist (Talib, PMA, Sarah, Roma, Ashok, Reena, Charlie) |
| **Traceability** | Tracking how requirements flow through all phases (REQ → FUNC → UC → Code) |
| **Workspace** | A robot's working directory (robots/talib/, robots/pma/) |
| **Skill** | An automated task robots can perform (/analyze-requirement, /generate-api-spec) |

---

## FAQ

**Q: How long does it take to build an app with ROME?**
A: Simple app (todo): 1 week. Medium app (e-commerce): 2-4 weeks. Complex app (SaaS): 1-3 months.

**Q: Do I need to know how to code?**
A: No, but it helps. ROME guides you through, but understanding basics makes reviews easier.

**Q: Can I modify the generated code?**
A: Yes! The code is yours. ROME generates a working starting point.

**Q: What if I want to change something after P5?**
A: Go back to the phase where it originates (requirement change → P1, design change → P3), update, re-validate, regenerate.

**Q: Can multiple people work on the same project?**
A: Yes, use Git branches. Each person can work with different robots.

**Q: What if a robot makes a mistake?**
A: Quality gates catch most mistakes. If something slips through, ask the robot to fix it or ask Sarah to review.

**Q: Can I use ROME for non-software projects?**
A: ROME is designed for software, but the AORDL methodology can be adapted for other domains.

---

## Getting Help

1. **Read Robot Instructions:** Each robot has a CLAUDE.md file explaining what it does
2. **Check Phase Documents:** `ROME/life-cycle/P0X-*/operations-guidelines.md`
3. **Ask Robots Questions:** They're designed to help and explain
4. **Review Examples:** Check `ROME_architect/ARTIFACTS/` for sample outputs
5. **Read Proposals:** `ROME_architect/proposals/ROME-PROP-*.md` explain design decisions

---

## Congratulations!

You now know how to use ROME to build applications from requirements to deployment.

**Your First Project:**
1. Pick a simple app idea (todo, contacts, notes)
2. Bootstrap the project (P0)
3. Write 3-5 requirements (P1)
4. Let ROME guide you through P2-P5
5. Deploy and celebrate!

**Remember:** ROME is a process. Trust the process, use the quality gates, maintain traceability, and you'll end up with a well-designed, working application.

Happy building! 🚀

---

## Revision History

| Version | Date | Summary of Changes |
|---------|------|-------------------|
| 1.0 | 2025-12-24T00:00:00Z | Initial dummies guide creation - complete walkthrough from P0-Delivery with real examples, troubleshooting, and tips |
