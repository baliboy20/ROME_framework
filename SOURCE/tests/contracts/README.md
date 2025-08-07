# ROME TDD Contract Tests - CRITICAL PHASE

## ⚠️ IMPLEMENTATION BLOCKED UNTIL ALL CONTRACTS PASS

These contract tests define the **exact interfaces** that all robots must implement. Following TDD-ROME methodology:

1. **ALL TESTS CURRENTLY FAIL** ✅ (This is correct!)
2. **NO IMPLEMENTATION** until contracts are agreed upon
3. **ROBOTS IMPLEMENT** only to make these tests pass
4. **CONTRACTS NEVER CHANGE** during implementation

## Contract Test Files

### Core Module Contracts
- `mcp.protocol.contract.test.js` - MCP server interface (Reena)
- `vector.database.contract.test.js` - Weaviate operations (Ashok)
- `document.processing.contract.test.js` - Document pipeline (Charlie)
- `search.engine.contract.test.js` - Search functionality (Charlie)

### Integration Contracts  
- `integration.flow.contract.test.js` - End-to-end flows (Roma)

## Running Contract Tests

```bash
# All tests should FAIL initially
npm test -- --testPathPattern=contracts

# Expected output:
# FAIL: 47 contract tests failing ✅
# This proves contracts are properly defined
```

## TDD-ROME Protocol

### Phase 1: Contract Definition ✅ COMPLETE
- [x] All interfaces defined through failing tests
- [x] Performance requirements specified
- [x] Error handling contracts established
- [x] Integration flows documented

### Phase 2: Implementation (NEXT)
Each robot implements ONLY their assigned contracts:

#### Luc (DevOps/Infrastructure)
- Environment setup
- Docker infrastructure
- Monitoring/metrics
- **No contract tests** (infrastructure layer)

#### Ashok (Data Architecture)  
- Must make `vector.database.contract.test.js` pass
- Database connection management
- Schema creation and validation
- Performance optimization

#### Reena (Backend API)
- Must make `mcp.protocol.contract.test.js` pass  
- Tool handler implementations
- Error handling and validation
- MCP server setup

#### Charlie (Search & Processing)
- Must make `document.processing.contract.test.js` pass
- Must make `search.engine.contract.test.js` pass
- Document pipeline implementation
- Search query engine

#### Roma (Quality Assurance)
- Must make `integration.flow.contract.test.js` pass
- Contract test enforcement
- End-to-end validation
- Performance monitoring

## Contract Validation Rules

### ✅ DO THIS
- Implement code that makes existing tests pass
- Follow exact interfaces specified in contracts
- Meet performance requirements in tests
- Handle all error cases defined in contracts

### ❌ NEVER DO THIS  
- Modify contract tests to make implementation easier
- Skip implementing any part of a contract
- Change expected return formats
- Add features not covered by contracts

## Integration Success Criteria

All contracts pass = Guaranteed integration success

- No API mismatches
- No database schema conflicts  
- No performance surprises
- No integration failures

## Performance Contracts

| Component | Requirement | Test Location |
|-----------|-------------|---------------|
| MCP Tool Response | <200ms | mcp.protocol.contract.test.js:130 |
| Vector Search | <200ms | search.engine.contract.test.js:190 |
| Document Processing | <60s for large docs | document.processing.contract.test.js:245 |
| Batch Insertions | <10s for 100 docs | vector.database.contract.test.js:180 |
| Concurrent Searches | 10 queries <500ms | integration.flow.contract.test.js:275 |

## Error Handling Contracts

All errors must follow standardized format:
```javascript
{
  code: 'ERROR_TYPE',
  message: 'Human readable description',
  data: {
    layer: 'mcp|database|search|processing',
    original_error: 'Original error message',
    request_id: 'unique-request-id'
  }
}
```

## Roma's Contract Enforcement Checklist

- [ ] All robots review and approve contracts
- [ ] Contract tests run in CI/CD pipeline
- [ ] Implementation phase cannot start until contracts pass review
- [ ] No contract modifications during implementation
- [ ] Integration tests pass = deployment ready

**ROMA AUTHORITY**: I will BLOCK any implementation that doesn't make contract tests pass.