import React, { useState, useEffect } from 'react';
import { Part, PART_STATUSES, PART_STATUS_LABELS } from '../types';
import { Modal } from './Modal';

interface PartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (part: Partial<Part>) => Promise<void>;
  part?: Part;
  vehicleId: string;
}

export function PartModal({ isOpen, onClose, onSave, part, vehicleId }: PartModalProps) {
  const [formData, setFormData] = useState<Partial<Part>>({
    description: '',
    oemPartNumber: '',
    supplier: '',
    supplierQuote: undefined,
    purchasePrice: undefined,
    sellPrice: undefined,
    status: 'quoted',
    orderedAt: '',
    receivedAt: '',
    installedAt: '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (part) {
      setFormData({
        description: part.description,
        oemPartNumber: part.oemPartNumber || '',
        supplier: part.supplier || '',
        supplierQuote: part.supplierQuote,
        purchasePrice: part.purchasePrice,
        sellPrice: part.sellPrice,
        status: part.status,
        orderedAt: part.orderedAt ? part.orderedAt.split('T')[0] : '',
        receivedAt: part.receivedAt ? part.receivedAt.split('T')[0] : '',
        installedAt: part.installedAt ? part.installedAt.split('T')[0] : '',
        notes: part.notes || '',
      });
    } else {
      setFormData({
        description: '',
        oemPartNumber: '',
        supplier: '',
        supplierQuote: undefined,
        purchasePrice: undefined,
        sellPrice: undefined,
        status: 'quoted',
        orderedAt: '',
        receivedAt: '',
        installedAt: '',
        notes: '',
      });
    }
  }, [part, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const partData: Partial<Part> = {
        ...formData,
        orderedAt: formData.orderedAt ? new Date(formData.orderedAt).toISOString() : undefined,
        receivedAt: formData.receivedAt ? new Date(formData.receivedAt).toISOString() : undefined,
        installedAt: formData.installedAt ? new Date(formData.installedAt).toISOString() : undefined,
      };
      await onSave(partData);
      onClose();
    } catch (error) {
      console.error('Error saving part:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar refacción');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={part ? 'Editar Refacción' : 'Agregar Refacción'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción *
          </label>
          <input
            type="text"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Bomba de agua"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              No. OEM
            </label>
            <input
              type="text"
              value={formData.oemPartNumber}
              onChange={(e) => setFormData({ ...formData, oemPartNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: 12345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proveedor
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Proveedor A"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cotización
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.supplierQuote || ''}
              onChange={(e) => setFormData({ ...formData, supplierQuote: e.target.value ? parseFloat(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo de Compra
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.purchasePrice || ''}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio de Venta
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.sellPrice || ''}
              onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado *
          </label>
          <select
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Part['status'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {PART_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PART_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Pedido
            </label>
            <input
              type="date"
              value={formData.orderedAt}
              onChange={(e) => setFormData({ ...formData, orderedAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Recepción
            </label>
            <input
              type="date"
              value={formData.receivedAt}
              onChange={(e) => setFormData({ ...formData, receivedAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Instalación
            </label>
            <input
              type="date"
              value={formData.installedAt}
              onChange={(e) => setFormData({ ...formData, installedAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Notas adicionales..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : (part ? 'Actualizar' : 'Agregar')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
