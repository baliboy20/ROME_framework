-- Database Schema
-- Generated: 2025-12-24T12:05:33.264Z
-- Database: POSTGRESQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: Audit
CREATE TABLE audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_audit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_updated_at
    BEFORE UPDATE ON audit
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_updated_at();

-- Table: Task
CREATE TABLE task (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
     TEXT,
     TEXT,
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_task_updated_at
    BEFORE UPDATE ON task
    FOR EACH ROW
    EXECUTE FUNCTION update_task_updated_at();

-- Table: Project
CREATE TABLE project (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
     TEXT,
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_project_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_project_updated_at
    BEFORE UPDATE ON project
    FOR EACH ROW
    EXECUTE FUNCTION update_project_updated_at();

-- Table: ProjectManager
CREATE TABLE project_manager (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_project_manager_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_project_manager_updated_at
    BEFORE UPDATE ON project_manager
    FOR EACH ROW
    EXECUTE FUNCTION update_project_manager_updated_at();

-- Table: Manager
CREATE TABLE manager (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_manager_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_manager_updated_at
    BEFORE UPDATE ON manager
    FOR EACH ROW
    EXECUTE FUNCTION update_manager_updated_at();

-- Table: Notification
CREATE TABLE notification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_updated_at
    BEFORE UPDATE ON notification
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

-- Table: TeamMember
CREATE TABLE team_member (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_team_member_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_team_member_updated_at
    BEFORE UPDATE ON team_member
    FOR EACH ROW
    EXECUTE FUNCTION update_team_member_updated_at();

-- Table: Member
CREATE TABLE member (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_member_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_member_updated_at
    BEFORE UPDATE ON member
    FOR EACH ROW
    EXECUTE FUNCTION update_member_updated_at();

-- Table: Role
CREATE TABLE role (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_role_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_role_updated_at
    BEFORE UPDATE ON role
    FOR EACH ROW
    EXECUTE FUNCTION update_role_updated_at();

-- Table: Permission
CREATE TABLE permission (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_permission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_permission_updated_at
    BEFORE UPDATE ON permission
    FOR EACH ROW
    EXECUTE FUNCTION update_permission_updated_at();

-- Table: Organization
CREATE TABLE organization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_organization_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_organization_updated_at
    BEFORE UPDATE ON organization
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_updated_at();

-- Table: Created
CREATE TABLE created (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_created_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_created_updated_at
    BEFORE UPDATE ON created
    FOR EACH ROW
    EXECUTE FUNCTION update_created_updated_at();

-- Table: Team
CREATE TABLE team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_team_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_team_updated_at
    BEFORE UPDATE ON team
    FOR EACH ROW
    EXECUTE FUNCTION update_team_updated_at();

-- Table: Administrator
CREATE TABLE administrator (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_administrator_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_administrator_updated_at
    BEFORE UPDATE ON administrator
    FOR EACH ROW
    EXECUTE FUNCTION update_administrator_updated_at();

-- Table: Due
CREATE TABLE due (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_due_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_due_updated_at
    BEFORE UPDATE ON due
    FOR EACH ROW
    EXECUTE FUNCTION update_due_updated_at();

-- Table: SystemIntegrator
CREATE TABLE system_integrator (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_system_integrator_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_system_integrator_updated_at
    BEFORE UPDATE ON system_integrator
    FOR EACH ROW
    EXECUTE FUNCTION update_system_integrator_updated_at();

-- Table: Integrator
CREATE TABLE integrator (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_integrator_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_integrator_updated_at
    BEFORE UPDATE ON integrator
    FOR EACH ROW
    EXECUTE FUNCTION update_integrator_updated_at();

-- Table: Token
CREATE TABLE token (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_token_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_token_updated_at
    BEFORE UPDATE ON token
    FOR EACH ROW
    EXECUTE FUNCTION update_token_updated_at();

-- Table: Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_tasks_updated_at();

-- Table: Webhook
CREATE TABLE webhook (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_webhook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_webhook_updated_at
    BEFORE UPDATE ON webhook
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_updated_at();

-- Table: Current
CREATE TABLE current (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_current_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_current_updated_at
    BEFORE UPDATE ON current
    FOR EACH ROW
    EXECUTE FUNCTION update_current_updated_at();

-- Table: Related
CREATE TABLE related (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_related_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_related_updated_at
    BEFORE UPDATE ON related
    FOR EACH ROW
    EXECUTE FUNCTION update_related_updated_at();

-- Table: Deletion
CREATE TABLE deletion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_deletion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deletion_updated_at
    BEFORE UPDATE ON deletion
    FOR EACH ROW
    EXECUTE FUNCTION update_deletion_updated_at();

-- Table: Results
CREATE TABLE results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_results_updated_at
    BEFORE UPDATE ON results
    FOR EACH ROW
    EXECUTE FUNCTION update_results_updated_at();

-- Table: User
CREATE TABLE user (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_updated_at
    BEFORE UPDATE ON user
    FOR EACH ROW
    EXECUTE FUNCTION update_user_updated_at();

-- Table: Submission
CREATE TABLE submission (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_submission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_submission_updated_at
    BEFORE UPDATE ON submission
    FOR EACH ROW
    EXECUTE FUNCTION update_submission_updated_at();

-- Table: ApiToken
CREATE TABLE api_token (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_api_token_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_api_token_updated_at
    BEFORE UPDATE ON api_token
    FOR EACH ROW
    EXECUTE FUNCTION update_api_token_updated_at();

-- Table: Event
CREATE TABLE event (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_event_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_event_updated_at
    BEFORE UPDATE ON event
    FOR EACH ROW
    EXECUTE FUNCTION update_event_updated_at();

-- Table: Test
CREATE TABLE test (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_test_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_test_updated_at
    BEFORE UPDATE ON test
    FOR EACH ROW
    EXECUTE FUNCTION update_test_updated_at();

-- Table: Assignee
CREATE TABLE assignee (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_assignee_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assignee_updated_at
    BEFORE UPDATE ON assignee
    FOR EACH ROW
    EXECUTE FUNCTION update_assignee_updated_at();

-- Table: Priority
CREATE TABLE priority (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_priority_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_priority_updated_at
    BEFORE UPDATE ON priority
    FOR EACH ROW
    EXECUTE FUNCTION update_priority_updated_at();

-- Table: Completed
CREATE TABLE completed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_completed_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_completed_updated_at
    BEFORE UPDATE ON completed
    FOR EACH ROW
    EXECUTE FUNCTION update_completed_updated_at();

-- Table: Last
CREATE TABLE last (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_last_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_last_updated_at
    BEFORE UPDATE ON last
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_at();

-- Table: View
CREATE TABLE view (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_view_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_view_updated_at
    BEFORE UPDATE ON view
    FOR EACH ROW
    EXECUTE FUNCTION update_view_updated_at();

-- Table: Search
CREATE TABLE search (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_search_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_search_updated_at
    BEFORE UPDATE ON search
    FOR EACH ROW
    EXECUTE FUNCTION update_search_updated_at();

-- Table: Deleted
CREATE TABLE deleted (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_deleted_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deleted_updated_at
    BEFORE UPDATE ON deleted
    FOR EACH ROW
    EXECUTE FUNCTION update_deleted_updated_at();

-- Table: Comment
CREATE TABLE comment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_updated_at
    BEFORE UPDATE ON comment
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_updated_at();

-- Table: Attachment
CREATE TABLE attachment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_attachment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_attachment_updated_at
    BEFORE UPDATE ON attachment
    FOR EACH ROW
    EXECUTE FUNCTION update_attachment_updated_at();

-- Table: File
CREATE TABLE file (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_file_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_file_updated_at
    BEFORE UPDATE ON file
    FOR EACH ROW
    EXECUTE FUNCTION update_file_updated_at();

-- Table: Fs
CREATE TABLE fs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_fs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fs_updated_at
    BEFORE UPDATE ON fs
    FOR EACH ROW
    EXECUTE FUNCTION update_fs_updated_at();

-- Table: Filename
CREATE TABLE filename (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_filename_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_filename_updated_at
    BEFORE UPDATE ON filename
    FOR EACH ROW
    EXECUTE FUNCTION update_filename_updated_at();

-- Table: Upload
CREATE TABLE upload (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_upload_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_upload_updated_at
    BEFORE UPDATE ON upload
    FOR EACH ROW
    EXECUTE FUNCTION update_upload_updated_at();

-- Table: Completion
CREATE TABLE completion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_completion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_completion_updated_at
    BEFORE UPDATE ON completion
    FOR EACH ROW
    EXECUTE FUNCTION update_completion_updated_at();

-- Table: Rejection
CREATE TABLE rejection (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_rejection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rejection_updated_at
    BEFORE UPDATE ON rejection
    FOR EACH ROW
    EXECUTE FUNCTION update_rejection_updated_at();

-- Table: Rejected
CREATE TABLE rejected (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_rejected_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rejected_updated_at
    BEFORE UPDATE ON rejected
    FOR EACH ROW
    EXECUTE FUNCTION update_rejected_updated_at();

-- Table: Export
CREATE TABLE export (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_export_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_export_updated_at
    BEFORE UPDATE ON export
    FOR EACH ROW
    EXECUTE FUNCTION update_export_updated_at();

-- Table: Import
CREATE TABLE import (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_import_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_import_updated_at
    BEFORE UPDATE ON import
    FOR EACH ROW
    EXECUTE FUNCTION update_import_updated_at();

-- Table: Duplicate
CREATE TABLE duplicate (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_duplicate_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_duplicate_updated_at
    BEFORE UPDATE ON duplicate
    FOR EACH ROW
    EXECUTE FUNCTION update_duplicate_updated_at();

-- Table: Archived
CREATE TABLE archived (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_archived_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_archived_updated_at
    BEFORE UPDATE ON archived
    FOR EACH ROW
    EXECUTE FUNCTION update_archived_updated_at();

-- Table: Archive
CREATE TABLE archive (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_archive_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_archive_updated_at
    BEFORE UPDATE ON archive
    FOR EACH ROW
    EXECUTE FUNCTION update_archive_updated_at();

-- Table: Restore
CREATE TABLE restore (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_restore_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_restore_updated_at
    BEFORE UPDATE ON restore
    FOR EACH ROW
    EXECUTE FUNCTION update_restore_updated_at();

-- Table: Analytic
CREATE TABLE analytic (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_analytic_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_analytic_updated_at
    BEFORE UPDATE ON analytic
    FOR EACH ROW
    EXECUTE FUNCTION update_analytic_updated_at();

-- Table: Metrics
CREATE TABLE metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_metrics_updated_at
    BEFORE UPDATE ON metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_metrics_updated_at();

-- Table: Charts
CREATE TABLE charts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_charts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_charts_updated_at
    BEFORE UPDATE ON charts
    FOR EACH ROW
    EXECUTE FUNCTION update_charts_updated_at();

-- Table: NonDeleted
CREATE TABLE non_deleted (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_non_deleted_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_non_deleted_updated_at
    BEFORE UPDATE ON non_deleted
    FOR EACH ROW
    EXECUTE FUNCTION update_non_deleted_updated_at();

-- Table: Analytics
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_analytics_updated_at
    BEFORE UPDATE ON analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_updated_at();

-- Table: UnRevoked
CREATE TABLE un_revoked (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_un_revoked_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_un_revoked_updated_at
    BEFORE UPDATE ON un_revoked
    FOR EACH ROW
    EXECUTE FUNCTION update_un_revoked_updated_at();

-- Table: Revocation
CREATE TABLE revocation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_revocation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_revocation_updated_at
    BEFORE UPDATE ON revocation
    FOR EACH ROW
    EXECUTE FUNCTION update_revocation_updated_at();

-- Table: Active
CREATE TABLE active (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_active_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_active_updated_at
    BEFORE UPDATE ON active
    FOR EACH ROW
    EXECUTE FUNCTION update_active_updated_at();

-- Table: Pending
CREATE TABLE pending (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_pending_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pending_updated_at
    BEFORE UPDATE ON pending
    FOR EACH ROW
    EXECUTE FUNCTION update_pending_updated_at();

-- Foreign Key Constraints
-- Indexes
CREATE INDEX idx_audit_deleted_at ON audit(deleted_at);
CREATE INDEX idx_task_deleted_at ON task(deleted_at);
CREATE INDEX idx_project_deleted_at ON project(deleted_at);
CREATE INDEX idx_project_manager_deleted_at ON project_manager(deleted_at);
CREATE INDEX idx_manager_deleted_at ON manager(deleted_at);
CREATE INDEX idx_notification_deleted_at ON notification(deleted_at);
CREATE INDEX idx_team_member_deleted_at ON team_member(deleted_at);
CREATE INDEX idx_member_deleted_at ON member(deleted_at);
CREATE INDEX idx_role_deleted_at ON role(deleted_at);
CREATE INDEX idx_permission_deleted_at ON permission(deleted_at);
CREATE INDEX idx_organization_deleted_at ON organization(deleted_at);
CREATE INDEX idx_created_deleted_at ON created(deleted_at);
CREATE INDEX idx_team_deleted_at ON team(deleted_at);
CREATE INDEX idx_administrator_deleted_at ON administrator(deleted_at);
CREATE INDEX idx_due_deleted_at ON due(deleted_at);
CREATE INDEX idx_system_integrator_deleted_at ON system_integrator(deleted_at);
CREATE INDEX idx_integrator_deleted_at ON integrator(deleted_at);
CREATE INDEX idx_token_deleted_at ON token(deleted_at);
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at);
CREATE INDEX idx_webhook_deleted_at ON webhook(deleted_at);
CREATE INDEX idx_current_deleted_at ON current(deleted_at);
CREATE INDEX idx_related_deleted_at ON related(deleted_at);
CREATE INDEX idx_deletion_deleted_at ON deletion(deleted_at);
CREATE INDEX idx_results_deleted_at ON results(deleted_at);
CREATE INDEX idx_user_deleted_at ON user(deleted_at);
CREATE INDEX idx_submission_deleted_at ON submission(deleted_at);
CREATE INDEX idx_api_token_deleted_at ON api_token(deleted_at);
CREATE INDEX idx_event_deleted_at ON event(deleted_at);
CREATE INDEX idx_test_deleted_at ON test(deleted_at);
CREATE INDEX idx_assignee_deleted_at ON assignee(deleted_at);
CREATE INDEX idx_priority_deleted_at ON priority(deleted_at);
CREATE INDEX idx_completed_deleted_at ON completed(deleted_at);
CREATE INDEX idx_last_deleted_at ON last(deleted_at);
CREATE INDEX idx_view_deleted_at ON view(deleted_at);
CREATE INDEX idx_search_deleted_at ON search(deleted_at);
CREATE INDEX idx_deleted_deleted_at ON deleted(deleted_at);
CREATE INDEX idx_comment_deleted_at ON comment(deleted_at);
CREATE INDEX idx_attachment_deleted_at ON attachment(deleted_at);
CREATE INDEX idx_file_deleted_at ON file(deleted_at);
CREATE INDEX idx_fs_deleted_at ON fs(deleted_at);
CREATE INDEX idx_filename_deleted_at ON filename(deleted_at);
CREATE INDEX idx_upload_deleted_at ON upload(deleted_at);
CREATE INDEX idx_completion_deleted_at ON completion(deleted_at);
CREATE INDEX idx_rejection_deleted_at ON rejection(deleted_at);
CREATE INDEX idx_rejected_deleted_at ON rejected(deleted_at);
CREATE INDEX idx_export_deleted_at ON export(deleted_at);
CREATE INDEX idx_import_deleted_at ON import(deleted_at);
CREATE INDEX idx_duplicate_deleted_at ON duplicate(deleted_at);
CREATE INDEX idx_archived_deleted_at ON archived(deleted_at);
CREATE INDEX idx_archive_deleted_at ON archive(deleted_at);
CREATE INDEX idx_restore_deleted_at ON restore(deleted_at);
CREATE INDEX idx_analytic_deleted_at ON analytic(deleted_at);
CREATE INDEX idx_metrics_deleted_at ON metrics(deleted_at);
CREATE INDEX idx_charts_deleted_at ON charts(deleted_at);
CREATE INDEX idx_non_deleted_deleted_at ON non_deleted(deleted_at);
CREATE INDEX idx_analytics_deleted_at ON analytics(deleted_at);
CREATE INDEX idx_un_revoked_deleted_at ON un_revoked(deleted_at);
CREATE INDEX idx_revocation_deleted_at ON revocation(deleted_at);
CREATE INDEX idx_active_deleted_at ON active(deleted_at);
CREATE INDEX idx_pending_deleted_at ON pending(deleted_at);

