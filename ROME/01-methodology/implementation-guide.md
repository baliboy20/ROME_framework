# ROME Implementation Guide
**Version**: 3.0 - Integration-First Development with Class Annotations
**Last Updated**: 2025-10-07

## Integration-First Philosophy

Build from data sources outward, validating integration at each layer:
```
Database Schema
    ↓ (Integration Test)
Server Data Access
    ↓ (Integration Test)
API Endpoints
    ↓ (Integration Test)
Client Data Layer
    ↓ (Integration Test)
Domain Logic
    ↓ (Integration Test)
Presentation Layer
    ↓ (Integration Test)
```

**Unit tests added at project end** for genuinely complex logic only.

---

## Class Annotation Standards

### Annotation Lifecycle

#### 1. Initial Creation (Robot creates class)
```typescript
/**
 * @Created 2025-10-07 by Reena
 * @TestLevel None
 * @Stable false
 * @ComplexityLevel Low
 * 
 * Initial implementation of project API endpoints.
 */
class ProjectController { ... }
```

#### 2. After Integration Tests (Robot adds tests)
```typescript
/**
 * @Created 2025-10-07 by Reena
 * @Modified 2025-10-07 by Reena
 * @TestLevel Integration
 * @Stable false
 * @ComplexityLevel Low
 * 
 * Integration tests: test/integration/project_api_test.js
 * - Covers: create, read, update, delete operations
 */
class ProjectController { ... }
```

#### 3. Production Ready (PMA marks stable)
```typescript
/**
 * @Created 2025-10-07 by Reena
 * @Modified 2025-10-08 by PMA
 * @TestLevel Integration
 * @Stable true
 * @ComplexityLevel Low
 * 
 * CHANGELOG:
 * 2025-10-08: Marked stable after UAT passed
 * 2025-10-07: Initial implementation with integration tests
 */
class ProjectController { ... }
```

#### 4. Complex Logic Identified (Needs unit tests)
```typescript
/**
 * @Created 2025-10-07 by Reena
 * @Modified 2025-10-10 by Reena
 * @TestLevel Both
 * @Stable true
 * @ComplexityLevel High
 * 
 * CHANGELOG:
 * 2025-10-10: Added complex authorization logic - added unit tests
 * 2025-10-08: Marked stable after UAT passed
 * 2025-10-07: Initial implementation
 * 
 * Integration tests: test/integration/project_api_test.js
 * Unit tests: test/unit/project_authorization_test.js
 * - Permission calculation edge cases
 * - Role hierarchy validation
 */
class ProjectController { ... }
```

### Annotation Quick Reference

| Annotation | Values | When to Update |
|------------|--------|----------------|
| @Created | `YYYY-MM-DD by [Robot]` | Only once at creation |
| @Modified | `YYYY-MM-DD by [Robot]` | Every significant change |
| @TestLevel | `None` → `Integration` → `Both` | When tests added |
| @Stable | `false` → `true` | When PMA approves for production |
| @ComplexityLevel | `Low` \| `Medium` \| `High` | When complexity identified |

---

## Implementation Progression

### Layer 1: Database Schema (Ashok)

**Create:**
```sql
-- @Created 2025-10-07 by Ashok
-- @TestLevel Integration
-- @Stable false
-- @ComplexityLevel Low

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_project_name UNIQUE (name)
);
```

**Populate:**
```sql
-- Test data for integration tests
INSERT INTO projects (name, description, status) VALUES
    ('Test Project 1', 'Description 1', 'active'),
    ('Test Project 2', 'Description 2', 'draft');
```

**Integration Test:**
```javascript
// test/integration/database/projects_schema_test.js
describe('Projects Database Integration', () => {
  it('should insert and retrieve projects', async () => {
    const project = await db.query(
      'INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *',
      ['New Project', 'Test Description']
    );
    
    expect(project.rows[0].name).toBe('New Project');
    expect(project.rows[0].status).toBe('draft'); // default value
  });

  it('should enforce unique name constraint', async () => {
    await expect(
      db.query('INSERT INTO projects (name) VALUES ($1)', ['Test Project 1'])
    ).rejects.toThrow(/unique constraint/);
  });
});
```

