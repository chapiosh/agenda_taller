/*
  # Add placa and VIN fields to cotizaciones

  This allows searching quotations by license plate and VIN number.
*/

-- Add placa and vin columns
ALTER TABLE cotizaciones
ADD COLUMN IF NOT EXISTS placa text,
ADD COLUMN IF NOT EXISTS vin text;

-- Create indexes for faster searching
CREATE INDEX IF NOT EXISTS idx_cotizaciones_placa ON cotizaciones(placa);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_vin ON cotizaciones(vin);

-- Drop existing functions to allow signature changes
DROP FUNCTION IF EXISTS rpc_get_cotizaciones(text, text, text, text);
DROP FUNCTION IF EXISTS rpc_get_cotizacion_by_id(uuid);
DROP FUNCTION IF EXISTS rpc_create_cotizacion(text, text, text, uuid, timestamp, timestamp, numeric, numeric, text, text, text);
DROP FUNCTION IF EXISTS rpc_update_cotizacion(uuid, text, text, text, uuid, timestamp, timestamp, numeric, numeric, text, text);
DROP FUNCTION IF EXISTS rpc_duplicate_cotizacion(uuid, text);

-- Update rpc_get_cotizaciones to include placa, vin and search them
CREATE FUNCTION rpc_get_cotizaciones(
  p_status text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_from_date text DEFAULT NULL,
  p_to_date text DEFAULT NULL
)
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', id,
        'folio', folio,
        'customer_name', customer_name,
        'customer_contact', customer_contact,
        'vehicle', vehicle,
        'vehicle_id', vehicle_id,
        'placa', placa,
        'vin', vin,
        'status', status,
        'quote_date', to_char(quote_date, 'YYYY-MM-DD"T"HH24:MI:SS'),
        'valid_until', CASE WHEN valid_until IS NOT NULL THEN to_char(valid_until, 'YYYY-MM-DD"T"HH24:MI:SS') ELSE NULL END,
        'subtotal', subtotal,
        'total_discount', total_discount,
        'total_taxes', total_taxes,
        'total', total,
        'created_at', to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS')
      ) ORDER BY quote_date DESC
    )
    FROM cotizaciones
    WHERE
      (p_status IS NULL OR status = p_status)
      AND (p_search IS NULL OR
           customer_name ILIKE '%' || p_search || '%' OR
           vehicle ILIKE '%' || p_search || '%' OR
           folio ILIKE '%' || p_search || '%' OR
           placa ILIKE '%' || p_search || '%' OR
           vin ILIKE '%' || p_search || '%')
      AND (p_from_date IS NULL OR quote_date >= p_from_date::timestamp)
      AND (p_to_date IS NULL OR quote_date <= p_to_date::timestamp + interval '1 day')
  );
END;
$$ LANGUAGE plpgsql;

-- Update rpc_get_cotizacion_by_id to include placa and vin
CREATE FUNCTION rpc_get_cotizacion_by_id(p_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_cotizacion jsonb;
  v_trabajos jsonb;
BEGIN
  -- Get cotizacion header
  SELECT jsonb_build_object(
    'id', id,
    'folio', folio,
    'customer_name', customer_name,
    'customer_contact', customer_contact,
    'vehicle', vehicle,
    'vehicle_id', vehicle_id,
    'placa', placa,
    'vin', vin,
    'status', status,
    'quote_date', to_char(quote_date, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'valid_until', CASE WHEN valid_until IS NOT NULL THEN to_char(valid_until, 'YYYY-MM-DD"T"HH24:MI:SS') ELSE NULL END,
    'default_parts_margin_percent', default_parts_margin_percent,
    'default_labor_rate', default_labor_rate,
    'subtotal', subtotal,
    'total_discount', total_discount,
    'total_taxes', total_taxes,
    'total', total,
    'notes', notes,
    'terms_and_conditions', terms_and_conditions,
    'created_at', to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'updated_at', to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'created_by', created_by
  ) INTO v_cotizacion
  FROM cotizaciones
  WHERE id = p_id;

  IF v_cotizacion IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get trabajos with partidas (including proveedores with incluye_iva)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'cotizacion_id', t.cotizacion_id,
      'name', t.name,
      'description', t.description,
      'sort_order', t.sort_order,
      'subtotal', t.subtotal,
      'total_discount', t.total_discount,
      'total_taxes', t.total_taxes,
      'total', t.total,
      'partidas', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'trabajo_id', p.trabajo_id,
            'tipo', p.tipo,
            'description', p.description,
            'sort_order', p.sort_order,
            'quantity', p.quantity,
            'unit', p.unit,
            'cost', p.cost,
            'margin_percent', p.margin_percent,
            'hours', p.hours,
            'labor_rate', p.labor_rate,
            'unit_price', p.unit_price,
            'discount_type', p.discount_type,
            'discount_value', p.discount_value,
            'discount_amount', p.discount_amount,
            'tax_percent', p.tax_percent,
            'tax_amount', p.tax_amount,
            'subtotal', p.subtotal,
            'total', p.total,
            'proveedores', COALESCE(
              (SELECT jsonb_agg(
                jsonb_build_object(
                  'id', prov.id,
                  'proveedor', prov.proveedor,
                  'costo', prov.costo,
                  'is_selected', prov.is_selected,
                  'incluye_iva', prov.incluye_iva
                ) ORDER BY prov.costo ASC
              )
              FROM cotizacion_partida_proveedores prov
              WHERE prov.partida_id = p.id),
              '[]'::jsonb
            )
          ) ORDER BY p.sort_order
        ), '[]'::jsonb)
        FROM cotizacion_partidas p
        WHERE p.trabajo_id = t.id
      )
    ) ORDER BY t.sort_order
  ) INTO v_trabajos
  FROM cotizacion_trabajos t
  WHERE t.cotizacion_id = p_id;

  -- Combine and return
  RETURN v_cotizacion || jsonb_build_object('trabajos', COALESCE(v_trabajos, '[]'::jsonb));
