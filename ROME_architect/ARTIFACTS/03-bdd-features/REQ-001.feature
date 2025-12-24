Feature: Create project
  As a ProjectManager
  I want to create project
  So that project saved to database with unique id

  Scenario: Successfully create project
    Given projectManager authenticated
    And projectManager has active subscription
    When I create a project
    Then project status set to 'active'
    And projectManager assigned as project owner
    And audit log entry created
    And project saved to database with unique ID
    And projectManager receives confirmation notification
    And project appears in ProjectManager's project list

  Scenario: Error: If project name already exists
    Given projectManager authenticated
    And projectManager has active subscription
    And If project name already exists
    When I create a project
    Then Project name already exists in your organization

  Scenario: Error: If subscription inactive
    Given projectManager authenticated
    And projectManager has active subscription
    And If subscription inactive
    When I create a project
    Then Active subscription required to create projects

