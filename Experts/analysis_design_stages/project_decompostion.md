# Decomposition Strategy with Claude


### overview

When using Claude to decompose requirements, start by prompting it to analyze your requirements and break them into hierarchical levels: epics for business capabilities, features for user-facing functionality, user stories for specific value delivery, and technical tasks for implementation units. Ask Claude to provide IDs, descriptions, acceptance criteria, and dependencies for each level.
For labeling, use a hierarchical identifier system like PREFIX-[EPIC].[FEATURE].[STORY].[TASK], such as AUTH-001.1.1.1. This creates a clear parent-child relationship. Supplement these with metadata tags for component ownership (frontend/backend), priority levels, status tracking, and sprint assignment.
To maintain traceability to code, embed IDs directly in code comments at the class or function level, use conventional commit messages that reference the feature IDs, and maintain documentation that links each feature ID to its implementation files and test locations. This creates bidirectional traceability where you can navigate from requirement to code and back again.
The practical workflow involves three steps. First, give Claude your PRD and ask it to generate a requirements traceability matrix with the hierarchy and IDs. Second, have Claude create supporting artifacts like feature specifications, test plans, and API documentation, all tagged with the same IDs. Third, maintain these links throughout development by consistently using the IDs in commits, code comments, and issue tracking tools.
For implementation, integrate this system with your tools by using issue tracker labels that match your ID scheme, maintaining a feature registry file that maps IDs to code locations, and using searchable doc comments in your codebase. This approach works particularly well for microservices architectures where you need to track features across multiple repositories and technology stacks.



#### 1. Start with a structured prompt pattern:

"Analyze these user requirements: [requirements]

Decompose into:
- Epic-level features (business capabilities)
- User stories (specific user value)
- Technical tasks (implementation units)

For each, provide: ID, description, acceptance criteria, dependencies"


#### 2. Use hierarchical labeling:

Epics: EPIC-001, EPIC-002
Features: FEAT-001.1, FEAT-001.2 (nested under epics)
User Stories: US-001.1.1, US-001.1.2 (nested under features)
Tasks: TASK-001.1.1.1 (implementation units)

Labeling for Traceability
Recommended tagging system:

[PREFIX]-[EPIC].[FEATURE].[STORY].[TASK]

Examples:
- AUTH-001: Authentication epic
- AUTH-001.1: Social login feature
- AUTH-001.1.1: Google OAuth user story
- AUTH-001.1.1.1: Implement OAuth flow (task)

Include metadata tags:

@component:backend, @component:frontend
@priority:high|medium|low
@status:draft|ready|in-progress|review|done
@sprint:2024-W45

#### Tracking to Code
1. Embed IDs in commits and code:

```// [AUTH-001.1.1.1] Google OAuth implementation
class GoogleAuthService {
  // Implementation
}
```

2. Use conventional commits:

```
git commit -m "feat(AUTH-001.1.1): implement Google OAuth flow

Implements user story AUTH-001.1.1
- Added OAuth configuration
- Created auth callback handler
Closes TASK-AUTH-001.1.1.1"

```

3. Link in documentation:

````
## Authentication System

**Epic:** AUTH-001
**Features:**
- [FEAT-001.1](docs/features/social-login.md) Social Login
  - Implementation: `lib/services/auth/`
  - Tests: `test/auth/google_auth_test.dart`
```

## Practical Workflow

**Step 1: Initial Decomposition**
Ask Claude:
```
"Here's my PRD: [content]

Create a requirements traceability matrix with:
1. Feature hierarchy
2. Unique IDs
3. Acceptance criteria
4. Implementation components
5. Test requirements

Output as structured JSON/Markdown"
```

**Step 2: Generate Tracking Artifacts**
Ask Claude to create:
- **Traceability matrix** (requirements → features → code)
- **Feature specification docs** with IDs
- **Test plans** linked to feature IDs
- **API documentation** tagged with feature IDs

**Step 3: Maintain Bidirectional Links**
```
Requirement ←→ Feature ←→ Code ←→ Tests ←→ Docs
   (ID)        (ID)      (comment)  (describe)  (link)

````


Tool Integration
For your Flutter/Go project, consider:
1. Issue Tracking:

GitHub Issues/Projects with labels matching your IDs
Linear (with custom fields for traceability)

2. Documentation:

```yaml
# feature-registry.yaml
features:
  - id: AUTH-001.1
    name: Social Login
    epic: AUTH-001
    implementation:
      backend: services/auth/oauth.go
      frontend: lib/features/auth/
    tests:
      - test/auth/oauth_test.go
      - test/auth/google_auth_test.dart
```

3. Code Annotations:
   Use doc comments with IDs for searchability:
```gotemplate
// Package oauth implements social authentication [AUTH-001.1]
// Supports Google, GitHub OAuth flows
package oauth
```

## Example Prompt for Your Platform

For your market intelligence platform:
```
"Decompose this requirement: 'Users need semantic search across market reports'

Create:
1. Epic-level feature (SEARCH-xxx)
2. Break into user stories (search UI, embedding service, ranking)
3. Technical tasks (spaCy integration, vector DB, API endpoints)
4. Map to architecture components (Flutter UI, Go service, Parse Server)
5. Define acceptance criteria
6. Identify test scenarios

Format as a traceability matrix with IDs for tracking"


```
