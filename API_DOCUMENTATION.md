# API Documentation - Mechanic Shop Manager

API REST para gestionar citas y vehículos en el taller mecánico.

## URL Base

```
https://fquuajdbnlipavxiaqah.supabase.co/functions/v1/api
```

## Autenticación

La API es pública y no requiere autenticación. Todos los endpoints están disponibles sin necesidad de un token.

## Headers Requeridos

```
Content-Type: application/json
```

---

## Endpoints de Citas (Appointments)

### 1. Obtener todas las citas

**GET** `/api/appointments`

Retorna todas las citas programadas.

**Respuesta exitosa (200):**
```json
[
  {
    "id": "uuid",
    "customer_name": "Juan Pérez",
    "vehicle": "Toyota Corolla 2020",
    "service": "Cambio de aceite",
    "contact": "5551234567",
    "date": "2025-01-25T10:00:00Z",
    "status": "Scheduled",
    "tags": ["asistió"],
    "created_at": "2025-01-20T08:00:00Z",
    "updated_at": "2025-01-20T08:00:00Z"
  }
]
```

**Posibles valores de status:**
- `Scheduled` - Programada
- `Completed` - Completada
- `Canceled` - Cancelada

**Posibles tags:**
- `canceló`
- `no asistió`
- `reprogramó`
- `asistió`
- `no dejó la unidad`
- `llegó sin cita`
- `llegó tarde`

---

### 2. Obtener una cita específica

**GET** `/api/appointments/{id}`

Retorna los detalles de una cita específica.

**Parámetros:**
- `id` (string, UUID) - ID de la cita

**Respuesta exitosa (200):**
```json
{
  "id": "uuid",
  "customer_name": "Juan Pérez",
  "vehicle": "Toyota Corolla 2020",
  "service": "Cambio de aceite",
  "contact": "5551234567",
  "date": "2025-01-25T10:00:00Z",
  "status": "Scheduled",
  "tags": ["asistió"],
  "created_at": "2025-01-20T08:00:00Z",
  "updated_at": "2025-01-20T08:00:00Z"
}
```

**Respuesta de error (404):**
```json
{
  "error": "Appointment not found"
}
```

---

### 3. Crear una nueva cita

**POST** `/api/appointments`

Crea una nueva cita.

**Body (JSON):**
```json
{
  "customer_name": "Juan Pérez",
  "vehicle": "Toyota Corolla 2020",
  "service": "Cambio de aceite",
  "contact": "5551234567",
  "date": "2025-01-25T10:00:00",
  "status": "Scheduled",
  "tags": []
}
```

**Campos requeridos:**
- `customer_name` (string)
- `vehicle` (string)
- `service` (string)
- `contact` (string)
- `date` (string, formato ISO 8601)

**Campos opcionales:**
- `status` (string, default: "Scheduled")
- `tags` (array de strings, default: [])

**Respuesta exitosa (201):**
```json
{
  "id": "uuid-generado",
  "customer_name": "Juan Pérez",
  "vehicle": "Toyota Corolla 2020",
  "service": "Cambio de aceite",
  "contact": "5551234567",
  "date": "2025-01-25T10:00:00",
  "status": "Scheduled",
  "tags": [],
  "created_at": "2025-01-25T08:00:00Z",
  "updated_at": "2025-01-25T08:00:00Z"
}
```

---

### 4. Actualizar una cita

**PUT** `/api/appointments/{id}`

Actualiza una cita existente.

**Parámetros:**
- `id` (string, UUID) - ID de la cita

**Body (JSON):**
```json
{
  "customer_name": "Juan Pérez",
  "vehicle": "Toyota Corolla 2020",
  "service": "Cambio de aceite y filtros",
  "contact": "5551234567",
  "date": "2025-01-26T10:00:00",
  "status": "Scheduled",
  "tags": ["reprogramó"]
}
```

**Respuesta exitosa (200):**
```json
{
  "id": "uuid",
  "customer_name": "Juan Pérez",
  "vehicle": "Toyota Corolla 2020",
  "service": "Cambio de aceite y filtros",
  "contact": "5551234567",
  "date": "2025-01-26T10:00:00",
  "status": "Scheduled",
  "tags": ["reprogramó"],
  "created_at": "2025-01-20T08:00:00Z",
  "updated_at": "2025-01-25T09:00:00Z"
}
```

