# ROME Module Design Principles

## Document Overview
Comprehensive guide to module design within the ROME methodology. Consolidates and expands upon module concepts scattered across ROME documentation to provide clear principles, patterns, and practical implementation guidelines.

---

## Module Definition

### **Core Definition**
A **module** is a discrete functionality unit that groups related features in a naturally isolated manner. Each module represents a major component of the system that can be developed, tested, and deployed independently while maintaining clear interfaces with other modules.

### **Key Characteristics**
- **Self-Contained**: Complete functionality within module boundaries
- **Minimal Coupling**: Limited dependencies on other modules
- **Business Alignment**: Maps to recognizable business use cases
- **Independent Testing**: Can be validated in isolation
- **Clear Ownership**: Assigned to specific robot developer
- **Interface-Driven**: Well-defined contracts with other modules

---

## Hierarchical Structure

### **ROME Decomposition**
```
Project (System)
├── Module (Major Functionality Unit)
│   ├── Step (Logical Task Grouping)
│   │   ├── Task (Atomic Work Unit)
│   │   ├── Task (Atomic Work Unit)
│   │   └── Task (Atomic Work Unit)
│   ├── Step (Logical Task Grouping)
│   └── Step (Logical Task Grouping)
├── Module (Major Functionality Unit)
└── Module (Major Functionality Unit)
```

### **Granularity Guidelines**
- **Module**: 15-30 tasks, 1 robot owner
- **Step**: 3-7 tasks, logical milestone
- **Task**: atomic deliverable, single session

---

## Module Design Principles

### **1. Single Responsibility Principle**
**Definition**: Each module should have one primary reason to exist and change.

**Implementation**:
- Module addresses one business domain or technical concern
- Clear mission statement for each module
- Avoid mixing unrelated functionality

**Example**:
```
✅ Good: "Authentication Module" - handles user login, token management, session control
❌ Bad: "User Module" - handles authentication, user profiles, notifications, preferences
```

### **2. Minimal Coupling Principle**
**Definition**: Modules should have minimal dependencies on other modules.

**Implementation**:
- **Interface-Based Communication**: Use well-defined APIs/contracts
- **Data Independence**: Avoid shared mutable state
- **Event-Driven Integration**: Prefer events over direct method calls
- **Dependency Injection**: Externalize dependencies for testability

**Coupling Evaluation Matrix**:
```
No Coupling    : Modules work independently ✅
Data Coupling  : Modules share simple data ✅
Stamp Coupling : Modules share data structures ⚠️
Control Coupling: Modules share control flow ❌
Content Coupling: Modules access internal data ❌
```

### **3. High Cohesion Principle**
**Definition**: Elements within a module should work together toward a common goal.

**Implementation**:
- Related functions grouped together
- Shared data models within module
- Common error handling patterns
- Consistent naming and patterns

### **4. Interface Segregation Principle**
**Definition**: Modules should not depend on interfaces they don't use.

**Implementation**:
- **Minimal Interfaces**: Expose only necessary functionality
- **Role-Specific Contracts**: Different interfaces for different consumers
- **Version Compatibility**: Backward-compatible interface evolution

### **5. Dependency Inversion Principle**
**Definition**: Modules should depend on abstractions, not concretions.

**Implementation**:
- **Abstract Interfaces**: Define contracts before implementations
- **Configuration-Driven**: External configuration for dependencies
- **Plugin Architecture**: Support multiple implementations

---

## Module Boundary Identification

### **Domain-Driven Boundaries**
**Business Context Mapping**:
- **Core Domain**: Essential business functionality
- **Supporting Domain**: Necessary but not core functionality  
- **Generic Domain**: Common functionality (logging, auth, etc.)

**Boundary Indicators**:
- Different business rules or policies
- Distinct data models or entities
- Separate user roles or permissions
- Independent scalability requirements
- Different technology needs

### **Technical Boundaries**
**Layered Architecture Alignment**:
- **Presentation Layer**: UI/UX modules
- **Application Layer**: Business logic modules
- **Domain Layer**: Core business modules
- **Infrastructure Layer**: Technical support modules

