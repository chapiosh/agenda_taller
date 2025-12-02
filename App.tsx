import React, { useState, useEffect } from 'react';
import { Appointment, AppointmentStatus, AppointmentTag } from './types';
import { parseLocalDate } from './utils/dateUtils';
import Header from './components/Header';
import AppointmentList from './components/AppointmentList';
import AppointmentForm from './components/AppointmentForm';
import Modal from './components/Modal';
import CalendarView from './components/CalendarView';
import DayView from './components/DayView';
import TagCompletionModal from './components/TagCompletionModal';
import VehiclesInShop from './components/VehiclesInShop';
import VehiclesTableView from './components/VehiclesTableView';
import { PlusIcon } from './components/icons/PlusIcon';
import { CalendarIcon } from './components/icons/CalendarIcon';
import { ListBulletIcon } from './components/icons/ListBulletIcon';
import { ClockIcon } from './components/icons/ClockIcon';
import * as apiService from './services/apiService';
import { createVehicleInShop } from './services/vehiclesService';
import { createVehicleInShop } from './services/vehiclesService';

type ViewMode = 'list' | 'calendar' | 'day' | 'shop' | 'shopTable';

const App: React.FC = () => {
  const getTodayDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());

  useEffect(() => {
    const fetchAppointments = async () => {
      const data = await apiService.getAppointments();
      setAppointments(data);
    };
    fetchAppointments();
  }, []);

  const handleSaveAppointment = async (appointmentData: Omit<Appointment, 'id' | 'status'>, id?: string) => {
    try {
        if (id) {
          // Update existing appointment
          const appointmentToUpdate = appointments.find(app => app.id === id);
          if (appointmentToUpdate) {
             const updatedData = { ...appointmentToUpdate, ...appointmentData };
             const updatedAppointment = await apiService.updateAppointment(updatedData);
             setAppointments(appointments.map(app => 
                app.id === id ? updatedAppointment : app
             ));
          }
        } else {
          // Add new appointment
          const newAppointment = await apiService.createAppointment(appointmentData);
          setAppointments(prev => [...prev, newAppointment].sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime()));
        }
        closeModal();
    } catch(error) {
        console.error("Failed to save appointment:", error);
        alert("No se pudo guardar la cita. Por favor, inténtelo de nuevo.");
    }
  };

  const handleToggleComplete = async (id: string) => {
    const appointment = appointments.find(app => app.id === id);
    if (!appointment) return;

    if (appointment.status === AppointmentStatus.Completed) {
      const updatedAppointmentData: Appointment = {
        ...appointment,
        status: AppointmentStatus.Scheduled,
        tags: [],
      };

      try {
        const updatedAppointment = await apiService.updateAppointment(updatedAppointmentData);
        setAppointments(appointments.map(app =>
          app.id === id ? updatedAppointment : app
        ));
      } catch(error) {
        console.error("Failed to update appointment status:", error);
        alert("No se pudo actualizar el estado de la cita.");
      }
    } else {
      setAppointmentToComplete(id);
      setIsTagModalOpen(true);
    }
  };

  const handleConfirmCompletion = async (tag: AppointmentTag) => {
    if (!appointmentToComplete) return;

    const appointment = appointments.find(app => app.id === appointmentToComplete);
    if (!appointment) return;

    const updatedAppointmentData: Appointment = {
      ...appointment,
      status: AppointmentStatus.Completed,
      tags: [tag],
    };

    try {
      const updatedAppointment = await apiService.updateAppointment(updatedAppointmentData);
      setAppointments(appointments.map(app =>
        app.id === appointmentToComplete ? updatedAppointment : app
      ));

      if (tag === 'asistió' || tag === 'llegó sin cita' || tag === 'llegó tarde') {
        try {
          await createVehicleInShop({
            customerName: appointment.customerName,
            vehicle: appointment.vehicle,
            service: appointment.service,
            contact: appointment.contact,
            checkInDate: new Date().toISOString(),
            notes: `Cita: ${tag}`,
            tags: [],
          });
        } catch (vehicleError) {
          console.error('Error creating vehicle in shop:', vehicleError);
        }
      }

      setIsTagModalOpen(false);
      setAppointmentToComplete(null);
    } catch(error) {
      console.error("Failed to complete appointment:", error);
      alert("No se pudo completar la cita.");
    }
  };

  const handleCancelCompletion = () => {
    setIsTagModalOpen(false);
    setAppointmentToComplete(null);
  };

  const handleDeleteAppointment = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
        try {
            await apiService.deleteAppointment(id);
            setAppointments(appointments.filter(app => app.id !== id));
        } catch (error) {
            console.error("Failed to delete appointment:", error);
            alert("No se pudo eliminar la cita.");
        }
    }
  };
  
  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingAppointment(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAppointment(null);
  };

  const handleMoveToShop = async (appointment: Appointment) => {
    if (!window.confirm('¿Deseas pasar esta cita a vehículos en taller?')) return;

    try {
      const now = new Date();
      const vehicleData = {
        customerName: appointment.customerName,
        vehicle: appointment.vehicle,
        service: appointment.service,
        contact: appointment.contact,
        checkInDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        estimatedCompletion: undefined,
        notes: `Cita original: ${new Date(appointment.date).toLocaleDateString('es-ES')}`,
        tags: [],
      };

      await createVehicleInShop(vehicleData);
      alert('✅ Vehículo agregado al taller correctamente.');
    } catch (error) {
      console.error('Error moving to shop:', error);
      alert('❌ Error al pasar el vehículo al taller.');
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.service.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedDate) {
      const appointmentDate = parseLocalDate(appointment.date);
      const [filterYear, filterMonth, filterDay] = selectedDate.split('-').map(Number);

      return appointmentDate.getFullYear() === filterYear &&
             appointmentDate.getMonth() + 1 === filterMonth &&
             appointmentDate.getDate() === filterDay;
    }

    return true;
  });

  const scheduledAppointments = filteredAppointments.filter(a => a.status === AppointmentStatus.Scheduled);
  const completedAppointments = filteredAppointments.filter(a => a.status === AppointmentStatus.Completed);

  const handleCopyTodayAppointments = async () => {
    const today = new Date();
    const todayAppointments = appointments.filter(app => {
      const appDate = parseLocalDate(app.date);
      return appDate.getFullYear() === today.getFullYear() &&
             appDate.getMonth() === today.getMonth() &&
             appDate.getDate() === today.getDate() &&
             app.status === AppointmentStatus.Scheduled;
    });

    if (todayAppointments.length === 0) {
      alert('No hay citas programadas para hoy.');
      return;
    }

    todayAppointments.sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());

    const formattedDate = today.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let message = `📅 *Citas para hoy ${formattedDate}*\n\n`;
    message += `Total de vehículos a recibir: *${todayAppointments.length}*\n\n`;

    todayAppointments.forEach((app, index) => {
      const time = parseLocalDate(app.date).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
      message += `${index + 1}. 🕐 *${time}*\n`;
      message += `   👤 ${app.customerName}\n`;
      message += `   🚗 ${app.vehicle}\n`;
      message += `   📞 ${app.contact}\n`;
      message += `   🔧 ${app.service}\n\n`;
    });

    message += `---\n_Generado desde el Sistema de Citas_`;

    try {
      await navigator.clipboard.writeText(message);
      alert('✅ Citas copiadas al portapapeles. Listo para enviar por WhatsApp.');
    } catch (error) {
      console.error('Error al copiar:', error);
      alert('❌ No se pudo copiar al portapapeles.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-blue">
              {viewMode === 'shop' || viewMode === 'shopTable' ? 'Vehículos en Taller' : 'Panel de Citas'}
            </h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={handleCopyTodayAppointments}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 shadow-md"
                  aria-label="Copiar citas de hoy para WhatsApp"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Copiar citas de hoy
                </button>
                {viewMode === 'list' && (
                <div className="relative flex-grow">
                    <input
                    type="text"
                    placeholder="Buscar por cliente, vehículo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    aria-label="Buscar citas"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                )}
                <div className="flex items-center space-x-2 bg-gray-200 p-1 rounded-lg shrink-0">
                    <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-brand-blue shadow' : 'text-gray-600 hover:bg-gray-300'}`}
                    aria-label="Vista de lista"
                    >
                    <ListBulletIcon />
                    </button>
                    <button
                    onClick={() => setViewMode('calendar')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-white text-brand-blue shadow' : 'text-gray-600 hover:bg-gray-300'}`}
                    aria-label="Vista de calendario"
                    >
                    <CalendarIcon />
                    </button>
                    <button
                    onClick={() => setViewMode('day')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'day' ? 'bg-white text-brand-blue shadow' : 'text-gray-600 hover:bg-gray-300'}`}
                    aria-label="Vista por día"
                    >
                    <ClockIcon />
                    </button>
                    <button
                    onClick={() => setViewMode('shop')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'shop' ? 'bg-white text-brand-blue shadow' : 'text-gray-600 hover:bg-gray-300'}`}
                    aria-label="Vehículos en taller"
                    title="Vehículos en taller"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                      <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                      <path d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5" />
                    </svg>
                    </button>
                    <button
                    onClick={() => setViewMode('shopTable')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'shopTable' ? 'bg-white text-brand-blue shadow' : 'text-gray-600 hover:bg-gray-300'}`}
                    aria-label="Monitor de taller"
                    title="Monitor de taller"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                      <line x1="9" y1="21" x2="9" y2="9"/>
                    </svg>
                    </button>
                </div>
            </div>
        </div>
        
        {viewMode === 'list' ? (
          <>
            <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <label htmlFor="dateFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Filtrar por fecha:
                </label>
                <input
                  type="date"
                  id="dateFilter"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Limpiar filtro
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b-2 border-brand-blue pb-2">Citas Programadas</h2>
                <AppointmentList
                  appointments={scheduledAppointments}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteAppointment}
                  onEdit={handleEditAppointment}
                  onMoveToShop={handleMoveToShop}
                />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b-2 border-gray-300 pb-2">Citas Completadas</h2>
                <AppointmentList
                  appointments={completedAppointments}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteAppointment}
                  onEdit={handleEditAppointment}
                />
              </div>
            </div>
          </>
        ) : viewMode === 'calendar' ? (
          <CalendarView appointments={appointments} onEditAppointment={handleEditAppointment} />
        ) : viewMode === 'day' ? (
          <DayView appointments={appointments} onEditAppointment={handleEditAppointment} />
        ) : viewMode === 'shop' ? (
          <VehiclesInShop />
        ) : (
          <VehiclesTableView />
        )}

      </main>

      {viewMode !== 'shop' && viewMode !== 'shopTable' && (
        <button
          onClick={openAddModal}
          className="fixed bottom-8 right-8 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
          aria-label="Añadir nueva cita"
        >
          <PlusIcon />
        </button>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <AppointmentForm
            onSave={handleSaveAppointment}
            appointmentToEdit={editingAppointment}
            onClose={closeModal}
        />
      </Modal>

      <TagCompletionModal
        isOpen={isTagModalOpen}
        onConfirm={handleConfirmCompletion}
        onCancel={handleCancelCompletion}
      />
    </div>
  );
};

export default App;