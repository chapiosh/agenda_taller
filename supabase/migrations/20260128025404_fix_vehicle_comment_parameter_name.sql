/*
  # Fix vehicle comment RPC function parameter name
  
  1. Changes
    - Drop existing rpc_create_vehicle_comment function
    - Recreate with p_comment_text parameter to match API calls
    - This fixes the function not found error when creating comments
    
  2. Notes
    - The API was calling with p_comment_text but function expected p_comment
    - This aligns the function signature with the API calls
*/

DROP FUNCTION IF EXISTS rpc_create_vehicle_comment(UUID, TEXT);

CREATE OR REPLACE FUNCTION rpc_create_vehicle_comment(
  p_vehicle_id UUID,
  p_comment_text TEXT
)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  INSERT INTO vehicle_comments (
    vehicle_id,
    comment
  ) VALUES (
    p_vehicle_id,
    p_comment_text
  )
  RETURNING json_build_object(
    'id', id,
    'vehicle_id', vehicle_id,
    'comment', comment,
    'created_at', to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS')
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;