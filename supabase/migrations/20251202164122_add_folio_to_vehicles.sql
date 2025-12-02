/*
  # Add folio column to vehicles_in_shop table

  1. Changes
    - Add `folio` column to `vehicles_in_shop` table (text, nullable)
    - Folio represents the invoice number for the vehicle service

  2. Notes
    - Column is nullable to support vehicles without an invoice yet
    - Can be edited by users through the UI
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles_in_shop' AND column_name = 'folio'
  ) THEN
    ALTER TABLE vehicles_in_shop ADD COLUMN folio text;
  END IF;
END $$;