---

### 5. Eliminar una cita

**DELETE** `/api/appointments/{id}`

Elimina una cita.

**Parámetros:**
- `id` (string, UUID) - ID de la cita

**Respuesta exitosa (200):**
```json
{
  "success": true
}
```

---

## Endpoints de Vehículos (Vehicles)

### 1. Obtener vehículos en el taller

**GET** `/api/vehicles`

Retorna todos los vehículos actualmente en el taller (no entregados).

**Parámetros de consulta opcionales:**
- `delivered=true` - Retorna solo vehículos entregados

**Respuesta exitosa (200):**
```json
[
  {
    "id": "uuid",
    "customer_name": "María García",
    "vehicle": "Honda Civic 2019",
    "service": "Reparación de transmisión",
    "contact": "5559876543",
    "check_in_date": "2025-01-20T09:00:00",
    "estimated_completion": "2025-01-27T17:00:00",
    "notes": "Cliente pidió presupuesto antes de iniciar",
    "tags": ["en reparación", "esperando refacciones"],
    "technician": "Carlos Méndez",
    "labor_hours": 8.5,
    "folio": "TM-2025-001",
    "delivered_at": null,
    "created_at": "2025-01-20T09:00:00Z",
    "updated_at": "2025-01-23T14:00:00Z"
  }
]
```

**Posibles tags para vehículos:**
- `esperando refacciones`
- `refacciones en recepción`
- `esperando técnico`
- `en diagnóstico`
- `en reparación`
- `listo para entrega`
- `esperando aprobación`
- `garantía`

---

### 2. Obtener un vehículo específico

**GET** `/api/vehicles/{id}`

Retorna los detalles de un vehículo específico.

**Parámetros:**
- `id` (string, UUID) - ID del vehículo

**Respuesta exitosa (200):**
```json
{
  "id": "uuid",
  "customer_name": "María García",
  "vehicle": "Honda Civic 2019",
  "service": "Reparación de transmisión",
  "contact": "5559876543",
  "check_in_date": "2025-01-20T09:00:00",
  "estimated_completion": "2025-01-27T17:00:00",
  "notes": "Cliente pidió presupuesto antes de iniciar",
  "tags": ["en reparación"],
  "technician": "Carlos Méndez",
  "labor_hours": 8.5,
  "folio": "TM-2025-001",
  "delivered_at": null,
  "created_at": "2025-01-20T09:00:00Z",
  "updated_at": "2025-01-23T14:00:00Z"
}
```

**Respuesta de error (404):**
```json
{
  "error": "Vehicle not found"
}
```

---

### 3. Crear un nuevo vehículo en el taller

**POST** `/api/vehicles`

Registra un vehículo nuevo en el taller.

**Body (JSON):**
```json
{
  "customer_name": "María García",
  "vehicle": "Honda Civic 2019",
  "service": "Reparación de transmisión",
  "contact": "5559876543",
  "check_in_date": "2025-01-20T09:00:00",
  "estimated_completion": "2025-01-27T17:00:00",
  "notes": "Cliente pidió presupuesto antes de iniciar",
  "tags": ["en diagnóstico"],
  "technician": "Carlos Méndez",
  "labor_hours": 0,
  "folio": "TM-2025-001"
}
```

**Campos requeridos:**
- `customer_name` (string)
- `vehicle` (string)
- `service` (string)
- `contact` (string)
- `check_in_date` (string, formato ISO 8601)

**Campos opcionales:**
- `estimated_completion` (string, formato ISO 8601, default: null)
- `notes` (string, default: "")
- `tags` (array de strings, default: [])
- `technician` (string, default: null)
- `labor_hours` (number, default: 0)
- `folio` (string, default: null)

**Respuesta exitosa (201):**
```json
{
  "id": "uuid-generado",
  "customer_name": "María García",
  "vehicle": "Honda Civic 2019",
  "service": "Reparación de transmisión",
  "contact": "5559876543",
  "check_in_date": "2025-01-20T09:00:00",
  "estimated_completion": "2025-01-27T17:00:00",
  "notes": "Cliente pidió presupuesto antes de iniciar",
  "tags": ["en diagnóstico"],
  "technician": "Carlos Méndez",
  "labor_hours": 0,
  "folio": "TM-2025-001",
  "delivered_at": null,
  "created_at": "2025-01-20T09:00:00Z",
  "updated_at": "2025-01-20T09:00:00Z"
}
```

