import React, { useEffect, useState } from 'react';
import { VehicleInShop, VEHICLE_IN_SHOP_TAGS, VehicleInShopTag } from '../types';
import { getVehiclesInShop, createVehicleInShop, updateVehicleInShop, deleteVehicleInShop, markVehicleAsDelivered } from '../services/vehiclesService';
import { parseLocalDate } from '../utils/dateUtils';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckIcon } from './icons/CheckIcon';
import Modal from './Modal';

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

const VehiclesInShop: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehicleInShop[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleInShop | null>(null);
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
  });
  const [selectedTags, setSelectedTags] = useState<VehicleInShopTag[]>([]);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await getVehiclesInShop();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const handleOpenModal = (vehicle?: VehicleInShop) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      const checkInDate = parseLocalDate(vehicle.checkInDate);
      const estimatedDate = vehicle.estimatedCompletion ? parseLocalDate(vehicle.estimatedCompletion) : null;

      setFormData({
        customerName: vehicle.customerName,
        vehicle: vehicle.vehicle,
        service: vehicle.service,
        contact: vehicle.contact,
        checkInDate: checkInDate.toISOString().split('T')[0],
        checkInTime: checkInDate.toTimeString().slice(0, 5),
        estimatedDate: estimatedDate ? estimatedDate.toISOString().split('T')[0] : '',
        estimatedTime: estimatedDate ? estimatedDate.toTimeString().slice(0, 5) : '',
        notes: vehicle.notes,
      });
      setSelectedTags(vehicle.tags || []);
    } else {
      setEditingVehicle(null);
      const now = new Date();
      setFormData({
        customerName: '',
        vehicle: '',
        service: '',
        contact: '',
        checkInDate: now.toISOString().split('T')[0],
        checkInTime: now.toTimeString().slice(0, 5),
        estimatedDate: '',
        estimatedTime: '',
        notes: '',
      });
      setSelectedTags([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
  };

  const handleSave = async () => {
    if (!formData.customerName || !formData.vehicle || !formData.service || !formData.contact || !formData.checkInDate || !formData.checkInTime) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    const checkInDateTime = `${formData.checkInDate}T${formData.checkInTime}:00`;
    const estimatedCompletion = formData.estimatedDate && formData.estimatedTime
      ? `${formData.estimatedDate}T${formData.estimatedTime}:00`
      : undefined;

    try {
      const vehicleData: Omit<VehicleInShop, 'id'> = {
        customerName: formData.customerName,
        vehicle: formData.vehicle,
        service: formData.service,
        contact: formData.contact,
        checkInDate: checkInDateTime,
        estimatedCompletion,
        notes: formData.notes,
        tags: selectedTags,
      };

      if (editingVehicle) {
        await updateVehicleInShop({ ...vehicleData, id: editingVehicle.id });
      } else {
        await createVehicleInShop(vehicleData);
      }

      await loadVehicles();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Error al guardar el vehículo');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este vehículo?')) {
      try {
        await deleteVehicleInShop(id);
        await loadVehicles();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert('Error al eliminar el vehículo');
      }
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

  const handleWhatsApp = (vehicle: VehicleInShop) => {
    const phone = vehicle.contact.replace(/\D/g, '');
    const message = `Hola ${vehicle.customerName}, su vehículo ${vehicle.vehicle} está en el taller. ${vehicle.notes ? `Nota: ${vehicle.notes}` : ''}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDaysInShop = (checkInDate: string) => {
    const checkIn = parseLocalDate(checkInDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleCopyVehiclesReport = async () => {
    if (vehicles.length === 0) {
      alert('No hay vehículos en el taller para copiar.');
      return;
    }

    const today = new Date();
    const formattedDate = today.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let message = `🔧 *Vehículos en Taller - ${formattedDate}*\n\n`;
    message += `Total de vehículos: *${vehicles.length}*\n\n`;

    vehicles.forEach((vehicle, index) => {
      const daysInShop = calculateDaysInShop(vehicle.checkInDate);
      message += `${index + 1}. 🚗 *${vehicle.vehicle}*\n`;
      message += `   👤 ${vehicle.customerName}\n`;
      message += `   📞 ${vehicle.contact}\n`;
      message += `   🔧 ${vehicle.service}\n`;
      message += `   📅 Días en taller: *${daysInShop}*\n`;

      if (vehicle.tags && vehicle.tags.length > 0) {
        message += `   🏷️ Estado: ${vehicle.tags.join(', ')}\n`;
      }

      if (vehicle.estimatedCompletion) {
        const estimatedDate = parseLocalDate(vehicle.estimatedCompletion);
        const formattedEstimate = estimatedDate.toLocaleDateString('es-ES', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        message += `   ⏰ Entrega estimada: ${formattedEstimate}\n`;
      }

      if (vehicle.notes) {
        message += `   📝 ${vehicle.notes}\n`;
      }

      message += `\n`;
    });

    message += `---\n_Generado desde el Sistema de Gestión del Taller_`;

    try {
      await navigator.clipboard.writeText(message);
      alert('✅ Reporte de vehículos copiado al portapapeles. Listo para enviar por WhatsApp.');
    } catch (error) {
      console.error('Error al copiar:', error);
      alert('❌ No se pudo copiar al portapapeles.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Vehículos en Taller</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCopyVehiclesReport}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Copiar reporte
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon />
            Agregar Vehículo
          </button>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No hay vehículos en el taller</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all">
              <div className="p-5 border-l-4 border-blue-500 rounded-l-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-bold text-lg text-blue-600">{vehicle.customerName}</p>
                    <p className="text-sm text-gray-500">{vehicle.vehicle}</p>
                    {vehicle.deliveredAt && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-300">
                        Entregado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {!vehicle.deliveredAt && (
                      <button
                        onClick={() => handleMarkAsDelivered(vehicle.id)}
                        className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        title="Marcar como entregado"
                      >
                        <CheckIcon />
                      </button>
                    )}
                    <button
                      onClick={() => handleWhatsApp(vehicle)}
                      className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                      title="WhatsApp"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleOpenModal(vehicle)}
                      className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      title="Editar"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500 font-medium">Servicio:</p>
                  <p className="text-sm text-gray-700">{vehicle.service}</p>
                </div>

                {vehicle.tags && vehicle.tags.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {vehicle.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${TAG_COLORS[tag]}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {vehicle.notes && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 font-medium">Notas:</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{vehicle.notes}</p>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Ingresó:</span>
                    <span className="text-gray-700 font-medium">{formatDate(vehicle.checkInDate)}</span>
                  </div>
                  {vehicle.estimatedCompletion && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Est. entrega:</span>
                      <span className="text-gray-700 font-medium">{formatDate(vehicle.estimatedCompletion)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Días en taller:</span>
                    <span className="font-bold text-blue-600">{calculateDaysInShop(vehicle.checkInDate)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Contacto:</span>
                    <span className="text-gray-700 font-medium">{vehicle.contact}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingVehicle ? 'Editar Vehículo' : 'Agregar Vehículo'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo *</label>
            <input
              type="text"
              value={formData.vehicle}
              onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Marca, modelo, año"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Servicio *</label>
            <textarea
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción del servicio"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contacto *</label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Teléfono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Ingreso *</label>
              <input
                type="date"
                value={formData.checkInDate}
                onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora Ingreso *</label>
              <input
                type="time"
                value={formData.checkInTime}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Est. Entrega</label>
              <input
                type="date"
                value={formData.estimatedDate}
                onChange={(e) => setFormData({ ...formData, estimatedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora Est. Entrega</label>
              <input
                type="time"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notas adicionales"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_IN_SHOP_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSelectedTags((prev) =>
                      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                    );
                  }}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    selectedTags.includes(tag)
                      ? TAG_COLORS[tag]
                      : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VehiclesInShop;
