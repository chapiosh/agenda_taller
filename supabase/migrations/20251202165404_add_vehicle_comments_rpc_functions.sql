/*
  # Add RPC functions for vehicle comments

  1. New Functions
    - `rpc_get_vehicle_comments` - Get all comments for a vehicle
    - `rpc_create_vehicle_comment` - Create a new comment for a vehicle
  
  2. Notes
    - Comments are returned ordered by creation date (oldest first)
    - Each comment includes id, vehicle_id, comment text, and timestamp
*/

CREATE OR REPLACE FUNCTION rpc_get_vehicle_comments(p_vehicle_id UUID)
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', id,
        'vehicle_id', vehicle_id,
        'comment', comment,
        'created_at', to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS')
      ) ORDER BY created_at ASC
    )
    FROM vehicle_comments
    WHERE vehicle_id = p_vehicle_id
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION rpc_create_vehicle_comment(
  p_vehicle_id UUID,
  p_comment TEXT
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
    p_comment
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