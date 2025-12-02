/*
  # Fix vehicle comments RLS policies

  1. Security Changes
    - Drop existing restrictive policies
    - Add permissive policies for unauthenticated access
    - Allow anyone to read and create comments without authentication
  
  2. Notes
    - This allows the application to work without authentication
    - Comments are public and can be managed by any user
*/

DROP POLICY IF EXISTS "Anyone can read comments" ON vehicle_comments;
DROP POLICY IF EXISTS "Anyone can create comments" ON vehicle_comments;

CREATE POLICY "Anyone can read comments"
  ON vehicle_comments FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create comments"
  ON vehicle_comments FOR INSERT
  WITH CHECK (true);