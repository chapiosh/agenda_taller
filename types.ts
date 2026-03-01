
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
  folio?: string;
}

export type PartStatus =
  | 'quoted'
  | 'ordered'
  | 'in_transit'
  | 'received'
  | 'installed'
  | 'returned'
  | 'canceled';

export const PART_STATUSES: PartStatus[] = [
  'quoted',
  'ordered',
  'in_transit',
  'received',
  'installed',
  'returned',
  'canceled',
];

export const PART_STATUS_LABELS: Record<PartStatus, string> = {
  quoted: 'Cotizada',
  ordered: 'Pedida',
  in_transit: 'En tránsito',
  received: 'Recibida',
  installed: 'Instalada',
  returned: 'Devuelta',
  canceled: 'Cancelada',
};

export interface Part {
  id: string;
  vehicleId: string;
  description: string;
  oemPartNumber?: string;
  alternativePartNumbers?: string[];
  supplier?: string;
  supplierQuote?: number;
  purchasePrice?: number;
  sellPrice?: number;
  status: PartStatus;
  orderedAt?: string;
  receivedAt?: string;
  installedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowData {
  en_diagnostico: VehicleInShop[];
  esperando_aprobacion: VehicleInShop[];
  esperando_refacciones: VehicleInShop[];
  refacciones_en_recepcion: VehicleInShop[];
  esperando_tecnico: VehicleInShop[];
  en_reparacion: VehicleInShop[];
  listo_para_entrega: VehicleInShop[];
  garantia: VehicleInShop[];
}
