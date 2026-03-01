import { Part } from '../types';

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;

export const partsService = {
  async getPartsByVehicle(vehicleId: string): Promise<Part[]> {
    const response = await fetch(`${API_URL}/vehicles/${vehicleId}/parts`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch parts');
    }
    const data = await response.json();
    return data.map((part: any) => ({
      id: part.id,
      vehicleId: part.vehicle_id,
      description: part.description,
      oemPartNumber: part.oem_part_number,
      alternativePartNumbers: part.alternative_part_numbers,
      supplier: part.supplier,
      supplierQuote: part.supplier_quote,
      purchasePrice: part.purchase_price,
      sellPrice: part.sell_price,
      status: part.status,
      orderedAt: part.ordered_at,
      receivedAt: part.received_at,
      installedAt: part.installed_at,
      notes: part.notes,
      createdAt: part.created_at,
      updatedAt: part.updated_at,
    }));
  },

  async createPart(vehicleId: string, part: Partial<Part>): Promise<Part> {
    const response = await fetch(`${API_URL}/vehicles/${vehicleId}/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: part.description,
        oem_part_number: part.oemPartNumber,
        alternative_part_numbers: part.alternativePartNumbers,
        supplier: part.supplier,
        supplier_quote: part.supplierQuote,
        purchase_price: part.purchasePrice,
        sell_price: part.sellPrice,
        status: part.status || 'quoted',
        ordered_at: part.orderedAt,
        received_at: part.receivedAt,
        installed_at: part.installedAt,
        notes: part.notes,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create part');
    }

    const data = await response.json();
    return {
      id: data.id,
      vehicleId: data.vehicle_id,
      description: data.description,
      oemPartNumber: data.oem_part_number,
      alternativePartNumbers: data.alternative_part_numbers,
      supplier: data.supplier,
      supplierQuote: data.supplier_quote,
      purchasePrice: data.purchase_price,
      sellPrice: data.sell_price,
      status: data.status,
      orderedAt: data.ordered_at,
      receivedAt: data.received_at,
      installedAt: data.installed_at,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updatePart(vehicleId: string, partId: string, updates: Partial<Part>): Promise<Part> {
    const response = await fetch(`${API_URL}/vehicles/${vehicleId}/parts/${partId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: updates.description,
        oem_part_number: updates.oemPartNumber,
        alternative_part_numbers: updates.alternativePartNumbers,
        supplier: updates.supplier,
        supplier_quote: updates.supplierQuote,
        purchase_price: updates.purchasePrice,
        sell_price: updates.sellPrice,
        status: updates.status,
        ordered_at: updates.orderedAt,
        received_at: updates.receivedAt,
        installed_at: updates.installedAt,
        notes: updates.notes,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update part');
    }

    const data = await response.json();
    return {
      id: data.id,
      vehicleId: data.vehicle_id,
      description: data.description,
      oemPartNumber: data.oem_part_number,
      alternativePartNumbers: data.alternative_part_numbers,
      supplier: data.supplier,
      supplierQuote: data.supplier_quote,
      purchasePrice: data.purchase_price,
      sellPrice: data.sell_price,
      status: data.status,
      orderedAt: data.ordered_at,
      receivedAt: data.received_at,
      installedAt: data.installed_at,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async deletePart(vehicleId: string, partId: string): Promise<void> {
    const response = await fetch(`${API_URL}/vehicles/${vehicleId}/parts/${partId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete part');
    }
  },
};
