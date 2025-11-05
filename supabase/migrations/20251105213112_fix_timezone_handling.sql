/*
  # Fix timezone handling for appointments

  1. Changes
    - Change `date` column from `timestamptz` to `timestamp` to store local time without timezone conversion
    - This ensures dates are stored exactly as entered by the user in their local timezone
    
  2. Notes
    - Existing data will be preserved
    - The timestamp type stores date/time without timezone information
    - This is appropriate for local business appointments where all users are in the same timezone
*/

-- Change the date column from timestamptz to timestamp
ALTER TABLE appointments 
ALTER COLUMN date TYPE timestamp USING date::timestamp;
