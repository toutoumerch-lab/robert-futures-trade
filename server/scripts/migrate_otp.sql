-- Run this once against roberts_trades_db to add OTP columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verification_code         VARCHAR(6),
  ADD COLUMN IF NOT EXISTS verification_code_expires TIMESTAMP;
