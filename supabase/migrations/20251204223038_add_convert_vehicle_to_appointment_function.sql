/*
  # Add function to convert vehicle back to appointment

  1. New Functions
    - `convert_vehicle_to_appointment` - Converts a vehicle in shop back to an appointment
      - Takes vehicle_id as parameter
      - Creates a new appointment with the vehicle's data
      - Deletes the vehicle from vehicles_in_shop table
      - Returns the created appointment
      
  2. Notes
    - Useful for correcting mistakes when a vehicle was moved to shop by error
    - Transaction ensures data consistency (both operations succeed or fail together)
    - Status is set to 'Scheduled' for the new appointment
*/

-- Function to convert a vehicle in shop back to an appointment
CREATE OR REPLACE FUNCTION convert_vehicle_to_appointment(vehicle_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vehicle_record vehicles_in_shop%ROWTYPE;
  new_appointment appointments%ROWTYPE;
BEGIN
  -- Get the vehicle data
  SELECT * INTO vehicle_record
  FROM vehicles_in_shop
  WHERE id = vehicle_id;

  -- Check if vehicle exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vehicle not found';
  END IF;

  -- Create new appointment with vehicle data
  INSERT INTO appointments (
    customer_name,
    vehicle,
    service,
    contact,
    date,
    status
  ) VALUES (
    vehicle_record.customer_name,
    vehicle_record.vehicle,
    vehicle_record.service,
    vehicle_record.contact,
    vehicle_record.check_in_date,
    'Scheduled'
  )
  RETURNING * INTO new_appointment;

  -- Delete the vehicle from shop
  DELETE FROM vehicles_in_shop WHERE id = vehicle_id;

  -- Return the new appointment as JSON
  RETURN row_to_json(new_appointment);
END;
$$;