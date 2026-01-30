/*
  # Create RPC Functions for Cotizaciones

  1. Configuration Functions
    - `rpc_get_configuracion` - Get all configuration values
    - `rpc_update_configuracion` - Update a configuration value

  2. Cotizaciones Functions
    - `rpc_get_cotizaciones` - Get all cotizaciones with filters
    - `rpc_get_cotizacion_by_id` - Get full cotizacion with trabajos and partidas
    - `rpc_create_cotizacion` - Create a new cotizacion
    - `rpc_update_cotizacion` - Update cotizacion header
    - `rpc_update_cotizacion_status` - Change status with audit trail
    - `rpc_delete_cotizacion` - Delete a cotizacion
    - `rpc_duplicate_cotizacion` - Duplicate an existing cotizacion

  3. Trabajos Functions
    - `rpc_create_cotizacion_trabajo` - Add a job to cotizacion
    - `rpc_update_cotizacion_trabajo` - Update a job
    - `rpc_delete_cotizacion_trabajo` - Delete a job
    - `rpc_reorder_trabajos` - Reorder jobs

  4. Partidas Functions
    - `rpc_create_cotizacion_partida` - Add a line item
    - `rpc_update_cotizacion_partida` - Update a line item
    - `rpc_delete_cotizacion_partida` - Delete a line item
*/

-- =============================================
-- CONFIGURATION FUNCTIONS
-- =============================================

-- Get all configuration values
CREATE OR REPLACE FUNCTION rpc_get_configuracion()
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', id,
        'key', key,
        'value', value,
        'description', description
      )
    )
    FROM configuracion_taller
  );
END;
$$ LANGUAGE plpgsql;

-- Update a configuration value
CREATE OR REPLACE FUNCTION rpc_update_configuracion(
  p_key text,
  p_value text
)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  UPDATE configuracion_taller
  SET value = p_value, updated_at = now()
  WHERE key = p_key
  RETURNING json_build_object(
    'id', id,
    'key', key,
    'value', value,
    'description', description
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COTIZACIONES FUNCTIONS
-- =============================================

-- Get all cotizaciones with filters
CREATE OR REPLACE FUNCTION rpc_get_cotizaciones(
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
           folio ILIKE '%' || p_search || '%')
      AND (p_from_date IS NULL OR quote_date >= p_from_date::timestamp)
      AND (p_to_date IS NULL OR quote_date <= p_to_date::timestamp + interval '1 day')
  );
END;
$$ LANGUAGE plpgsql;

-- Get cotizacion by ID with full details
CREATE OR REPLACE FUNCTION rpc_get_cotizacion_by_id(p_id uuid)
RETURNS json AS $$
DECLARE
  v_cotizacion json;
  v_trabajos json;
