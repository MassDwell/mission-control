-- Mission Control Schema Migration
-- Phase 2 Implementation
-- Created: 2026-02-09

-- ============================================
-- TABLES
-- ============================================

-- PROJECTS (reference table)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AGENTS (reference table)
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT,
  role TEXT,
  level TEXT CHECK (level IN ('lead', 'specialist', 'intern')),
  status TEXT DEFAULT 'idle',
  current_task TEXT,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TASKS (high write)
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'backlog' CHECK (status IN ('backlog', 'in_progress', 'review', 'done', 'permanent', 'cancelled')),
  project TEXT REFERENCES projects(id) ON DELETE SET NULL,
  assignee TEXT REFERENCES agents(id) ON DELETE SET NULL,
  assignees TEXT[],
  tags TEXT[],
  subtasks JSONB DEFAULT '[]'::jsonb,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  dod TEXT,
  comments JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  due_date TIMESTAMPTZ,
  recurring JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- ACTIVITY (append-only log)
CREATE TABLE IF NOT EXISTS activity (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  agent TEXT REFERENCES agents(id) ON DELETE SET NULL,
  agent_emoji TEXT,
  message TEXT NOT NULL,
  task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_task ON activity(task_id);
CREATE INDEX IF NOT EXISTS idx_agents_level ON agents(level);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;

-- Public read policies
DROP POLICY IF EXISTS "Public read projects" ON projects;
CREATE POLICY "Public read projects" ON projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read agents" ON agents;
CREATE POLICY "Public read agents" ON agents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read tasks" ON tasks;
CREATE POLICY "Public read tasks" ON tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read activity" ON activity;
CREATE POLICY "Public read activity" ON activity FOR SELECT USING (true);

-- Service role write policies (agents + admin)
DROP POLICY IF EXISTS "Service write projects" ON projects;
CREATE POLICY "Service write projects" ON projects FOR ALL USING (
  auth.role() = 'service_role' OR auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Service write agents" ON agents;
CREATE POLICY "Service write agents" ON agents FOR ALL USING (
  auth.role() = 'service_role' OR auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Service write tasks" ON tasks;
CREATE POLICY "Service write tasks" ON tasks FOR ALL USING (
  auth.role() = 'service_role' OR auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Service write activity" ON activity;
CREATE POLICY "Service write activity" ON activity FOR ALL USING (
  auth.role() = 'service_role' OR auth.role() = 'authenticated'
);

-- ============================================
-- REALTIME (enable for live updates)
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE activity;