**Update Schema Annotations:**
```sql
-- @Created 2025-10-07 by Ashok
-- @Modified 2025-10-07 by Ashok
-- @TestLevel Integration
-- @Stable false
-- @ComplexityLevel Low
-- Integration tests: test/integration/database/projects_schema_test.js
```

**Validation:** ✅ Schema exists, constraints work, seed data loads

---

### Layer 2: Server Data Access (Reena)

**Create:**
```javascript
/**
 * @Created 2025-10-07 by Reena
 * @TestLevel None
 * @Stable false
 * @ComplexityLevel Low
 * 
 * Project data access model.
 */
class Project {
  static async create(data) {
    const result = await db.query(
      'INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *',
      [data.name, data.description]
    );
    return result.rows[0];
  }

  static async findAll() {
    const result = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const result = await db.query(
      'UPDATE projects SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [data.name, data.description, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM projects WHERE id = $1', [id]);
  }
}
```

**Integration Test:**
```javascript
// test/integration/models/project_model_test.js
describe('Project Model Integration', () => {
  afterEach(async () => {
    await db.query('DELETE FROM projects WHERE name LIKE $1', ['Test%']);
  });

  it('should create project and return with id', async () => {
    const project = await Project.create({
      name: 'Test Model Project',
      description: 'Test'
    });
    
    expect(project.id).toBeDefined();
    expect(project.name).toBe('Test Model Project');
    expect(project.created_at).toBeInstanceOf(Date);
  });

  it('should retrieve all projects', async () => {
    await Project.create({ name: 'Test Project 1', description: 'Desc 1' });
    await Project.create({ name: 'Test Project 2', description: 'Desc 2' });
    
    const projects = await Project.findAll();
    expect(projects.length).toBeGreaterThanOrEqual(2);
    expect(projects[0]).toHaveProperty('name');
  });

  it('should update project', async () => {
    const project = await Project.create({ name: 'Original', description: 'Desc' });
    
    const updated = await Project.update(project.id, {
      name: 'Updated',
      description: 'New Desc'
    });
    
    expect(updated.name).toBe('Updated');
    expect(updated.description).toBe('New Desc');
  });
});
```

**Update Class Annotations:**
```javascript
/**
 * @Created 2025-10-07 by Reena
 * @Modified 2025-10-07 by Reena
 * @TestLevel Integration
 * @Stable false
 * @ComplexityLevel Low
 * 
 * Integration tests: test/integration/models/project_model_test.js
 * - Covers: create, findAll, findById, update, delete
 */
class Project { ... }
```

**Validation:** ✅ Model methods work, data persists, queries return correct data

---

### Layer 3: API Endpoints (Reena)

**Create:**
```javascript
/**
 * @Created 2025-10-07 by Reena
 * @TestLevel None
 * @Stable false
 * @ComplexityLevel Low
 * 
 * REST API endpoints for project management.
 */
const router = express.Router();

router.post('/api/projects', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name is required' }
      });
    }
    
    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name too long (max 100 chars)' }
      });
    }
    
    const project = await Project.create({ name, description });
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    if (error.constraint === 'unique_project_name') {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_ERROR', message: 'Project name already exists' }
      });
    }
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

router.get('/api/projects', async (req, res) => {
  const projects = await Project.findAll();
  res.json({ success: true, data: projects });
});

router.get('/api/projects/:id', async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Project not found' }
    });
  }
  res.json({ success: true, data: project });
});

router.put('/api/projects/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.update(req.params.id, { name, description });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' }
      });
    }
    
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

router.delete('/api/projects/:id', async (req, res) => {
  await Project.delete(req.params.id);
  res.json({ success: true, data: null });
});
```

