CREATE DATABASE IF NOT EXISTS propintel
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE propintel;

CREATE TABLE IF NOT EXISTS leads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  location VARCHAR(160) NOT NULL,
  property_requirement VARCHAR(160) NOT NULL,
  budget_min DECIMAL(15, 2) NULL,
  budget_max DECIMAL(15, 2) NULL,
  buying_timeline VARCHAR(80) NOT NULL,
  customer_message TEXT NOT NULL,
  status ENUM('new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'won', 'lost')
    NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_leads_status_created (status, created_at),
  INDEX idx_leads_location (location),
  CONSTRAINT chk_leads_budget_range
    CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS lead_analyses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lead_id BIGINT UNSIGNED NOT NULL,
  summary TEXT NOT NULL,
  customer_intent VARCHAR(500) NOT NULL,
  key_requirements JSON NOT NULL,
  objections JSON NOT NULL,
  recommended_action TEXT NOT NULL,
  suggested_response TEXT NOT NULL,
  lead_score TINYINT UNSIGNED NOT NULL,
  priority ENUM('hot', 'warm', 'cold') NOT NULL,
  score_breakdown JSON NOT NULL,
  model_name VARCHAR(120) NOT NULL,
  analysis_version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_analyses_lead_created (lead_id, created_at),
  CONSTRAINT fk_analyses_lead
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  CONSTRAINT chk_analysis_score CHECK (lead_score <= 100)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lead_id BIGINT UNSIGNED NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_conversations_lead_created (lead_id, created_at),
  CONSTRAINT fk_conversations_lead
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS follow_up_tasks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lead_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  due_at DATETIME NULL,
  status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  PRIMARY KEY (id),
  INDEX idx_tasks_status_due (status, due_at),
  INDEX idx_tasks_lead_created (lead_id, created_at),
  CONSTRAINT fk_tasks_lead
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS lead_activities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lead_id BIGINT UNSIGNED NOT NULL,
  activity_type VARCHAR(60) NOT NULL,
  description VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_activities_lead_created (lead_id, created_at),
  CONSTRAINT fk_activities_lead
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
) ENGINE=InnoDB;
