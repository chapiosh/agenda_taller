
export enum AppointmentStatus {
  Scheduled = 'Scheduled',
  Completed = 'Completed',
  Canceled = 'Canceled',
}

export interface Appointment {
  id: string;
  customerName: string;
  vehicle: string;
  service: string;
  date: string;
  contact: string;
  status: AppointmentStatus;
}
