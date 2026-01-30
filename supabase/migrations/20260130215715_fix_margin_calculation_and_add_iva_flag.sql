/*
  # Fix margin calculation and add IVA flag to suppliers

  1. Changes
    - Add `incluye_iva` column to cotizacion_partida_proveedores
    - Update margin calculation formula:
      Old: unitPrice = cost * (1 + marginPercent / 100)  -- markup
      New: unitPrice = cost / (1 - marginPercent / 100)  -- margin
    - If supplier cost doesn't include IVA, add IVA to cost first

  2. Formula explanation
    - Margin formula: Precio Venta = Costo / (1 - Porcentaje de Utilidad)
    - Example: Cost $100, Margin 30% -> $100 / (1 - 0.30) = $100 / 0.70 = $142.86
*/

-- Add incluye_iva column to proveedores
ALTER TABLE cotizacion_partida_proveedores
ADD COLUMN IF NOT EXISTS incluye_iva boolean DEFAULT true;

-- Update the trigger function for calculating partida totals
CREATE OR REPLACE FUNCTION calculate_partida_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_tax_rate numeric;
BEGIN
  -- Get default tax rate from config
  SELECT COALESCE(value::numeric, 16) INTO v_tax_rate
  FROM configuracion_taller
  WHERE key = 'default_tax_percent';

  -- Calculate unit_price based on tipo
  IF NEW.tipo = 'REFACCION' AND NEW.cost IS NOT NULL AND NEW.margin_percent IS NOT NULL THEN
    -- Margin formula: Precio Venta = Costo / (1 - Margen%)
    -- Protect against division by zero (margin >= 100%)
    IF NEW.margin_percent >= 100 THEN
      NEW.unit_price := NEW.cost * 10; -- Fallback for invalid margin
    ELSE
      NEW.unit_price := NEW.cost / (1 - NEW.margin_percent / 100);
    END IF;
  ELSIF NEW.tipo = 'MANO_DE_OBRA' AND NEW.hours IS NOT NULL AND NEW.labor_rate IS NOT NULL THEN
    NEW.unit_price := NEW.hours * NEW.labor_rate;
  END IF;

  -- Calculate subtotal
  NEW.subtotal := NEW.quantity * NEW.unit_price;

  -- Calculate discount amount
  IF NEW.discount_type = 'PERCENT' THEN
    NEW.discount_amount := NEW.subtotal * COALESCE(NEW.discount_value, 0) / 100;
  ELSE
    NEW.discount_amount := COALESCE(NEW.discount_value, 0);
  END IF;

  -- Calculate tax amount
  NEW.tax_amount := (NEW.subtotal - NEW.discount_amount) * COALESCE(NEW.tax_percent, 0) / 100;

  -- Calculate total
  NEW.total := NEW.subtotal - NEW.discount_amount + NEW.tax_amount;

  NEW.updated_at := now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update rpc_add_partida_proveedor to include incluye_iva