**Example Module Boundaries**:
```
Frontend Modules:
├── UI Components Module (Presentation)
├── State Management Module (Application)
└── API Integration Module (Infrastructure)

Backend Modules:
├── Business Logic Module (Domain)
├── Data Access Module (Infrastructure)
└── Authentication Module (Infrastructure)
```

### **Data Flow Boundaries**
**Information Flow Analysis**:
- **High Data Flow**: Consider merging modules
- **Low Data Flow**: Good module boundary
- **One-Way Flow**: Healthy dependency direction
- **Circular Flow**: Refactor module boundaries

---

## Module Sizing Guidelines

### **Optimal Module Size**
**Task Count**: 15-30 tasks per module
- **Minimum**: 10 tasks (ensures sufficient complexity)
- **Maximum**: 40 tasks (prevents overwhelming single robot)

**Task Count**: 15-30 tasks per module
- **Minimum**: 2 weeks (meaningful milestone)
- **Maximum**: 8 weeks (manageable scope)

**Code Complexity**: Varies by technology
- **Frontend**: 2,000-8,000 lines of code
- **Backend**: 3,000-12,000 lines of code
- **Infrastructure**: Configuration and scripts

### **Size Adjustment Strategies**

**Module Too Large** (>40 tasks):
- **Vertical Split**: Separate by feature/functionality
- **Horizontal Split**: Separate by layer (UI/Business/Data)
- **Temporal Split**: Separate by development phases

**Module Too Small** (<10 tasks):
- **Merge Related**: Combine with closely related modules
- **Expand Scope**: Include additional related functionality
- **Consolidate Steps**: Group steps into fewer, larger modules

---

## Module Types and Patterns

### **1. Foundation Modules**
**Purpose**: Provide core infrastructure and shared services
**Characteristics**:
- Built first in project timeline
- High reuse across other modules
- Stable interfaces
- Minimal dependencies

**Examples**:
- Infrastructure Setup Module
- Authentication/Authorization Module
- Logging and Monitoring Module
- Configuration Management Module

### **2. Domain Modules**
**Purpose**: Implement core business functionality
**Characteristics**:
- Business logic implementation
- Domain-specific data models
- Business rule enforcement
- Core user value delivery

**Examples**:
- Document Processing Module
- Search Engine Module
- User Management Module
- Payment Processing Module

### **3. Integration Modules**
**Purpose**: Connect system with external services
**Characteristics**:
- External API integration
- Data transformation
- Protocol adaptation
- Error handling and retry logic

**Examples**:
- Third-Party API Module
- Database Integration Module
- Message Queue Module
- File System Module

### **4. Presentation Modules**
**Purpose**: Provide user interfaces and experiences
**Characteristics**:
- User interaction handling
- Data presentation
- Input validation
- User experience optimization

**Examples**:
- Web UI Module
- Mobile App Module
- CLI Tool Module
- API Gateway Module

### **5. Cross-Cutting Modules**
**Purpose**: Handle concerns that span multiple domains
**Characteristics**:
- System-wide concerns
- Aspect-oriented functionality
- Non-functional requirements
- Quality attributes

**Examples**:
- Security Module
- Performance Monitoring Module
- Testing Framework Module
- Documentation Module

---

## Module Interface Design

### **Interface Definition Standards**

**API Contract Specification**:
```json
{
  "module": "authentication",
  "version": "1.0.0",
  "endpoints": [
    {
      "name": "login",
      "method": "POST",
      "path": "/auth/login",
      "request": { "schema": "LoginRequest" },
      "response": { "schema": "AuthToken" },
      "errors": ["InvalidCredentials", "AccountLocked"]
    }
  ],
  "events": [
    {
      "name": "UserLoggedIn",
      "schema": "UserLoginEvent",
      "frequency": "per_login"
    }
  ]
}
```

**Data Contract Specification**:
```typescript
// Module data exports
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at: Date;
}

// Module service interface
export interface AuthenticationService {
  login(credentials: LoginCredentials): Promise<AuthToken>;
  logout(token: AuthToken): Promise<void>;
  validateToken(token: AuthToken): Promise<UserProfile>;
}
```

