# ROME Methodology Glossary

## Core Concepts

**Application develpment** -  

**ROME (Robot Methodology)** - A systematic approach to software development using defined roles, protocols, and structured task management.

**Project Manager/Architect (PMA)** - The central role responsible for overseeing and coordinating resources and tasks to meet system specifications. This role analyzes requirements, creates task lists, 
and manages robot developers.

**Robot Developer** - A specialized AI agent who performs tasks and instructions according to the ROME protocol. They are specialized code generators allocated specific modules to design and develop by addressing the assigned task lists and protocols to complete development.

**Robot** - Informal term for Robot Developer. A Claude Code session that collaborates with other Claude Code sessions and resources. Robot creation and assignments are normally supervised by the PMA.

## Project Structure

**Module** - A major component of the project dev process that groups related functionality in such way as they are naturally discrete and so can be naturally isolated enabling it development and testing
a single process that minimises any
overlap of file modification or state with another module. 
Each module has an owner (robot developer or rodeo) and contains multiple steps with sub-tasks.
A module comprises of sufficient functionality to made an integration test understandable with the context of the business use-case. A module may have its own dependencies and use extenal libraries
particuar to fufilling the business need.

**Step** - A significant phase within a module that represents a logical grouping of related tasks.

**Task** - The smallest unit of work within a step. Tasks are executed sequentially by the assigned robot developer.

**Task List** - Broken down as a tree stucture  Project(root) → Modules → Steps → Tasks.

## Roles

**Rodeo** - A robot developer who is assigned roles focused on user interface development and client-side functionality.

 

**Module Owner** - The Rodeo assigned responsibility for completing the steps and their tasks within a specific module.

## Documents

**Requirements Specification** - Document detailing the business requirements, technical specifications, UI designs, and platform-specific concerns.

**Design Task List** - Document explaining how to create task lists and the hierarchy of modules, steps, and tasks.

**Robot Roles** - Document defining specific robot developer roles, their conformance to ROME, and any particular assignments.

**Robot Action Protocols** - Document outlining the standard procedures robots must follow when executing tasks.

**Project Activity Status Template** - Template for tracking current project status and robot activities.

**Project Tasks Log Template** - Template for logging task execution, including start/end times and issues.

## Technical Terms

**Domain-Driven Design** - The architectural approach used in ROME projects to structure code around business domains.

**BLoC (Business Logic Component)** - State management pattern used in Flutter frontend development.

**Cupertino** - iOS-style UI components used in Flutter applications.

**Equatable** - Dart package for value equality comparisons in Flutter applications.

## Process Terms

**Task Execution Process** - The standard 7-step process robots follow: Review → Log Start → Execute → Test → Log Completion → Update Status → Proceed.

**Task States** - The status of a task: pending, in_progress, or completed.

**Blockers** - Issues or dependencies that prevent a robot from completing assigned tasks.

**Dependencies** - External requirements or other tasks that must be completed before a task can proceed.

## Acronyms

**PMA** - Project Manager/Architect
**HTTP** - HyperText Transfer Protocol
**URL** - Uniform Resource Locator
**POST** - HTTP method for sending data to a server
**API** - Application Programming Interface

## File References

**ac_tasklist.md** - Refers to the active/assigned task list for a specific module (now standardized as design_task_list.md).

**project_tasks.log** - The active log file created from project_tasks_log.template.txt.