BEGIN
  -- Get cotizacion header
  SELECT json_build_object(
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
  SELECT json_agg(
    json_build_object(
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
        SELECT COALESCE(json_agg(
          json_build_object(
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
        ), '[]'::json)
        FROM cotizacion_partidas p
        WHERE p.trabajo_id = t.id
      )
    ) ORDER BY t.sort_order
  ) INTO v_trabajos
  FROM cotizacion_trabajos t
  WHERE t.cotizacion_id = p_id;

  -- Combine and return
  RETURN v_cotizacion || json_build_object('trabajos', COALESCE(v_trabajos, '[]'::json));
END;
$$ LANGUAGE plpgsql;

-- Create a new cotizacion
CREATE OR REPLACE FUNCTION rpc_create_cotizacion(
  p_customer_name text,
  p_vehicle text,
  p_customer_contact text DEFAULT NULL,
  p_vehicle_id uuid DEFAULT NULL,
  p_quote_date text DEFAULT NULL,
  p_valid_until text DEFAULT NULL,
  p_default_parts_margin_percent numeric DEFAULT NULL,
  p_default_labor_rate numeric DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_terms_and_conditions text DEFAULT NULL,
  p_created_by text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_result json;
  v_quote_date timestamp;
  v_valid_until timestamp;
  v_validity_days integer;
  v_margin numeric;
  v_rate numeric;
BEGIN
  -- Get defaults from configuration
  SELECT value::integer INTO v_validity_days FROM configuracion_taller WHERE key = 'default_validity_days';
  SELECT value::numeric INTO v_margin FROM configuracion_taller WHERE key = 'default_parts_margin_percent';
  SELECT value::numeric INTO v_rate FROM configuracion_taller WHERE key = 'default_labor_rate';

  v_quote_date := COALESCE(p_quote_date::timestamp, now());
  v_valid_until := COALESCE(p_valid_until::timestamp, v_quote_date + (COALESCE(v_validity_days, 7) || ' days')::interval);

  INSERT INTO cotizaciones (
    customer_name, vehicle, customer_contact, vehicle_id,
    quote_date, valid_until, default_parts_margin_percent, default_labor_rate,
    notes, terms_and_conditions, created_by
  )
  VALUES (
    p_customer_name, p_vehicle, p_customer_contact, p_vehicle_id,
    v_quote_date, v_valid_until,
    COALESCE(p_default_parts_margin_percent, v_margin, 30),
    COALESCE(p_default_labor_rate, v_rate, 350),
    p_notes, p_terms_and_conditions, p_created_by
  )
  RETURNING json_build_object(
    'id', id,
    'folio', folio,
    'customer_name', customer_name,
    'customer_contact', customer_contact,
    'vehicle', vehicle,
    'vehicle_id', vehicle_id,
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

  -- Add initial status history
  INSERT INTO cotizacion_status_history (cotizacion_id, new_status, changed_by, notes)
  VALUES ((v_result->>'id')::uuid, 'BORRADOR', p_created_by, 'Cotización creada');

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Update cotizacion header
CREATE OR REPLACE FUNCTION rpc_update_cotizacion(
  p_id uuid,
  p_customer_name text DEFAULT NULL,
  p_vehicle text DEFAULT NULL,
  p_customer_contact text DEFAULT NULL,
  p_vehicle_id uuid DEFAULT NULL,
  p_quote_date text DEFAULT NULL,
  p_valid_until text DEFAULT NULL,
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
    vehicle = COALESCE(p_vehicle, vehicle),
    customer_contact = COALESCE(p_customer_contact, customer_contact),
    vehicle_id = p_vehicle_id,
    quote_date = COALESCE(p_quote_date::timestamp, quote_date),
    valid_until = COALESCE(p_valid_until::timestamp, valid_until),
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
    'updated_at', to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS')
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Update cotizacion status with audit trail
CREATE OR REPLACE FUNCTION rpc_update_cotizacion_status(
  p_id uuid,
  p_status text,
  p_changed_by text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_old_status text;
  v_result json;
BEGIN
  -- Get old status
  SELECT status INTO v_old_status FROM cotizaciones WHERE id = p_id;

  -- Update status
  UPDATE cotizaciones
  SET status = p_status, updated_at = now()
  WHERE id = p_id
  RETURNING json_build_object(
    'id', id,
    'folio', folio,
    'status', status
  ) INTO v_result;

  -- Add to history
  INSERT INTO cotizacion_status_history (cotizacion_id, old_status, new_status, changed_by, notes)
  VALUES (p_id, v_old_status, p_status, p_changed_by, p_notes);

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Delete cotizacion
CREATE OR REPLACE FUNCTION rpc_delete_cotizacion(p_id uuid)
RETURNS boolean AS $$
BEGIN
  DELETE FROM cotizaciones WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Duplicate cotizacion
CREATE OR REPLACE FUNCTION rpc_duplicate_cotizacion(
  p_id uuid,
  p_created_by text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_new_cotizacion_id uuid;
  v_result json;
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

-- =============================================
-- TRABAJOS FUNCTIONS
-- =============================================

-- Create trabajo
CREATE OR REPLACE FUNCTION rpc_create_cotizacion_trabajo(
  p_cotizacion_id uuid,
  p_name text,
  p_description text DEFAULT NULL,
  p_sort_order integer DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_sort_order integer;
  v_result json;
BEGIN
  -- Get next sort order if not provided
  IF p_sort_order IS NULL THEN
    SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_sort_order
    FROM cotizacion_trabajos WHERE cotizacion_id = p_cotizacion_id;
  ELSE
    v_sort_order := p_sort_order;
  END IF;

  INSERT INTO cotizacion_trabajos (cotizacion_id, name, description, sort_order)
  VALUES (p_cotizacion_id, p_name, p_description, v_sort_order)
  RETURNING json_build_object(
    'id', id,
    'cotizacion_id', cotizacion_id,
    'name', name,
    'description', description,
    'sort_order', sort_order,
    'subtotal', subtotal,
    'total_discount', total_discount,
    'total_taxes', total_taxes,
    'total', total,
    'partidas', '[]'::json
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Update trabajo
CREATE OR REPLACE FUNCTION rpc_update_cotizacion_trabajo(
  p_id uuid,
  p_name text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_sort_order integer DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  UPDATE cotizacion_trabajos
  SET
    name = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    sort_order = COALESCE(p_sort_order, sort_order),
    updated_at = now()
  WHERE id = p_id
  RETURNING json_build_object(
    'id', id,
    'cotizacion_id', cotizacion_id,
    'name', name,
    'description', description,
    'sort_order', sort_order,
    'subtotal', subtotal,
    'total_discount', total_discount,
    'total_taxes', total_taxes,
    'total', total
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Delete trabajo
CREATE OR REPLACE FUNCTION rpc_delete_cotizacion_trabajo(p_id uuid)
RETURNS boolean AS $$
BEGIN
  DELETE FROM cotizacion_trabajos WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Reorder trabajos
CREATE OR REPLACE FUNCTION rpc_reorder_trabajos(p_trabajo_ids uuid[])
RETURNS boolean AS $$
DECLARE
  v_id uuid;
  v_order integer := 1;
BEGIN
  FOREACH v_id IN ARRAY p_trabajo_ids
  LOOP
    UPDATE cotizacion_trabajos SET sort_order = v_order WHERE id = v_id;
    v_order := v_order + 1;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PARTIDAS FUNCTIONS
-- =============================================

-- Create partida
CREATE OR REPLACE FUNCTION rpc_create_cotizacion_partida(
  p_trabajo_id uuid,
  p_tipo text,
  p_description text,
  p_quantity numeric DEFAULT 1,
  p_unit text DEFAULT 'pza',
  p_cost numeric DEFAULT NULL,
  p_margin_percent numeric DEFAULT NULL,
  p_hours numeric DEFAULT NULL,
  p_labor_rate numeric DEFAULT NULL,
  p_unit_price numeric DEFAULT 0,
  p_discount_type text DEFAULT 'AMOUNT',
  p_discount_value numeric DEFAULT 0,
  p_tax_percent numeric DEFAULT 16,
  p_sort_order integer DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_sort_order integer;
  v_cotizacion_id uuid;
  v_default_margin numeric;
  v_default_rate numeric;
  v_result json;
BEGIN
  -- Get cotizacion defaults
  SELECT c.id, c.default_parts_margin_percent, c.default_labor_rate
  INTO v_cotizacion_id, v_default_margin, v_default_rate
  FROM cotizaciones c
  JOIN cotizacion_trabajos t ON t.cotizacion_id = c.id
  WHERE t.id = p_trabajo_id;

  -- Get next sort order if not provided
  IF p_sort_order IS NULL THEN
    SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_sort_order
    FROM cotizacion_partidas WHERE trabajo_id = p_trabajo_id;
  ELSE
    v_sort_order := p_sort_order;
  END IF;

  -- Use defaults if not provided
  IF p_tipo = 'REFACCION' AND p_margin_percent IS NULL THEN
    p_margin_percent := v_default_margin;
  END IF;
  IF p_tipo = 'MANO_DE_OBRA' AND p_labor_rate IS NULL THEN
    p_labor_rate := v_default_rate;
  END IF;

  INSERT INTO cotizacion_partidas (
    trabajo_id, tipo, description, sort_order, quantity, unit,
    cost, margin_percent, hours, labor_rate, unit_price,
    discount_type, discount_value, tax_percent
  )
  VALUES (
    p_trabajo_id, p_tipo, p_description, v_sort_order, p_quantity, p_unit,
    p_cost, p_margin_percent, p_hours, p_labor_rate, p_unit_price,
    p_discount_type, p_discount_value, p_tax_percent
  )
  RETURNING json_build_object(
    'id', id,
    'trabajo_id', trabajo_id,
    'tipo', tipo,
    'description', description,
    'sort_order', sort_order,
    'quantity', quantity,
    'unit', unit,
    'cost', cost,
    'margin_percent', margin_percent,
    'hours', hours,
    'labor_rate', labor_rate,
    'unit_price', unit_price,
    'discount_type', discount_type,
    'discount_value', discount_value,
    'discount_amount', discount_amount,
    'tax_percent', tax_percent,
    'tax_amount', tax_amount,
    'subtotal', subtotal,
    'total', total
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Update partida
CREATE OR REPLACE FUNCTION rpc_update_cotizacion_partida(
  p_id uuid,
  p_tipo text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_quantity numeric DEFAULT NULL,
  p_unit text DEFAULT NULL,
  p_cost numeric DEFAULT NULL,
  p_margin_percent numeric DEFAULT NULL,
  p_hours numeric DEFAULT NULL,
  p_labor_rate numeric DEFAULT NULL,
  p_unit_price numeric DEFAULT NULL,
  p_discount_type text DEFAULT NULL,
  p_discount_value numeric DEFAULT NULL,
  p_tax_percent numeric DEFAULT NULL,
  p_sort_order integer DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  UPDATE cotizacion_partidas
  SET
    tipo = COALESCE(p_tipo, tipo),
    description = COALESCE(p_description, description),
    quantity = COALESCE(p_quantity, quantity),
    unit = COALESCE(p_unit, unit),
    cost = COALESCE(p_cost, cost),
    margin_percent = COALESCE(p_margin_percent, margin_percent),
    hours = COALESCE(p_hours, hours),
    labor_rate = COALESCE(p_labor_rate, labor_rate),
    unit_price = COALESCE(p_unit_price, unit_price),
    discount_type = COALESCE(p_discount_type, discount_type),
    discount_value = COALESCE(p_discount_value, discount_value),
    tax_percent = COALESCE(p_tax_percent, tax_percent),
    sort_order = COALESCE(p_sort_order, sort_order),
    updated_at = now()
  WHERE id = p_id
  RETURNING json_build_object(
    'id', id,
    'trabajo_id', trabajo_id,
    'tipo', tipo,
    'description', description,
    'sort_order', sort_order,
    'quantity', quantity,
    'unit', unit,
    'cost', cost,
    'margin_percent', margin_percent,
    'hours', hours,
    'labor_rate', labor_rate,
    'unit_price', unit_price,
    'discount_type', discount_type,
    'discount_value', discount_value,
    'discount_amount', discount_amount,
    'tax_percent', tax_percent,
    'tax_amount', tax_amount,
    'subtotal', subtotal,
    'total', total
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Delete partida
CREATE OR REPLACE FUNCTION rpc_delete_cotizacion_partida(p_id uuid)
RETURNS boolean AS $$
BEGIN
  DELETE FROM cotizacion_partidas WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Get cotizacion status history
CREATE OR REPLACE FUNCTION rpc_get_cotizacion_status_history(p_cotizacion_id uuid)
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', id,
        'old_status', old_status,
        'new_status', new_status,
        'changed_by', changed_by,
        'notes', notes,
        'created_at', to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS')
      ) ORDER BY created_at DESC
    )
    FROM cotizacion_status_history
    WHERE cotizacion_id = p_cotizacion_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create cotizacion from vehicle in shop
CREATE OR REPLACE FUNCTION rpc_create_cotizacion_from_vehicle(
  p_vehicle_id uuid,
  p_created_by text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_vehicle RECORD;
  v_result json;
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
  ) INTO v_result;

  -- Create initial trabajo with service description
  PERFORM rpc_create_cotizacion_trabajo(
    p_cotizacion_id := (v_result->>'id')::uuid,
    p_name := v_vehicle.service,
    p_description := v_vehicle.notes
  );

  -- Return full cotizacion
  SELECT rpc_get_cotizacion_by_id((v_result->>'id')::uuid) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;