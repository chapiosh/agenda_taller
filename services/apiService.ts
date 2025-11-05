import { createClient } from '@supabase/supabase-js';
import { Appointment, AppointmentStatus } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const getAppointments = async (): Promise<Appointment[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, customer_name, vehicle, service, contact, status, tags, to_char(date, \'YYYY-MM-DD"T"HH24:MI:SS\') as date')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    customerName: row.customer_name,
    vehicle: row.vehicle,
    service: row.service,
    date: row.date,
    contact: row.contact,
    status: row.status as AppointmentStatus,
    tags: row.tags || [],
  }));
};

export const createAppointment = async (data: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> => {
  console.log('Creating appointment with date:', data.date);
  const { data: result, error } = await supabase.rpc('rpc_create_appointment', {
    p_customer_name: data.customerName,
    p_vehicle: data.vehicle,
    p_service: data.service,
    p_date: data.date,
    p_contact: data.contact,
    p_tags: data.tags || [],
  });

  if (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }

  console.log('Created appointment returned:', result);

  return {
    id: result.id,
    customerName: result.customer_name,
    vehicle: result.vehicle,
    service: result.service,
    date: result.date,
    contact: result.contact,
    status: result.status as AppointmentStatus,
    tags: result.tags || [],
  };
};

export const updateAppointment = async (updatedData: Appointment): Promise<Appointment> => {
  console.log('Updating appointment with date:', updatedData.date);
  const { data: result, error } = await supabase.rpc('rpc_update_appointment', {
    p_id: updatedData.id,
    p_customer_name: updatedData.customerName,
    p_vehicle: updatedData.vehicle,
    p_service: updatedData.service,
    p_date: updatedData.date,
    p_contact: updatedData.contact,
    p_status: updatedData.status,
    p_tags: updatedData.tags || [],
  });

  if (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }

  console.log('Updated appointment returned:', result);

  return {
    id: result.id,
    customerName: result.customer_name,
    vehicle: result.vehicle,
    service: result.service,
    date: result.date,
    contact: result.contact,
    status: result.status as AppointmentStatus,
    tags: result.tags || [],
  };
};

export const deleteAppointment = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
};