-- Migration: Add JSONB indexes for fast Bale/Telegram chat ID lookups
-- Purpose: Optimize performance for webhook message processing
-- These indexes allow O(log n) lookup of users by bale_chat_id or telegram_chat_id
-- Without indexes, every message would require a full table scan

-- GIN index for bale_chat_id lookup (JSONB field)
-- This index is used when looking up users by: profile->>'bale_chat_id' = $1
CREATE INDEX IF NOT EXISTS idx_users_profile_bale_chat_id
  ON users
  USING gin((profile->'bale_chat_id'));

COMMENT ON INDEX idx_users_profile_bale_chat_id IS
  'GIN index for fast JSONB lookups of bale_chat_id in user profiles. Used for Bale bot webhook message processing.';

-- GIN index for telegram_chat_id lookup (JSONB field, for future Telegram integration)
-- This index is used when looking up users by: profile->>'telegram_chat_id' = $1
CREATE INDEX IF NOT EXISTS idx_users_profile_telegram_chat_id
  ON users
  USING gin((profile->'telegram_chat_id'));

COMMENT ON INDEX idx_users_profile_telegram_chat_id IS
  'GIN index for fast JSONB lookups of telegram_chat_id in user profiles. Reserved for future Telegram bot integration.';

-- Compound index for finding bot tokens and chat IDs together
-- This can help with queries that need both the chat_id and the bot token
CREATE INDEX IF NOT EXISTS idx_users_school_id_role_bale_key
  ON users(school_id, role)
  WHERE profile->>'bale_api_key' IS NOT NULL
    AND is_active = true;

COMMENT ON INDEX idx_users_school_id_role_bale_key IS
  'Partial index for fast lookup of active principals with bale_api_key in their profile. Optimizes getBotTokenForSchool() query.';
