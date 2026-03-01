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

**Parámetros de consulta opcionales:**
- `date` (string, formato YYYY-MM-DD) - Filtra citas de una fecha específica
- `start_date` (string, formato YYYY-MM-DD) - Filtra citas desde esta fecha
- `end_date` (string, formato YYYY-MM-DD) - Filtra citas hasta esta fecha
- `status` (string) - Filtra por estado (Scheduled, Completed, Canceled)

**Ejemplos de uso:**
- `/api/appointments` - Todas las citas
- `/api/appointments?date=2025-01-25` - Citas del 25 de enero de 2025
- `/api/appointments?start_date=2025-01-20&end_date=2025-01-27` - Citas en un rango
- `/api/appointments?status=Scheduled` - Solo citas programadas

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
# Todas las citas
curl -X GET https://[your-project].supabase.co/functions/v1/api/appointments \
  -H "Content-Type: application/json"

# Citas de una fecha específica
curl -X GET "https://[your-project].supabase.co/functions/v1/api/appointments?date=2025-01-25" \
  -H "Content-Type: application/json"

# Citas en un rango de fechas
curl -X GET "https://[your-project].supabase.co/functions/v1/api/appointments?start_date=2025-01-20&end_date=2025-01-27" \
  -H "Content-Type: application/json"

# Solo citas programadas
curl -X GET "https://[your-project].supabase.co/functions/v1/api/appointments?status=Scheduled" \
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

### Crear una nueva cotización
```bash
curl -X POST https://[your-project].supabase.co/functions/v1/api/cotizaciones \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Juan Pérez",
    "vehicle": "Toyota Corolla 2020",
    "customer_contact": "5551234567",
    "placa": "ABC-123",
    "vin": "1HGBH41JXMN109186",
    "notes": "Cotización para mantenimiento mayor"
  }'
```

### Obtener cotizaciones
```bash
# Todas las cotizaciones
curl -X GET https://[your-project].supabase.co/functions/v1/api/cotizaciones \
  -H "Content-Type: application/json"

# Buscar cotizaciones por placa
curl -X GET "https://[your-project].supabase.co/functions/v1/api/cotizaciones?search=ABC-123" \
  -H "Content-Type: application/json"

# Cotizaciones aprobadas
curl -X GET "https://[your-project].supabase.co/functions/v1/api/cotizaciones?status=APPROVED" \
  -H "Content-Type: application/json"
```

### Agregar trabajo a cotización
```bash
curl -X POST https://[your-project].supabase.co/functions/v1/api/cotizaciones/[cotizacion-id]/trabajos \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mantenimiento Mayor",
    "description": "Cambio de aceite y filtros"
  }'
```

### Agregar partida de refacción
```bash
curl -X POST https://[your-project].supabase.co/functions/v1/api/trabajos/[trabajo-id]/partidas \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "REFACCION",
    "description": "Aceite sintético 5W-30",
    "quantity": 4,
    "unit": "LT",
    "cost": 200.00,
    "margin_percent": 30,
    "discount_type": "PERCENT",
    "discount_value": 10,
    "tax_percent": 16
  }'
```

### Agregar proveedor a partida
```bash
curl -X POST https://[your-project].supabase.co/functions/v1/api/partidas/[partida-id]/proveedores \
  -H "Content-Type: application/json" \
  -d '{
    "proveedor": "AutoZone",
    "costo": 200.00,
    "is_selected": true,
    "incluye_iva": true
  }'
```

---

## Ejemplos de Uso con JavaScript/TypeScript

