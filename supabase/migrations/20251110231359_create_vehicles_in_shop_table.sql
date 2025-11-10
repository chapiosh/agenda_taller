/*
  # Create vehicles in shop table

  1. New Tables
    - `vehicles_in_shop`
      - `id` (uuid, primary key) - Unique identifier
      - `customer_name` (text) - Customer name
      - `vehicle` (text) - Vehicle description
      - `service` (text) - Service being performed
      - `contact` (text) - Contact information
      - `check_in_date` (timestamp) - When vehicle entered shop
      - `estimated_completion` (timestamp, optional) - Expected completion date
      - `notes` (text, optional) - Additional notes
      - `tags` (text array) - Status tags
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp
      
  2. Security
    - Enable RLS on `vehicles_in_shop` table
    - Add policies for authenticated users to manage vehicles

  3. Notes
    - Tracks vehicles currently in the shop
    - Uses timestamp without timezone for local time tracking
    - Includes tags for flexible status tracking
*/

-- Create vehicles_in_shop table
CREATE TABLE IF NOT EXISTS vehicles_in_shop (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  vehicle text NOT NULL,
  service text NOT NULL,
  contact text NOT NULL,
  check_in_date timestamp NOT NULL DEFAULT now(),
  estimated_completion timestamp,
  notes text DEFAULT '',
  tags text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vehicles_in_shop ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can view all vehicles in shop"
  ON vehicles_in_shop FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert vehicles in shop"
  ON vehicles_in_shop FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update vehicles in shop"
  ON vehicles_in_shop FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete vehicles in shop"
  ON vehicles_in_shop FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_vehicles_in_shop_check_in_date ON vehicles_in_shop(check_in_date DESC);
