/*
  # Create parts table for vehicle parts management

  1. New Tables
    - `parts`
      - `id` (uuid, primary key)
      - `vehicle_id` (uuid, foreign key to vehicles_in_shop)
      - `description` (text, required)
      - `oem_part_number` (text, optional)
      - `alternative_part_numbers` (text[], optional)
      - `supplier` (text, optional)
      - `supplier_quote` (numeric, optional)
      - `purchase_price` (numeric, optional)
      - `sell_price` (numeric, optional)
      - `status` (text, required)
      - `ordered_at` (timestamptz, optional)
      - `received_at` (timestamptz, optional)
      - `installed_at` (timestamptz, optional)
      - `notes` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `parts` table
    - Add policies for public access (matching vehicles_in_shop pattern)
  
  3. Constraints
    - Foreign key on vehicle_id references vehicles_in_shop(id) with CASCADE delete
    - Check constraints for valid status values
    - Check constraints for non-negative prices
*/

-- Create parts table
CREATE TABLE IF NOT EXISTS parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles_in_shop(id) ON DELETE CASCADE,
  description text NOT NULL,
  oem_part_number text,
  alternative_part_numbers text[],
  supplier text,
  supplier_quote numeric CHECK (supplier_quote >= 0),
  purchase_price numeric CHECK (purchase_price >= 0),
  sell_price numeric CHECK (sell_price >= 0),
  status text NOT NULL CHECK (status IN ('quoted', 'ordered', 'in_transit', 'received', 'installed', 'returned', 'canceled')),
  ordered_at timestamptz,
  received_at timestamptz,
  installed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create index on vehicle_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_parts_vehicle_id ON parts(vehicle_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_parts_status ON parts(status);

-- Enable RLS
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public access like vehicles_in_shop)
CREATE POLICY "Parts are viewable by everyone"
  ON parts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Parts can be created by everyone"
  ON parts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Parts can be updated by everyone"
  ON parts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Parts can be deleted by everyone"
  ON parts FOR DELETE
  TO anon
  USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_parts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_parts_updated_at
  BEFORE UPDATE ON parts
  FOR EACH ROW
  EXECUTE FUNCTION update_parts_updated_at();