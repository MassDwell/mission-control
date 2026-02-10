-- Mission Control Schema Migration: Autonomy Pillars
-- Based on Vox's 5 Pillars of Autonomy architecture
-- Created: 2026-02-10

-- ============================================
-- PILLAR 1: CENTRALIZED PROPOSAL SERVICE
-- ============================================

-- Task proposals (pending approval queue)
CREATE TABLE IF NOT EXISTS task_proposals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  proposed_by TEXT REFERENCES agents(id) ON DELETE SET NULL,
  assigned_to TEXT REFERENCES agents(id) ON DELETE SET NULL,
  project TEXT REFERENCES projects(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  rejection_reason TEXT,
  auto_approve_eligible BOOLEAN DEFAULT true,
  source TEXT DEFAULT 'agent', -- agent, api, trigger, reaction
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

-- ============================================
-- PILLAR 2: CAP GATES (QUOTA MANAGEMENT)
-- ============================================

-- Add quota tracking to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS daily_task_limit INTEGER DEFAULT 5;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS daily_tasks_created INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_quota_reset TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- PILLAR 3: POLICY-DRIVEN CONFIG
-- ============================================

-- Policy table (configuration as data)
CREATE TABLE IF NOT EXISTS policy (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL, -- 'approval', 'quotas', 'thresholds', 'permissions'
  name TEXT NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default policies
INSERT INTO policy (id, category, name, value, description) VALUES
  ('pol_auto_approve', 'approval', 'auto_approve_rules', '{
    "enabled": true,
    "allowed_priorities": ["low", "medium"],
    "allowed_sources": ["agent"],
    "require_description": false,
    "max_auto_approve_per_day": 10
  }'::jsonb, 'Rules for automatic proposal approval'),
  
  ('pol_quotas', 'quotas', 'agent_quotas', '{
    "default_daily_limit": 5,
    "lead_daily_limit": 10,
    "specialist_daily_limit": 5,
    "intern_daily_limit": 3
  }'::jsonb, 'Daily task creation limits by agent level'),
  
  ('pol_stale', 'thresholds', 'stale_task_rules', '{
    "stale_threshold_minutes": 30,
    "auto_fail_enabled": true,
    "notify_on_stale": true
  }'::jsonb, 'Rules for detecting and handling stale tasks'),
  
  ('pol_permissions', 'permissions', 'agent_permissions', '{
    "lead": {"can_approve": true, "can_reject": true, "can_create_urgent": true},
    "specialist": {"can_approve": false, "can_reject": false, "can_create_urgent": false},
    "intern": {"can_approve": false, "can_reject": false, "can_create_urgent": false}
  }'::jsonb, 'Permission matrix by agent level')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PILLAR 5: SELF-HEALING (Stale Task Recovery)
-- ============================================

-- Add tracking columns to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS stale_count INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS auto_failed BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- ============================================
-- INTER-AGENT REACTIONS QUEUE
-- ============================================

-- Agent reactions (inter-agent messaging)
CREATE TABLE IF NOT EXISTS agent_reactions (
  id TEXT PRIMARY KEY,
  from_agent TEXT REFERENCES agents(id) ON DELETE SET NULL,
  to_agent TEXT REFERENCES agents(id) ON DELETE SET NULL,
  reaction_type TEXT NOT NULL, -- 'task_request', 'handoff', 'escalation', 'info'
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'expired')),
  related_task TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_proposals_status ON task_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_assigned ON task_proposals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_proposals_created ON task_proposals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policy_category ON policy(category);
CREATE INDEX IF NOT EXISTS idx_reactions_to_agent ON agent_reactions(to_agent);
CREATE INDEX IF NOT EXISTS idx_reactions_status ON agent_reactions(status);
CREATE INDEX IF NOT EXISTS idx_tasks_stale ON tasks(status, last_activity_at) 
  WHERE status = 'in_progress';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE task_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_reactions ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read proposals" ON task_proposals FOR SELECT USING (true);
CREATE POLICY "Public read policy" ON policy FOR SELECT USING (true);
CREATE POLICY "Public read reactions" ON agent_reactions FOR SELECT USING (true);

-- Service role write policies
CREATE POLICY "Service write proposals" ON task_proposals FOR ALL USING (
  auth.role() = 'service_role' OR auth.role() = 'authenticated'
);
CREATE POLICY "Service write policy" ON policy FOR ALL USING (
  auth.role() = 'service_role' OR auth.role() = 'authenticated'
);
CREATE POLICY "Service write reactions" ON agent_reactions FOR ALL USING (
  auth.role() = 'service_role' OR auth.role() = 'authenticated'
);

-- ============================================
-- REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE task_proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_reactions;

-- ============================================
-- FUNCTIONS: Auto-Reset Daily Quotas
-- ============================================

-- This would typically be a cron job, but we can track via policy
CREATE OR REPLACE FUNCTION reset_daily_quotas()
RETURNS void AS $$
BEGIN
  UPDATE agents 
  SET daily_tasks_created = 0, 
      last_quota_reset = NOW()
  WHERE last_quota_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
