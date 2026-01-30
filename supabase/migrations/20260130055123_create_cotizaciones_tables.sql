/*
  # Create Cotizaciones (Quotations) Tables

  1. New Tables
    - `configuracion_taller` - Global shop configuration (margins, rates, tax, etc.)
    - `cotizaciones` - Main quotation header with customer/vehicle info
    - `cotizacion_trabajos` - Work items/jobs within a quotation
    - `cotizacion_partidas` - Line items within a job (parts, labor, etc.)
    - `cotizacion_status_history` - Audit trail for status changes

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (anon key)

  3. Notes
    - Folio auto-generated as COT-YYYYMMDD-XXXX
    - Calculations cascade: partidas -> trabajos -> cotizacion
*/

-- Configuracion Taller (Global Settings)
CREATE TABLE IF NOT EXISTS configuracion_taller (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Insert default configuration values
INSERT INTO configuracion_taller (key, value, description) VALUES
  ('default_parts_margin_percent', '30', 'Margen de ganancia por defecto para refacciones (%)'),
  ('default_labor_rate', '350', 'Tarifa por hora de mano de obra por defecto'),
  ('default_tax_percent', '16', 'Porcentaje de IVA por defecto'),
  ('default_validity_days', '7', 'Días de validez de cotización por defecto'),
  ('company_name', 'Taller Mecánico', 'Nombre del taller para impresión'),
  ('company_address', '', 'Dirección del taller para impresión'),
  ('company_phone', '', 'Teléfono del taller para impresión'),
  ('company_email', '', 'Email del taller para impresión')
ON CONFLICT (key) DO NOTHING;

-- Cotizaciones (Quotations)
CREATE TABLE IF NOT EXISTS cotizaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_contact text,
  vehicle text NOT NULL,
  vehicle_id uuid REFERENCES vehicles_in_shop(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'BORRADOR' CHECK (status IN ('BORRADOR', 'ENVIADA', 'ACEPTADA', 'RECHAZADA', 'VENCIDA')),
  quote_date timestamp NOT NULL DEFAULT now(),
  valid_until timestamp,
  default_parts_margin_percent numeric(5,2) DEFAULT 30,
  default_labor_rate numeric(10,2) DEFAULT 350,
  subtotal numeric(12,2) DEFAULT 0,
  total_discount numeric(12,2) DEFAULT 0,
  total_taxes numeric(12,2) DEFAULT 0,
  total numeric(12,2) DEFAULT 0,
  notes text,
  terms_and_conditions text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  created_by text
);

-- Create index for folio lookups
CREATE INDEX IF NOT EXISTS idx_cotizaciones_folio ON cotizaciones(folio);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_status ON cotizaciones(status);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_customer ON cotizaciones(customer_name);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_quote_date ON cotizaciones(quote_date DESC);

-- Cotizacion Trabajos (Jobs/Work Items)
CREATE TABLE IF NOT EXISTS cotizacion_trabajos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id uuid NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  subtotal numeric(12,2) DEFAULT 0,
  total_discount numeric(12,2) DEFAULT 0,
  total_taxes numeric(12,2) DEFAULT 0,
  total numeric(12,2) DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cotizacion_trabajos_cotizacion ON cotizacion_trabajos(cotizacion_id);

-- Cotizacion Partidas (Line Items)
CREATE TABLE IF NOT EXISTS cotizacion_partidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trabajo_id uuid NOT NULL REFERENCES cotizacion_trabajos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('REFACCION', 'MANO_DE_OBRA', 'ARTICULOS_TALLER', 'CARGO_FIJO', 'OTRO')),
  description text NOT NULL,
  sort_order integer DEFAULT 0,
  quantity numeric(10,4) DEFAULT 1,
  unit text DEFAULT 'pza',
  -- For parts (REFACCION)
  cost numeric(12,2),
  margin_percent numeric(5,2),
  -- For labor (MANO_DE_OBRA)
  hours numeric(10,2),
  labor_rate numeric(10,2),
  -- Calculated/direct price
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  -- Discount
  discount_type text DEFAULT 'AMOUNT' CHECK (discount_type IN ('AMOUNT', 'PERCENT')),
  discount_value numeric(12,2) DEFAULT 0,
  discount_amount numeric(12,2) DEFAULT 0,
  -- Tax
  tax_percent numeric(5,2) DEFAULT 16,
  tax_amount numeric(12,2) DEFAULT 0,
  -- Totals
  subtotal numeric(12,2) DEFAULT 0,
  total numeric(12,2) DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cotizacion_partidas_trabajo ON cotizacion_partidas(trabajo_id);

-- Cotizacion Status History (Audit Trail)
CREATE TABLE IF NOT EXISTS cotizacion_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id uuid NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by text,
  notes text,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cotizacion_status_history_cotizacion ON cotizacion_status_history(cotizacion_id);

-- Enable Row Level Security
ALTER TABLE configuracion_taller ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizacion_trabajos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizacion_partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizacion_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public access (using anon key)
CREATE POLICY "Allow public read on configuracion_taller"
  ON configuracion_taller FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert on configuracion_taller"
  ON configuracion_taller FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public update on configuracion_taller"
  ON configuracion_taller FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow public read on cotizaciones"
  ON cotizaciones FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert on cotizaciones"
  ON cotizaciones FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public update on cotizaciones"
  ON cotizaciones FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow public delete on cotizaciones"
  ON cotizaciones FOR DELETE TO anon USING (true);

