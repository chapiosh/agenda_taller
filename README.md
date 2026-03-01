# Sistema de Gestión para Taller Mecánico

Sistema completo para gestionar citas, vehículos en taller, refacciones, cotizaciones y flujo de trabajo en un taller mecánico.

## Características Principales

### 📅 Gestión de Citas
- Calendario interactivo con vistas: lista, calendario mensual y horario diario
- Estados: Programada, Completada, Cancelada
- Tags para seguimiento: asistió, no asistió, canceló, reprogramó, llegó sin cita, llegó tarde
- Exportación de citas del día para WhatsApp
- Conversión automática a vehículo en taller cuando el cliente asiste

### 🚗 Gestión de Vehículos en Taller
- Vista de tarjetas y tabla completa
- Información detallada: cliente, vehículo, servicio, técnico asignado, horas de trabajo
- Tags de estado del proceso: en diagnóstico, esperando aprobación, esperando refacciones, refacciones en recepción, esperando técnico, en reparación, listo para entrega, garantía
- Sistema de comentarios por vehículo
- Cálculo automático de días en taller
- Marcado como entregado con timestamp
- Integración con WhatsApp para notificaciones

### 🔧 Gestión de Refacciones
- Control completo del ciclo de vida de cada refacción
- Estados: cotizada, pedida, en tránsito, recibida, instalada, devuelta, cancelada
- Seguimiento de costos y precios:
  - Cotización del proveedor
  - Precio de compra
  - Precio de venta al cliente
- Números de parte:
  - OEM (fabricante original)
  - Números alternativos (RockAuto, TecDoc, Partslink24, etc.)
- Fechas clave: pedido, recepción, instalación
- Cálculo automático de utilidad bruta por vehículo
- Proveedores y notas

### 📊 Flujo de Trabajo (Kanban)
Vista visual tipo Kanban con 8 columnas:
1. En Diagnóstico
2. Esperando Aprobación
3. Esperando Refacciones
4. Refacciones en Recepción
5. Esperando Técnico
6. En Reparación
7. Listo para Entrega
8. Garantía

### 💰 Sistema de Cotizaciones
- Creación de cotizaciones con folios automáticos
- Trabajos y partidas detalladas
- Gestión de refacciones y mano de obra
- Múltiples proveedores por partida
- Cálculo automático de márgenes, descuentos e IVA
- Estados: borrador, enviada, aprobada, rechazada, vencida
- Duplicación de cotizaciones
- Búsqueda por cliente, vehículo, placa, VIN o folio

## Tecnologías

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Supabase Edge Functions (Deno)
- **Base de Datos**: PostgreSQL (Supabase)
- **Estilos**: Tailwind CSS
- **IA**: Google Gemini API para asistencia

## Requisitos

- Node.js (versión 18 o superior)
- Cuenta de Supabase
- API Key de Google Gemini (opcional)

## Instalación

1. Clonar el repositorio

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno en `.env`:
```env
VITE_SUPABASE_URL=tu-url-de-supabase
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_GEMINI_API_KEY=tu-gemini-api-key
```

4. Ejecutar en modo desarrollo:
```bash
npm run dev
```

5. Construir para producción:
```bash
npm run build
```

## Estructura del Proyecto

```
/
├── components/          # Componentes React
│   ├── icons/          # Iconos SVG
│   ├── AppointmentForm.tsx
│   ├── AppointmentList.tsx
│   ├── CalendarView.tsx
│   ├── DayView.tsx
│   ├── VehiclesInShop.tsx
│   ├── VehiclesTableView.tsx
│   ├── VehicleDetailModal.tsx
│   ├── PartsTable.tsx
│   ├── PartModal.tsx
│   ├── WorkflowView.tsx
│   ├── CommentsModal.tsx
│   └── ...
├── services/           # Servicios API
│   ├── apiService.ts
│   ├── vehiclesService.ts
│   ├── partsService.ts
│   ├── workflowService.ts
│   ├── commentsService.ts
│   └── geminiService.ts
├── supabase/
│   ├── functions/      # Edge Functions
│   │   └── api/        # API REST
│   └── migrations/     # Migraciones de BD
├── utils/              # Utilidades
├── types.ts            # Tipos TypeScript
├── App.tsx             # Componente principal
└── API_DOCUMENTATION.md # Documentación completa del API
```

