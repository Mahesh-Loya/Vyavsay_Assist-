-- 005-voice-calls.sql
-- Voice call tracking for Vapi integration

-- Voice call records
CREATE TABLE IF NOT EXISTS wb_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES wb_users(id),
  vapi_call_id VARCHAR(255),
  provider VARCHAR(50) DEFAULT 'vapi',
  direction VARCHAR(10) NOT NULL DEFAULT 'inbound',
  from_number VARCHAR(20),
  to_number VARCHAR(20),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'ringing',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_sec INTEGER,
  transcript TEXT,
  summary TEXT,
  outcome VARCHAR(50),
  sentiment VARCHAR(20),
  recording_url TEXT,
  conversation_id UUID REFERENCES wb_conversations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Actions taken during a call
CREATE TABLE IF NOT EXISTS wb_call_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES wb_calls(id) ON DELETE CASCADE,
  action_name VARCHAR(100) NOT NULL,
  action_args JSONB,
  action_result JSONB,
  success BOOLEAN DEFAULT true,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wb_calls_user ON wb_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_wb_calls_vapi ON wb_calls(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_wb_calls_customer ON wb_calls(customer_phone);
CREATE INDEX IF NOT EXISTS idx_wb_calls_status ON wb_calls(user_id, status);
CREATE INDEX IF NOT EXISTS idx_wb_call_actions_call ON wb_call_actions(call_id);

-- Unique constraint for upsert on vapi_call_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_wb_calls_vapi_unique ON wb_calls(vapi_call_id) WHERE vapi_call_id IS NOT NULL;
