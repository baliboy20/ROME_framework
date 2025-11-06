# Use Cases
**Project:** [Project Name]  
**Created:** [Date]  
**Last Updated:** [Date]

---

## Use Case Index

| ID | Use Case Name | Actor | Priority |
|----|---------------|-------|----------|
| UC-1 | [Use Case Name] | [Actor] | HIGH/MED/LOW |
| UC-2 | [Use Case Name] | [Actor] | HIGH/MED/LOW |
| UC-3 | [Use Case Name] | [Actor] | HIGH/MED/LOW |

---

## UC-1: [Use Case Name]

**Priority:** [HIGH / MEDIUM / LOW]  
**Status:** [Planned / In Development / Implemented / Tested]

### Basic Information

**Actor:** [Who performs this action? e.g., Authenticated User, Admin, System]  
**Goal:** [What does the actor want to achieve?]  
**Scope:** [What is included/excluded]

### Preconditions

List conditions that must be true before this use case can begin:
- [Precondition 1 - e.g., User is logged in]
- [Precondition 2 - e.g., User has required permissions]
- [Precondition 3 - e.g., Related entity exists]

**Example:**
```
- User is logged in
- User has 'create_project' permission
- User has not reached project limit (max 10 projects)
```

### Main Flow (Happy Path)

1. [Step 1 - Actor action]
2. [Step 2 - System response]
3. [Step 3 - Actor action]
4. [Step 4 - System response]
...
n. [Final step]

**Example:**
```
1. User clicks "New Project" button
2. System displays project creation form
3. User enters project name "My New Project"
4. User enters optional description "This is a test project"
5. User clicks "Create" button
6. System validates input (name required, unique per user)
7. System creates project with status 'draft'
8. System generates unique project ID
9. System saves project to database
10. System displays success message "Project created successfully"
11. System redirects user to project details page
```

### Alternate Flows

**Alternate Flow A: [Description - e.g., User cancels]**
- At step [X]: [What happens differently]
- Result: [Where does it end up]

**Example:**
```
Alternate Flow A: User cancels creation
- At step 5: User clicks "Cancel" button instead of "Create"
- System discards entered data
- System returns user to project list page
```

**Alternate Flow B: [Description]**
- At step [Y]: [What happens differently]
- Result: [Outcome]

### Exception Flows (Error Cases)

**Exception E1: [Error Type - e.g., Validation Error]**
- Condition: [When does this error occur?]
- System Response: [What does the system do?]
- User Recovery: [How can user recover?]

**Example:**
```
Exception E1: Empty Project Name
- Condition: User submits form with empty name field (at step 6)
- System Response: 
  - Does not create project
  - Displays error message: "Project name is required"
  - Highlights name field in red
- User Recovery: User enters valid name and resubmits

Exception E2: Duplicate Project Name
- Condition: User enters name that already exists for this user
- System Response:
  - Does not create project
  - Displays error: "You already have a project with this name"
- User Recovery: User enters different name

Exception E3: Project Limit Reached
- Condition: User tries to create 11th project (max is 10)
- System Response:
  - Does not create project
  - Displays error: "You have reached the maximum of 10 projects"
  - Suggests: "Please archive or delete existing projects"
- User Recovery: User archives/deletes old projects first

Exception E4: Server Error
- Condition: Database connection fails or server error occurs
- System Response:
  - Does not create project
  - Displays error: "Unable to create project. Please try again."
  - Logs error details for debugging
- User Recovery: User retries after a moment
```

### Postconditions (Success)

List conditions that are true after successful completion:
- [Postcondition 1 - e.g., Project exists in database]
- [Postcondition 2 - e.g., User sees confirmation]
- [Postcondition 3 - e.g., Related entities updated]

**Example:**
```
- Project exists in database with status 'draft'
- Project has unique ID (UUID)
- Project.created_at and updated_at timestamps set
- User sees success confirmation message
- User is on project details page
- Project appears in user's project list
```

### Validation Rules

**Input Validation:**
- [Field]: [Validation rule]

**Example:**
```
- name: Required, string, min 1 char, max 100 chars, trimmed
- description: Optional, string, max 1000 chars
- status: Auto-set to 'draft' (not user input)
```

**Business Rules:**
- [Rule description]