**Integration Test:**
```javascript
// test/integration/api/projects_api_test.js
describe('Projects API Integration', () => {
  afterEach(async () => {
    await db.query('DELETE FROM projects WHERE name LIKE $1', ['Test%']);
  });

  describe('POST /api/projects', () => {
    it('should create project via POST', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({ name: 'Test API Project', description: 'Test' })
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test API Project');
      expect(response.body.data.id).toBeDefined();
      
      // Verify in database
      const project = await db.query('SELECT * FROM projects WHERE id = $1', [response.body.data.id]);
      expect(project.rows[0].name).toBe('Test API Project');
    });

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({ name: '', description: 'Test' })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for duplicate name', async () => {
      await request(app)
        .post('/api/projects')
        .send({ name: 'Duplicate Test', description: 'First' })
        .expect(201);
      
      const response = await request(app)
        .post('/api/projects')
        .send({ name: 'Duplicate Test', description: 'Second' })
        .expect(400);
      
      expect(response.body.error.code).toBe('DUPLICATE_ERROR');
    });
  });

  describe('GET /api/projects', () => {
    it('should retrieve all projects', async () => {
      await Project.create({ name: 'Test Project 1', description: 'Desc 1' });
      await Project.create({ name: 'Test Project 2', description: 'Desc 2' });
      
      const response = await request(app)
        .get('/api/projects')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should retrieve specific project', async () => {
      const project = await Project.create({ name: 'Test Project', description: 'Desc' });
      
      const response = await request(app)
        .get(`/api/projects/${project.id}`)
        .expect(200);
      
      expect(response.body.data.name).toBe('Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/api/projects/${fakeId}`)
        .expect(404);
      
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update project', async () => {
      const project = await Project.create({ name: 'Original', description: 'Original Desc' });
      
      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send({ name: 'Updated', description: 'Updated Desc' })
        .expect(200);
      
      expect(response.body.data.name).toBe('Updated');
      expect(response.body.data.description).toBe('Updated Desc');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete project', async () => {
      const project = await Project.create({ name: 'To Delete', description: 'Will be deleted' });
      
      await request(app)
        .delete(`/api/projects/${project.id}`)
        .expect(200);
      
      // Verify deleted from database
      const result = await db.query('SELECT * FROM projects WHERE id = $1', [project.id]);
      expect(result.rows.length).toBe(0);
    });
  });
});
```

**Update Annotations:**
```javascript
/**
 * @Created 2025-10-07 by Reena
 * @Modified 2025-10-07 by Reena
 * @TestLevel Integration
 * @Stable false
 * @ComplexityLevel Low
 * 
 * Integration tests: test/integration/api/projects_api_test.js
 * - Covers: POST, GET (all), GET (one), PUT, DELETE
 * - Tests validation, error handling, database integration
 */
```

**Validation:** ✅ API endpoints respond correctly, data flows DB → API → Response

---

### Layer 4: Client Data Layer (Charlie - Flutter)

**Create:**
```dart
/**
 * @Created 2025-10-07 by Charlie
 * @TestLevel None
 * @Stable false
 * @ComplexityLevel Low
 * 
 * Remote data source for project API communication.
 */
class ProjectRemoteDataSource {
  final Dio dio;
  
  ProjectRemoteDataSource({required this.dio});
  
  Future<List<ProjectModel>> fetchProjects() async {
    try {
      final response = await dio.get('/api/projects');
      
      if (response.statusCode == 200 && response.data['success']) {
        return (response.data['data'] as List)
            .map((json) => ProjectModel.fromJson(json))
            .toList();
      }
      
      throw ServerException(message: 'Failed to fetch projects');
    } on DioException catch (e) {
      throw ServerException(message: e.message ?? 'Network error');
    }
  }

  Future<ProjectModel> createProject(ProjectModel project) async {
    try {
      final response = await dio.post(
        '/api/projects',
        data: project.toJson(),
      );
      
      if (response.statusCode == 201 && response.data['success']) {
        return ProjectModel.fromJson(response.data['data']);
      }
      
      throw ServerException(message: 'Failed to create project');
    } on DioException catch (e) {
      if (e.response?.statusCode == 400) {
        final errorCode = e.response?.data['error']['code'];
        if (errorCode == 'VALIDATION_ERROR') {
          throw ValidationException(message: e.response?.data['error']['message']);
        }
        if (errorCode == 'DUPLICATE_ERROR') {
          throw DuplicateException(message: 'Project name already exists');
        }
      }
      throw ServerException(message: e.message ?? 'Network error');
    }
  }

