import { WorkflowData, VehicleInShop } from '../types';

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;

function transformVehicle(vehicle: any): VehicleInShop {
  return {
    id: vehicle.id,
    customerName: vehicle.customer_name,
    vehicle: vehicle.vehicle,
    service: vehicle.service,
    contact: vehicle.contact,
    checkInDate: vehicle.check_in_date,
    estimatedCompletion: vehicle.estimated_completion,
    notes: vehicle.notes,
    tags: vehicle.tags,
    deliveredAt: vehicle.delivered_at,
    technician: vehicle.technician,
    laborHours: vehicle.labor_hours,
    folio: vehicle.folio,
  };
}

export const workflowService = {
  async getWorkflow(): Promise<WorkflowData> {
    const response = await fetch(`${API_URL}/vehicles/workflow`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch workflow');
    }
    const data = await response.json();
    return {
      en_diagnostico: data.en_diagnostico?.map(transformVehicle) || [],
      esperando_aprobacion: data.esperando_aprobacion?.map(transformVehicle) || [],
      esperando_refacciones: data.esperando_refacciones?.map(transformVehicle) || [],
      refacciones_en_recepcion: data.refacciones_en_recepcion?.map(transformVehicle) || [],
      esperando_tecnico: data.esperando_tecnico?.map(transformVehicle) || [],
      en_reparacion: data.en_reparacion?.map(transformVehicle) || [],
      listo_para_entrega: data.listo_para_entrega?.map(transformVehicle) || [],
      garantia: data.garantia?.map(transformVehicle) || [],
    };
  },
};
