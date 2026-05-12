-- Add phone verification fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Prevent duplicate verified phone numbers
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_verified
  ON users (phone)
  WHERE phone IS NOT NULL AND phone_verified = TRUE;