### **Interface Evolution Principles**
- **Backward Compatibility**: New versions support old interfaces
- **Deprecation Strategy**: Phased removal of old interfaces
- **Version Negotiation**: Clients specify required version
- **Documentation**: Clear interface documentation and examples

---

## Module Dependency Management

### **Dependency Types**

**1. Compile-Time Dependencies**
- Code imports and libraries
- Shared data models
- Interface definitions

**2. Runtime Dependencies**
- Service calls and API requests
- Database connections
- File system access

**3. Deployment Dependencies**
- Infrastructure requirements
- Configuration dependencies
- Startup order requirements

### **Dependency Direction Rules**

**Allowed Dependency Patterns**:
```
UI Layer → Business Layer → Data Layer ✅
Core Domain ← Supporting Services ✅
Abstract Interface ← Concrete Implementation ✅
```

**Forbidden Dependency Patterns**:
```
Data Layer → UI Layer ❌
Infrastructure → Business Logic ❌
Concrete → Abstract ❌
```

### **Dependency Resolution Strategies**

**Dependency Injection**:
```typescript
class UserService {
  constructor(
    private authService: AuthenticationService,
    private userRepository: UserRepository,
    private logger: Logger
  ) {}
}
```

**Service Registry**:
```typescript
const serviceRegistry = new ServiceRegistry();
serviceRegistry.register('auth', new AuthenticationService());
serviceRegistry.register('user', new UserService());
```

**Event-Driven Integration**:
```typescript
// Publisher
eventBus.publish('UserCreated', { userId, email });

// Subscriber
eventBus.subscribe('UserCreated', (event) => {
  emailService.sendWelcomeEmail(event.email);
});
```

---

## Module Organization Standards

### **File Structure Template**
```
module_[name]/
├── README.md                    # Module documentation
├── INTERFACE.md                 # API contracts and interfaces
├── src/                        # Source code
│   ├── controllers/            # Request handlers (if applicable)
│   ├── services/               # Business logic
│   ├── models/                 # Data models
│   ├── interfaces/             # Type definitions
│   └── utils/                  # Utility functions
├── tests/                      # Test suites
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── fixtures/               # Test data
├── docs/                       # Additional documentation
│   ├── design.md               # Module design decisions
│   ├── api.md                  # API documentation
│   └── examples/               # Usage examples
├── config/                     # Configuration files
└── scripts/                    # Build and deployment scripts
```

### **Naming Conventions**

**Module Names**:
- **Pattern**: `module_[domain]_[purpose]`
- **Examples**: `module_auth_core`, `module_user_management`, `module_payment_processing`

**File Names**:
- **Services**: `[entity].service.ts`
- **Controllers**: `[entity].controller.ts`
- **Models**: `[entity].model.ts`
- **Interfaces**: `[entity].interface.ts`
- **Tests**: `[entity].test.ts`

**Function Names**:
- **Actions**: `createUser()`, `updateProfile()`, `deleteAccount()`
- **Queries**: `getUserById()`, `findUsersByRole()`, `searchUsers()`
- **Validators**: `validateEmail()`, `isValidPassword()`, `checkPermissions()`

---

## Module Quality Gates

### **Module Completion Criteria**

**Functional Requirements**:
- [ ] All assigned tasks completed per 7-step protocol
- [ ] Business requirements satisfied
- [ ] Interface contracts implemented
- [ ] Error handling comprehensive
- [ ] Performance targets met

**Technical Requirements**:
- [ ] Code review completed
- [ ] Unit test coverage >80%
- [ ] Integration tests passing
- [ ] Documentation complete
- [ ] Security requirements satisfied

**Integration Requirements**:
- [ ] Interface contracts validated
- [ ] Dependency injection working
- [ ] Error propagation tested
- [ ] Performance impact assessed
- [ ] Monitoring/logging implemented

### **Module Health Metrics**

**Code Quality Metrics**:
- **Cyclomatic Complexity**: <10 per function
- **Test Coverage**: >80% line coverage
- **Code Duplication**: <5% duplicate code
- **Maintainability Index**: >60/100

