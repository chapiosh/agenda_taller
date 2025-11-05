/*
  # Add tags field to appointments table

  1. Changes
    - Add `tags` column to `appointments` table
      - `tags` (text array) - Array of tags for appointment status tracking
      - Possible values: 'canceló', 'no asistió', 'reprogramó', 'asistió', 'no dejó la unidad', 'llegó sin cita', 'llegó tarde'
      - Defaults to empty array
    
  2. Notes
    - Tags allow multiple status markers per appointment
    - Provides more detailed tracking than simple status field
*/

-- Add tags column to appointments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'tags'
  ) THEN
    ALTER TABLE appointments ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;

-- Create index for faster tag-based queries
CREATE INDEX IF NOT EXISTS idx_appointments_tags ON appointments USING GIN(tags);
