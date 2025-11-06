import React from 'react';
import { Appointment, AppointmentStatus, AppointmentTag } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UndoIcon } from './icons/UndoIcon';
import { PencilIcon } from './icons/PencilIcon';
import { parseLocalDate } from '../utils/dateUtils';

const TAG_COLORS: Record<AppointmentTag, string> = {
  'asistió': 'bg-green-100 text-green-800 border-green-300',
  'canceló': 'bg-red-100 text-red-800 border-red-300',
  'no asistió': 'bg-orange-100 text-orange-800 border-orange-300',
  'reprogramó': 'bg-blue-100 text-blue-800 border-blue-300',
  'no dejó la unidad': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'llegó sin cita': 'bg-purple-100 text-purple-800 border-purple-300',
  'llegó tarde': 'bg-pink-100 text-pink-800 border-pink-300',
};

interface AppointmentItemProps {
  appointment: Appointment;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (appointment: Appointment) => void;
}

const AppointmentItem: React.FC<AppointmentItemProps> = ({ appointment, onToggleComplete, onDelete, onEdit }) => {
  const isCompleted = appointment.status === AppointmentStatus.Completed;

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

  const handleWhatsApp = () => {
    const phone = appointment.contact.replace(/\D/g, '');
    const date = parseLocalDate(appointment.date);
    const formattedDate = date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const message = `Hola ${appointment.customerName}, le recordamos su cita para el ${formattedDate} a las ${formattedTime}. Vehículo: ${appointment.vehicle}. Servicio: ${appointment.service}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className={`bg-white rounded-lg shadow-md transition-all duration-300 ${isCompleted ? 'bg-gray-100 opacity-70' : 'hover:shadow-xl'}`}>
      <div className={`p-5 border-l-4 ${isCompleted ? 'border-green-500' : 'border-blue-500'} rounded-l-lg`}>
        <div className="flex justify-between items-start">
          <div>
            <p className={`font-bold text-lg ${isCompleted ? 'text-gray-600 line-through' : 'text-brand-blue'}`}>
              {appointment.customerName}
            </p>
            <p className="text-sm text-gray-500">{appointment.vehicle}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleWhatsApp}
              className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
              title="Enviar mensaje por WhatsApp"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </button>
            <button
              onClick={() => onEdit(appointment)}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title="Editar cita"
            >
              <PencilIcon />
            </button>
            <button
              onClick={() => onToggleComplete(appointment.id)}
              className={`p-2 rounded-full transition-colors ${isCompleted ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
              title={isCompleted ? "Marcar como pendiente" : "Marcar como completada"}
            >
              {isCompleted ? <UndoIcon /> : <CheckIcon />}
            </button>
            <button
              onClick={() => onDelete(appointment.id)}
              className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              title="Eliminar cita"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-gray-700 font-medium">Servicio:</p>
          <p className="text-gray-600 whitespace-pre-wrap">{appointment.service}</p>
        </div>
        {appointment.tags && appointment.tags.length > 0 && (
          <div className="mt-4">
            <p className="text-gray-700 font-medium mb-2">Etiquetas:</p>
            <div className="flex flex-wrap gap-2">
              {appointment.tags.map((tag) => (
                <span
                  key={tag}
                  className={`px-3 py-1 text-xs font-medium rounded-full border ${TAG_COLORS[tag]}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center text-sm">
          <p className="text-gray-600 font-semibold">{formatDate(appointment.date)}</p>
          <p className="text-gray-500">Contacto: <span className="font-medium text-gray-700">{appointment.contact}</span></p>
        </div>
      </div>
    </div>
  );
};

export default AppointmentItem;