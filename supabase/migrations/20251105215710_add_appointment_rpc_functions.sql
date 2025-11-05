/*
  # Add RPC functions for appointment operations

  1. New Functions
    - `rpc_create_appointment` - Creates appointment with local timestamp
    - `rpc_update_appointment` - Updates appointment with local timestamp
    
  2. Notes
    - These functions handle timestamp conversion properly
    - They ensure dates are stored exactly as provided without timezone conversion
    - The functions use explicit timestamp casting to avoid client-side conversions
*/

-- Function to create appointment with proper timestamp handling
CREATE OR REPLACE FUNCTION rpc_create_appointment(
  p_customer_name text,
  p_vehicle text,
  p_service text,
  p_date text,
  p_contact text,
  p_tags text[] DEFAULT '{}'::text[]
)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  INSERT INTO appointments (customer_name, vehicle, service, date, contact, status, tags)
  VALUES (p_customer_name, p_vehicle, p_service, p_date::timestamp, p_contact, 'Scheduled', p_tags)
  RETURNING json_build_object(
    'id', id,
    'customer_name', customer_name,
    'vehicle', vehicle,
    'service', service,
    'date', to_char(date, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'contact', contact,
    'status', status,
    'tags', tags
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to update appointment with proper timestamp handling
CREATE OR REPLACE FUNCTION rpc_update_appointment(
  p_id uuid,
  p_customer_name text,
  p_vehicle text,
  p_service text,
  p_date text,
  p_contact text,
  p_status text,
  p_tags text[] DEFAULT '{}'::text[]
)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  UPDATE appointments
  SET 
    customer_name = p_customer_name,
    vehicle = p_vehicle,
    service = p_service,
    date = p_date::timestamp,
    contact = p_contact,
    status = p_status,
    tags = p_tags,
    updated_at = now()
  WHERE id = p_id
  RETURNING json_build_object(
    'id', id,
    'customer_name', customer_name,
    'vehicle', vehicle,
    'service', service,
    'date', to_char(date, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'contact', contact,
    'status', status,
    'tags', tags
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
