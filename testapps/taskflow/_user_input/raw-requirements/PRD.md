# TaskFlow — Product Requirements Document

**Version:** 1.0
**Date:** 2026-02-27
**Author:** Sponsor (test)
**Status:** Ready for Ingest

---

## Overview

TaskFlow is a lightweight task management tool for small development teams. Teams create projects, manage tasks within those projects, and track work through a status workflow. The product is delivered as a Flutter web app backed by a REST API running on Cloudflare Workers with a D1 (SQLite) database.

---

## Goals

- Give small teams (2–10 people) a simple, fast place to track work
- No installation — runs entirely in the browser
- Deployable to Cloudflare's free tier

---

## Users

**Team Member** — creates and updates tasks, views project boards
**Project Admin** — creates projects, invites team members, manages project settings
**Guest** — view-only access to a specific project (read-only, no account required if link is shared)

---

## Features

### F1 — Authentication
- User registration with email and password
- Login / logout
- Password reset via email
- JWT-based session (details TBD)
- Remember me (persistent session)

### F2 — Project Management
- Create a project (name, description, optional colour label)
- Archive a project (hidden from main list but data retained)
- Delete a project (requires confirmation; deletes all tasks)
- Invite team members to a project by email
- Set member roles: Admin or Member
- Project settings page

### F3 — Task Management
- Create a task within a project (title, description, status, priority, due date, assignee)
- Edit task details inline
- Delete a task
- Assign/unassign a task to a team member
- Set task priority: Low / Medium / High / Critical
- Set due date (with optional reminder)

### F4 — Status Workflow
- Task statuses: **Backlog → Todo → In Progress → Review → Done**
- Drag-and-drop Kanban board view
- List view as alternative to board
- Filter tasks by: status, assignee, priority, due date range
- Tasks in Review state can only be moved to Done by a Project Admin

### F5 — Notifications
- In-app notifications when: task assigned to you, task due within 24h, task moved to Review
- Email notification when task assigned (optional, user preference)
- Notification badge count in app header

---

## Non-Functional Requirements

- **Performance:** Board view must load within 2 seconds for a project with 200 tasks
- **Scale:** Support up to 50 concurrent users per Cloudflare Worker instance
- **Availability:** Target 99.5% uptime (Cloudflare SLA)
- **Data:** All data stored in Cloudflare D1 (SQLite); no external database dependencies
- **Auth:** Sessions expire after 24h of inactivity; JWT stored in httpOnly cookie
- **CORS:** API must accept requests from the Flutter web app origin only
- **Deployment:** Single `wrangler deploy` command deploys both Worker and D1 migrations

---

## Tech Stack (Mandated)

| Layer | Technology |
|-------|-----------|
| Frontend | Flutter Web |
| Backend API | Hono (TypeScript) on Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Auth | JWT (httpOnly cookie) |
| Deployment | Cloudflare Wrangler CLI |
| CI | GitHub Actions |

---

## Out of Scope (v1)

- Mobile native apps (Flutter web only)
- File attachments on tasks
- Time tracking
- Recurring tasks
- Integrations (GitHub, Slack, etc.)
- Billing / multi-tenant SaaS features

---

## Open Questions for Development Team

1. Should Guest access require a separate link/token per project, or a globally public flag on the project?
2. Reminder notifications — push browser notifications, or email only?
3. Task ordering within a status column — manual drag order persisted, or auto-sorted by priority?
4. D1 migration strategy — Wrangler migrations or manual schema init?
5. Flutter web — single-page app with client-side routing, or server-side rendered?

---

## Acceptance Criteria (High Level)

- A team member can complete the full workflow: register → create project → create tasks → move tasks through statuses → mark done
- A Project Admin can invite a member and that member can access the project after accepting
- The Kanban board loads in < 2s with 200 tasks
- All API endpoints return appropriate HTTP status codes and error messages
- App is deployable from a clean clone with `wrangler deploy` and `flutter build web`
