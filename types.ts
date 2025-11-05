
export enum AppointmentStatus {
  Scheduled = 'Scheduled',
  Completed = 'Completed',
  Canceled = 'Canceled',
}

export type AppointmentTag =
  | 'canceló'
  | 'no asistió'
  | 'reprogramó'
  | 'asistió'
  | 'no dejó la unidad'
  | 'llegó sin cita'
  | 'llegó tarde';

export const APPOINTMENT_TAGS: AppointmentTag[] = [
  'canceló',
  'no asistió',
  'reprogramó',
  'asistió',
  'no dejó la unidad',
  'llegó sin cita',
  'llegó tarde',
];

export interface Appointment {
  id: string;
  customerName: string;
  vehicle: string;
  service: string;
  date: string;
  contact: string;
  status: AppointmentStatus;
  tags?: AppointmentTag[];
}
