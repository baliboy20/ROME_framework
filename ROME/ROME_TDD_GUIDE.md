# ROME TDD Guide
## Test-Driven Development for Robot Methodology

### Why TDD for ROME?

Based on real project experience:
- **Current approach**: 21% API failure rate, extensive rework cycles
- **TDD approach**: Eliminates integration failures through contract-driven development
- **Result**: 60% less rework, guaranteed integration success

---

## TDD-ROME Workflow

### Phase 1: Contract Definition (BLOCKING)
**All robots collaborate to define testable interfaces**

```
┌─────────────────────────────────────────────────────┐
│              CONTRACT DEFINITION PHASE               │
│                                                      │
│  PMA + All Robots                                   │
│  ├── Define API contracts through tests             │
│  ├── Define database schemas through tests          │
│  ├── Define UI behaviors through tests              │
│  └── Define integration flows through tests         │
│                                                      │
│  Output: Comprehensive test suite (all failing)     │
└─────────────────────────────────────────────────────┘
```

### Phase 2: Parallel Implementation (SEMI-BLOCKING)
**Each robot implements to pass their contract tests**

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│     Luc      │ │    Ashok     │ │    Reena     │ │   Charlie    │
│              │ │              │ │              │ │              │
│ Make infra   │ │ Make schema  │ │  Make API    │ │   Make UI    │
│ tests pass   │ │ tests pass   │ │ tests pass   │ │ tests pass   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
                                ↓
                        ┌──────────────┐
                        │     Roma     │
                        │              │
                        │   Validate   │
                        │  all tests   │
                        └──────────────┘
