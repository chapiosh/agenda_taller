/*
  # Update RPC functions to include folio field

  1. Changes
    - Update rpc_get_vehicles_in_shop to return folio
    - Update rpc_get_delivered_vehicles to return folio
    - Update rpc_create_vehicle_in_shop to accept and store folio
    - Update rpc_update_vehicle_in_shop to accept and update folio
  
  2. Notes
    - Folio field represents the invoice number for the vehicle service
    - Maintains backward compatibility with NULL values
*/

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
        'tags', tags,
        'delivered_at', CASE 
          WHEN delivered_at IS NOT NULL 
          THEN to_char(delivered_at, 'YYYY-MM-DD"T"HH24:MI:SS')
          ELSE NULL 
        END,
        'technician', technician,
        'labor_hours', labor_hours,
        'folio', folio
      ) ORDER BY check_in_date DESC
    )
    FROM vehicles_in_shop
    WHERE delivered_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION rpc_get_delivered_vehicles()
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
        'tags', tags,
        'delivered_at', to_char(delivered_at, 'YYYY-MM-DD"T"HH24:MI:SS'),
        'technician', technician,
        'labor_hours', labor_hours,
        'folio', folio
      ) ORDER BY delivered_at DESC
    )
    FROM vehicles_in_shop
    WHERE delivered_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION rpc_create_vehicle_in_shop(
  p_customer_name TEXT,
  p_vehicle TEXT,
  p_service TEXT,
  p_contact TEXT,
  p_check_in_date TIMESTAMP,
  p_estimated_completion TIMESTAMP,
  p_notes TEXT,
  p_tags TEXT[],
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
    p_check_in_date,
    p_estimated_completion,
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
  p_check_in_date TIMESTAMP,
  p_estimated_completion TIMESTAMP,
  p_notes TEXT,
  p_tags TEXT[],
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
    check_in_date = p_check_in_date,
    estimated_completion = p_estimated_completion,
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