/*
  # Fix JSON concatenation operator issue

  The || operator for JSON concatenation requires jsonb, not json.
  This migration updates the functions to use jsonb.
*/

-- Drop existing functions first
DROP FUNCTION IF EXISTS rpc_get_cotizacion_by_id(uuid);
DROP FUNCTION IF EXISTS rpc_create_cotizacion_from_vehicle(uuid, text);
DROP FUNCTION IF EXISTS rpc_duplicate_cotizacion(uuid, text);

-- Fix rpc_get_cotizacion_by_id to use jsonb
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

  -- Get trabajos with partidas
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
            'total', p.total
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

-- Fix rpc_create_cotizacion_from_vehicle to use the updated function
CREATE FUNCTION rpc_create_cotizacion_from_vehicle(
  p_vehicle_id uuid,
  p_created_by text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_vehicle RECORD;
  v_cotizacion_result json;
  v_result jsonb;
BEGIN
  -- Get vehicle info
  SELECT * INTO v_vehicle FROM vehicles_in_shop WHERE id = p_vehicle_id;

  IF v_vehicle IS NULL THEN
    RAISE EXCEPTION 'Vehicle not found';
  END IF;

  -- Create cotizacion
  SELECT rpc_create_cotizacion(
    p_customer_name := v_vehicle.customer_name,
    p_vehicle := v_vehicle.vehicle,
    p_customer_contact := v_vehicle.contact,
    p_vehicle_id := p_vehicle_id,
    p_notes := 'Creada desde vehículo en taller. Servicio: ' || v_vehicle.service,
    p_created_by := p_created_by
  ) INTO v_cotizacion_result;

  -- Create initial trabajo with service description
  PERFORM rpc_create_cotizacion_trabajo(
    p_cotizacion_id := (v_cotizacion_result->>'id')::uuid,
    p_name := v_vehicle.service,
    p_description := v_vehicle.notes
  );

  -- Return full cotizacion
  SELECT rpc_get_cotizacion_by_id((v_cotizacion_result->>'id')::uuid) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Fix rpc_duplicate_cotizacion to use jsonb
CREATE FUNCTION rpc_duplicate_cotizacion(
  p_id uuid,
  p_created_by text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_new_cotizacion_id uuid;
  v_result jsonb;
  v_trabajo RECORD;
  v_new_trabajo_id uuid;
BEGIN
  -- Create new cotizacion from existing
  INSERT INTO cotizaciones (
    customer_name, vehicle, customer_contact, vehicle_id,
    quote_date, valid_until, default_parts_margin_percent, default_labor_rate,
    notes, terms_and_conditions, created_by
  )
  SELECT
    customer_name, vehicle, customer_contact, vehicle_id,
    now(), now() + interval '7 days', default_parts_margin_percent, default_labor_rate,
    notes, terms_and_conditions, p_created_by
  FROM cotizaciones
  WHERE id = p_id
  RETURNING id INTO v_new_cotizacion_id;

  -- Copy trabajos and partidas
  FOR v_trabajo IN SELECT * FROM cotizacion_trabajos WHERE cotizacion_id = p_id ORDER BY sort_order
  LOOP
    INSERT INTO cotizacion_trabajos (cotizacion_id, name, description, sort_order)
    VALUES (v_new_cotizacion_id, v_trabajo.name, v_trabajo.description, v_trabajo.sort_order)
    RETURNING id INTO v_new_trabajo_id;

    -- Copy partidas
    INSERT INTO cotizacion_partidas (
      trabajo_id, tipo, description, sort_order, quantity, unit,
      cost, margin_percent, hours, labor_rate, unit_price,
      discount_type, discount_value, tax_percent
    )
    SELECT
      v_new_trabajo_id, tipo, description, sort_order, quantity, unit,
      cost, margin_percent, hours, labor_rate, unit_price,
      discount_type, discount_value, tax_percent
    FROM cotizacion_partidas
    WHERE trabajo_id = v_trabajo.id
    ORDER BY sort_order;
  END LOOP;

  -- Add status history
  INSERT INTO cotizacion_status_history (cotizacion_id, new_status, changed_by, notes)
  VALUES (v_new_cotizacion_id, 'BORRADOR', p_created_by, 'Cotización duplicada de ' || (SELECT folio FROM cotizaciones WHERE id = p_id));

  -- Return the new cotizacion
  SELECT rpc_get_cotizacion_by_id(v_new_cotizacion_id) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION rpc_get_cotizacion_by_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION rpc_create_cotizacion_from_vehicle(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION rpc_duplicate_cotizacion(uuid, text) TO anon;