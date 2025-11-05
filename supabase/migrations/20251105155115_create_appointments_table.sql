/*
  # Create appointments table for mechanic appointment manager

  1. New Tables
    - `appointments`
      - `id` (uuid, primary key) - Unique identifier for each appointment
      - `customer_name` (text) - Name of the customer
      - `vehicle` (text) - Vehicle information (make, model, year, etc.)
      - `service` (text) - Type of service requested
      - `date` (timestamptz) - Date and time of the appointment
      - `contact` (text) - Customer contact information (phone/email)
      - `status` (text) - Appointment status (Scheduled, Completed, Canceled)
      - `created_at` (timestamptz) - Timestamp when the appointment was created
      - `updated_at` (timestamptz) - Timestamp when the appointment was last updated

  2. Security
    - Enable RLS on `appointments` table
    - Add policy for public read access (anyone can view appointments)
    - Add policy for public insert access (anyone can create appointments)
    - Add policy for public update access (anyone can update appointments)
    - Add policy for public delete access (anyone can delete appointments)
    
  Note: This app uses public access policies suitable for a small mechanic shop
  where all staff members need full access to manage appointments.
*/

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  vehicle text NOT NULL,
  service text NOT NULL,
  date timestamptz NOT NULL,
  contact text NOT NULL,
  status text NOT NULL DEFAULT 'Scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (suitable for shop internal use)
CREATE POLICY "Anyone can view appointments"
  ON appointments
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create appointments"
  ON appointments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update appointments"
  ON appointments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete appointments"
  ON appointments
  FOR DELETE
  USING (true);

-- Create index for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);

-- Create index for faster status-based queries
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