END;
$$ LANGUAGE plpgsql;

-- Update rpc_create_cotizacion to include placa and vin
CREATE FUNCTION rpc_create_cotizacion(
  p_customer_name text,
  p_vehicle text,
  p_customer_contact text DEFAULT NULL,
  p_vehicle_id uuid DEFAULT NULL,
  p_placa text DEFAULT NULL,
  p_vin text DEFAULT NULL,
  p_quote_date timestamp DEFAULT NULL,
  p_valid_until timestamp DEFAULT NULL,
  p_default_parts_margin_percent numeric DEFAULT NULL,
  p_default_labor_rate numeric DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_terms_and_conditions text DEFAULT NULL,
  p_created_by text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_result json;
  v_margin numeric;
  v_labor_rate numeric;
  v_validity_days integer;
  v_quote_date timestamp;
  v_valid_until timestamp;
BEGIN
  -- Get defaults from config
  SELECT COALESCE(value::numeric, 30) INTO v_margin
  FROM configuracion_taller WHERE key = 'default_parts_margin_percent';

  SELECT COALESCE(value::numeric, 350) INTO v_labor_rate
  FROM configuracion_taller WHERE key = 'default_labor_rate';

  SELECT COALESCE(value::integer, 7) INTO v_validity_days
  FROM configuracion_taller WHERE key = 'default_validity_days';

  -- Set dates
  v_quote_date := COALESCE(p_quote_date, now());
  v_valid_until := COALESCE(p_valid_until, v_quote_date + (v_validity_days || ' days')::interval);

  INSERT INTO cotizaciones (
    customer_name,
    customer_contact,
    vehicle,
    vehicle_id,
    placa,
    vin,
    quote_date,
    valid_until,
    default_parts_margin_percent,
    default_labor_rate,
    notes,
    terms_and_conditions,
    created_by
  ) VALUES (
    p_customer_name,
    p_customer_contact,
    p_vehicle,
    p_vehicle_id,
    p_placa,
    p_vin,
    v_quote_date,
    v_valid_until,
    COALESCE(p_default_parts_margin_percent, v_margin),
    COALESCE(p_default_labor_rate, v_labor_rate),
    p_notes,
    p_terms_and_conditions,
    p_created_by
  )
  RETURNING json_build_object(
    'id', id,
    'folio', folio,
    'customer_name', customer_name,
    'customer_contact', customer_contact,
    'vehicle', vehicle,
    'vehicle_id', vehicle_id,
    'placa', placa,
    'vin', vin,
    'status', status,
    'quote_date', to_char(quote_date, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'valid_until', to_char(valid_until, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'default_parts_margin_percent', default_parts_margin_percent,
    'default_labor_rate', default_labor_rate,
    'subtotal', subtotal,
    'total_discount', total_discount,
    'total_taxes', total_taxes,
    'total', total,
    'notes', notes,
    'terms_and_conditions', terms_and_conditions,
    'created_at', to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'created_by', created_by
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Update rpc_update_cotizacion to include placa and vin
CREATE FUNCTION rpc_update_cotizacion(
  p_id uuid,
  p_customer_name text DEFAULT NULL,
  p_vehicle text DEFAULT NULL,
  p_customer_contact text DEFAULT NULL,
  p_vehicle_id uuid DEFAULT NULL,
  p_placa text DEFAULT NULL,
  p_vin text DEFAULT NULL,
  p_quote_date timestamp DEFAULT NULL,
  p_valid_until timestamp DEFAULT NULL,
  p_default_parts_margin_percent numeric DEFAULT NULL,
  p_default_labor_rate numeric DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_terms_and_conditions text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  UPDATE cotizaciones
  SET
    customer_name = COALESCE(p_customer_name, customer_name),
    customer_contact = COALESCE(p_customer_contact, customer_contact),
    vehicle = COALESCE(p_vehicle, vehicle),
    vehicle_id = COALESCE(p_vehicle_id, vehicle_id),
    placa = COALESCE(p_placa, placa),
    vin = COALESCE(p_vin, vin),
    quote_date = COALESCE(p_quote_date, quote_date),
    valid_until = COALESCE(p_valid_until, valid_until),
    default_parts_margin_percent = COALESCE(p_default_parts_margin_percent, default_parts_margin_percent),
    default_labor_rate = COALESCE(p_default_labor_rate, default_labor_rate),
    notes = COALESCE(p_notes, notes),
    terms_and_conditions = COALESCE(p_terms_and_conditions, terms_and_conditions),
    updated_at = now()
  WHERE id = p_id
  RETURNING json_build_object(
    'id', id,
    'folio', folio,
    'customer_name', customer_name,
    'customer_contact', customer_contact,
    'vehicle', vehicle,
    'vehicle_id', vehicle_id,
    'placa', placa,
    'vin', vin,
    'status', status,
    'quote_date', to_char(quote_date, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'valid_until', to_char(valid_until, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'default_parts_margin_percent', default_parts_margin_percent,
    'default_labor_rate', default_labor_rate,
    'subtotal', subtotal,
    'total_discount', total_discount,
    'total_taxes', total_taxes,
    'total', total,
    'notes', notes,
    'terms_and_conditions', terms_and_conditions,
    'created_at', to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'updated_at', to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'created_by', created_by
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Update rpc_duplicate_cotizacion to include placa and vin
CREATE FUNCTION rpc_duplicate_cotizacion(
  p_id uuid,
  p_created_by text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_new_cotizacion_id uuid;
  v_result json;
  v_validity_days integer;
BEGIN
  -- Get validity days from config
  SELECT COALESCE(value::integer, 7) INTO v_validity_days
  FROM configuracion_taller WHERE key = 'default_validity_days';

  -- Create new cotizacion from existing
  INSERT INTO cotizaciones (
    customer_name,
    customer_contact,
    vehicle,
    vehicle_id,
    placa,
    vin,
    quote_date,
    valid_until,
    default_parts_margin_percent,
    default_labor_rate,
    notes,
    terms_and_conditions,
    created_by
  )
  SELECT
    customer_name,
    customer_contact,
    vehicle,
    vehicle_id,
    placa,
    vin,
    now(),
    now() + (v_validity_days || ' days')::interval,
    default_parts_margin_percent,
    default_labor_rate,
    notes,
    terms_and_conditions,
    COALESCE(p_created_by, created_by)
  FROM cotizaciones
  WHERE id = p_id
  RETURNING id INTO v_new_cotizacion_id;

  -- Copy trabajos
  INSERT INTO cotizacion_trabajos (cotizacion_id, name, description, sort_order)
  SELECT v_new_cotizacion_id, name, description, sort_order
  FROM cotizacion_trabajos
  WHERE cotizacion_id = p_id;

  -- Copy partidas (mapping old trabajo_id to new trabajo_id)
  INSERT INTO cotizacion_partidas (
    trabajo_id, tipo, description, sort_order, quantity, unit,
    cost, margin_percent, hours, labor_rate, unit_price,
    discount_type, discount_value, tax_percent
  )
  SELECT
    new_t.id,
    p.tipo, p.description, p.sort_order, p.quantity, p.unit,
    p.cost, p.margin_percent, p.hours, p.labor_rate, p.unit_price,
    p.discount_type, p.discount_value, p.tax_percent
  FROM cotizacion_partidas p
  JOIN cotizacion_trabajos old_t ON old_t.id = p.trabajo_id
  JOIN cotizacion_trabajos new_t ON new_t.cotizacion_id = v_new_cotizacion_id AND new_t.name = old_t.name
  WHERE old_t.cotizacion_id = p_id;

  -- Get the new cotizacion
  SELECT json_build_object(
    'id', id,
    'folio', folio,
    'customer_name', customer_name,
    'customer_contact', customer_contact,
    'vehicle', vehicle,
    'vehicle_id', vehicle_id,
    'placa', placa,
    'vin', vin,
    'status', status,
    'quote_date', to_char(quote_date, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'valid_until', to_char(valid_until, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'default_parts_margin_percent', default_parts_margin_percent,
    'default_labor_rate', default_labor_rate,
    'subtotal', subtotal,
    'total_discount', total_discount,
    'total_taxes', total_taxes,
    'total', total,
    'notes', notes,
    'terms_and_conditions', terms_and_conditions,
    'created_at', to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'created_by', created_by
  ) INTO v_result
  FROM cotizaciones
  WHERE id = v_new_cotizacion_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION rpc_get_cotizaciones(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION rpc_get_cotizacion_by_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION rpc_create_cotizacion(text, text, text, uuid, text, text, timestamp, timestamp, numeric, numeric, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION rpc_update_cotizacion(uuid, text, text, text, uuid, text, text, timestamp, timestamp, numeric, numeric, text, text) TO anon;
GRANT EXECUTE ON FUNCTION rpc_duplicate_cotizacion(uuid, text) TO anon;