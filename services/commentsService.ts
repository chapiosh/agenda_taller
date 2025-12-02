import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface VehicleComment {
  id: string;
  vehicleId: string;
  comment: string;
  createdAt: string;
}

export const getVehicleComments = async (vehicleId: string): Promise<VehicleComment[]> => {
  const { data, error } = await supabase.rpc('rpc_get_vehicle_comments', {
    p_vehicle_id: vehicleId
  });

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  if (!data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    vehicleId: row.vehicle_id,
    comment: row.comment,
    createdAt: row.created_at,
  }));
};

export const createVehicleComment = async (
  vehicleId: string,
  comment: string
): Promise<VehicleComment> => {
  const { data: result, error } = await supabase.rpc('rpc_create_vehicle_comment', {
    p_vehicle_id: vehicleId,
    p_comment: comment,
  });

  if (error) {
    console.error('Error creating comment:', error);
    throw error;
  }

  return {
    id: result.id,
    vehicleId: result.vehicle_id,
    comment: result.comment,
    createdAt: result.created_at,
  };
};