### Obtener todas las citas
```javascript
// Todas las citas
const response = await fetch('https://[your-project].supabase.co/functions/v1/api/appointments');
const appointments = await response.json();
console.log(appointments);

// Citas de una fecha específica
const responseByDate = await fetch('https://[your-project].supabase.co/functions/v1/api/appointments?date=2025-01-25');
const appointmentsByDate = await responseByDate.json();

// Citas en un rango
const responseByRange = await fetch('https://[your-project].supabase.co/functions/v1/api/appointments?start_date=2025-01-20&end_date=2025-01-27');
const appointmentsByRange = await responseByRange.json();

// Solo citas programadas
const responseByStatus = await fetch('https://[your-project].supabase.co/functions/v1/api/appointments?status=Scheduled');
const scheduledAppointments = await responseByStatus.json();
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

### Crear una nueva cotización
```javascript
const response = await fetch('https://[your-project].supabase.co/functions/v1/api/cotizaciones', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customer_name: 'Juan Pérez',
    vehicle: 'Toyota Corolla 2020',
    customer_contact: '5551234567',
    placa: 'ABC-123',
    vin: '1HGBH41JXMN109186',
    notes: 'Cotización para mantenimiento mayor'
  })
});
const newCotizacion = await response.json();
console.log(newCotizacion);
```

### Obtener cotizaciones con filtros
```javascript
// Todas las cotizaciones
const response = await fetch('https://[your-project].supabase.co/functions/v1/api/cotizaciones');
const cotizaciones = await response.json();

// Buscar por placa
const searchResponse = await fetch('https://[your-project].supabase.co/functions/v1/api/cotizaciones?search=ABC-123');
const searchResults = await searchResponse.json();