  Future<ProjectModel> updateProject(String id, ProjectModel project) async {
    final response = await dio.put(
      '/api/projects/$id',
      data: project.toJson(),
    );
    
    if (response.statusCode == 200 && response.data['success']) {
      return ProjectModel.fromJson(response.data['data']);
    }
    
    throw ServerException(message: 'Failed to update project');
  }

  Future<void> deleteProject(String id) async {
    await dio.delete('/api/projects/$id');
  }
}
```

**Integration Test:**
```dart
// test/integration/data/project_remote_datasource_test.dart
void main() {
  group('ProjectRemoteDataSource Integration', () {
    late Dio dio;
    late ProjectRemoteDataSource dataSource;
    
    setUp(() {
      // Use real API endpoint for integration testing
      dio = Dio(BaseOptions(
        baseUrl: 'http://localhost:3000',
        contentType: 'application/json',
      ));
      dataSource = ProjectRemoteDataSource(dio: dio);
    });
    
    test('should fetch projects from API', () async {
      final projects = await dataSource.fetchProjects();
      
      expect(projects, isA<List<ProjectModel>>());
      expect(projects, isNotEmpty);
      expect(projects.first.name, isNotEmpty);
    });

    test('should create project via API', () async {
      final newProject = ProjectModel(
        name: 'Flutter Test Project ${DateTime.now().millisecondsSinceEpoch}',
        description: 'Created from Flutter integration test',
      );
      
      final created = await dataSource.createProject(newProject);
      
      expect(created.id, isNotNull);
      expect(created.name, equals(newProject.name));
      expect(created.description, equals(newProject.description));
      
      // Cleanup
      await dataSource.deleteProject(created.id!);
    });

    test('should throw ValidationException for empty name', () async {
      final invalidProject = ProjectModel(
        name: '',
        description: 'Invalid',
      );
      
      expect(
        () => dataSource.createProject(invalidProject),
        throwsA(isA<ValidationException>()),
      );
    });

    test('should update project via API', () async {
      // Create test project
      final project = await dataSource.createProject(
        ProjectModel(name: 'Update Test', description: 'Original'),
      );
      
      // Update it
      final updated = await dataSource.updateProject(
        project.id!,
        ProjectModel(name: 'Updated Name', description: 'Updated Description'),
      );
      
      expect(updated.name, equals('Updated Name'));
      expect(updated.description, equals('Updated Description'));
      
      // Cleanup
      await dataSource.deleteProject(project.id!);
    });
  });
}
```

**Update Annotations:**
```dart
/**
 * @Created 2025-10-07 by Charlie
 * @Modified 2025-10-07 by Charlie
 * @TestLevel Integration
 * @Stable false
 * @ComplexityLevel Low
 * 
 * Integration tests: test/integration/data/project_remote_datasource_test.dart
 * - Tests real API communication
 * - Covers: fetch, create, update, delete operations
 * - Tests error handling
 */
class ProjectRemoteDataSource { ... }
```

**Validation:** ✅ Client can communicate with API, data deserializes correctly

---

### Layer 5: Domain Layer (Charlie - Flutter)

**Create:**
```dart
/**
 * @Created 2025-10-07 by Charlie
 * @TestLevel None
 * @Stable false
 * @ComplexityLevel Low
 * 
 * Use case for creating projects with validation.
 */
class CreateProject {
  final ProjectRepository repository;
  
  CreateProject({required this.repository});
  
  Future<Either<Failure, Project>> call(String name, String description) async {
    // Validation
    if (name.trim().isEmpty) {
      return Left(ValidationFailure(message: 'Project name cannot be empty'));
    }
    
    if (name.length > 100) {
      return Left(ValidationFailure(message: 'Project name too long (max 100 characters)'));
    }
    
    // Create project
    final project = Project(name: name.trim(), description: description.trim());
    return await repository.createProject(project);
  }
}

