/*
  # Fix IVA extraction from supplier cost

  When supplier cost includes IVA, we need to extract the net cost before applying margin.
  This prevents double-charging IVA.

  Formula:
  - If cost includes IVA: costoNeto = costo / (1 + IVA%)
  - Then apply margin: precioVenta = costoNeto / (1 - margen%)
  - Sale IVA is calculated on the final price as usual
*/

-- Update rpc_add_partida_proveedor to extract IVA when included
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
  v_costo_neto numeric;
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

  -- If selected, update partida cost (extracting IVA if included)
  IF p_is_selected THEN
    -- Get tax rate
    SELECT COALESCE(value::numeric, 16) INTO v_tax_rate
    FROM configuracion_taller
    WHERE key = 'default_tax_percent';

    -- Calculate net cost (extract IVA if included)
    IF p_incluye_iva THEN
      v_costo_neto := p_costo / (1 + v_tax_rate / 100);
    ELSE
      v_costo_neto := p_costo;
    END IF;

    UPDATE cotizacion_partidas
    SET cost = v_costo_neto
    WHERE id = p_partida_id;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Update rpc_update_partida_proveedor to extract IVA when included
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
  v_costo_neto numeric;
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

    -- Calculate net cost (extract IVA if included)
    IF v_incluye_iva THEN
      v_costo_neto := v_costo / (1 + v_tax_rate / 100);
    ELSE
      v_costo_neto := v_costo;
    END IF;

    UPDATE cotizacion_partidas
    SET cost = v_costo_neto
    WHERE id = v_partida_id;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION rpc_add_partida_proveedor(uuid, text, numeric, boolean, boolean) TO anon;
GRANT EXECUTE ON FUNCTION rpc_update_partida_proveedor(uuid, text, numeric, boolean, boolean) TO anon;