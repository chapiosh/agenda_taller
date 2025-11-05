import { createClient } from '@supabase/supabase-js';
import { Appointment, AppointmentStatus } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const getAppointments = async (): Promise<Appointment[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
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
  const { data: newAppointment, error } = await supabase
    .from('appointments')
    .insert([
      {
        customer_name: data.customerName,
        vehicle: data.vehicle,
        service: data.service,
        date: data.date,
        contact: data.contact,
        status: AppointmentStatus.Scheduled,
        tags: data.tags || [],
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }

  return {
    id: newAppointment.id,
    customerName: newAppointment.customer_name,
    vehicle: newAppointment.vehicle,
    service: newAppointment.service,
    date: newAppointment.date,
    contact: newAppointment.contact,
    status: newAppointment.status as AppointmentStatus,
    tags: newAppointment.tags || [],
  };
};

export const updateAppointment = async (updatedData: Appointment): Promise<Appointment> => {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      customer_name: updatedData.customerName,
      vehicle: updatedData.vehicle,
      service: updatedData.service,
      date: updatedData.date,
      contact: updatedData.contact,
      status: updatedData.status,
      tags: updatedData.tags || [],
    })
    .eq('id', updatedData.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }

  return {
    id: data.id,
    customerName: data.customer_name,
    vehicle: data.vehicle,
    service: data.service,
    date: data.date,
    contact: data.contact,
    status: data.status as AppointmentStatus,
    tags: data.tags || [],
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