---

### 4. Actualizar un vehículo

**PUT** `/api/vehicles/{id}`

Actualiza la información de un vehículo.

**Parámetros:**
- `id` (string, UUID) - ID del vehículo

**Body (JSON):**
```json
{
  "customer_name": "María García",
  "vehicle": "Honda Civic 2019",
  "service": "Reparación de transmisión",
  "contact": "5559876543",
  "check_in_date": "2025-01-20T09:00:00",
  "estimated_completion": "2025-01-27T17:00:00",
  "notes": "Presupuesto aprobado, trabajo en progreso",
  "tags": ["en reparación", "esperando refacciones"],
  "technician": "Carlos Méndez",
  "labor_hours": 8.5,
  "folio": "TM-2025-001"
}
```

**Respuesta exitosa (200):**
```json
{
  "id": "uuid",
  "customer_name": "María García",
  "vehicle": "Honda Civic 2019",
  "service": "Reparación de transmisión",
  "contact": "5559876543",
  "check_in_date": "2025-01-20T09:00:00",
  "estimated_completion": "2025-01-27T17:00:00",
  "notes": "Presupuesto aprobado, trabajo en progreso",
  "tags": ["en reparación", "esperando refacciones"],
  "technician": "Carlos Méndez",
  "labor_hours": 8.5,
  "folio": "TM-2025-001",
  "delivered_at": null,
  "created_at": "2025-01-20T09:00:00Z",
  "updated_at": "2025-01-23T14:30:00Z"
}
```

---

### 5. Eliminar un vehículo

**DELETE** `/api/vehicles/{id}`

Elimina un vehículo del sistema.

**Parámetros:**
- `id` (string, UUID) - ID del vehículo

**Respuesta exitosa (200):**
```json
{
  "success": true
}
```

---

### 6. Marcar vehículo como entregado

**POST** `/api/vehicles/{id}/deliver`

Marca un vehículo como entregado.

**Parámetros:**
- `id` (string, UUID) - ID del vehículo

**Respuesta exitosa (200):**
```json
{
  "success": true
}
```

---

### 7. Convertir vehículo a cita

**POST** `/api/vehicles/{id}/convert-to-appointment`

Convierte un vehículo del taller de vuelta a una cita (útil para corregir errores).

**Parámetros:**
- `id` (string, UUID) - ID del vehículo

**Respuesta exitosa (200):**
```json
{
  "id": "nuevo-uuid-cita",
  "customer_name": "María García",
  "vehicle": "Honda Civic 2019",
  "service": "Reparación de transmisión",
  "contact": "5559876543",
  "date": "2025-01-20T09:00:00",
  "status": "Scheduled",
  "tags": [],
  "created_at": "2025-01-25T10:00:00Z",
  "updated_at": "2025-01-25T10:00:00Z"
}
```

---

### 8. Obtener comentarios de un vehículo

**GET** `/api/vehicles/{id}/comments`

Retorna todos los comentarios de un vehículo.

**Parámetros:**
- `id` (string, UUID) - ID del vehículo

**Respuesta exitosa (200):**
```json
[
  {
    "id": "uuid",
    "vehicle_id": "uuid-vehiculo",
    "comment_text": "Se encontró daño adicional en el eje",
    "created_at": "2025-01-22T11:30:00Z"
  },
  {
    "id": "uuid",
    "vehicle_id": "uuid-vehiculo",
    "comment_text": "Cliente aprobó presupuesto adicional",
    "created_at": "2025-01-23T09:15:00Z"
  }
]
```

---

### 9. Agregar comentario a un vehículo

**POST** `/api/vehicles/{id}/comments`

Agrega un nuevo comentario a un vehículo.

**Parámetros:**
- `id` (string, UUID) - ID del vehículo

**Body (JSON):**
```json
{
  "comment_text": "Refacciones recibidas, iniciando reparación"
}
```

**Campos requeridos:**
- `comment_text` (string)

**Respuesta exitosa (201):**
```json
{
  "id": "uuid-generado",
  "vehicle_id": "uuid-vehiculo",
  "comment_text": "Refacciones recibidas, iniciando reparación",
  "created_at": "2025-01-24T14:00:00Z"
}
```

---

## Endpoint de Estadísticas

