CREATE TABLE task (
  id UUID PRIMARY KEY,
  status VARCHAR(50) NOT NULL,
  creator UUID,
  title VARCHAR(255) NOT NULL,
  assignee UUID,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  owner UUID,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team_member (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner UUID,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE webhook (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE api_token (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comment (
  id UUID PRIMARY KEY,
  time TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attachment (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytic (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_status ON task (status);
CREATE INDEX idx_task_created_at ON task (created_at);

CREATE INDEX idx_project_status ON project (status);
CREATE INDEX idx_project_owner ON project (owner);
CREATE INDEX idx_project_created_at ON project (created_at);

CREATE INDEX idx_team_member_created_at ON team_member (created_at);

CREATE INDEX idx_team_owner ON team (owner);
CREATE INDEX idx_team_created_at ON team (created_at);

CREATE INDEX idx_webhook_created_at ON webhook (created_at);

CREATE INDEX idx_api_token_created_at ON api_token (created_at);

CREATE INDEX idx_comment_created_at ON comment (created_at);

CREATE INDEX idx_attachment_created_at ON attachment (created_at);

CREATE INDEX idx_analytic_created_at ON analytic (created_at);