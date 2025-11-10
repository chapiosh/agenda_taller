/*
  # Add RPC functions for vehicles in shop operations

  1. New Functions
    - `rpc_get_vehicles_in_shop` - Get all vehicles with formatted dates
    - `rpc_create_vehicle_in_shop` - Create vehicle entry with proper timestamp
    - `rpc_update_vehicle_in_shop` - Update vehicle entry with proper timestamp
    
  2. Notes
    - Functions handle timestamp conversion properly
    - Dates stored exactly as provided without timezone conversion
*/

-- Get all vehicles in shop
CREATE OR REPLACE FUNCTION rpc_get_vehicles_in_shop()
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', id,
        'customer_name', customer_name,
        'vehicle', vehicle,
        'service', service,
        'contact', contact,
        'check_in_date', to_char(check_in_date, 'YYYY-MM-DD"T"HH24:MI:SS'),
        'estimated_completion', CASE 
          WHEN estimated_completion IS NOT NULL 
          THEN to_char(estimated_completion, 'YYYY-MM-DD"T"HH24:MI:SS')
          ELSE NULL 
        END,
        'notes', notes,
        'tags', tags
      ) ORDER BY check_in_date DESC
    )
    FROM vehicles_in_shop
  );
END;
$$ LANGUAGE plpgsql;

-- Create vehicle in shop
CREATE OR REPLACE FUNCTION rpc_create_vehicle_in_shop(
  p_customer_name text,
  p_vehicle text,
  p_service text,
  p_contact text,
  p_check_in_date text,
  p_estimated_completion text DEFAULT NULL,
  p_notes text DEFAULT '',
  p_tags text[] DEFAULT '{}'::text[]
)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  INSERT INTO vehicles_in_shop (
    customer_name, vehicle, service, contact, check_in_date, 
    estimated_completion, notes, tags
  )
  VALUES (
    p_customer_name, p_vehicle, p_service, p_contact, p_check_in_date::timestamp,
    CASE WHEN p_estimated_completion IS NOT NULL THEN p_estimated_completion::timestamp ELSE NULL END,
    p_notes, p_tags
  )
  RETURNING json_build_object(
    'id', id,
    'customer_name', customer_name,
    'vehicle', vehicle,
    'service', service,
    'contact', contact,
    'check_in_date', to_char(check_in_date, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'estimated_completion', CASE 
      WHEN estimated_completion IS NOT NULL 
      THEN to_char(estimated_completion, 'YYYY-MM-DD"T"HH24:MI:SS')
      ELSE NULL 
    END,
    'notes', notes,
    'tags', tags
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Update vehicle in shop
CREATE OR REPLACE FUNCTION rpc_update_vehicle_in_shop(
  p_id uuid,
  p_customer_name text,
  p_vehicle text,
  p_service text,
  p_contact text,
  p_check_in_date text,
  p_estimated_completion text DEFAULT NULL,
  p_notes text DEFAULT '',
  p_tags text[] DEFAULT '{}'::text[]
)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  UPDATE vehicles_in_shop
  SET 
    customer_name = p_customer_name,
    vehicle = p_vehicle,
    service = p_service,
    contact = p_contact,
    check_in_date = p_check_in_date::timestamp,
    estimated_completion = CASE WHEN p_estimated_completion IS NOT NULL THEN p_estimated_completion::timestamp ELSE NULL END,
    notes = p_notes,
    tags = p_tags,
    updated_at = now()
  WHERE id = p_id
  RETURNING json_build_object(
    'id', id,
    'customer_name', customer_name,
    'vehicle', vehicle,
    'service', service,
    'contact', contact,
    'check_in_date', to_char(check_in_date, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'estimated_completion', CASE 
      WHEN estimated_completion IS NOT NULL 
      THEN to_char(estimated_completion, 'YYYY-MM-DD"T"HH24:MI:SS')
      ELSE NULL 
    END,
    'notes', notes,
    'tags', tags
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