/**
 * @Created 2025-10-07 by Charlie
 * @TestLevel None
 * @Stable false
 * @ComplexityLevel Low
 * 
 * Repository implementation for project data access.
 */
class ProjectRepositoryImpl implements ProjectRepository {
  final ProjectRemoteDataSource remoteDataSource;
  
  ProjectRepositoryImpl({required this.remoteDataSource});
  
  @override
  Future<Either<Failure, List<Project>>> fetchProjects() async {
    try {
      final projectModels = await remoteDataSource.fetchProjects();
      final projects = projectModels.map((model) => model.toEntity()).toList();
      return Right(projects);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message));
    } catch (e) {
      return Left(ServerFailure(message: 'Unexpected error'));
    }
  }
  
  @override
  Future<Either<Failure, Project>> createProject(Project project) async {
    try {
      final projectModel = ProjectModel.fromEntity(project);
      final created = await remoteDataSource.createProject(projectModel);
      return Right(created.toEntity());
    } on ValidationException catch (e) {
      return Left(ValidationFailure(message: e.message));
    } on DuplicateException catch (e) {
      return Left(DuplicateFailure(message: e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message));
    }
  }
}
```

**Integration Test:**
```dart
// test/integration/domain/create_project_usecase_test.dart
void main() {
  group('Create Project Use Case Integration', () {
    late Dio dio;
    late ProjectRemoteDataSource dataSource;
    late ProjectRepositoryImpl repository;
    late CreateProject useCase;
    
    setUp(() {
      dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000'));
      dataSource = ProjectRemoteDataSource(dio: dio);
      repository = ProjectRepositoryImpl(remoteDataSource: dataSource);
      useCase = CreateProject(repository: repository);
    });
    
    test('should create project through full domain layer', () async {
      final result = await useCase(
        'Domain Test ${DateTime.now().millisecondsSinceEpoch}',
        'Testing complete domain layer',
      );
      
      expect(result.isRight(), true);
      
      result.fold(
        (failure) => fail('Should not fail: ${failure.message}'),
        (project) {
          expect(project.name, startsWith('Domain Test'));
          expect(project.id, isNotNull);
          
          // Cleanup
          dataSource.deleteProject(project.id!);
        },
      );
    });

    test('should validate empty project name', () async {
      final result = await useCase('', 'Empty name should fail');
      
      expect(result.isLeft(), true);
      result.fold(
        (failure) => expect(failure, isA<ValidationFailure>()),
        (project) => fail('Should have failed validation'),
      );
    });

    test('should validate project name length', () async {
      final longName = 'x' * 101;
      final result = await useCase(longName, 'Name too long');
      
      expect(result.isLeft(), true);
      result.fold(
        (failure) => expect(failure, isA<ValidationFailure>()),
        (project) => fail('Should have failed validation'),
      );
    });

    test('should handle duplicate project names', () async {
      final uniqueName = 'Duplicate Test ${DateTime.now().millisecondsSinceEpoch}';
      
      // Create first project
      final firstResult = await useCase(uniqueName, 'First');
      expect(firstResult.isRight(), true);
      
      // Try to create duplicate
      final duplicateResult = await useCase(uniqueName, 'Second');
      expect(duplicateResult.isLeft(), true);
      
      duplicateResult.fold(
        (failure) => expect(failure, isA<DuplicateFailure>()),
        (project) => fail('Should have failed due to duplicate'),
      );
      
      // Cleanup
      firstResult.fold(
        (l) => null,
        (project) => dataSource.deleteProject(project.id!),
      );
    });
  });
}
```

**Update Annotations:**
```dart
/**
 * @Created 2025-10-07 by Charlie
 * @Modified 2025-10-07 by Charlie
 * @TestLevel Integration
 * @Stable false
 * @ComplexityLevel Low
 * 
 * Integration tests: test/integration/domain/create_project_usecase_test.dart
 * - Tests full domain layer with real API
 * - Covers validation, creation, error handling
 */
