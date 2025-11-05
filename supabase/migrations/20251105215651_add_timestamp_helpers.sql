/*
  # Add timestamp helper functions

  1. Changes
    - Add helper function to convert string to timestamp without timezone conversion
    - This ensures datetime strings are stored exactly as provided
    
  2. Notes
    - The function interprets the input string as a local timestamp
    - No timezone conversion is applied
*/

-- Create a function to convert text to timestamp without timezone conversion
CREATE OR REPLACE FUNCTION text_to_timestamp_local(text_date text)
RETURNS timestamp AS $$
BEGIN
  RETURN text_date::timestamp;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
