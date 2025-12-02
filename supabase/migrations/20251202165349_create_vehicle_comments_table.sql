/*
  # Create vehicle_comments table

  1. New Tables
    - `vehicle_comments`
      - `id` (uuid, primary key)
      - `vehicle_id` (uuid, foreign key to vehicles_in_shop)
      - `comment` (text, not null)
      - `created_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on `vehicle_comments` table
    - Add policy for authenticated users to read comments
    - Add policy for authenticated users to create comments
  
  3. Notes
    - Comments are linked to vehicles and stored with timestamp
    - Used to track service progress and notes over time
*/

CREATE TABLE IF NOT EXISTS vehicle_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles_in_shop(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments"
  ON vehicle_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create comments"
  ON vehicle_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);