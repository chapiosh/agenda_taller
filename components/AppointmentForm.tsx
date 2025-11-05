import React, { useState, useEffect } from 'react';
import { Appointment } from '../types';
import { generateServiceDescription } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';

interface AppointmentFormProps {
  onSave: (appointment: Omit<Appointment, 'id' | 'status'>, id?: string) => void;
  appointmentToEdit: Appointment | null;
  onClose: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ onSave, appointmentToEdit, onClose }) => {
  const [customerName, setCustomerName] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [service, setService] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [contact, setContact] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (appointmentToEdit) {
      setCustomerName(appointmentToEdit.customerName);
      setVehicle(appointmentToEdit.vehicle);
      setService(appointmentToEdit.service);
      const localDate = new Date(appointmentToEdit.date);
      localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
      const isoString = localDate.toISOString();
      setDateValue(isoString.slice(0, 10));
      setTimeValue(isoString.slice(11, 16));
      setContact(appointmentToEdit.contact);
    } else {
      setCustomerName('');
      setVehicle('');
      setService('');
      setDateValue('');
      setTimeValue('');
      setContact('');
    }
  }, [appointmentToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !vehicle || !service || !dateValue || !timeValue || !contact) {
      alert('Por favor, completa todos los campos.');
      return;
    }
    const localDateTime = new Date(`${dateValue}T${timeValue}`);
    const date = localDateTime.toISOString();
    onSave({ customerName, vehicle, service, date, contact, tags: appointmentToEdit?.tags }, appointmentToEdit?.id);
  };

  const handleGenerateDescription = async () => {
    if (!service) {
        alert("Por favor, introduce una breve descripción de la queja del cliente.");
        return;
    }
    setIsGenerating(true);
    const generatedDescription = await generateServiceDescription(service);
    setService(generatedDescription);
    setIsGenerating(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-brand-blue">
        {appointmentToEdit ? 'Editar Cita' : 'Nueva Cita'}
      </h2>
      
      <div>
        <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Nombre del Cliente</label>
        <input
          type="text"
          id="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700">Vehículo (Marca, Modelo, Año)</label>
        <input
          type="text"
          id="vehicle"
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="service" className="block text-sm font-medium text-gray-700">Descripción del Servicio</label>
        <textarea
          id="service"
          rows={4}
          value={service}
          onChange={(e) => setService(e.target.value)}
          placeholder="Describe la queja del cliente o el servicio requerido..."
          className="mt-1 block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
          required
        />
        <button
          type="button"
          onClick={handleGenerateDescription}
          disabled={isGenerating}
          className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SparklesIcon />
          <span className="ml-2">{isGenerating ? 'Generando...' : 'Sugerir con IA'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">Fecha</label>
          <input
            type="date"
            id="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700">Hora</label>
          <input
            type="time"
            id="time"
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Número de Contacto</label>
        <input
          type="tel"
          id="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
          required
        />
      </div>


      <div className="flex gap-4">
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2 px-4 rounded-md shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
        >
          {appointmentToEdit ? 'Guardar Cambios' : 'Guardar Cita'}
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm;