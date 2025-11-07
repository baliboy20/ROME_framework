# ROME v6.0 Documentation

**Organized by Phase - Navigate by Project Stage**

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
├── 07-project-structure/  → Conventions & standards
├── 08-robot-setup/        → Robot infrastructure
├── 99-reference/          → Archive & reference docs
├── templates/             → Robot & project templates
├── scripts/               → Automation scripts
└── integration/           → HTM integration docs
```

---

## 🚀 Quick Start

**New to ROME?** Start here:
1. [`00-start/README.md`](00-start/README.md) - Main entry point
2. [`00-start/overview.md`](00-start/overview.md) - Methodology overview
3. [`07-project-structure/directory-layout.md`](07-project-structure/directory-layout.md) - Project structure

**Setup workspace:**
- [`scripts/setup-workspace.sh`](scripts/setup-workspace.sh) - Automated iTerm workspace
- [`08-robot-setup/robot-creation.md`](08-robot-setup/robot-creation.md) - Manual robot setup

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

### Phase 2B: System Audit (Sarah - Optional)
**Folder:** [`05-phase2b-audit/`](05-phase2b-audit/)
- Design validation
- Quality gate
- Risk assessment

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

---

## 📚 Documentation Sections

### [`00-start/`](00-start/) - Getting Started
Entry point for new users

### [`01-methodology/`](01-methodology/) - Core Concepts
ROME methodology, testing philosophy, workflow

### [`07-project-structure/`](07-project-structure/) - Conventions
Directory layout, naming, file locations

### [`08-robot-setup/`](08-robot-setup/) - Infrastructure
Robot creation, workspace automation

### [`99-reference/`](99-reference/) - Archive
Legacy docs, comprehensive guides

---

## ⚡ Common Tasks

| Task | Documentation |
|------|---------------|
| Start new project | [`00-start/README.md`](00-start/README.md) |
| Transform PRD | [`02-phase1-requirements/`](02-phase1-requirements/) |
| Design architecture | [`03-phase2-architecture/`](03-phase2-architecture/) |
| Create UX designs | [`04-phase2a-ux/`](04-phase2a-ux/) |
| Audit specifications | [`05-phase2b-audit/`](05-phase2b-audit/) |
| Build database | [`06-phase3-development/role-ashok.md`](06-phase3-development/role-ashok.md) |
| Build APIs | [`06-phase3-development/role-reena.md`](06-phase3-development/role-reena.md) |
| Build frontend | [`06-phase3-development/role-charlie.md`](06-phase3-development/role-charlie.md) |
| Setup robots | [`08-robot-setup/`](08-robot-setup/) |

---

**Version:** 6.0
**Last Updated:** 2025-11-06
