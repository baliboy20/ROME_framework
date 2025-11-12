# ROME v7.0 Documentation

**Organized by Phase - Navigate by Project Stage**

## 🎉 What's New in v7.0

**MCP Integration**: ROME v7.0 introduces native MongoDB-backed activity tracking via Model Context Protocol (MCP):
- **Zero race conditions** - ACID transactions ensure safe concurrent access
- **10-100x faster** - Indexed database queries vs file parsing
- **Scalable** - Handle 10,000+ activity entries
- **Clean API** - MCP functions available in all robot sessions
- **Production ready** - Battle-tested migration from JSON file system

See [`MCP-MIGRATION-START-HERE.md`](/MCP-MIGRATION-START-HERE.md) for details.

---

## 📁 Documentation Structure

```
ROME/
├── 00-start/              → Getting started guides
├── 01-methodology/        → Core ROME concepts
├── 02-phase1-requirements/→ Phase 1: HTM (Talib)
├── 03-phase2-architecture/→ Phase 2: Architecture (PMA)
├── 04-phase2a-ux/         → Phase 2A: UX Design (Clara)
├── 05-phase2b-audit/      → Phase 2B: System Audit (Sarah)
├── 06-phase3-development/ → Phase 3: Development (Ashok/Reena/Charlie)
├── 99-reference/          → Archive & reference materials
├── templates/             → Robot & project templates
├── scripts/               → Automation scripts
└── robot-protocols/       → Generic robot protocols
```

---

## 🚀 Quick Start

**New to ROME?** Start here:
1. **Automated Project Setup**: `cd 00-start && claude`
   - Reads [`00-start/CLAUDE.md`](00-start/CLAUDE.md) - Launches interactive project setup
   - Creates all robot workspaces automatically
   - Sets up iTerm with split-pane workspace
2. [`00-start/README.md`](00-start/README.md) - Project launch guide
3. Phase-specific docs once your project is created

---

## 📋 By Phase

### Phase 1: HTM Requirements (Talib)
**Folder:** [`02-phase1-requirements/`](02-phase1-requirements/)
- Transform PRD into structured YAML artifacts
- Epic → Feature → Story → Task decomposition

### Phase 2: Architecture (PMA)
**Folder:** [`03-phase2-architecture/`](03-phase2-architecture/)
- Tech stack selection
- API design
- Testing strategy

### Phase 2A: UX Design (Clara)
**Folder:** [`04-phase2a-ux/`](04-phase2a-ux/)
- Wireframes
- Design system
- Component specifications

### Phase 2B: Quality Gate (Sarah)
**Folder:** [`05-phase2b-audit/`](05-phase2b-audit/)
- Design validation across 8 technical dimensions
- Mandatory quality gate before Phase 3
- Can APPROVE, BLOCK, or ESCALATE design

### Phase 3: Development
**Folder:** [`06-phase3-development/`](06-phase3-development/)
- Ashok (Data Layer)
- Reena (Backend APIs)
- Charlie (Frontend UI)

---

## 🤖 By Robot

| Robot | Phase | Folder | Role Doc |
|-------|-------|--------|----------|
| **Talib** | 1 | [`02-phase1-requirements/`](02-phase1-requirements/) | [role-talib.md](02-phase1-requirements/role-talib.md) |
| **PMA** | 2 | [`03-phase2-architecture/`](03-phase2-architecture/) | [role-pma.md](03-phase2-architecture/role-pma.md) |
| **Clara** | 2A | [`04-phase2a-ux/`](04-phase2a-ux/) | [role-clara.md](04-phase2a-ux/role-clara.md) |
| **Sarah** | 2B | [`05-phase2b-audit/`](05-phase2b-audit/) | [role-sarah.md](05-phase2b-audit/role-sarah.md) |
| **Ashok** | 3.1 | [`06-phase3-development/`](06-phase3-development/) | [role-ashok.md](06-phase3-development/role-ashok.md) |
| **Reena** | 3.2 | [`06-phase3-development/`](06-phase3-development/) | [role-reena.md](06-phase3-development/role-reena.md) |
| **Charlie** | 3.3 | [`06-phase3-development/`](06-phase3-development/) | [role-charlie.md](06-phase3-development/role-charlie.md) |
| **Roma** | All | [`99-reference/`](99-reference/) | [role-roma.md](99-reference/role-roma.md) |

---

## 📚 Documentation Sections

### [`00-start/`](00-start/) - Project Launcher
Entry point: Automated setup of new ROME projects via `claude` session

### [`01-methodology/`](01-methodology/) - Core Concepts
ROME 7.0 governance principles, testing philosophy, workflow patterns

### [`99-reference/`](99-reference/) - Additional References
Roma coordinator guide, document governance, architectural history

---

## ⚡ Common Tasks

| Task | Documentation |
|------|---------------|
| Start new project | `cd 00-start && claude` (Automated launcher) |
| Phase 1: Requirements | [`02-phase1-requirements/`](02-phase1-requirements/) (Talib) |
| Phase 2: Architecture | [`03-phase2-architecture/`](03-phase2-architecture/) (PMA) |
| Phase 2A: UX Design | [`04-phase2a-ux/`](04-phase2a-ux/) (Clara, optional) |
| Phase 2B: Quality Gate | [`05-phase2b-audit/`](05-phase2b-audit/) (Sarah) |
| Phase 3: Data Layer | [`06-phase3-development/role-ashok.md`](06-phase3-development/role-ashok.md) (Ashok) |
| Phase 3: APIs | [`06-phase3-development/role-reena.md`](06-phase3-development/role-reena.md) (Reena) |
| Phase 3: Frontend | [`06-phase3-development/role-charlie.md`](06-phase3-development/role-charlie.md) (Charlie) |
| Coordinate project | [`99-reference/role-roma.md`](99-reference/role-roma.md) (Roma) |

---

**Version:** 7.0
**Last Updated:** 2025-11-12
**Status:** MCP integration complete - MongoDB-backed activity tracking, zero race conditions, 10-100x performance improvement
