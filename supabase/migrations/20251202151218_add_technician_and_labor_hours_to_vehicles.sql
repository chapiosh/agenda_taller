/*
  # Add technician and labor hours to vehicles_in_shop

  1. Changes
    - Add technician column to store the assigned technician name
    - Add labor_hours column to store estimated labor hours (numeric with 2 decimal places)
  
  2. Notes
    - Both fields are optional (can be NULL)
    - Labor hours stored as NUMERIC(5,2) allows values up to 999.99 hours
    - Default value for labor_hours is 0
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles_in_shop' AND column_name = 'technician'
  ) THEN
    ALTER TABLE vehicles_in_shop ADD COLUMN technician TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles_in_shop' AND column_name = 'labor_hours'
  ) THEN
    ALTER TABLE vehicles_in_shop ADD COLUMN labor_hours NUMERIC(5,2) DEFAULT 0;
  END IF;
END $$;