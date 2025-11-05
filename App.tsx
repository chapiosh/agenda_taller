import React, { useState, useEffect } from 'react';
import { Appointment, AppointmentStatus, AppointmentTag } from './types';
import Header from './components/Header';
import AppointmentList from './components/AppointmentList';
import AppointmentForm from './components/AppointmentForm';
import Modal from './components/Modal';
import CalendarView from './components/CalendarView';
import DayView from './components/DayView';
import TagCompletionModal from './components/TagCompletionModal';
import { PlusIcon } from './components/icons/PlusIcon';
import { CalendarIcon } from './components/icons/CalendarIcon';
import { ListBulletIcon } from './components/icons/ListBulletIcon';
import { ClockIcon } from './components/icons/ClockIcon';
import * as apiService from './services/apiService';

type ViewMode = 'list' | 'calendar' | 'day';

const App: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

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
          setAppointments(prev => [...prev, newAppointment].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
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

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.service.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedDate) {
      const appointmentDate = new Date(appointment.date);
      const [filterYear, filterMonth, filterDay] = selectedDate.split('-').map(Number);

      return appointmentDate.getFullYear() === filterYear &&
             appointmentDate.getMonth() + 1 === filterMonth &&
             appointmentDate.getDate() === filterDay;
    }

    return true;
  });

  const scheduledAppointments = filteredAppointments.filter(a => a.status === AppointmentStatus.Scheduled);
  const completedAppointments = filteredAppointments.filter(a => a.status === AppointmentStatus.Completed);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-blue">Panel de Citas</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
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
        ) : (
          <DayView appointments={appointments} onEditAppointment={handleEditAppointment} />
        )}

      </main>

      <button
        onClick={openAddModal}
        className="fixed bottom-8 right-8 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
        aria-label="Añadir nueva cita"
      >
        <PlusIcon />
      </button>

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