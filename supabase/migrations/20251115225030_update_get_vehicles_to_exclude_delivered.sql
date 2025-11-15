/*
  # Update get vehicles function to exclude delivered vehicles

  1. Changes
    - Modified `rpc_get_vehicles_in_shop` function to only return vehicles that have NOT been delivered
    - Added WHERE clause to filter out vehicles where `delivered_at IS NOT NULL`
    - Vehicles marked as delivered will no longer appear in the vehicles in shop list
  
  2. Notes
    - This ensures delivered vehicles are automatically hidden from the shop view
    - Maintains all existing functionality for non-delivered vehicles
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
        END
      ) ORDER BY check_in_date DESC
    )
    FROM vehicles_in_shop
    WHERE delivered_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;