**Interface Quality Metrics**:
- **API Response Time**: <200ms for 95th percentile
- **Error Rate**: <1% of requests
- **Availability**: >99.9% uptime
- **Interface Stability**: <5% breaking changes per release

**Dependency Metrics**:
- **Coupling Factor**: <30% of classes coupled
- **Dependency Count**: <10 external dependencies
- **Circular Dependencies**: 0 circular references
- **Interface Complexity**: <20 methods per interface

---

## Module Testing Strategy

### **Testing Pyramid for Modules**

**Unit Tests** (70% of tests):
- Test individual functions and classes
- Mock all external dependencies
- Fast execution (<1ms per test)
- High code coverage (>80%)

**Integration Tests** (20% of tests):
- Test module interfaces
- Test with real dependencies
- Validate data contracts
- End-to-end workflows

**System Tests** (10% of tests):
- Test module in full system context
- Real user scenarios
- Performance validation
- Security testing

### **Test Organization**
```
tests/
├── unit/
│   ├── services/
│   ├── models/
│   └── utils/
├── integration/
│   ├── api/
│   ├── database/
│   └── external/
├── system/
│   ├── scenarios/
│   ├── performance/
│   └── security/
└── fixtures/
    ├── data/
    └── mocks/
```

---

## Common Module Patterns

### **1. Repository Pattern**
**Purpose**: Abstraction layer for data access
```typescript
interface UserRepository {
  findById(id: string): Promise<User>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### **2. Service Layer Pattern**
**Purpose**: Business logic encapsulation
```typescript
class UserService {
  async createUser(userData: CreateUserRequest): Promise<User> {
    const user = this.validateUserData(userData);
    await this.userRepository.save(user);
    this.eventBus.publish('UserCreated', user);
    return user;
  }
}
```

### **3. Factory Pattern**
**Purpose**: Object creation abstraction
```typescript
class ServiceFactory {
  createUserService(): UserService {
    return new UserService(
      this.getUserRepository(),
      this.getEventBus(),
      this.getLogger()
    );
  }
}
```

### **4. Observer Pattern**
**Purpose**: Loose coupling through events
```typescript
class EventBus {
  subscribe(event: string, handler: EventHandler): void;
  publish(event: string, data: any): void;
}
```

---

## Module Anti-Patterns

### **1. God Module**
**Problem**: Module tries to do everything
**Solution**: Split into smaller, focused modules

### **2. Chatty Modules**
**Problem**: Excessive communication between modules
**Solution**: Batch operations, reduce interface calls

### **3. Data Clumps**
**Problem**: Same data passed between many modules
**Solution**: Create shared data structures

### **4. Circular Dependencies**
**Problem**: Modules depend on each other cyclically
**Solution**: Extract common interfaces, dependency injection

### **5. Anemic Modules**
**Problem**: Module contains only data, no behavior
**Solution**: Add business logic, combine with related modules

---

## Summary

### **Key Principles Recap**
1. **Single Responsibility**: One reason to exist and change
2. **Minimal Coupling**: Limited dependencies between modules
3. **High Cohesion**: Related functionality grouped together
4. **Clear Interfaces**: Well-defined contracts and boundaries
5. **Independent Testing**: Modules can be validated in isolation

### **Design Process**
1. **Identify Boundaries**: Use domain analysis and data flow
2. **Define Interfaces**: Specify contracts before implementation
3. **Size Appropriately**: 15-30 tasks per module
4. **Organize Structure**: Follow standard file and naming conventions
5. **Validate Quality**: Meet completion criteria and health metrics

### **Success Indicators**
- **Development Velocity**: Modules can be developed in parallel
- **Testing Efficiency**: Modules can be tested independently
- **Maintenance Ease**: Changes isolated to specific modules
- **Team Productivity**: Clear ownership and responsibility boundaries

---

**Document Status**: Comprehensive Module Design Guide  
**Usage**: Reference for all ROME module design decisions  
**Maintenance**: Update as patterns and anti-patterns are discovered