CREATE OR REPLACE FUNCTION rpc_add_partida_proveedor(
  p_partida_id uuid,
  p_proveedor text,
  p_costo numeric,
  p_is_selected boolean DEFAULT false,
  p_incluye_iva boolean DEFAULT true
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_partida_tipo text;
  v_costo_final numeric;
  v_tax_rate numeric;
BEGIN
  -- Verify partida is REFACCION type
  SELECT tipo INTO v_partida_tipo FROM cotizacion_partidas WHERE id = p_partida_id;

  IF v_partida_tipo != 'REFACCION' THEN
    RAISE EXCEPTION 'Solo se pueden agregar proveedores a partidas de tipo REFACCION';
  END IF;

  -- If this is selected, unselect others
  IF p_is_selected THEN
    UPDATE cotizacion_partida_proveedores
    SET is_selected = false
    WHERE partida_id = p_partida_id;
  END IF;

  INSERT INTO cotizacion_partida_proveedores (partida_id, proveedor, costo, is_selected, incluye_iva)
  VALUES (p_partida_id, p_proveedor, p_costo, p_is_selected, p_incluye_iva)
  RETURNING jsonb_build_object(
    'id', id,
    'partida_id', partida_id,
    'proveedor', proveedor,
    'costo', costo,
    'is_selected', is_selected,
    'incluye_iva', incluye_iva
  ) INTO v_result;

  -- If selected, update partida cost (adding IVA if needed)
  IF p_is_selected THEN
    -- Get tax rate
    SELECT COALESCE(value::numeric, 16) INTO v_tax_rate
    FROM configuracion_taller
    WHERE key = 'default_tax_percent';

    -- Calculate final cost (add IVA if not included)
    IF p_incluye_iva THEN
      v_costo_final := p_costo;
    ELSE
      v_costo_final := p_costo * (1 + v_tax_rate / 100);
    END IF;

    UPDATE cotizacion_partidas
    SET cost = v_costo_final
    WHERE id = p_partida_id;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Update rpc_update_partida_proveedor to include incluye_iva
CREATE OR REPLACE FUNCTION rpc_update_partida_proveedor(
  p_id uuid,
  p_proveedor text DEFAULT NULL,
  p_costo numeric DEFAULT NULL,
  p_is_selected boolean DEFAULT NULL,
  p_incluye_iva boolean DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_partida_id uuid;
  v_costo_final numeric;
  v_tax_rate numeric;
  v_incluye_iva boolean;
  v_costo numeric;
BEGIN
  -- Get partida_id
  SELECT partida_id INTO v_partida_id FROM cotizacion_partida_proveedores WHERE id = p_id;

  -- If this is being selected, unselect others
  IF p_is_selected = true THEN
    UPDATE cotizacion_partida_proveedores
    SET is_selected = false
    WHERE partida_id = v_partida_id AND id != p_id;
  END IF;

  UPDATE cotizacion_partida_proveedores
  SET
    proveedor = COALESCE(p_proveedor, proveedor),
    costo = COALESCE(p_costo, costo),
    is_selected = COALESCE(p_is_selected, is_selected),
    incluye_iva = COALESCE(p_incluye_iva, incluye_iva)
  WHERE id = p_id
  RETURNING jsonb_build_object(
    'id', id,
    'partida_id', partida_id,
    'proveedor', proveedor,
    'costo', costo,
    'is_selected', is_selected,
    'incluye_iva', incluye_iva
  ) INTO v_result;

  -- If selected, update partida cost
  SELECT costo, incluye_iva INTO v_costo, v_incluye_iva
  FROM cotizacion_partida_proveedores WHERE id = p_id;

  IF COALESCE(p_is_selected, (SELECT is_selected FROM cotizacion_partida_proveedores WHERE id = p_id)) THEN
    -- Get tax rate
    SELECT COALESCE(value::numeric, 16) INTO v_tax_rate
    FROM configuracion_taller
    WHERE key = 'default_tax_percent';

    -- Calculate final cost (add IVA if not included)
    IF v_incluye_iva THEN
      v_costo_final := v_costo;
    ELSE
      v_costo_final := v_costo * (1 + v_tax_rate / 100);
    END IF;

    UPDATE cotizacion_partidas
    SET cost = v_costo_final
    WHERE id = v_partida_id;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Update rpc_get_partida_proveedores to include incluye_iva
CREATE OR REPLACE FUNCTION rpc_get_partida_proveedores(p_partida_id uuid)
RETURNS jsonb AS $$
BEGIN
  RETURN COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'partida_id', partida_id,
        'proveedor', proveedor,
        'costo', costo,
        'is_selected', is_selected,
        'incluye_iva', incluye_iva
      ) ORDER BY costo ASC
    )
    FROM cotizacion_partida_proveedores
    WHERE partida_id = p_partida_id),
    '[]'::jsonb
  );
END;
$$ LANGUAGE plpgsql;

-- Update rpc_get_cotizacion_by_id to include incluye_iva in proveedores
CREATE OR REPLACE FUNCTION rpc_get_cotizacion_by_id(p_id uuid)
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION rpc_add_partida_proveedor(uuid, text, numeric, boolean, boolean) TO anon;
GRANT EXECUTE ON FUNCTION rpc_update_partida_proveedor(uuid, text, numeric, boolean, boolean) TO anon;
GRANT EXECUTE ON FUNCTION rpc_get_partida_proveedores(uuid) TO anon;
GRANT EXECUTE ON FUNCTION rpc_get_cotizacion_by_id(uuid) TO anon;