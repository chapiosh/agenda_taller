import React, { useEffect, useState } from 'react';
import { WorkflowData, VehicleInShop } from '../types';
import { workflowService } from '../services/workflowService';

interface WorkflowColumn {
  key: keyof WorkflowData;
  title: string;
  color: string;
}

const WORKFLOW_COLUMNS: WorkflowColumn[] = [
  { key: 'en_diagnostico', title: 'En Diagnóstico', color: 'bg-purple-100 border-purple-300' },
  { key: 'esperando_aprobacion', title: 'Esperando Aprobación', color: 'bg-yellow-100 border-yellow-300' },
  { key: 'esperando_refacciones', title: 'Esperando Refacciones', color: 'bg-orange-100 border-orange-300' },
  { key: 'refacciones_en_recepcion', title: 'Refacciones en Recepción', color: 'bg-blue-100 border-blue-300' },
  { key: 'esperando_tecnico', title: 'Esperando Técnico', color: 'bg-pink-100 border-pink-300' },
  { key: 'en_reparacion', title: 'En Reparación', color: 'bg-indigo-100 border-indigo-300' },
  { key: 'listo_para_entrega', title: 'Listo para Entrega', color: 'bg-green-100 border-green-300' },
  { key: 'garantia', title: 'Garantía', color: 'bg-red-100 border-red-300' },
];

export function WorkflowView() {
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWorkflow();
  }, []);

  const loadWorkflow = async () => {
    try {
      const data = await workflowService.getWorkflow();
      setWorkflow(data);
    } catch (error) {
      console.error('Error loading workflow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando flujo de trabajo...</div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error al cargar el flujo de trabajo</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Flujo de Trabajo</h2>
        <p className="text-gray-600 mt-1">Vista de vehículos por etapa del proceso</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {WORKFLOW_COLUMNS.map((column) => {
          const vehicles = workflow[column.key];
          return (
            <div
              key={column.key}
              className="flex-shrink-0 w-80"
            >
              <div className={`rounded-lg border-2 ${column.color} h-full flex flex-col`}>
                <div className="p-4 border-b border-gray-300">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {vehicles.length} {vehicles.length === 1 ? 'vehículo' : 'vehículos'}
                  </p>
                </div>

                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {vehicles.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">
                      Sin vehículos
                    </p>
                  ) : (
                    vehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="font-semibold text-gray-900 mb-1">
                          {vehicle.customerName}
                        </div>
                        <div className="text-sm text-gray-700 mb-2">
                          {vehicle.vehicle}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          {vehicle.service}
                        </div>

                        {vehicle.technician && (
                          <div className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">Técnico:</span> {vehicle.technician}
                          </div>
                        )}

                        {vehicle.folio && (
                          <div className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">Folio:</span> {vehicle.folio}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                          <div className="text-xs text-gray-500">
                            Entrada: {formatDate(vehicle.checkInDate)}
                          </div>
                          {vehicle.estimatedCompletion && (
                            <div className="text-xs text-gray-500">
                              Est: {formatDate(vehicle.estimatedCompletion)}
                            </div>
                          )}
                        </div>

                        {vehicle.tags && vehicle.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {vehicle.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
