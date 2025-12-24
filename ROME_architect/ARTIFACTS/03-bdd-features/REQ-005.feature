Feature: Delete task
  As a ProjectManager
  I want to delete task
  So that task no longer appears in project task list

  Scenario: Successfully delete task
    Given projectManager authenticated
    And task exists
    And projectManager is project owner
    When I delete the task
    Then task marked as deleted (soft delete)
    And task removed from active task lists
    And audit log entry created
    And related comments and attachments retained
    And task no longer appears in project task list
    And task data retained in database (soft delete)
    And deletion audit trail created

  Scenario: Error: If ProjectManager not project owner
    Given projectManager authenticated
    And task exists
    And projectManager is project owner
    And If ProjectManager not project owner
    When I delete the task
    Then Only project owners can delete tasks

  Scenario: Error: If task already deleted
    Given projectManager authenticated
    And task exists
    And projectManager is project owner
    And If task already deleted
    When I delete the task
    Then Task has already been deleted

