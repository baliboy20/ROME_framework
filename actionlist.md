# Reverse App Development Task List

## Project Overview
A web application that accepts user text input (max 100 chars), sends it to a backend server, and displays the reversed text with proper error handling and UI feedback.

## Module 1: Backend Development
**Owner**: Reena (Backend analyst/Developer)
**Technology**: Node.js, Express, TypeScript

### Step 1: Project Setup
- Task 1.1: Initialize Node.js project with TypeScript
  - Create backend directory
  - Run npm init
  - Install TypeScript and dev dependencies
- Task 1.2: Install dependencies (express, typescript, ts-node, @types/express, cors, @types/cors)
- Task 1.3: Configure tsconfig.json for Node.js environment

### Step 2: Core Implementation
- Task 2.1: Create Express server setup in src/server.ts
  - Set up Express app
  - Configure middleware (cors, json body parser)
  - Define port and start server
- Task 2.2: Implement POST /question endpoint in src/routes/question.ts
  - Accept JSON payload with text field
  - Validate input length (max 100 characters)
  - Return JSON response with reversed text
  - Return 400 error for invalid input
- Task 2.3: Create string reversal service in src/services/reverseService.ts
  - Implement reverse function
  - Handle edge cases (empty string, special characters, unicode)
- Task 2.4: Add CORS configuration for Flutter frontend
- Task 2.5: Implement error handling middleware
  - Standardize error responses
  - Log errors appropriately

### Step 3: Testing & Documentation
- Task 3.1: Write unit tests for reversal service
- Task 3.2: Test API endpoint with various inputs
  - Test max length validation
  - Test error cases
- Task 3.3: Create API documentation in README.md
- Task 3.4: Performance testing (ensure < 500ms response time)

## Module 2: Frontend Development
**Owner**: Charlie (Frontend analyst/programmer)
**Technology**: Flutter, BLoC, Domain-Driven Design

### Step 1: Project Setup
- Task 1.1: Create Flutter web project
  - flutter create frontend --platforms=web
- Task 1.2: Add dependencies to pubspec.yaml
  - bloc: ^8.1.0
  - flutter_bloc: ^8.1.0
  - equatable: ^2.0.5
  - http: ^1.1.0
- Task 1.3: Set up project structure following DDD

### Step 2: Domain Layer
- Task 2.1: Create TextResult entity in lib/domain/entities/text_result.dart
  - Define properties: original text, reversed text, timestamp
- Task 2.2: Define TextRepository interface in lib/domain/repositories/text_repository.dart
  - Define method: Future<String> reverseText(String text)

### Step 3: Data Layer
- Task 3.1: Implement API client in lib/data/datasources/api_client.dart
  - Configure base URL
  - Implement POST request to /question endpoint
  - Handle network errors and timeouts
- Task 3.2: Implement TextRepository in lib/data/repositories/text_repository_impl.dart
  - Use API client to make requests
  - Map errors to user-friendly messages

### Step 4: Presentation Layer
- Task 4.1: Create BLoC components
  - text_event.dart: Define TextSubmitted, TextChanged events
  - text_state.dart: Define TextInitial, TextLoading, TextSuccess, TextFailure, TextValidation states
  - text_bloc.dart: Handle events and emit states, implement validation logic
- Task 4.2: Build UI components in lib/presentation/pages/home_page.dart
  - Text input field with 100 character limit
  - Character counter display (e.g., "87/100")
  - Send button (disabled when empty or loading)
  - Results list display with animations
  - Loading spinner
  - Error message display
- Task 4.3: Connect UI to BLoC
  - Wrap with BlocProvider
  - Use BlocBuilder for state management
  - Handle all states appropriately

### Step 5: Testing & Polish
- Task 5.1: Write widget tests for UI components
  - Test character limit enforcement
  - Test error message display
  - Test loading states
- Task 5.2: Test BLoC logic with bloc_test
  - Test validation logic
  - Test error handling
- Task 5.3: Polish UI with Cupertino styling and icons
  - Implement smooth animations
  - Ensure responsive design

## Integration Testing
**Owner**: PMA (Project Manager/Architect)
- Ensure frontend connects to backend successfully
- Test complete user flow with various inputs
- Verify all error scenarios
- Confirm performance requirements are met
- Test character limit validation end-to-end