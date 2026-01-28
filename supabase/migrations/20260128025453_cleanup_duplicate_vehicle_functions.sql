/*
  # Cleanup duplicate vehicle RPC functions
  
  1. Changes
    - Remove all old TIMESTAMP-based versions of vehicle functions
    - Keep only TEXT-based versions that match API calls
    - This fixes PostgreSQL's function resolution ambiguity
    
  2. Notes
    - Multiple function signatures were causing "function not found" errors
    - PostgreSQL couldn't decide which overloaded version to use
    - TEXT-based functions convert strings to timestamps internally
*/

-- Drop all TIMESTAMP-based versions
DROP FUNCTION IF EXISTS rpc_create_vehicle_in_shop(text, text, text, text, timestamp without time zone, timestamp without time zone, text, text[]);
DROP FUNCTION IF EXISTS rpc_create_vehicle_in_shop(text, text, text, text, timestamp without time zone, timestamp without time zone, text, text[], text, numeric);
DROP FUNCTION IF EXISTS rpc_create_vehicle_in_shop(text, text, text, text, timestamp without time zone, timestamp without time zone, text, text[], text, numeric, text);

DROP FUNCTION IF EXISTS rpc_update_vehicle_in_shop(uuid, text, text, text, text, timestamp without time zone, timestamp without time zone, text, text[]);
DROP FUNCTION IF EXISTS rpc_update_vehicle_in_shop(uuid, text, text, text, text, timestamp without time zone, timestamp without time zone, text, text[], text, numeric);
DROP FUNCTION IF EXISTS rpc_update_vehicle_in_shop(uuid, text, text, text, text, timestamp without time zone, timestamp without time zone, text, text[], text, numeric, text);