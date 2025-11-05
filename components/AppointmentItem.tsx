import React from 'react';
import { Appointment, AppointmentStatus, AppointmentTag } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UndoIcon } from './icons/UndoIcon';
import { PencilIcon } from './icons/PencilIcon';

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
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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