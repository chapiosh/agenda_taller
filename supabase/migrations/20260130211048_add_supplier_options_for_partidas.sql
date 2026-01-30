/*
  # Add supplier options for partidas (parts)

  1. New Table
    - `cotizacion_partida_proveedores` - Stores multiple supplier options per part
      - `id` (uuid, primary key)
      - `partida_id` (uuid, foreign key to cotizacion_partidas)
      - `proveedor` (text) - Supplier name
      - `costo` (numeric) - Cost from this supplier
      - `is_selected` (boolean) - Whether this supplier is selected for the quote
      - `created_at` (timestamp)

  2. Security
    - Enable RLS with public access policies
*/

-- Create table for supplier options
CREATE TABLE IF NOT EXISTS cotizacion_partida_proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partida_id uuid NOT NULL REFERENCES cotizacion_partidas(id) ON DELETE CASCADE,
  proveedor text NOT NULL,
  costo numeric(12,2) NOT NULL DEFAULT 0,
  is_selected boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partida_proveedores_partida ON cotizacion_partida_proveedores(partida_id);

-- Enable RLS
ALTER TABLE cotizacion_partida_proveedores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read on cotizacion_partida_proveedores"
  ON cotizacion_partida_proveedores FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert on cotizacion_partida_proveedores"
  ON cotizacion_partida_proveedores FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public update on cotizacion_partida_proveedores"
  ON cotizacion_partida_proveedores FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow public delete on cotizacion_partida_proveedores"
  ON cotizacion_partida_proveedores FOR DELETE TO anon USING (true);

-- Function to add a supplier option
CREATE OR REPLACE FUNCTION rpc_add_partida_proveedor(
  p_partida_id uuid,
  p_proveedor text,
  p_costo numeric,
  p_is_selected boolean DEFAULT false
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_partida_tipo text;
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

  INSERT INTO cotizacion_partida_proveedores (partida_id, proveedor, costo, is_selected)
  VALUES (p_partida_id, p_proveedor, p_costo, p_is_selected)
  RETURNING jsonb_build_object(
    'id', id,
    'partida_id', partida_id,
    'proveedor', proveedor,
    'costo', costo,
    'is_selected', is_selected
  ) INTO v_result;

  -- If selected, update partida cost
  IF p_is_selected THEN
    UPDATE cotizacion_partidas
    SET cost = p_costo
    WHERE id = p_partida_id;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to update a supplier option
CREATE OR REPLACE FUNCTION rpc_update_partida_proveedor(
  p_id uuid,
  p_proveedor text DEFAULT NULL,
  p_costo numeric DEFAULT NULL,
  p_is_selected boolean DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_partida_id uuid;
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
    is_selected = COALESCE(p_is_selected, is_selected)
  WHERE id = p_id
  RETURNING jsonb_build_object(
    'id', id,
    'partida_id', partida_id,
    'proveedor', proveedor,
    'costo', costo,
    'is_selected', is_selected
  ) INTO v_result;

  -- If selected, update partida cost
  IF COALESCE(p_is_selected, (SELECT is_selected FROM cotizacion_partida_proveedores WHERE id = p_id)) THEN
    UPDATE cotizacion_partidas
    SET cost = (SELECT costo FROM cotizacion_partida_proveedores WHERE id = p_id)
    WHERE id = v_partida_id;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to delete a supplier option
CREATE OR REPLACE FUNCTION rpc_delete_partida_proveedor(p_id uuid)
RETURNS boolean AS $$
DECLARE
  v_partida_id uuid;
  v_was_selected boolean;
BEGIN
  SELECT partida_id, is_selected INTO v_partida_id, v_was_selected
  FROM cotizacion_partida_proveedores WHERE id = p_id;

  DELETE FROM cotizacion_partida_proveedores WHERE id = p_id;

  -- If deleted was selected, select another one if available
  IF v_was_selected THEN
    UPDATE cotizacion_partida_proveedores
    SET is_selected = true
    WHERE id = (
      SELECT id FROM cotizacion_partida_proveedores
      WHERE partida_id = v_partida_id
      ORDER BY costo ASC
      LIMIT 1
    );

    -- Update partida cost with new selected
    UPDATE cotizacion_partidas
    SET cost = COALESCE(
      (SELECT costo FROM cotizacion_partida_proveedores WHERE partida_id = v_partida_id AND is_selected = true),
      0
    )
    WHERE id = v_partida_id;
  END IF;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to select a supplier (convenience function)
CREATE OR REPLACE FUNCTION rpc_select_partida_proveedor(p_id uuid)
RETURNS jsonb AS $$
BEGIN
  RETURN rpc_update_partida_proveedor(p_id, NULL, NULL, true);
END;
$$ LANGUAGE plpgsql;

-- Function to get proveedores for a partida
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
        'is_selected', is_selected
      ) ORDER BY costo ASC
    )
    FROM cotizacion_partida_proveedores
    WHERE partida_id = p_partida_id),
    '[]'::jsonb
  );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION rpc_add_partida_proveedor(uuid, text, numeric, boolean) TO anon;
GRANT EXECUTE ON FUNCTION rpc_update_partida_proveedor(uuid, text, numeric, boolean) TO anon;
GRANT EXECUTE ON FUNCTION rpc_delete_partida_proveedor(uuid) TO anon;
GRANT EXECUTE ON FUNCTION rpc_select_partida_proveedor(uuid) TO anon;
GRANT EXECUTE ON FUNCTION rpc_get_partida_proveedores(uuid) TO anon;

-- Update rpc_get_cotizacion_by_id to include proveedores in partidas
DROP FUNCTION IF EXISTS rpc_get_cotizacion_by_id(uuid);

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

  -- Get trabajos with partidas (including proveedores)
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
                  'is_selected', prov.is_selected
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

-- Re-grant permission for updated function
GRANT EXECUTE ON FUNCTION rpc_get_cotizacion_by_id(uuid) TO anon;