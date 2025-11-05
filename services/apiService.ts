import { Appointment, AppointmentStatus } from '../types';

const STORAGE_KEY = 'appointments';

// Helper to get appointments from localStorage
const getStoredAppointments = (): Appointment[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return [];
  }
};

// Helper to save appointments to localStorage
const saveAppointments = (appointments: Appointment[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  } catch (error) {
    console.error("Error writing to localStorage:", error);
  }
};

// --- Funciones del servicio ---

/**
 * Obtiene todas las citas del almacenamiento local.
 */
export const getAppointments = async (): Promise<Appointment[]> => {
  const appointments = getStoredAppointments();
  // Simula una llamada a la API asíncrona
  return Promise.resolve(appointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
};

/**
 * Crea una nueva cita en el almacenamiento local.
 * @param data Los datos de la cita a crear (sin id ni status).
 */
export const createAppointment = async (data: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> => {
  const appointments = getStoredAppointments();
  const newAppointment: Appointment = {
    ...data,
    id: new Date().getTime().toString(), // Genera un ID simple
    status: AppointmentStatus.Scheduled,
  };
  const updatedAppointments = [...appointments, newAppointment];
  saveAppointments(updatedAppointments);
  return Promise.resolve(newAppointment);
};

/**
 * Actualiza una cita existente en el almacenamiento local.
 * @param updatedData El objeto completo de la cita actualizada.
 */
export const updateAppointment = async (updatedData: Appointment): Promise<Appointment> => {
  let appointments = getStoredAppointments();
  const index = appointments.findIndex(app => app.id === updatedData.id);
  if (index === -1) {
    throw new Error("Appointment not found");
  }
  appointments[index] = updatedData;
  saveAppointments(appointments);
  return Promise.resolve(updatedData);
};

/**
 * Elimina una cita del almacenamiento local.
 * @param id El ID de la cita a eliminar.
 */
export const deleteAppointment = async (id: string): Promise<void> => {
  let appointments = getStoredAppointments();
  const updatedAppointments = appointments.filter(app => app.id !== id);
  if (appointments.length === updatedAppointments.length) {
      throw new Error("Appointment not found to delete");
  }
  saveAppointments(updatedAppointments);
  return Promise.resolve();
};