// Cotizaciones aprobadas
const approvedResponse = await fetch('https://[your-project].supabase.co/functions/v1/api/cotizaciones?status=APPROVED');
const approvedCotizaciones = await approvedResponse.json();
```

### Obtener cotización completa
```javascript
const cotizacionId = 'uuid-de-la-cotizacion';
const response = await fetch(`https://[your-project].supabase.co/functions/v1/api/cotizaciones/${cotizacionId}`);
const cotizacion = await response.json();
console.log(cotizacion);
// Incluye trabajos, partidas y proveedores
```

### Agregar trabajo a cotización
```javascript
const cotizacionId = 'uuid-de-la-cotizacion';
const response = await fetch(`https://[your-project].supabase.co/functions/v1/api/cotizaciones/${cotizacionId}/trabajos`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Mantenimiento Mayor',
    description: 'Cambio de aceite y filtros'
  })
});
const newTrabajo = await response.json();
console.log(newTrabajo);
```

### Agregar partida de refacción
```javascript
const trabajoId = 'uuid-del-trabajo';
const response = await fetch(`https://[your-project].supabase.co/functions/v1/api/trabajos/${trabajoId}/partidas`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tipo: 'REFACCION',
    description: 'Aceite sintético 5W-30',
    quantity: 4,
    unit: 'LT',
    cost: 200.00,
    margin_percent: 30,
    discount_type: 'PERCENT',
    discount_value: 10,
    tax_percent: 16
  })
});
const newPartida = await response.json();
console.log(newPartida);
```

### Agregar partida de mano de obra
```javascript
const trabajoId = 'uuid-del-trabajo';
const response = await fetch(`https://[your-project].supabase.co/functions/v1/api/trabajos/${trabajoId}/partidas`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tipo: 'MANO_DE_OBRA',
    description: 'Cambio de aceite y filtros',
    hours: 2,
    labor_rate: 350,
    discount_type: 'NONE',
    discount_value: 0,
    tax_percent: 16
  })
});
const newPartida = await response.json();
console.log(newPartida);
```

### Agregar proveedor a partida
```javascript
const partidaId = 'uuid-de-la-partida';
const response = await fetch(`https://[your-project].supabase.co/functions/v1/api/partidas/${partidaId}/proveedores`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    proveedor: 'AutoZone',
    costo: 200.00,
    is_selected: true,
    incluye_iva: true
  })
});
const newProveedor = await response.json();
console.log(newProveedor);
```

### Actualizar proveedor
```javascript
const proveedorId = 'uuid-del-proveedor';
const response = await fetch(`https://[your-project].supabase.co/functions/v1/api/proveedores/${proveedorId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    costo: 190.00,
    is_selected: true,
    incluye_iva: false
  })
});
const updatedProveedor = await response.json();
console.log(updatedProveedor);
```

### Duplicar cotización
```javascript
const cotizacionId = 'uuid-de-la-cotizacion';
const response = await fetch(`https://[your-project].supabase.co/functions/v1/api/cotizaciones/${cotizacionId}/duplicate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    created_by: 'admin'
  })
});
const duplicatedCotizacion = await response.json();
console.log(duplicatedCotizacion);
```

---

## Endpoints de Cotizaciones

### 1. Obtener todas las cotizaciones

**GET** `/api/cotizaciones`

Retorna todas las cotizaciones con filtros opcionales.

**Parámetros de consulta opcionales:**
- `status` (string) - Filtra por estado (DRAFT, SENT, APPROVED, REJECTED, EXPIRED)
- `search` (string) - Busca por nombre de cliente, vehículo, folio, placa o VIN
- `from_date` (string, formato YYYY-MM-DD) - Fecha desde
- `to_date` (string, formato YYYY-MM-DD) - Fecha hasta

**Ejemplos de uso:**
- `/api/cotizaciones` - Todas las cotizaciones
- `/api/cotizaciones?status=APPROVED` - Solo cotizaciones aprobadas
- `/api/cotizaciones?search=Toyota` - Buscar por vehículo
- `/api/cotizaciones?from_date=2025-01-01&to_date=2025-01-31` - Rango de fechas

**Respuesta exitosa (200):**
```json
[
  {
    "id": "uuid",
    "folio": "COT-2025-001",
    "customer_name": "Juan Pérez",
    "customer_contact": "5551234567",
    "vehicle": "Toyota Corolla 2020",
    "vehicle_id": "uuid",
    "placa": "ABC-123",
    "vin": "1HGBH41JXMN109186",
    "status": "DRAFT",
    "quote_date": "2025-01-25T10:00:00",
    "valid_until": "2025-02-01T10:00:00",
    "subtotal": 5000.00,
    "total_discount": 500.00,
    "total_taxes": 720.00,
    "total": 5220.00,
    "created_at": "2025-01-25T10:00:00"
  }
]
```

**Posibles valores de status:**
- `DRAFT` - Borrador
- `SENT` - Enviada al cliente
- `APPROVED` - Aprobada
- `REJECTED` - Rechazada
- `EXPIRED` - Vencida

---

### 2. Obtener una cotización específica

**GET** `/api/cotizaciones/{id}`

Retorna los detalles completos de una cotización incluyendo trabajos y partidas.

**Parámetros:**
- `id` (string, UUID) - ID de la cotización

**Respuesta exitosa (200):**
```json
{
  "id": "uuid",
  "folio": "COT-2025-001",
  "customer_name": "Juan Pérez",
  "customer_contact": "5551234567",
  "vehicle": "Toyota Corolla 2020",
  "vehicle_id": "uuid",
  "placa": "ABC-123",
  "vin": "1HGBH41JXMN109186",
  "status": "DRAFT",
  "quote_date": "2025-01-25T10:00:00",
  "valid_until": "2025-02-01T10:00:00",
  "default_parts_margin_percent": 30,
  "default_labor_rate": 350,
  "subtotal": 5000.00,
  "total_discount": 500.00,
  "total_taxes": 720.00,
  "total": 5220.00,
  "notes": "Cotización para mantenimiento mayor",
  "terms_and_conditions": "Garantía de 6 meses",
  "created_at": "2025-01-25T10:00:00",
  "updated_at": "2025-01-25T10:00:00",
  "created_by": "admin",
  "trabajos": [
    {
      "id": "uuid",
      "cotizacion_id": "uuid",
      "name": "Mantenimiento Mayor",
      "description": "Cambio de aceite y filtros",
      "sort_order": 0,
      "subtotal": 3000.00,
      "total_discount": 300.00,
      "total_taxes": 432.00,
      "total": 3132.00,
      "partidas": [
        {
          "id": "uuid",
          "trabajo_id": "uuid",
          "tipo": "REFACCION",
          "description": "Aceite sintético 5W-30",
          "sort_order": 0,
          "quantity": 4,
          "unit": "LT",
          "cost": 200.00,
          "margin_percent": 30,
          "unit_price": 285.71,
          "discount_type": "PERCENT",
          "discount_value": 10,
          "discount_amount": 114.28,
          "tax_percent": 16,
          "tax_amount": 163.43,
          "subtotal": 1142.84,
          "total": 1191.99,
          "proveedores": [
            {
              "id": "uuid",
              "proveedor": "AutoZone",
              "costo": 200.00,
              "is_selected": true,
              "incluye_iva": true
            },
            {
              "id": "uuid",
              "proveedor": "Refaccionaria Central",
              "costo": 220.00,
              "is_selected": false,
              "incluye_iva": false
            }
          ]
        },
        {
          "id": "uuid",
          "trabajo_id": "uuid",
          "tipo": "MANO_DE_OBRA",
          "description": "Cambio de aceite y filtros",
          "sort_order": 1,
          "quantity": 1,
          "unit": "SERVICIO",
          "hours": 2,
          "labor_rate": 350,
          "unit_price": 700.00,
          "discount_type": "NONE",
          "discount_value": 0,
          "discount_amount": 0,
          "tax_percent": 16,
          "tax_amount": 112.00,
          "subtotal": 700.00,
          "total": 812.00,
          "proveedores": []
        }
      ]
    }
  ]
}
```

**Respuesta de error (404):**
```json
{
  "error": "Cotización not found"
}
```

---

### 3. Crear una nueva cotización

**POST** `/api/cotizaciones`

Crea una nueva cotización.

**Body (JSON):**
```json
{
  "customer_name": "Juan Pérez",
  "vehicle": "Toyota Corolla 2020",
  "customer_contact": "5551234567",
  "vehicle_id": "uuid",
  "placa": "ABC-123",
  "vin": "1HGBH41JXMN109186",
  "quote_date": "2025-01-25T10:00:00",
  "valid_until": "2025-02-01T10:00:00",
  "default_parts_margin_percent": 30,
  "default_labor_rate": 350,
  "notes": "Cotización para mantenimiento mayor",
  "terms_and_conditions": "Garantía de 6 meses",
  "created_by": "admin"
}
```

**Campos requeridos:**
- `customer_name` (string)
- `vehicle` (string)

**Campos opcionales:**
- `customer_contact` (string)
- `vehicle_id` (uuid)
- `placa` (string)
- `vin` (string)
- `quote_date` (string, ISO 8601, default: now)
- `valid_until` (string, ISO 8601, default: now + 7 days)
- `default_parts_margin_percent` (number, default: 30)
- `default_labor_rate` (number, default: 350)
- `notes` (string)
- `terms_and_conditions` (string)
- `created_by` (string)

**Respuesta exitosa (201):**
```json
{
  "id": "uuid-generado",
  "folio": "COT-2025-001",
  "customer_name": "Juan Pérez",
  "customer_contact": "5551234567",
  "vehicle": "Toyota Corolla 2020",
  "vehicle_id": "uuid",
  "placa": "ABC-123",
  "vin": "1HGBH41JXMN109186",
  "status": "DRAFT",
  "quote_date": "2025-01-25T10:00:00",
  "valid_until": "2025-02-01T10:00:00",
  "default_parts_margin_percent": 30,
  "default_labor_rate": 350,
  "subtotal": 0,
  "total_discount": 0,
  "total_taxes": 0,
  "total": 0,
  "notes": "Cotización para mantenimiento mayor",
  "terms_and_conditions": "Garantía de 6 meses",
  "created_at": "2025-01-25T10:00:00",
  "created_by": "admin"
}
```

---

### 4. Actualizar una cotización

**PUT** `/api/cotizaciones/{id}`

Actualiza una cotización existente.

**Parámetros:**
- `id` (string, UUID) - ID de la cotización

**Body (JSON):** Todos los campos son opcionales
```json
{
  "customer_name": "Juan Pérez",
  "vehicle": "Toyota Corolla 2020",
  "customer_contact": "5551234567",
  "vehicle_id": "uuid",
  "placa": "ABC-123",
  "vin": "1HGBH41JXMN109186",
  "quote_date": "2025-01-25T10:00:00",
  "valid_until": "2025-02-01T10:00:00",
  "default_parts_margin_percent": 30,
  "default_labor_rate": 350,
  "notes": "Cotización actualizada",
  "terms_and_conditions": "Garantía de 6 meses"
}
```

**Respuesta exitosa (200):**
```json
{
  "id": "uuid",
  "folio": "COT-2025-001",
  "customer_name": "Juan Pérez",
  "customer_contact": "5551234567",
  "vehicle": "Toyota Corolla 2020",
  "vehicle_id": "uuid",
  "placa": "ABC-123",
  "vin": "1HGBH41JXMN109186",
  "status": "DRAFT",
  "quote_date": "2025-01-25T10:00:00",
  "valid_until": "2025-02-01T10:00:00",
  "default_parts_margin_percent": 30,
  "default_labor_rate": 350,
  "subtotal": 5000.00,
  "total_discount": 500.00,
  "total_taxes": 720.00,
  "total": 5220.00,
  "notes": "Cotización actualizada",
  "terms_and_conditions": "Garantía de 6 meses",
  "created_at": "2025-01-25T10:00:00",
  "updated_at": "2025-01-26T14:00:00",
  "created_by": "admin"
}
```

---

### 5. Eliminar una cotización

**DELETE** `/api/cotizaciones/{id}`

Elimina una cotización.

**Parámetros:**
- `id` (string, UUID) - ID de la cotización

**Respuesta exitosa (200):**
```json
{
  "success": true
}
```

---

### 6. Duplicar una cotización

**POST** `/api/cotizaciones/{id}/duplicate`

Crea una copia de una cotización existente.

**Parámetros:**
- `id` (string, UUID) - ID de la cotización a duplicar

**Body (JSON):**
```json
{
  "created_by": "admin"
}
```

**Campos opcionales:**
- `created_by` (string)

**Respuesta exitosa (201):**
```json
{
  "id": "nuevo-uuid",
  "folio": "COT-2025-002",
  "customer_name": "Juan Pérez",
  "customer_contact": "5551234567",
  "vehicle": "Toyota Corolla 2020",
  "vehicle_id": "uuid",
  "placa": "ABC-123",
  "vin": "1HGBH41JXMN109186",
  "status": "DRAFT",
  "quote_date": "2025-01-26T10:00:00",
  "valid_until": "2025-02-02T10:00:00",
  "default_parts_margin_percent": 30,
  "default_labor_rate": 350,
  "subtotal": 0,
  "total_discount": 0,
  "total_taxes": 0,
  "total": 0,
  "notes": "Cotización para mantenimiento mayor",
  "terms_and_conditions": "Garantía de 6 meses",
  "created_at": "2025-01-26T10:00:00",
  "created_by": "admin"
}
```

---

### 7. Agregar trabajo a una cotización

**POST** `/api/cotizaciones/{id}/trabajos`

Agrega un nuevo trabajo a una cotización.

**Parámetros:**
- `id` (string, UUID) - ID de la cotización

**Body (JSON):**
```json
{
  "name": "Mantenimiento Mayor",
  "description": "Cambio de aceite y filtros"
}
```

**Campos requeridos:**
- `name` (string)

**Campos opcionales:**
- `description` (string)

**Respuesta exitosa (201):**
```json
{
  "id": "uuid-generado",
  "cotizacion_id": "uuid",
  "name": "Mantenimiento Mayor",
  "description": "Cambio de aceite y filtros",
  "sort_order": 0,
  "subtotal": 0,
  "total_discount": 0,
  "total_taxes": 0,
  "total": 0
}
```

---

## Endpoints de Trabajos

### 1. Actualizar un trabajo

**PUT** `/api/trabajos/{id}`

Actualiza un trabajo existente.

**Parámetros:**
- `id` (string, UUID) - ID del trabajo

**Body (JSON):** Todos los campos son opcionales
```json
{
  "name": "Mantenimiento Mayor",
  "description": "Cambio de aceite, filtros y bujías"
}
```

**Respuesta exitosa (200):**
```json
{
  "id": "uuid",
  "cotizacion_id": "uuid",
  "name": "Mantenimiento Mayor",
  "description": "Cambio de aceite, filtros y bujías",
  "sort_order": 0,
  "subtotal": 5000.00,
  "total_discount": 500.00,
  "total_taxes": 720.00,
  "total": 5220.00
}
```

---

### 2. Eliminar un trabajo

**DELETE** `/api/trabajos/{id}`

Elimina un trabajo y todas sus partidas.

**Parámetros:**
- `id` (string, UUID) - ID del trabajo

**Respuesta exitosa (200):**
```json
{
  "success": true
}
```

---

### 3. Agregar partida a un trabajo

**POST** `/api/trabajos/{id}/partidas`

Agrega una nueva partida (refacción o mano de obra) a un trabajo.

**Parámetros:**
- `id` (string, UUID) - ID del trabajo

**Body para partida tipo REFACCION:**
```json
{
  "tipo": "REFACCION",
  "description": "Aceite sintético 5W-30",
  "quantity": 4,
  "unit": "LT",
  "cost": 200.00,
  "margin_percent": 30,
  "discount_type": "PERCENT",
  "discount_value": 10,
  "tax_percent": 16
}
```

**Body para partida tipo MANO_DE_OBRA:**
```json
{
  "tipo": "MANO_DE_OBRA",
  "description": "Cambio de aceite y filtros",
  "hours": 2,
  "labor_rate": 350,
  "discount_type": "NONE",
  "discount_value": 0,
  "tax_percent": 16
}
```

**Campos requeridos:**
- `tipo` (string) - "REFACCION" o "MANO_DE_OBRA"
- `description` (string)

**Campos opcionales para REFACCION:**
- `quantity` (number, default: 1)
- `unit` (string, default: "PZA")
- `cost` (number, default: 0)
- `margin_percent` (number, default: valor de cotización)
- `discount_type` (string, default: "NONE")
- `discount_value` (number, default: 0)
- `tax_percent` (number, default: 16)

**Campos opcionales para MANO_DE_OBRA:**
- `hours` (number, default: 1)
- `labor_rate` (number, default: valor de cotización)
- `discount_type` (string, default: "NONE")
- `discount_value` (number, default: 0)
- `tax_percent` (number, default: 16)

**Tipos de descuento (discount_type):**
- `NONE` - Sin descuento
- `PERCENT` - Descuento porcentual
- `FIXED` - Descuento fijo

**Respuesta exitosa (201):**
```json
{
  "id": "uuid-generado",
  "trabajo_id": "uuid",
  "tipo": "REFACCION",
  "description": "Aceite sintético 5W-30",
  "sort_order": 0,
  "quantity": 4,
  "unit": "LT",
  "cost": 200.00,
  "margin_percent": 30,
  "unit_price": 285.71,
  "discount_type": "PERCENT",
  "discount_value": 10,
  "discount_amount": 114.28,
  "tax_percent": 16,
  "tax_amount": 163.43,
  "subtotal": 1142.84,
  "total": 1191.99
}
```

---

## Endpoints de Partidas

### 1. Actualizar una partida

**PUT** `/api/partidas/{id}`

Actualiza una partida existente.

**Parámetros:**
- `id` (string, UUID) - ID de la partida

**Body para REFACCION (todos los campos opcionales):**
```json
{
  "tipo": "REFACCION",
  "description": "Aceite sintético 5W-40",
  "quantity": 5,
  "unit": "LT",
  "cost": 220.00,
  "margin_percent": 35,
  "discount_type": "PERCENT",
  "discount_value": 15,
  "tax_percent": 16
}
```

**Body para MANO_DE_OBRA (todos los campos opcionales):**
```json
{
  "tipo": "MANO_DE_OBRA",
  "description": "Cambio de aceite, filtros y bujías",
  "hours": 3,
  "labor_rate": 400,
  "discount_type": "FIXED",
  "discount_value": 100,
  "tax_percent": 16
}
```

**Respuesta exitosa (200):**
```json
{
  "id": "uuid",
  "trabajo_id": "uuid",
  "tipo": "REFACCION",
  "description": "Aceite sintético 5W-40",
  "sort_order": 0,
  "quantity": 5,
  "unit": "LT",
  "cost": 220.00,
  "margin_percent": 35,
  "unit_price": 338.46,
  "discount_type": "PERCENT",
  "discount_value": 15,
  "discount_amount": 253.85,
  "tax_percent": 16,
  "tax_amount": 222.77,
  "subtotal": 1692.30,
  "total": 1661.22
}
```

---

### 2. Eliminar una partida

**DELETE** `/api/partidas/{id}`

Elimina una partida.

**Parámetros:**
- `id` (string, UUID) - ID de la partida

**Respuesta exitosa (200):**
```json
{
  "success": true
}
```

---

### 3. Obtener proveedores de una partida

**GET** `/api/partidas/{id}/proveedores`

Retorna todos los proveedores de una partida de tipo REFACCION.

**Parámetros:**
- `id` (string, UUID) - ID de la partida

**Respuesta exitosa (200):**
```json
[
  {
    "id": "uuid",
    "proveedor": "AutoZone",
    "costo": 200.00,
    "is_selected": true,
    "incluye_iva": true
  },
  {
    "id": "uuid",
    "proveedor": "Refaccionaria Central",
    "costo": 220.00,
    "is_selected": false,
    "incluye_iva": false
  }
]
```

---

### 4. Agregar proveedor a una partida

**POST** `/api/partidas/{id}/proveedores`

Agrega un nuevo proveedor a una partida de tipo REFACCION.

**Parámetros:**
- `id` (string, UUID) - ID de la partida

**Body (JSON):**
```json
{
  "proveedor": "AutoZone",
  "costo": 200.00,
  "is_selected": true,
  "incluye_iva": true
}
```

**Campos requeridos:**
- `proveedor` (string) - Nombre del proveedor
- `costo` (number) - Costo del proveedor

**Campos opcionales:**
- `is_selected` (boolean, default: false) - Si está seleccionado como proveedor activo
- `incluye_iva` (boolean, default: true) - Si el costo incluye IVA

**Respuesta exitosa (201):**
```json
{
  "id": "uuid-generado",
  "partida_id": "uuid",
  "proveedor": "AutoZone",
  "costo": 200.00,
  "is_selected": true,
  "incluye_iva": true
}
```

---

## Endpoints de Proveedores

### 1. Actualizar un proveedor

**PUT** `/api/proveedores/{id}`

Actualiza un proveedor existente.

**Parámetros:**
- `id` (string, UUID) - ID del proveedor

**Body (JSON):** Todos los campos son opcionales
```json
{
  "proveedor": "AutoZone",
  "costo": 190.00,
  "is_selected": true,
  "incluye_iva": true
}
```

**Respuesta exitosa (200):**
```json
{
  "id": "uuid",
  "partida_id": "uuid",
  "proveedor": "AutoZone",
  "costo": 190.00,
  "is_selected": true,
  "incluye_iva": true
}
```

---

### 2. Eliminar un proveedor

**DELETE** `/api/proveedores/{id}`

Elimina un proveedor.

**Parámetros:**
- `id` (string, UUID) - ID del proveedor

**Respuesta exitosa (200):**
```json
{
  "success": true
}
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

8. **Folios automáticos**: Las cotizaciones generan folios automáticamente en formato COT-YYYY-NNN (ej: COT-2025-001).

9. **Cálculo de márgenes**: Se usa la fórmula de margen real, no markup:
   - Precio Venta = Costo / (1 - Margen%)
   - Ejemplo: Costo $100, Margen 30% → $100 / 0.70 = $142.86

10. **IVA en proveedores**: El sistema maneja automáticamente el IVA:
    - Si el costo incluye IVA: extrae el IVA antes de aplicar margen
    - Si el costo no incluye IVA: usa el costo directo para calcular margen
    - Esto evita doble cobro de IVA al cliente

11. **Actualización de totales**: Los totales se calculan automáticamente mediante triggers de base de datos cuando se modifican partidas.

12. **Proveedores múltiples**: Cada partida de refacción puede tener múltiples proveedores. Solo uno puede estar seleccionado a la vez.

13. **Tipos de partida**:
    - REFACCION: requiere quantity, cost, margin_percent
    - MANO_DE_OBRA: requiere hours, labor_rate

14. **Búsqueda de cotizaciones**: El parámetro `search` busca en: nombre de cliente, vehículo, folio, placa y VIN.