class CreateProject { ... }

/**
 * @Created 2025-10-07 by Charlie
 * @Modified 2025-10-07 by Charlie
 * @TestLevel Integration
 * @Stable false
 * @ComplexityLevel Low
 * 
 * Integration tests: test/integration/domain/project_repository_test.dart
 */
class ProjectRepositoryImpl implements ProjectRepository { ... }
```

**Validation:** ✅ Business logic works, validation enforced, repository pattern functions

---

### Layer 6: Presentation Layer (Charlie - Flutter)

**Create:**
```dart
/**
 * @Created 2025-10-07 by Charlie
 * @TestLevel None
 * @Stable false
 * @ComplexityLevel Low
 * 
 * BLoC for managing project list state.
 */
class ProjectBloc extends Bloc<ProjectEvent, ProjectState> {
  final FetchProjects fetchProjects;
  final CreateProject createProject;
  final DeleteProject deleteProject;
  
  ProjectBloc({
    required this.fetchProjects,
    required this.createProject,
    required this.deleteProject,
  }) : super(ProjectInitial()) {
    on<LoadProjects>(_onLoadProjects);
    on<AddProject>(_onAddProject);
    on<RemoveProject>(_onRemoveProject);
  }
  
  Future<void> _onLoadProjects(LoadProjects event, Emitter<ProjectState> emit) async {
    emit(ProjectLoading());
    
    final result = await fetchProjects();
    
    result.fold(
      (failure) => emit(ProjectError(message: failure.message)),
      (projects) => emit(ProjectsLoaded(projects: projects)),
    );
  }
  
  Future<void> _onAddProject(AddProject event, Emitter<ProjectState> emit) async {
    emit(ProjectLoading());
    
    final result = await createProject(event.name, event.description);
    
    result.fold(
      (failure) => emit(ProjectError(message: failure.message)),
      (project) {
        // Reload all projects after creation
        add(LoadProjects());
      },
    );
  }
}

/**
 * @Created 2025-10-07 by Charlie
 * @TestLevel None
 * @Stable false
 * @ComplexityLevel Low
 * 
 * Project list page UI.
 */
class ProjectListPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Projects')),
      body: BlocBuilder<ProjectBloc, ProjectState>(
        builder: (context, state) {
          if (state is ProjectLoading) {
            return Center(child: CircularProgressIndicator());
          }
          
          if (state is ProjectError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error, size: 64, color: Colors.red),
                  SizedBox(height: 16),
                  Text('Error: ${state.message}'),
                  SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.read<ProjectBloc>().add(LoadProjects()),
                    child: Text('Retry'),
                  ),
                ],
              ),
            );
          }
          
          if (state is ProjectsLoaded) {
            if (state.projects.isEmpty) {
              return Center(child: Text('No projects yet. Create one!'));
            }
            
            return ListView.builder(
              itemCount: state.projects.length,
              itemBuilder: (context, index) {
                final project = state.projects[index];
                return ListTile(
                  title: Text(project.name),
                  subtitle: Text(project.description ?? 'No description'),
                  trailing: IconButton(
                    icon: Icon(Icons.delete),
                    onPressed: () {
                      context.read<ProjectBloc>().add(RemoveProject(id: project.id!));
                    },
                  ),
                  onTap: () {
                    // Navigate to project details
                  },
                );
              },
            );
          }
          
          return Container();
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreateDialog(context),
        child: Icon(Icons.add),
      ),
    );
  }
  
  void _showCreateDialog(BuildContext context) {
    final nameController = TextEditingController();
    final descController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('Create Project'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: InputDecoration(labelText: 'Project Name'),
            ),
            SizedBox(height: 16),
            TextField(
              controller: descController,
              decoration: InputDecoration(labelText: 'Description'),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              context.read<ProjectBloc>().add(AddProject(
                name: nameController.text,
                description: descController.text,
              ));
              Navigator.pop(dialogContext);
            },
            child: Text('Create'),
          ),
        ],
      ),
    );
  }
}
```

**Integration Test:**
```dart
// test/integration/presentation/project_list_page_test.dart
void main() {
  group('Project List Page Integration', () {
    late Dio dio;
    late ProjectRemoteDataSource dataSource;
    late ProjectRepositoryImpl repository;
    late FetchProjects fetchProjects;
    late CreateProject createProject;
    late DeleteProject deleteProject;
    late ProjectBloc bloc;
    
    setUp(() {
      dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000'));
      dataSource = ProjectRemoteDataSource(dio: dio);
      repository = ProjectRepositoryImpl(remoteDataSource: dataSource);
      fetchProjects = FetchProjects(repository: repository);
      createProject = CreateProject(repository: repository);
      deleteProject = DeleteProject(repository: repository);
      bloc = ProjectBloc(
        fetchProjects: fetchProjects,
        createProject: createProject,
        deleteProject: deleteProject,
      );
    });
    
    tearDown(() {
      bloc.close();
    });
    
    testWidgets('should display projects from real API', (tester) async {
      // Create test project first
      await dataSource.createProject(
        ProjectModel(name: 'Integration Test Project', description: 'For testing'),
      );
      
      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider.value(
            value: bloc,
            child: ProjectListPage(),
          ),
        ),
      );
      
      // Trigger load
      bloc.add(LoadProjects());
      await tester.pumpAndSettle();
      
      // Verify projects are displayed
      expect(find.byType(ListTile), findsWidgets);
      expect(find.text('Integration Test Project'), findsOneWidget);
    });

    testWidgets('should create new project via dialog', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider.value(
            value: bloc,
            child: ProjectListPage(),
          ),
        ),
      );
      
      // Load initial projects
      bloc.add(LoadProjects());
      await tester.pumpAndSettle();
      
      // Tap FAB to open create dialog
      await tester.tap(find.byType(FloatingActionButton));
      await tester.pumpAndSettle();
      
      // Enter project details
      await tester.enterText(
        find.widgetWithText(TextField, 'Project Name'),
        'UI Test Project',
      );
      await tester.enterText(
        find.widgetWithText(TextField, 'Description'),
        'Created from UI test',
      );
      
      // Tap create button
      await tester.tap(find.widgetWithText(ElevatedButton, 'Create'));
      await tester.pumpAndSettle();
      
      // Verify new project appears in list
      expect(find.text('UI Test Project'), findsOneWidget);
    });

    testWidgets('should display error message on failure', (tester) async {
      // Use invalid base URL to force error
      final badDio = Dio(BaseOptions(baseUrl: 'http://localhost:9999'));
      final badDataSource = ProjectRemoteDataSource(dio: badDio);
      final badRepository = ProjectRepositoryImpl(remoteDataSource: badDataSource);
      final badBloc = ProjectBloc(
        fetchProjects: FetchProjects(repository: badRepository),
        createProject: CreateProject(repository: badRepository),
        deleteProject: DeleteProject(repository: badRepository),
      );
      
      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider.value(
            value: badBloc,
            child: ProjectListPage(),
          ),
        ),
      );
      
      badBloc.add(LoadProjects());
      await tester.pumpAndSettle();
      
      // Verify error state is displayed
      expect(find.byIcon(Icons.error), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
      
      badBloc.close();
    });
  });
}
```

**Update Annotations:**
```dart
/**
 * @Created 2025-10-07 by Charlie
 * @Modified 2025-10-07 by Charlie
 * @TestLevel Integration
 * @Stable false
 * @ComplexityLevel Medium
 * 
 * Integration tests: test/integration/presentation/project_list_page_test.dart
 * - Tests complete UI flow with real API
 * - Covers: display, create, delete, error handling
 */
class ProjectListPage extends StatelessWidget { ... }

/**
 * @Created 2025-10-07 by Charlie
 * @Modified 2025-10-07 by Charlie
 * @TestLevel Integration
 * @Stable false
 * @ComplexityLevel Medium
 * 
 * State management for project operations.
 */
