import React, { useEffect, useState } from 'react';
import { VehicleInShop, VehicleInShopTag } from '../types';
import { getVehiclesInShop } from '../services/vehiclesService';
import { parseLocalDate } from '../utils/dateUtils';

const TAG_COLORS: Record<VehicleInShopTag, string> = {
  'esperando refacciones': 'bg-orange-100 text-orange-800 border-orange-300',
  'en diagnóstico': 'bg-blue-100 text-blue-800 border-blue-300',
  'en reparación': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'listo para entrega': 'bg-green-100 text-green-800 border-green-300',
  'esperando aprobación': 'bg-purple-100 text-purple-800 border-purple-300',
  'garantía': 'bg-red-100 text-red-800 border-red-300',
};

const VehiclesTableView: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehicleInShop[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadVehicles = async () => {
    try {
      const data = await getVehiclesInShop();
      setVehicles(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  useEffect(() => {
    loadVehicles();

    const interval = setInterval(() => {
      loadVehicles();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const calculateDaysInShop = (checkInDate: string) => {
    const checkIn = parseLocalDate(checkInDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDateTime = (dateString: string) => {
    const date = parseLocalDate(dateString);
    return date.toLocaleString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastUpdate = () => {
    return lastUpdate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Monitor de Vehículos</h2>
        <div className="text-sm text-gray-500">
          Última actualización: {formatLastUpdate()}
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No hay vehículos en el taller</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehículo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingreso
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Entrega
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Días
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => {
                  const daysInShop = calculateDaysInShop(vehicle.checkInDate);
                  const isOverdue = vehicle.estimatedCompletion &&
                    parseLocalDate(vehicle.estimatedCompletion) < new Date();

                  return (
                    <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{vehicle.vehicle}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {vehicle.tags && vehicle.tags.length > 0 ? (
                            vehicle.tags.map((tag) => (
                              <span
                                key={tag}
                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${TAG_COLORS[tag]}`}
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDateTime(vehicle.checkInDate)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {vehicle.estimatedCompletion ? (
                          <div className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                            {formatDateTime(vehicle.estimatedCompletion)}
                            {isOverdue && ' ⚠️'}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${
                          daysInShop > 7 ? 'bg-red-100 text-red-800' :
                          daysInShop > 3 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {daysInShop}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600 max-w-xs truncate" title={vehicle.notes}>
                          {vehicle.notes || '-'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        Actualización automática cada 5 minutos
      </div>
    </div>
  );
};

export default VehiclesTableView;