### Obtener estadísticas generales

**GET** `/api/stats`

Retorna estadísticas generales del taller.

**Respuesta exitosa (200):**
```json
{
  "total_appointments": 45,
  "vehicles_in_shop": 12,
  "delivered_vehicles": 8,
  "scheduled_appointments": 15,
  "completed_appointments": 30
}
```

---

## Códigos de Error

- **200** - OK - Solicitud exitosa
- **201** - Created - Recurso creado exitosamente
- **404** - Not Found - Recurso no encontrado
- **500** - Internal Server Error - Error del servidor

**Formato de respuesta de error:**
```json
{
  "error": "Descripción del error"
}
```

---

## Ejemplos de Uso con cURL

### Obtener todas las citas
```bash
curl -X GET https://[your-project].supabase.co/functions/v1/api/appointments \
  -H "Content-Type: application/json"
```

### Crear una nueva cita
```bash
curl -X POST https://[your-project].supabase.co/functions/v1/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Juan Pérez",
    "vehicle": "Toyota Corolla 2020",
    "service": "Cambio de aceite",
    "contact": "5551234567",
    "date": "2025-01-25T10:00:00",
    "status": "Scheduled"
  }'
```

### Obtener vehículos en el taller
```bash
curl -X GET https://[your-project].supabase.co/functions/v1/api/vehicles \
  -H "Content-Type: application/json"
```

### Agregar comentario a un vehículo
```bash
curl -X POST https://[your-project].supabase.co/functions/v1/api/vehicles/[vehicle-id]/comments \
  -H "Content-Type: application/json" \
  -d '{
    "comment_text": "Trabajo completado, listo para entrega"
  }'
```

### Marcar vehículo como entregado
```bash
curl -X POST https://[your-project].supabase.co/functions/v1/api/vehicles/[vehicle-id]/deliver \
  -H "Content-Type: application/json"
```

---

## Ejemplos de Uso con JavaScript/TypeScript

### Obtener todas las citas
```javascript
const response = await fetch('https://[your-project].supabase.co/functions/v1/api/appointments');
const appointments = await response.json();
console.log(appointments);
```

### Crear una nueva cita
```javascript
const response = await fetch('https://[your-project].supabase.co/functions/v1/api/appointments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customer_name: 'Juan Pérez',
    vehicle: 'Toyota Corolla 2020',
    service: 'Cambio de aceite',
    contact: '5551234567',
    date: '2025-01-25T10:00:00',
    status: 'Scheduled'
  })
});
const newAppointment = await response.json();
console.log(newAppointment);
```

### Obtener vehículos en el taller
```javascript
const response = await fetch('https://[your-project].supabase.co/functions/v1/api/vehicles');
const vehicles = await response.json();
console.log(vehicles);
```

### Actualizar un vehículo
```javascript
const vehicleId = 'uuid-del-vehiculo';
const response = await fetch(`https://[your-project].supabase.co/functions/v1/api/vehicles/${vehicleId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customer_name: 'María García',
    vehicle: 'Honda Civic 2019',
    service: 'Reparación de transmisión',
    contact: '5559876543',
    check_in_date: '2025-01-20T09:00:00',
    estimated_completion: '2025-01-27T17:00:00',
    notes: 'Trabajo completado',
    tags: ['listo para entrega'],
    technician: 'Carlos Méndez',
    labor_hours: 12.5,
    folio: 'TM-2025-001'
  })
});
const updatedVehicle = await response.json();
console.log(updatedVehicle);
```

---

## Notas Importantes

1. **Formato de fechas**: Todas las fechas deben estar en formato ISO 8601. Por ejemplo: `2025-01-25T10:00:00`

2. **UUIDs**: Todos los IDs son UUIDs generados automáticamente por el sistema.

3. **Tags**: Los tags son arrays de strings y deben usar exactamente los valores listados en esta documentación.

4. **CORS**: La API está configurada con CORS abierto, permitiendo llamadas desde cualquier origen.

5. **Sin autenticación**: Esta API es pública y no requiere autenticación. Es apropiada para uso interno del taller.

6. **Timestamps**: `created_at` y `updated_at` son gestionados automáticamente por el sistema.

7. **Conversión de vehículo a cita**: Al convertir un vehículo de vuelta a cita, el vehículo se elimina del taller y se crea una nueva cita con status "Scheduled".
