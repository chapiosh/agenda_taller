import { createClient } from '@supabase/supabase-js';
import { VehicleInShop } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const getVehiclesInShop = async (): Promise<VehicleInShop[]> => {
  const { data, error } = await supabase.rpc('rpc_get_vehicles_in_shop');

  if (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }

  if (!data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    customerName: row.customer_name,
    vehicle: row.vehicle,
    service: row.service,
    contact: row.contact,
    checkInDate: row.check_in_date,
    estimatedCompletion: row.estimated_completion,
    notes: row.notes,
    tags: row.tags || [],
    deliveredAt: row.delivered_at,
    technician: row.technician,
    laborHours: row.labor_hours,
  }));
};

export const getDeliveredVehicles = async (): Promise<VehicleInShop[]> => {
  const { data, error } = await supabase.rpc('rpc_get_delivered_vehicles');

  if (error) {
    console.error('Error fetching delivered vehicles:', error);
    throw error;
  }

  if (!data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    customerName: row.customer_name,
    vehicle: row.vehicle,
    service: row.service,
    contact: row.contact,
    checkInDate: row.check_in_date,
    estimatedCompletion: row.estimated_completion,
    notes: row.notes,
    tags: row.tags || [],
    deliveredAt: row.delivered_at,
    technician: row.technician,
    laborHours: row.labor_hours,
  }));
};

export const createVehicleInShop = async (data: Omit<VehicleInShop, 'id'>): Promise<VehicleInShop> => {
  const { data: result, error } = await supabase.rpc('rpc_create_vehicle_in_shop', {
    p_customer_name: data.customerName,
    p_vehicle: data.vehicle,
    p_service: data.service,
    p_contact: data.contact,
    p_check_in_date: data.checkInDate,
    p_estimated_completion: data.estimatedCompletion || null,
    p_notes: data.notes || '',
    p_tags: data.tags || [],
    p_technician: data.technician || null,
    p_labor_hours: data.laborHours || 0,
  });

  if (error) {
    console.error('Error creating vehicle:', error);
    throw error;
  }

  return {
    id: result.id,
    customerName: result.customer_name,
    vehicle: result.vehicle,
    service: result.service,
    contact: result.contact,
    checkInDate: result.check_in_date,
    estimatedCompletion: result.estimated_completion,
    notes: result.notes,
    tags: result.tags || [],
    technician: result.technician,
    laborHours: result.labor_hours,
  };
};

export const updateVehicleInShop = async (updatedData: VehicleInShop): Promise<VehicleInShop> => {
  const { data: result, error } = await supabase.rpc('rpc_update_vehicle_in_shop', {
    p_id: updatedData.id,
    p_customer_name: updatedData.customerName,
    p_vehicle: updatedData.vehicle,
    p_service: updatedData.service,
    p_contact: updatedData.contact,
    p_check_in_date: updatedData.checkInDate,
    p_estimated_completion: updatedData.estimatedCompletion || null,
    p_notes: updatedData.notes || '',
    p_tags: updatedData.tags || [],
    p_technician: updatedData.technician || null,
    p_labor_hours: updatedData.laborHours || 0,
  });

  if (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }

  return {
    id: result.id,
    customerName: result.customer_name,
    vehicle: result.vehicle,
    service: result.service,
    contact: result.contact,
    checkInDate: result.check_in_date,
    estimatedCompletion: result.estimated_completion,
    notes: result.notes,
    tags: result.tags || [],
    technician: result.technician,
    laborHours: result.labor_hours,
  };
};

export const deleteVehicleInShop = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('vehicles_in_shop')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
};

export const markVehicleAsDelivered = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('vehicles_in_shop')
    .update({ delivered_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error marking vehicle as delivered:', error);
    throw error;
  }
};
