/*
  # Grant permissions on cotizaciones RPC functions

  This migration grants execute permissions to the anon role for all cotizaciones-related RPC functions.
*/

-- Configuration functions
GRANT EXECUTE ON FUNCTION rpc_get_configuracion() TO anon;
GRANT EXECUTE ON FUNCTION rpc_update_configuracion(text, text) TO anon;

-- Cotizaciones functions
GRANT EXECUTE ON FUNCTION rpc_get_cotizaciones(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION rpc_get_cotizacion_by_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION rpc_create_cotizacion(text, text, text, uuid, text, text, numeric, numeric, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION rpc_update_cotizacion(uuid, text, text, text, uuid, text, text, numeric, numeric, text, text) TO anon;
GRANT EXECUTE ON FUNCTION rpc_update_cotizacion_status(uuid, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION rpc_delete_cotizacion(uuid) TO anon;
GRANT EXECUTE ON FUNCTION rpc_duplicate_cotizacion(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION rpc_get_cotizacion_status_history(uuid) TO anon;
GRANT EXECUTE ON FUNCTION rpc_create_cotizacion_from_vehicle(uuid, text) TO anon;

-- Trabajos functions
GRANT EXECUTE ON FUNCTION rpc_create_cotizacion_trabajo(uuid, text, text, integer) TO anon;
GRANT EXECUTE ON FUNCTION rpc_update_cotizacion_trabajo(uuid, text, text, integer) TO anon;
GRANT EXECUTE ON FUNCTION rpc_delete_cotizacion_trabajo(uuid) TO anon;
GRANT EXECUTE ON FUNCTION rpc_reorder_trabajos(uuid[]) TO anon;

-- Partidas functions
GRANT EXECUTE ON FUNCTION rpc_create_cotizacion_partida(uuid, text, text, numeric, text, numeric, numeric, numeric, numeric, numeric, text, numeric, numeric, integer) TO anon;
GRANT EXECUTE ON FUNCTION rpc_update_cotizacion_partida(uuid, text, text, numeric, text, numeric, numeric, numeric, numeric, numeric, text, numeric, numeric, integer) TO anon;
GRANT EXECUTE ON FUNCTION rpc_delete_cotizacion_partida(uuid) TO anon;

-- Helper functions (also need to be accessible)
GRANT EXECUTE ON FUNCTION generate_cotizacion_folio() TO anon;
GRANT EXECUTE ON FUNCTION recalculate_trabajo_totals(uuid) TO anon;
GRANT EXECUTE ON FUNCTION recalculate_cotizacion_totals(uuid) TO anon;