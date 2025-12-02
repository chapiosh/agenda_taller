/*
  # Add function to get delivered vehicles

  1. New Functions
    - `rpc_get_delivered_vehicles` - Get all vehicles that have been delivered with formatted dates
  
  2. Notes
    - Returns vehicles where `delivered_at IS NOT NULL`
    - Orders by delivery date in descending order (most recent first)
    - Includes all vehicle information with proper timestamp formatting
*/

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
        'delivered_at', to_char(delivered_at, 'YYYY-MM-DD"T"HH24:MI:SS')
      ) ORDER BY delivered_at DESC
    )
    FROM vehicles_in_shop
    WHERE delivered_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;