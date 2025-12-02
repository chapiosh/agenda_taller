
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

export type VehicleInShopTag =
  | 'esperando refacciones'
  | 'refacciones en recepción'
  | 'esperando técnico'
  | 'en diagnóstico'
  | 'en reparación'
  | 'listo para entrega'
  | 'esperando aprobación'
  | 'garantía';

export const VEHICLE_IN_SHOP_TAGS: VehicleInShopTag[] = [
  'esperando refacciones',
  'refacciones en recepción',
  'esperando técnico',
  'en diagnóstico',
  'en reparación',
  'listo para entrega',
  'esperando aprobación',
  'garantía',
];

export interface VehicleInShop {
  id: string;
  customerName: string;
  vehicle: string;
  service: string;
  contact: string;
  checkInDate: string;
  estimatedCompletion?: string;
  notes: string;
  tags?: VehicleInShopTag[];
  deliveredAt?: string;
  technician?: string;
  laborHours?: number;
}