## API REST

La aplicación expone una API REST pública a través de Supabase Edge Functions.

### URL Base
```
https://[tu-proyecto].supabase.co/functions/v1/api
```

### Endpoints Principales

#### Citas
- `GET /api/appointments` - Listar citas
- `POST /api/appointments` - Crear cita
- `GET /api/appointments/{id}` - Obtener cita
- `PUT /api/appointments/{id}` - Actualizar cita
- `DELETE /api/appointments/{id}` - Eliminar cita

#### Vehículos
- `GET /api/vehicles` - Listar vehículos en taller
- `POST /api/vehicles` - Crear vehículo
- `GET /api/vehicles/{id}` - Obtener vehículo
- `PUT /api/vehicles/{id}` - Actualizar vehículo
- `DELETE /api/vehicles/{id}` - Eliminar vehículo
- `POST /api/vehicles/{id}/deliver` - Marcar como entregado
- `POST /api/vehicles/{id}/convert-to-appointment` - Convertir a cita
- `GET /api/vehicles/workflow` - Obtener flujo de trabajo

#### Refacciones
- `GET /api/vehicles/{id}/parts` - Listar refacciones de un vehículo
- `POST /api/vehicles/{id}/parts` - Agregar refacción
- `GET /api/vehicles/{vehicle_id}/parts/{part_id}` - Obtener refacción
- `PUT /api/vehicles/{vehicle_id}/parts/{part_id}` - Actualizar refacción
- `DELETE /api/vehicles/{vehicle_id}/parts/{part_id}` - Eliminar refacción

#### Comentarios
- `GET /api/vehicles/{id}/comments` - Listar comentarios
- `POST /api/vehicles/{id}/comments` - Agregar comentario

#### Cotizaciones
- `GET /api/cotizaciones` - Listar cotizaciones
- `POST /api/cotizaciones` - Crear cotización
- `GET /api/cotizaciones/{id}` - Obtener cotización completa
- `PUT /api/cotizaciones/{id}` - Actualizar cotización
- `DELETE /api/cotizaciones/{id}` - Eliminar cotización
- `POST /api/cotizaciones/{id}/duplicate` - Duplicar cotización
- `POST /api/cotizaciones/{id}/trabajos` - Agregar trabajo

Ver [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) para documentación completa.

## Modelo de Datos

### Appointment (Citas)
```typescript
{
  id: string;
  customer_name: string;
  vehicle: string;
  service: string;
  contact: string;
  date: string; // ISO 8601
  status: "Scheduled" | "Completed" | "Canceled";
  tags: string[];
  created_at: string;
  updated_at: string;
}
```

### Vehicle (Vehículos en Taller)
```typescript
{
  id: string;
  customer_name: string;
  vehicle: string;
  service: string;
  contact: string;
  check_in_date: string; // ISO 8601
  estimated_completion: string | null;
  notes: string;
  tags: string[];
  technician: string | null;
  labor_hours: number;
  folio: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}
```

### Part (Refacciones)
```typescript
{
  id: string;
  vehicle_id: string;
  description: string;
  oem_part_number?: string;
  alternative_part_numbers?: string[];
  supplier?: string;
  supplier_quote?: number;
  purchase_price?: number;
  sell_price?: number;
  status: PartStatus;
  ordered_at?: string;
  received_at?: string;
  installed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

## Características de Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- API pública sin autenticación (apropiada para uso interno)
- Validación de datos en backend
- Sanitización de inputs
- CORS configurado

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto es privado y de uso interno del taller.

## Soporte

Para soporte o preguntas, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ para mejorar la gestión de talleres mecánicos**