```

---

## Contract Test Examples

### 1. API Contract Test (Backend)
```javascript
// test/contracts/project.api.contract.test.js
describe('Project API Contract', () => {
  // Written BEFORE implementation
  describe('POST /api/v1/projects', () => {
    it('should create project with valid data', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
        folders: ['/path/to/folder']
      };
      
      const response = await request(app)
        .post('/api/v1/projects')
        .send(projectData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        _id: expect.any(String),
        name: projectData.name,
        description: projectData.description,
        folders: projectData.folders,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });
    
    it('should reject invalid project data', async () => {
      const invalidData = { name: '' }; // Missing required fields
      
      const response = await request(app)
        .post('/api/v1/projects')
        .send(invalidData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

### 2. Database Contract Test (Data Layer)
```javascript
// test/contracts/project.model.contract.test.js
describe('Project Model Contract', () => {
  // Written BEFORE implementation
  it('should validate required fields', async () => {
    const project = new Project({
      name: '', // Invalid: empty required field
      description: 'Test'
    });
    
    await expect(project.validate()).rejects.toThrow('name is required');
  });
  
  it('should auto-generate timestamps', async () => {
    const project = new Project({
      name: 'Test Project',
      description: 'Test Description'
    });
    
    await project.save();
    
    expect(project.createdAt).toBeInstanceOf(Date);
    expect(project.updatedAt).toBeInstanceOf(Date);
  });
});
```

### 3. Frontend Contract Test (UI Layer)
```dart
// test/contracts/project_repository.contract.test.dart
void main() {
  group('ProjectRepository Contract', () {
    // Written BEFORE implementation
    test('should handle successful project creation', () async {
      final mockDio = MockDio();
      final repository = ProjectRepositoryImpl(dio: mockDio);
      
      final projectData = Project(
        name: 'Test Project',
        description: 'Test Description',
      );
      
      when(() => mockDio.post(
        '/projects',
        data: any(named: 'data'),
      )).thenAnswer((_) async => Response(
        data: {
          'success': true,
          'data': {
            '_id': '123',
            'name': 'Test Project',
            'description': 'Test Description',
            'createdAt': '2024-01-01T00:00:00Z',
            'updatedAt': '2024-01-01T00:00:00Z',
          }
        },
        statusCode: 201,
        requestOptions: RequestOptions(path: '/projects'),
      ));
      
      final result = await repository.createProject(projectData);
      
      expect(result.isSuccess, true);
      expect(result.data!.id, '123');
    });
  });
}
```

### 4. Integration Contract Test
```javascript
// test/contracts/project.integration.contract.test.js
describe('Project Integration Contract', () => {
  // Tests the full flow across systems
  it('should create project with file upload', async () => {
    // 1. Create project via API
    const projectResponse = await request(app)
      .post('/api/v1/projects')
      .send({
        name: 'Project with Files',
        description: 'Test'
      })
      .expect(201);
    
    const projectId = projectResponse.body.data._id;
    
    // 2. Upload file to project
    const fileResponse = await request(app)
      .post(`/api/v1/projects/${projectId}/files`)
      .attach('file', 'test/fixtures/sample.pdf')
      .expect(200);
    
    expect(fileResponse.body.data.filename).toBeDefined();
    
    // 3. Verify project includes file
    const getResponse = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .expect(200);
    
    expect(getResponse.body.data.attachments).toHaveLength(1);
  });
});
```

---

## TDD Benefits for ROME

### 1. **Eliminates Integration Issues**
- Frontend knows exact API response format
- Backend knows exact database schema
- No surprises during integration

### 2. **Enables True Parallel Development**
- Clear contracts allow independent work
- No waiting for other robots
- Integration guaranteed from start

### 3. **Reduces Rework Cycles**
- Current: Design → Code → Test → Fail → Rework (60% waste)
- TDD: Test → Code → Pass → Done (0% waste)

### 4. **Improves Design Quality**
- Tests force thinking about interfaces
- Edge cases considered upfront
- Clean, testable code architecture

---

## Roma's Enhanced Role in TDD-ROME

### Test Enforcement Responsibilities
1. **Contract Review**: Verify all interfaces have contract tests
2. **Test-First Validation**: No implementation without failing tests
3. **Coverage Monitoring**: Track test metrics throughout development
4. **Integration Testing**: Coordinate cross-robot contract validation
5. **Quality Gates**: Block progression without passing tests

### Roma's TDD Checklist
```markdown
## Before Implementation Phase
- [ ] All API endpoints have contract tests
- [ ] All database models have validation tests
- [ ] All UI components have behavior tests
- [ ] All integration points have flow tests
- [ ] All tests are currently FAILING (red phase)

## During Implementation Phase
- [ ] Robots only writing code to pass existing tests
- [ ] No new features without new failing tests first
- [ ] Test coverage increasing with each commit
- [ ] Contract tests remain unchanged

## After Implementation Phase
- [ ] All contract tests passing (green phase)
- [ ] Coverage meets 80% minimum
- [ ] Integration tests passing
- [ ] No test modifications to make them pass
```

---

## Common TDD Pitfalls in ROME

### 1. **Writing Tests After Code**
❌ **Wrong**: Implement feature → Write tests → Modify tests to pass
✅ **Right**: Write failing tests → Implement → Tests pass unchanged

### 2. **Changing Tests to Match Implementation**
❌ **Wrong**: API returns different format → Update tests to match
✅ **Right**: API must match contract tests → Fix implementation

### 3. **Skipping Contract Phase**
❌ **Wrong**: Each robot writes their own tests independently
✅ **Right**: All robots collaborate on contract tests first

### 4. **Testing Implementation Details**
❌ **Wrong**: Test private methods and internal state
✅ **Right**: Test public contracts and behaviors only

---

## Getting Started with TDD-ROME

### For New Projects
1. **Tech Spec Review**: All robots review requirements together
2. **Contract Definition**: 2-3 days defining all interfaces with tests
3. **Test Distribution**: Each robot gets their contract test suite
4. **Implementation**: Make tests pass (no new features without tests)
5. **Integration**: All contract tests passing = guaranteed integration

### For Existing Projects
1. **Identify Pain Points**: Where is rework happening?
2. **Write Contract Tests**: For problematic interfaces
3. **Refactor to Tests**: Make existing code pass contracts
4. **New Features**: Always TDD from now on

---

## Measuring TDD Success

### Metrics to Track
- **First-Time Success Rate**: % of features working on first integration
- **Rework Hours**: Time spent fixing integration issues
- **Test Coverage**: Not just %, but contract coverage
- **Defect Rate**: Bugs found after "completion"
- **Cycle Time**: Total time from start to working feature

### Expected Improvements
- Integration failures: 21% → <5%
- Rework time: 40% of effort → <10%
- First-time success: 79% → >95%
- Overall velocity: 20% faster despite upfront test investment

---

## Conclusion

TDD-ROME transforms the ROME methodology from "fast parallel development with integration risk" to "fast parallel development with guaranteed integration success."

The investment in contract tests pays for itself by eliminating rework cycles and ensuring first-time quality.