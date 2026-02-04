-- Add initial_password column to users table
-- This column stores the encrypted initial password for teachers
-- so it can be retrieved for administrative purposes (like Excel export)

-- Add the column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS initial_password TEXT;

-- Add comment to explain the purpose
COMMENT ON COLUMN users.initial_password IS 'Encrypted initial password for the user (for administrative recovery)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_initial_password ON users(initial_password) WHERE initial_password IS NOT NULL;

-- Display confirmation
SELECT 'Migration completed: initial_password column added to users table' as message;
