import React, { useEffect, useState } from 'react';
import { VehicleInShop, VehicleInShopTag } from '../types';
import { getVehiclesInShop, getDeliveredVehicles, updateVehicleInShop, deleteVehicleInShop, markVehicleAsDelivered } from '../services/vehiclesService';
import { getVehicleComments } from '../services/commentsService';
import { parseLocalDate } from '../utils/dateUtils';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckIcon } from './icons/CheckIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import Modal from './Modal';
import CommentsModal from './CommentsModal';
import { VEHICLE_IN_SHOP_TAGS } from '../types';

const TAG_COLORS: Record<VehicleInShopTag, string> = {
  'esperando refacciones': 'bg-orange-100 text-orange-800 border-orange-300',
  'refacciones en recepción': 'bg-amber-100 text-amber-800 border-amber-300',
  'esperando técnico': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'en diagnóstico': 'bg-blue-100 text-blue-800 border-blue-300',
  'en reparación': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'listo para entrega': 'bg-green-100 text-green-800 border-green-300',
  'esperando aprobación': 'bg-purple-100 text-purple-800 border-purple-300',
  'garantía': 'bg-red-100 text-red-800 border-red-300',
};

const VehiclesTableView: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehicleInShop[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleInShop | null>(null);
  const [showDelivered, setShowDelivered] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    vehicle: '',
    service: '',
    contact: '',
    checkInDate: '',
    checkInTime: '',
    estimatedDate: '',
    estimatedTime: '',
    notes: '',
    technician: '',
    laborHours: '0',
    folio: '',
  });
  const [selectedTags, setSelectedTags] = useState<VehicleInShopTag[]>([]);
  const [technicianTimeouts, setTechnicianTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedVehicleForComments, setSelectedVehicleForComments] = useState<VehicleInShop | null>(null);

  const loadVehicles = async () => {
    try {
      const data = showDelivered ? await getDeliveredVehicles() : await getVehiclesInShop();
      setVehicles(data);
      setLastUpdate(new Date());

      const counts: Record<string, number> = {};
      for (const vehicle of data) {
        try {
          const comments = await getVehicleComments(vehicle.id);
          counts[vehicle.id] = comments.length;
        } catch (error) {
          console.error(`Error loading comments for vehicle ${vehicle.id}:`, error);
          counts[vehicle.id] = 0;
        }
      }
      setCommentCounts(counts);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [showDelivered]);

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

  const handleOpenModal = async (vehicle: VehicleInShop) => {
    setEditingVehicle(vehicle);
    const checkInDateTime = parseLocalDate(vehicle.checkInDate);
    const estimatedDateTime = vehicle.estimatedCompletion ? parseLocalDate(vehicle.estimatedCompletion) : null;

    setFormData({
      customerName: vehicle.customerName,
      vehicle: vehicle.vehicle,
      service: vehicle.service,
      contact: vehicle.contact,
      checkInDate: checkInDateTime.toISOString().split('T')[0],
      checkInTime: checkInDateTime.toTimeString().slice(0, 5),
      estimatedDate: estimatedDateTime ? estimatedDateTime.toISOString().split('T')[0] : '',
      estimatedTime: estimatedDateTime ? estimatedDateTime.toTimeString().slice(0, 5) : '',
      notes: vehicle.notes || '',
      technician: vehicle.technician || '',
      laborHours: vehicle.laborHours?.toString() || '0',
      folio: vehicle.folio || '',
    });
    setSelectedTags(vehicle.tags || []);
    setIsModalOpen(true);
  };

  const handleOpenCommentsModal = (vehicle: VehicleInShop) => {
    setSelectedVehicleForComments(vehicle);
    setIsCommentsModalOpen(true);
  };

  const handleCloseCommentsModal = async () => {
    setIsCommentsModalOpen(false);
    setSelectedVehicleForComments(null);
    await loadVehicles();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
    setFormData({
      customerName: '',
      vehicle: '',
      service: '',
      contact: '',
      checkInDate: '',
      checkInTime: '',
      estimatedDate: '',
      estimatedTime: '',
      notes: '',
      technician: '',
      laborHours: '0',
      folio: '',
    });
    setSelectedTags([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingVehicle) return;

    const checkInDateTime = `${formData.checkInDate}T${formData.checkInTime}`;
    const estimatedDateTime = formData.estimatedDate && formData.estimatedTime
      ? `${formData.estimatedDate}T${formData.estimatedTime}`
      : undefined;

    const updatedData: VehicleInShop = {
      ...editingVehicle,
      customerName: formData.customerName,
      vehicle: formData.vehicle,
      service: formData.service,
      contact: formData.contact,
      checkInDate: checkInDateTime,
      estimatedCompletion: estimatedDateTime,
      notes: formData.notes,
      tags: selectedTags,
      technician: formData.technician,
      laborHours: parseFloat(formData.laborHours) || 0,
      folio: formData.folio,
    };

    try {
      await updateVehicleInShop(updatedData);
      await loadVehicles();
      handleCloseModal();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('Error al actualizar el vehículo');
    }
  };

  const handleMarkAsDelivered = async (id: string) => {
    if (confirm('¿Confirmar que el vehículo ha sido entregado?')) {
      try {
        await markVehicleAsDelivered(id);
        await loadVehicles();
      } catch (error) {
        console.error('Error marking vehicle as delivered:', error);
        alert('Error al marcar el vehículo como entregado');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
      try {
        await deleteVehicleInShop(id);
        await loadVehicles();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert('Error al eliminar el vehículo');
      }
    }
  };

  const handleSendWhatsApp = (vehicle: VehicleInShop) => {
    if (!vehicle.contact) {
      alert('No hay número de contacto para este vehículo');
      return;
    }

    const phoneNumber = vehicle.contact.replace(/\D/g, '');
    const message = `Hola ${vehicle.customerName}, le escribimos del taller respecto a su vehículo ${vehicle.vehicle}.`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
  };

  const toggleTag = (tag: VehicleInShopTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleTechnicianChange = (id: string, technician: string) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, technician } : v));

    if (technicianTimeouts[id]) {
      clearTimeout(technicianTimeouts[id]);
    }

    const timeoutId = setTimeout(async () => {
      const vehicle = vehicles.find(v => v.id === id);
      if (!vehicle) return;

      try {
        await updateVehicleInShop({ ...vehicle, technician });
      } catch (error) {
        console.error('Error updating technician:', error);
        alert('Error al actualizar el técnico');
      }

      setTechnicianTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[id];
        return newTimeouts;
      });
    }, 3000);

    setTechnicianTimeouts(prev => ({ ...prev, [id]: timeoutId }));
  };

  const handleFolioChange = (id: string, folio: string) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, folio } : v));

    if (technicianTimeouts[id]) {
      clearTimeout(technicianTimeouts[id]);
    }

    const timeoutId = setTimeout(async () => {
      const vehicle = vehicles.find(v => v.id === id);
      if (!vehicle) return;

      try {
        await updateVehicleInShop({ ...vehicle, folio });
      } catch (error) {
        console.error('Error updating folio:', error);
        alert('Error al actualizar el folio');
      }

      setTechnicianTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[id];
        return newTimeouts;
      });
    }, 3000);

    setTechnicianTimeouts(prev => ({ ...prev, [id]: timeoutId }));
  };

  const handleLaborHoursChange = (id: string, laborHours: number) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, laborHours } : v));

    if (technicianTimeouts[id]) {
      clearTimeout(technicianTimeouts[id]);
    }

    const timeoutId = setTimeout(async () => {
      const vehicle = vehicles.find(v => v.id === id);
      if (!vehicle) return;

      try {
        await updateVehicleInShop({ ...vehicle, laborHours });
      } catch (error) {
        console.error('Error updating labor hours:', error);
        alert('Error al actualizar las horas de mano de obra');
      }

      setTechnicianTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[id];
        return newTimeouts;
      });
    }, 3000);

    setTechnicianTimeouts(prev => ({ ...prev, [id]: timeoutId }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Monitor de Vehículos</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowDelivered(!showDelivered)}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition-colors ${
              showDelivered
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showDelivered ? 'Ver en Taller' : 'Ver Entregados'}
          </button>
          <div className="text-sm text-gray-500">
            Última actualización: {formatLastUpdate()}
          </div>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">
            {showDelivered ? 'No hay vehículos entregados' : 'No hay vehículos en el taller'}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-600">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase">
                    Vehículo
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase">
                    Servicio
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase">
                    Técnico
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-white uppercase">
                    Hrs MO
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase">
                    Folio
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase">
                    Estado
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase">
                    Ingreso
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase">
                    Est. Entrega
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-white uppercase">
                    Días
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-white uppercase">
                    Comentarios
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-white uppercase">
                    Acciones
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
                      <td className="px-2 py-2">
                        <div className="text-xs font-semibold text-gray-900">{vehicle.vehicle}</div>
                        <div className="text-xs text-gray-500">{vehicle.customerName}</div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="text-xs text-gray-700 max-w-[200px] break-words">
                          {vehicle.service}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={vehicle.technician || ''}
                          onChange={(e) => handleTechnicianChange(vehicle.id, e.target.value)}
                          placeholder="Asignar"
                          className="w-full text-xs px-1.5 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="number"
                          value={vehicle.laborHours || 0}
                          onChange={(e) => handleLaborHoursChange(vehicle.id, parseFloat(e.target.value) || 0)}
                          step="0.5"
                          min="0"
                          className="w-16 text-xs px-1.5 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={vehicle.folio || ''}
                          onChange={(e) => handleFolioChange(vehicle.id, e.target.value)}
                          placeholder="# Factura"
                          className="w-24 text-xs px-1.5 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap gap-1">
                          {vehicle.tags && vehicle.tags.length > 0 ? (
                            vehicle.tags.map((tag) => (
                              <span
                                key={tag}
                                className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full border ${TAG_COLORS[tag]}`}
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">{formatDateTime(vehicle.checkInDate)}</div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {vehicle.estimatedCompletion ? (
                          <div className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                            {formatDateTime(vehicle.estimatedCompletion)}
                            {isOverdue && ' ⚠️'}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                          daysInShop > 7 ? 'bg-red-100 text-red-800' :
                          daysInShop > 3 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {daysInShop}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleOpenCommentsModal(vehicle)}
                          className={`inline-flex items-center justify-center w-10 h-8 rounded-full text-xs font-bold transition-colors ${
                            (commentCounts[vehicle.id] || 0) > 0
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title="Ver comentarios"
                        >
                          {commentCounts[vehicle.id] || 0}
                        </button>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          {showDelivered ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-800 rounded-full border border-green-300">
                              {vehicle.deliveredAt ? new Date(vehicle.deliveredAt).toLocaleDateString() : 'Entregado'}
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleSendWhatsApp(vehicle)}
                                className="p-1 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                                title="Enviar WhatsApp"
                              >
                                <WhatsAppIcon />
                              </button>
                              <button
                                onClick={() => handleMarkAsDelivered(vehicle.id)}
                                className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                title="Marcar como entregado"
                              >
                                <CheckIcon />
                              </button>
                              <button
                                onClick={() => handleOpenModal(vehicle)}
                                className="p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                title="Editar vehículo"
                              >
                                <PencilIcon />
                              </button>
                              <button
                                onClick={() => handleDelete(vehicle.id)}
                                className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                title="Eliminar vehículo"
                              >
                                <TrashIcon />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

          <div className="md:hidden space-y-3">
            {vehicles.map((vehicle) => {
              const daysInShop = calculateDaysInShop(vehicle.checkInDate);
              const isOverdue = vehicle.estimatedCompletion &&
                parseLocalDate(vehicle.estimatedCompletion) < new Date();

              return (
                <div key={vehicle.id} className="bg-white rounded-lg shadow p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{vehicle.vehicle}</h3>
                      <p className="text-sm text-gray-600">{vehicle.customerName}</p>
                      {vehicle.folio && (
                        <p className="text-xs text-gray-500 mt-1">Folio: {vehicle.folio}</p>
                      )}
                    </div>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                      daysInShop > 7 ? 'bg-red-100 text-red-800' :
                      daysInShop > 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {daysInShop}d
                    </div>
                  </div>

                  <div className="text-sm text-gray-700">
                    <p className="font-medium">Servicio:</p>
                    <p className="text-gray-600">{vehicle.service}</p>
                  </div>

                  {vehicle.technician && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Técnico:</span>
                      <span className="font-medium text-gray-900">{vehicle.technician}</span>
                    </div>
                  )}

                  {vehicle.laborHours !== undefined && vehicle.laborHours > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Hrs MO:</span>
                      <span className="font-medium text-gray-900">{vehicle.laborHours}</span>
                    </div>
                  )}

                  {vehicle.tags && vehicle.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {vehicle.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${TAG_COLORS[tag]}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                    <div>
                      <p>Ingreso: {formatDateTime(vehicle.checkInDate)}</p>
                      {vehicle.estimatedCompletion && (
                        <p className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                          Est: {formatDateTime(vehicle.estimatedCompletion)}
                          {isOverdue && ' ⚠️'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleOpenCommentsModal(vehicle)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        (commentCounts[vehicle.id] || 0) > 0
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>💬</span>
                      <span>{commentCounts[vehicle.id] || 0}</span>
                    </button>
                    {showDelivered ? (
                      <div className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium bg-green-100 text-green-800 rounded-lg">
                        Entregado
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSendWhatsApp(vehicle)}
                          className="px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                          title="Enviar WhatsApp"
                        >
                          <WhatsAppIcon />
                        </button>
                        <button
                          onClick={() => handleMarkAsDelivered(vehicle.id)}
                          className="px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                          title="Marcar como entregado"
                        >
                          <CheckIcon />
                        </button>
                        <button
                          onClick={() => handleOpenModal(vehicle)}
                          className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          title="Editar vehículo"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className="px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="Eliminar vehículo"
                        >
                          <TrashIcon />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="text-xs text-gray-500 text-center">
        Actualización automática cada 5 minutos
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Editar Vehículo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo *</label>
              <input
                type="text"
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Servicio *</label>
            <textarea
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contacto *</label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Técnico Asignado</label>
              <input
                type="text"
                value={formData.technician}
                onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre del técnico"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horas de Mano de Obra</label>
            <input
              type="number"
              value={formData.laborHours}
              onChange={(e) => setFormData({ ...formData, laborHours: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              step="0.5"
              min="0"
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso *</label>
              <input
                type="date"
                value={formData.checkInDate}
                onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Ingreso *</label>
              <input
                type="time"
                value={formData.checkInTime}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Estimada de Entrega</label>
              <input
                type="date"
                value={formData.estimatedDate}
                onChange={(e) => setFormData({ ...formData, estimatedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora Estimada</label>
              <input
                type="time"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_IN_SHOP_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {selectedVehicleForComments && (
        <CommentsModal
          isOpen={isCommentsModalOpen}
          onClose={handleCloseCommentsModal}
          vehicleId={selectedVehicleForComments.id}
          vehicleName={`${selectedVehicleForComments.vehicle} - ${selectedVehicleForComments.customerName}`}
        />
      )}
    </div>
  );
};

export default VehiclesTableView;