CREATE POLICY "Allow public read on cotizacion_trabajos"
  ON cotizacion_trabajos FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert on cotizacion_trabajos"
  ON cotizacion_trabajos FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public update on cotizacion_trabajos"
  ON cotizacion_trabajos FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow public delete on cotizacion_trabajos"
  ON cotizacion_trabajos FOR DELETE TO anon USING (true);

CREATE POLICY "Allow public read on cotizacion_partidas"
  ON cotizacion_partidas FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert on cotizacion_partidas"
  ON cotizacion_partidas FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public update on cotizacion_partidas"
  ON cotizacion_partidas FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow public delete on cotizacion_partidas"
  ON cotizacion_partidas FOR DELETE TO anon USING (true);

CREATE POLICY "Allow public read on cotizacion_status_history"
  ON cotizacion_status_history FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert on cotizacion_status_history"
  ON cotizacion_status_history FOR INSERT TO anon WITH CHECK (true);

-- Function to generate folio
CREATE OR REPLACE FUNCTION generate_cotizacion_folio()
RETURNS text AS $$
DECLARE
  v_date text;
  v_seq integer;
  v_folio text;
BEGIN
  v_date := to_char(now(), 'YYYYMMDD');

  -- Get next sequence number for today
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(folio FROM 'COT-' || v_date || '-([0-9]+)') AS integer)
  ), 0) + 1
  INTO v_seq
  FROM cotizaciones
  WHERE folio LIKE 'COT-' || v_date || '-%';

  v_folio := 'COT-' || v_date || '-' || LPAD(v_seq::text, 4, '0');

  RETURN v_folio;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate folio on insert
CREATE OR REPLACE FUNCTION set_cotizacion_folio()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.folio IS NULL OR NEW.folio = '' THEN
    NEW.folio := generate_cotizacion_folio();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_cotizacion_folio
  BEFORE INSERT ON cotizaciones
  FOR EACH ROW
  EXECUTE FUNCTION set_cotizacion_folio();

-- Function to calculate partida totals
CREATE OR REPLACE FUNCTION calculate_partida_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate unit_price based on tipo
  IF NEW.tipo = 'REFACCION' AND NEW.cost IS NOT NULL AND NEW.margin_percent IS NOT NULL THEN
    NEW.unit_price := NEW.cost * (1 + NEW.margin_percent / 100);
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

CREATE TRIGGER trigger_calculate_partida_totals
  BEFORE INSERT OR UPDATE ON cotizacion_partidas
  FOR EACH ROW
  EXECUTE FUNCTION calculate_partida_totals();

-- Function to recalculate trabajo totals
CREATE OR REPLACE FUNCTION recalculate_trabajo_totals(p_trabajo_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE cotizacion_trabajos
  SET
    subtotal = COALESCE((SELECT SUM(subtotal) FROM cotizacion_partidas WHERE trabajo_id = p_trabajo_id), 0),
    total_discount = COALESCE((SELECT SUM(discount_amount) FROM cotizacion_partidas WHERE trabajo_id = p_trabajo_id), 0),
    total_taxes = COALESCE((SELECT SUM(tax_amount) FROM cotizacion_partidas WHERE trabajo_id = p_trabajo_id), 0),
    total = COALESCE((SELECT SUM(total) FROM cotizacion_partidas WHERE trabajo_id = p_trabajo_id), 0),
    updated_at = now()
  WHERE id = p_trabajo_id;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate cotizacion totals
CREATE OR REPLACE FUNCTION recalculate_cotizacion_totals(p_cotizacion_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE cotizaciones
  SET
    subtotal = COALESCE((SELECT SUM(subtotal) FROM cotizacion_trabajos WHERE cotizacion_id = p_cotizacion_id), 0),
    total_discount = COALESCE((SELECT SUM(total_discount) FROM cotizacion_trabajos WHERE cotizacion_id = p_cotizacion_id), 0),
    total_taxes = COALESCE((SELECT SUM(total_taxes) FROM cotizacion_trabajos WHERE cotizacion_id = p_cotizacion_id), 0),
    total = COALESCE((SELECT SUM(total) FROM cotizacion_trabajos WHERE cotizacion_id = p_cotizacion_id), 0),
    updated_at = now()
  WHERE id = p_cotizacion_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update trabajo totals when partida changes
CREATE OR REPLACE FUNCTION trigger_update_trabajo_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_trabajo_totals(OLD.trabajo_id);
    RETURN OLD;
  ELSE
    PERFORM recalculate_trabajo_totals(NEW.trabajo_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_partida_update_trabajo
  AFTER INSERT OR UPDATE OR DELETE ON cotizacion_partidas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_trabajo_totals();

-- Trigger to update cotizacion totals when trabajo changes
CREATE OR REPLACE FUNCTION trigger_update_cotizacion_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_cotizacion_totals(OLD.cotizacion_id);
    RETURN OLD;
  ELSE
    PERFORM recalculate_cotizacion_totals(NEW.cotizacion_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_trabajo_update_cotizacion
  AFTER INSERT OR UPDATE OR DELETE ON cotizacion_trabajos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_cotizacion_totals();