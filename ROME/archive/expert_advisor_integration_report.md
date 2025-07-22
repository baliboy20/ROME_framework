# ROME Expert Advisor Integration

## Problem
ROME rodeos lack domain expertise. They make basic mistakes in security, performance, architecture because they don't know best practices.

## Solution
Add Expert Advisors - specialized robots with access to:
- Vector databases of patterns/solutions
- Curated GitHub repos
- Web documentation

## Architecture

**Expert Sessions: Separate Claude Code sessions**

```
PMA assigns experts → Rodeo requests help → Expert (separate session) → Response back to rodeo
```

**Why separate sessions:**
- Experts maintain specialized context/knowledge
- Can serve multiple rodeos simultaneously  
- Persistent expert memory across consultations
- Cleaner separation of concerns

**Expert Types:**
- Security (auth, encryption, vulnerabilities)
- Performance (optimization, caching, scaling)
- Architecture (patterns, APIs, design)
- Testing (strategies, coverage, automation)
- DevOps (CI/CD, monitoring, deployment)
- Database (schema, queries, migrations)

## Technical Implementation

### Directory Structure
```
expert_advisors/
├── security_expert/
│   ├── CLAUDE.md
│   └── claude-start.sh
├── performance_expert/
│   ├── CLAUDE.md  
│   └── claude-start.sh
└── expert_protocol.md
```

**Each expert runs as separate Claude Code session:**
- `cd expert_advisors/security_expert && ./claude-start.sh`
- Rodeos communicate via shared files or API calls

**Expert Resource Access:**
- **Vector DB**: MCP server (rome-vector-db) configured in expert's .claude/mcp-servers.json
- **GitHub**: MCP github server for repo access
- **Web**: WebFetch/WebSearch tools for documentation

### Expert CLAUDE.md Template
```markdown
You are a [Domain] Expert advisor. You provide technical solutions, not project management.

When rodeos request consultation:
1. Search vector DB for patterns
2. Check GitHub repos for examples  
3. Provide 2-3 options with trade-offs
4. Include code examples
5. Update knowledge base with new learnings

You don't need to understand ROME methodology - just answer technical questions.
Rodeos handle all ROME protocols (logging, task management, etc).
```

**Experts don't need ROME knowledge:**
- They're pure technical consultants
- Rodeos handle all ROME compliance
- Keeps expert focus narrow and specialized

### Vector DB Schema
```json
{
  "domain": "security|performance|architecture|testing|devops|database",
  "type": "pattern|vulnerability|example|best_practice",
  "content": "implementation details",
  "code": "example code",
  "use_cases": ["when to use"],
  "trade_offs": ["pros/cons"],
  "references": ["links"]
}
```

**Benefits of single DB:**
- Easier maintenance
- Cross-domain pattern discovery
- Simpler deployment
- Better search across all knowledge

## Integration with ROME

### Updated 7-Step Protocol
1. Read task
2. Log start
3. **Check if expert needed** ← NEW
4. Execute task
5. Test
6. **Expert review (if critical)** ← NEW
7. Log completion

### When to Consult Experts
- Authentication/authorization code
- Database schema design
- API architecture decisions
- Performance optimization
- Security implementations
- Deployment configurations
- **When specified in PMA technical spec/task requirements**

### Consultation Format
**Request:**
```
Expert: Security
Task: User login system
Question: Best auth pattern for Node.js API?
Constraints: JWT preferred, mobile app client
```

**Response:**
```
Options:
1. JWT + refresh tokens
2. Session + Redis
3. OAuth2 + JWT

Recommend: #1
Code: [example]
Refs: [links]
```

## Implementation Plan

**Week 1-2: Foundation**
- Create expert directories with .claude/mcp-servers.json
- Set up rome-vector-db MCP server
- Configure GitHub MCP access
- Test security expert pilot

**Week 3-4: Rollout**
- Deploy all 6 expert types
- Populate knowledge bases
- Train rodeos on consultation

**Week 5-6: Optimize**
- Monitor usage patterns
- Refine knowledge bases
- Automate common requests

## Files to Modify

1. **rome_methodology.md** - Add expert phase
2. **robot_actions_protocol.md** - Update 7-step protocol
3. **__START_HERE.md** - Add expert assignment step
4. **project_setup.md** - Add expert_advisors/ directory

## Benefits

**Measurable:**
- Reduce security vulnerabilities by 30%
- Improve performance by 25%
- Cut refactoring time by 40%

**Qualitative:**
- Faster development
- Better code quality
- Knowledge accumulation
- Consistent patterns

## Risks & Mitigation

| Risk | Fix |
|------|-----|
| Expert bottleneck | Multiple expert instances |
| Stale knowledge | Automated DB updates |
| Conflicting advice | PMA arbitration |
| Over-dependence | Encourage rodeo learning |

## Decision

**Recommend: Yes, implement experts**

Start with security expert pilot. If successful after 2 weeks, deploy remaining domains.

Cost: 2 weeks setup + ongoing maintenance
Value: Significantly better code quality + faster development

---

## Development Context

This document evolved from a collaborative discussion about integrating Expert Advisors into ROME methodology. Key refinements made during development:

**Initial Concept**: User proposed expert advisors to provide specialist advice to rodeos, with access to vector DB, GitHub repos, and web resources for best practices.

**Architecture Decisions**:
- **Separate Claude Code sessions** for experts (not embedded in rodeo sessions) for persistent specialized context and concurrent service
- **Single vector database** with domain tagging instead of separate DBs per expert type
- **No ROME knowledge required** for experts - they're pure technical consultants
- **MCP server access** for vector DB, GitHub, and web resources

**Key Clarifications**:
- PMA can specify expert consultation points in technical specs
- Experts maintain specialized context across consultations
- Communication via shared files or API calls between sessions
- Each expert gets own `.claude/mcp-servers.json` configuration

**Documentation Evolution**: Condensed from verbose 35-page consultant report to terse, actionable 150-line specification focusing on technical implementation over promotional content.

*Final recommendation: Implement with security expert pilot, expand based on results.*