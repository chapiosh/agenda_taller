import React from 'react';
import { Appointment } from '../types';
import AppointmentItem from './AppointmentItem';

interface AppointmentListProps {
  appointments: Appointment[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (appointment: Appointment) => void;
}

const AppointmentList: React.FC<AppointmentListProps> = ({ appointments, onToggleComplete, onDelete, onEdit }) => {
  if (appointments.length === 0) {
    return <p className="text-gray-500 italic mt-4 text-center">No hay citas en esta categoría.</p>;
  }

  return (
    <div className="space-y-4">
      {appointments.map(appointment => (
        <AppointmentItem 
          key={appointment.id} 
          appointment={appointment} 
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

export default AppointmentList;