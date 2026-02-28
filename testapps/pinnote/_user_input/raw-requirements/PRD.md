# PinNote — Product Requirements Document

**Version:** 1.0
**Date:** 2026-02-28
**Author:** Sponsor (test)
**Status:** Ready for Ingest

---

## Overview

PinNote is a minimal personal note-taking app. A user registers, logs in, and manages a personal list of short text notes. No collaboration, no sharing. Delivered as a Flutter web app backed by Hono on Cloudflare Workers with a D1 (SQLite) database.

---

## Goals

- Prove the simplest possible ROME run still produces correct, traceable artifacts
- Runs in < 2 hours end-to-end (P0 → GATE-P5)
- No scope creep — if it is not listed below, it is out of scope

---

## Users

**NoteUser** — the only actor. Registers, logs in, creates, reads, and deletes their own notes.

---

## Features

### F1 — Authentication

- User registration with email and password
- User login with email and password
- JWT session (stored in httpOnly cookie)
- Logout (clears session cookie)

### F2 — Note Management

- Create a note (title required, body optional)
- List own notes (newest first)
- Delete a note (with confirmation)

---

## Non-Functional Requirements

- **Security:** Passwords bcrypt-hashed; JWT httpOnly cookie; users cannot access other users' notes
- **Performance:** Note list loads in < 1 second for up to 50 notes
- **Platform:** Flutter web (Chrome, Firefox, Safari); mobile-responsive

---

## Tech Stack (Mandated)

| Layer | Technology |
|-------|-----------|
| Frontend | Flutter Web |
| Backend API | Hono (TypeScript) on Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Auth | JWT (httpOnly cookie) |
| Deployment | Cloudflare Wrangler CLI |

---

## Out of Scope

- Note editing / update
- Note categories or tags
- Note search
- Sharing or collaboration
- Password reset
- Email verification
- Rich text or markdown rendering

---

## Open Questions for Development Team

1. Should notes have a maximum character limit for the body field? If so, how many characters?
2. Should the note title also have a maximum length, or is any length acceptable?

---

## Acceptance Criteria

- NoteUser can register, log in, create a note, see it in the list, and delete it
- Notes from one user are never visible to another user
- App deploys from clean clone with `wrangler deploy` and `flutter build web`
