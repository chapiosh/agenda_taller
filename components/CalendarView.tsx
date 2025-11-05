import React, { useState } from 'react';
import { Appointment, AppointmentStatus } from '../types';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface CalendarViewProps {
  appointments: Appointment[];
  onEditAppointment: (appointment: Appointment) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ appointments, onEditAppointment }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const calendarDays = [];
  let day = new Date(startDate);
  while (day <= endDate) {
    calendarDays.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const today = new Date();

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeftIcon /></button>
        <h2 className="text-xl font-semibold text-brand-blue">
          {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
        </h2>
        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronRightIcon /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center font-medium text-gray-600">
        {daysOfWeek.map(day => <div key={day} className="py-2">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isToday = isSameDay(date, today);
          const appointmentsForDay = appointments.filter(app => isSameDay(new Date(app.date), date));

          return (
            <div key={index} className={`border rounded-md min-h-[120px] p-1.5 flex flex-col ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}`}>
              <span className={`text-sm font-semibold mb-1 ${isToday ? 'bg-brand-blue text-white rounded-full h-6 w-6 flex items-center justify-center' : ''} ${isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}`}>
                {date.getDate()}
              </span>
              <div className="flex-grow overflow-y-auto space-y-1">
                {appointmentsForDay.map(app => (
                  <div 
                    key={app.id} 
                    onClick={() => onEditAppointment(app)}
                    className={`p-1.5 rounded-md text-xs text-white cursor-pointer hover:opacity-80 transition-opacity ${app.status === AppointmentStatus.Completed ? 'bg-green-500' : 'bg-blue-500'}`}
                  >
                    <p className="font-bold truncate">{app.customerName}</p>
                    <p className="truncate">{app.vehicle}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
