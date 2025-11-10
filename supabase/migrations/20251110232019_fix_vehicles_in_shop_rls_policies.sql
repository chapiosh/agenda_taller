/*
  # Fix RLS policies for vehicles_in_shop table

  1. Changes
    - Drop existing restrictive policies that require authentication
    - Create new public access policies for all operations
    
  2. Security
    - Allow public access suitable for internal shop use
    - Consistent with appointments table policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all vehicles in shop" ON vehicles_in_shop;
DROP POLICY IF EXISTS "Users can insert vehicles in shop" ON vehicles_in_shop;
DROP POLICY IF EXISTS "Users can update vehicles in shop" ON vehicles_in_shop;
DROP POLICY IF EXISTS "Users can delete vehicles in shop" ON vehicles_in_shop;

-- Create public access policies
CREATE POLICY "Anyone can view vehicles in shop"
  ON vehicles_in_shop
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert vehicles in shop"
  ON vehicles_in_shop
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update vehicles in shop"
  ON vehicles_in_shop
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete vehicles in shop"
  ON vehicles_in_shop
  FOR DELETE
  USING (true);
