/*
  # Add RPC function to get appointments

  1. New Functions
    - `rpc_get_appointments` - Returns all appointments with properly formatted dates
    
  2. Notes
    - Returns dates as formatted strings to avoid timezone conversion
    - Orders by date ascending
*/

-- Function to get all appointments with proper date formatting
CREATE OR REPLACE FUNCTION rpc_get_appointments()
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', id,
        'customer_name', customer_name,
        'vehicle', vehicle,
        'service', service,
        'date', to_char(date, 'YYYY-MM-DD"T"HH24:MI:SS'),
        'contact', contact,
        'status', status,
        'tags', tags
      ) ORDER BY date ASC
    )
    FROM appointments
  );
END;
$$ LANGUAGE plpgsql;
