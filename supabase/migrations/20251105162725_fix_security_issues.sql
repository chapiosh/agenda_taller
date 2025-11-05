/*
  # Fix security issues in appointments table

  1. Changes
    - Drop unused index `idx_appointments_status` (not used by queries)
    - Drop unused index `idx_appointments_tags` (not used by queries)
    - Fix search_path vulnerability in `update_updated_at_column` function
    
  2. Security
    - Recreate function with secure search_path to prevent potential SQL injection
    - Must drop and recreate trigger along with function
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_appointments_status;
DROP INDEX IF EXISTS idx_appointments_tags;

-- Drop the trigger first
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;

-- Drop the function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Recreate the function with a secure search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
