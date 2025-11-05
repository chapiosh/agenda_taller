import React, { useState } from 'react';
import { Appointment, AppointmentStatus } from '../types';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface DayViewProps {
  appointments: Appointment[];
  onEditAppointment: (appointment: Appointment) => void;
}

const DayView: React.FC<DayViewProps> = ({ appointments, onEditAppointment }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const appointmentsForDay = appointments.filter(app =>
    isSameDay(new Date(app.date), currentDate)
  );

  const getAppointmentsForHour = (hour: number) => {
    return appointmentsForDay.filter(app => {
      const appDate = new Date(app.date);
      return appDate.getHours() === hour;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const isToday = isSameDay(currentDate, new Date());

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Día anterior"
            >
              <ChevronLeftIcon />
            </button>
            <button
              onClick={handleNextDay}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Día siguiente"
            >
              <ChevronRightIcon />
            </button>
          </div>
          <h2 className="text-xl font-semibold text-brand-blue capitalize">
            {formatDate(currentDate)}
          </h2>
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-lg transition-colors font-medium"
          >
            Hoy
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-h-[calc(100vh-280px)] overflow-y-auto">
        <div className="space-y-2">
          {hours.map(hour => {
            const hourAppointments = getAppointmentsForHour(hour);
            const hasAppointments = hourAppointments.length > 0;

            return (
              <div
                key={hour}
                className={`flex border-l-4 ${hasAppointments ? 'border-brand-blue bg-blue-50' : 'border-gray-200'} rounded-r-lg transition-all`}
              >
                <div className="w-20 sm:w-24 flex-shrink-0 p-3 text-right border-r border-gray-200">
                  <span className="text-sm font-semibold text-gray-600">
                    {formatTime(hour)}
                  </span>
                </div>
                <div className="flex-grow p-3 min-h-[60px]">
                  {hasAppointments ? (
                    <div className="space-y-2">
                      {hourAppointments.map(app => (
                        <div
                          key={app.id}
                          onClick={() => onEditAppointment(app)}
                          className={`p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            app.status === AppointmentStatus.Completed
                              ? 'bg-green-100 border border-green-300'
                              : 'bg-white border border-blue-300 hover:border-blue-400'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-grow">
                              <p className={`font-bold text-brand-blue ${app.status === AppointmentStatus.Completed ? 'line-through opacity-70' : ''}`}>
                                {app.customerName}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">{app.vehicle}</p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{app.service}</p>
                            </div>
                            <div className="ml-3">
                              <span className="text-xs font-medium text-gray-500">
                                {new Date(app.date).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {app.status === AppointmentStatus.Completed && (
                                <div className="mt-1">
                                  <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-green-200 text-green-800">
                                    Completada
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      Sin citas
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayView;
