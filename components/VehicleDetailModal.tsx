import React, { useState, useEffect } from 'react';
import { VehicleInShop, Part } from '../types';
import { Modal } from './Modal';
import { PartsTable } from './PartsTable';
import { PartModal } from './PartModal';
import CommentsModal from './CommentsModal';
import { partsService } from '../services/partsService';

interface VehicleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleInShop;
}

export function VehicleDetailModal({ isOpen, onClose, vehicle }: VehicleDetailModalProps) {
  const [parts, setParts] = useState<Part[]>([]);
  const [isPartsLoading, setIsPartsLoading] = useState(true);
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | undefined>(undefined);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && vehicle) {
      loadParts();
    }
  }, [isOpen, vehicle]);

  const loadParts = async () => {
    try {
      setIsPartsLoading(true);
      const data = await partsService.getPartsByVehicle(vehicle.id);
      setParts(data);
    } catch (error) {
      console.error('Error loading parts:', error);
    } finally {
      setIsPartsLoading(false);
    }
  };

  const handleAddPart = () => {
    setEditingPart(undefined);
    setIsPartModalOpen(true);
  };

  const handleEditPart = (part: Part) => {
    setEditingPart(part);
    setIsPartModalOpen(true);
  };

  const handleSavePart = async (partData: Partial<Part>) => {
    if (editingPart) {
      await partsService.updatePart(vehicle.id, editingPart.id, partData);
    } else {
      await partsService.createPart(vehicle.id, partData);
    }
    await loadParts();
    setIsPartModalOpen(false);
  };

  const handleDeletePart = async (partId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta refacción?')) return;

    try {
      await partsService.deletePart(vehicle.id, partId);
      await loadParts();
    } catch (error) {
      console.error('Error deleting part:', error);
      alert('Error al eliminar la refacción');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Detalles del Vehículo" size="large">
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Vehículo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-semibold text-gray-900">{vehicle.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vehículo</p>
                <p className="font-semibold text-gray-900">{vehicle.vehicle}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Servicio</p>
                <p className="font-semibold text-gray-900">{vehicle.service}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contacto</p>
                <p className="font-semibold text-gray-900">{vehicle.contact}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha de Entrada</p>
                <p className="font-semibold text-gray-900">{formatDate(vehicle.checkInDate)}</p>
              </div>
              {vehicle.estimatedCompletion && (
                <div>
                  <p className="text-sm text-gray-600">Estimado de Salida</p>
                  <p className="font-semibold text-gray-900">{formatDate(vehicle.estimatedCompletion)}</p>
                </div>
              )}
              {vehicle.technician && (
                <div>
                  <p className="text-sm text-gray-600">Técnico</p>
                  <p className="font-semibold text-gray-900">{vehicle.technician}</p>
                </div>
              )}
              {vehicle.laborHours !== undefined && vehicle.laborHours > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Horas de Trabajo</p>
                  <p className="font-semibold text-gray-900">{vehicle.laborHours} hrs</p>
                </div>
              )}
              {vehicle.folio && (
                <div>
                  <p className="text-sm text-gray-600">Folio</p>
                  <p className="font-semibold text-gray-900">{vehicle.folio}</p>
                </div>
              )}
            </div>

            {vehicle.tags && vehicle.tags.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Etiquetas</p>
                <div className="flex flex-wrap gap-2">
                  {vehicle.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {vehicle.notes && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">Notas</p>
                <p className="text-gray-900 mt-1">{vehicle.notes}</p>
              </div>
            )}
          </div>

          <div>
            {isPartsLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Cargando refacciones...</p>
              </div>
            ) : (
              <PartsTable
                parts={parts}
                onAddPart={handleAddPart}
                onEditPart={handleEditPart}
                onDeletePart={handleDeletePart}
              />
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsCommentsModalOpen(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Ver Comentarios
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      <PartModal
        isOpen={isPartModalOpen}
        onClose={() => setIsPartModalOpen(false)}
        onSave={handleSavePart}
        part={editingPart}
        vehicleId={vehicle.id}
      />

      <CommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => setIsCommentsModalOpen(false)}
        vehicleId={vehicle.id}
        vehicleName={vehicle.vehicle}
      />
    </>
  );
}
