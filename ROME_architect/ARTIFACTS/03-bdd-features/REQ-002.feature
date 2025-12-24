Feature: Create task
  As a ProjectManager
  I want to create task
  So that task saved to database with unique id

  Scenario: Successfully create task
    Given projectManager authenticated
    And project exists and ProjectManager has write access
    When I create a task
    Then task status set to 'open'
    And task assigned to project
    And task creator recorded
    And notification sent to assignee if specified
    And task saved to database with unique ID
    And task appears in project task list
    And assignee receives notification if assigned

  Scenario: Error: If project not found
    Given projectManager authenticated
    And project exists and ProjectManager has write access
    And If project not found
    When I create a task
    Then Project does not exist

  Scenario: Error: If assignee not project member
    Given projectManager authenticated
    And project exists and ProjectManager has write access
    And If assignee not project member
    When I create a task
    Then Assignee must be a project team member

  Scenario: Error: If due date in past
    Given projectManager authenticated
    And project exists and ProjectManager has write access
    And If due date in past
    When I create a task
    Then Due date cannot be in the past