**Example:**
```
- Project name must be unique per user (not globally unique)
- Users can have max 10 projects total (active + draft + archived)
- Project name is case-insensitive for uniqueness check
```

### User Interface Notes

**Form Fields:**
- [Field name]: [Type, required/optional]

**Example:**
```
- Project Name: Text input, required, placeholder "Enter project name"
- Description: Textarea, optional, placeholder "Describe your project"
- Create Button: Disabled until name is entered
- Cancel Button: Always enabled
```

**Visual Feedback:**
- [User action] → [Visual response]

**Example:**
```
- Submit form → Show loading spinner on button
- Validation error → Highlight field in red, show error below field
- Success → Show green checkmark, display success message
- Network error → Show error icon, display retry option
```

### Related Use Cases

- **Depends on:** [UC-X: Use Case Name]
- **Leads to:** [UC-Y: Use Case Name]
- **Related:** [UC-Z: Use Case Name]

**Example:**
```
- Depends on: UC-0: User Login (must be logged in)
- Leads to: UC-2: View Project Details (redirects here after creation)
- Related: UC-5: Edit Project (similar form, different endpoint)
```

---

## UC-2: [Another Use Case Name]

[Repeat same structure as UC-1]

---

## System Workflows (Automated)

### SW-1: [System Workflow Name]

**Description:** [What automated process is this?]  
**Trigger:** [What causes this workflow to run?]  
**Frequency:** [How often does it run?]

**Steps:**
1. [System action]
2. [System action]
3. [System action]

**Example:**
```
SW-1: Daily Project Cleanup

Description: Automatically archive projects that have been inactive for 90+ days

Trigger: Cron job runs daily at 2:00 AM UTC

Steps:
1. System queries for projects where:
   - Last activity > 90 days ago
   - Status is 'active'
2. For each matching project:
   - Change status to 'archived'
   - Set archived_at timestamp
   - Send notification email to project owner
3. System logs number of projects archived
```

---

## Integration Scenarios

### IS-1: [Integration Name]

**External System:** [Name of external system]  
**Purpose:** [Why integrate?]  
**Direction:** [Inbound / Outbound / Bidirectional]

**Flow:**
1. [Integration step]
2. [Integration step]

**Error Handling:**
- [What happens if integration fails?]

**Example:**
```
IS-1: Email Notification Service

External System: SendGrid API
Purpose: Send email notifications for project events
Direction: Outbound (we send to SendGrid)

Flow:
1. User creates project (UC-1 success)
2. System generates email content
3. System calls SendGrid API with:
   - Recipient: project owner email
   - Subject: "Project Created: {project_name}"
   - Body: HTML template with project details
4. SendGrid sends email
5. SendGrid returns success/failure status
6. System logs email delivery status

Error Handling:
- If SendGrid API fails:
  - System logs error
  - System queues email for retry (max 3 attempts)
  - User still sees project creation success
  - Email sent asynchronously, doesn't block user
```

---

## Edge Cases

### EC-1: [Edge Case Description]

**Scenario:** [Describe unusual situation]  
**Expected Behavior:** [How should system handle it?]  
**Rationale:** [Why handle it this way?]

**Example:**
```
EC-1: Very Long Project Name

Scenario: User pastes 500-character text into name field
Expected Behavior: 
  - System truncates to 100 characters
  - Shows warning: "Name truncated to 100 characters"
  - Allows user to edit before submitting
Rationale: Graceful degradation instead of hard error

EC-2: Special Characters in Name

Scenario: User enters name with emojis, symbols: "Project 🚀 #1"
Expected Behavior:
  - System accepts Unicode characters
  - Sanitizes HTML/SQL injection attempts
  - Stores exactly as entered
Rationale: Support international users and expressiveness

EC-3: Concurrent Creation

Scenario: User clicks "Create" button twice rapidly
Expected Behavior:
  - First click: Creates project, disables button
  - Second click: Ignored (button disabled)
  - Only one project created
Rationale: Prevent duplicate submissions
```

---

## Change Log

| Date | Use Case | Change | Changed By |
|------|----------|--------|------------|
| 2025-10-07 | UC-1 | Initial creation | PMA |
| [Date] | [UC-X] | [Description] | [Who] |