class ProjectBloc extends Bloc<ProjectEvent, ProjectState> { ... }
```

**Validation:** ✅ Complete feature works end-to-end: UI → Domain → Data → API → DB

---

## When to Add Unit Tests

Add unit tests **at project end** for:

### 1. Complex Business Logic
```dart
/**
 * @Created 2025-10-07 by Reena
 * @TestLevel Both
 * @Stable true
 * @ComplexityLevel High
 * 
 * Integration tests: test/integration/order_service_test.js
 * Unit tests: test/unit/order_state_machine_test.js
 */
class OrderStateMachine {
  OrderStatus transition(OrderStatus current, OrderEvent event) {
    // Complex state machine logic with many edge cases
    // Unit tests verify all state transitions
  }
}
```

### 2. Algorithms
```dart
/**
 * @TestLevel Unit
 * @ComplexityLevel High
 * 
 * Unit tests: test/unit/interest_calculator_test.dart
 */
class InterestCalculator {
  double compound({required double principal, required double rate, required int years}) {
    // Complex financial calculation
  }
}
```

### 3. Utility Functions
```javascript
/**
 * @TestLevel Unit
 * @ComplexityLevel Low
 * 
 * Unit tests: test/unit/date_formatter_test.js
 */
class DateFormatter {
  static format(date, format) {
    // Date manipulation logic
  }
}
```

**Don't unit test:**
- Simple CRUD operations (covered by integration tests)
- Data models without logic
- API routes (integration tests sufficient)
- UI widgets without complex logic

---

## Integration Test Best Practices

### 1. Test Against Real Systems
```javascript
// ✅ Good: Real database
describe('Integration', () => {
  beforeAll(async () => {
    await db.connect();
    await db.migrate();
  });
  
  it('should persist data', async () => {
    // Test against actual database
  });
});
```

### 2. Clean Up Between Tests
```javascript
afterEach(async () => {
  await db.query('DELETE FROM projects WHERE name LIKE $1', ['Test%']);
});
```

### 3. Use Descriptive Test Names
```javascript
// ✅ Good
it('should return 400 when project name exceeds 100 characters', async () => {

// ❌ Bad
it('should work', async () => {
```

### 4. Test Data Flow
```javascript
// ✅ Good: Tests full flow
it('should create project end-to-end', async () => {
  // 1. API call
  const response = await request(app).post('/api/projects').send(data);
  
  // 2. Verify in database
  const project = await db.query('SELECT * FROM projects WHERE id = $1', [response.body.data.id]);
  expect(project.rows[0].name).toBe(data.name);
});
```

---

## Marking Classes as Stable

### PMA Review Checklist

Before marking @Stable true:

- [ ] All integration tests passing
- [ ] Feature tested in realistic environment
- [ ] Error handling comprehensive
- [ ] Performance acceptable
- [ ] Code reviewed
- [ ] Documentation complete

### Updating to Stable

```typescript
/**
 * @Created 2025-10-07 by Reena
 * @Modified 2025-10-10 by PMA
 * @TestLevel Integration
 * @Stable true  // ← Changed from false
 * @ComplexityLevel Low
 * 
 * CHANGELOG:
 * 2025-10-10: Marked stable after successful UAT
 * 2025-10-07: Initial implementation with integration tests
 * 
 * ⚠️  PRODUCTION CODE - Changes require PMA approval
 */
class ProjectController { ... }
```

---

## Summary

**Integration-First with Annotations Benefits:**

✅ **Traceability**: Know who created/modified every class  
✅ **Test Visibility**: See what testing exists at a glance  
✅ **Safety**: Protect production code from accidental changes  
✅ **Guidance**: ComplexityLevel shows when unit tests needed  
✅ **Less Overhead**: 50-70% less test code than unit-first approach  
✅ **Real Confidence**: Integration tests prove features actually work

**Build outward from data, validate at each layer, annotate all classes, unit test only complexity.**
