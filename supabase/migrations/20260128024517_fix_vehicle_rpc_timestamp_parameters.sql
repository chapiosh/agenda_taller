/*
  # Fix vehicle RPC functions to accept TEXT timestamps
  
  1. Changes
    - Update rpc_create_vehicle_in_shop to accept TEXT for date parameters
    - Update rpc_update_vehicle_in_shop to accept TEXT for date parameters
    - Functions now handle timestamp conversion properly from TEXT input
    - Maintains compatibility with API that sends ISO date strings
    
  2. Notes
    - p_check_in_date now accepts TEXT and converts to timestamp
    - p_estimated_completion now accepts TEXT and converts to timestamp (or NULL)
    - This fixes the "function not found" error when calling from API
*/

CREATE OR REPLACE FUNCTION rpc_create_vehicle_in_shop(
  p_customer_name TEXT,
  p_vehicle TEXT,
  p_service TEXT,
  p_contact TEXT,
  p_check_in_date TEXT,
  p_estimated_completion TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT '',
  p_tags TEXT[] DEFAULT '{}'::TEXT[],
  p_technician TEXT DEFAULT NULL,
  p_labor_hours NUMERIC DEFAULT 0,
  p_folio TEXT DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  INSERT INTO vehicles_in_shop (
    customer_name,
    vehicle,
    service,
    contact,
    check_in_date,
    estimated_completion,
    notes,
    tags,
    technician,
    labor_hours,
    folio
  ) VALUES (
    p_customer_name,
    p_vehicle,
    p_service,
    p_contact,
    p_check_in_date::timestamp,
    CASE WHEN p_estimated_completion IS NOT NULL THEN p_estimated_completion::timestamp ELSE NULL END,
    p_notes,
    p_tags,
    p_technician,
    p_labor_hours,
    p_folio
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
    'tags', tags,
    'technician', technician,
    'labor_hours', labor_hours,
    'folio', folio
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION rpc_update_vehicle_in_shop(
  p_id UUID,
  p_customer_name TEXT,
  p_vehicle TEXT,
  p_service TEXT,
  p_contact TEXT,
  p_check_in_date TEXT,
  p_estimated_completion TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT '',
  p_tags TEXT[] DEFAULT '{}'::TEXT[],
  p_technician TEXT DEFAULT NULL,
  p_labor_hours NUMERIC DEFAULT 0,
  p_folio TEXT DEFAULT NULL
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
    technician = p_technician,
    labor_hours = p_labor_hours,
    folio = p_folio
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
    'tags', tags,
    'technician', technician,
    'labor_hours', labor_hours,
    'folio', folio
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;