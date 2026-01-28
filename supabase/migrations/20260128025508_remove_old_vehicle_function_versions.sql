/*
  # Remove old vehicle function versions without folio
  
  1. Changes
    - Remove old rpc_create_vehicle_in_shop without folio parameter
    - Remove old rpc_update_vehicle_in_shop without folio parameter
    - Keep only the latest versions with all parameters
    
  2. Notes
    - This ensures PostgreSQL uses the correct function signature
    - API always sends all parameters including folio
*/

-- Remove old create version without folio
DROP FUNCTION IF EXISTS rpc_create_vehicle_in_shop(text, text, text, text, text, text, text, text[]);

-- Remove old update version without folio
DROP FUNCTION IF EXISTS rpc_update_vehicle_in_shop(uuid, text, text, text, text, text, text, text, text[]);