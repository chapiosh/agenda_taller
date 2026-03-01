# MCP Tools Reference

Complete reference for all 12 tools available in the Mechanic Shop MCP Server.

## Tool Categories

### Appointments (2 tools)
- `list_appointments` - Query and filter appointments
- `create_appointment` - Create new appointments

### Vehicles (3 tools)
- `list_vehicles` - List vehicles in shop
- `get_vehicle` - Get vehicle details
- `update_vehicle` - Update vehicle information

### Parts (3 tools)
- `list_vehicle_parts` - List parts for a vehicle
- `add_vehicle_part` - Add new part
- `update_vehicle_part` - Update part status/info

### Workflow & Stats (2 tools)
- `get_workflow` - Get Kanban workflow view
- `get_stats` - Get shop statistics

### Quotes (2 tools)
- `list_quotes` - List and filter quotes
- `get_quote` - Get full quote details

---

## Detailed Tool Specifications

### 1. list_appointments

**Purpose:** List appointments with optional filters

**Input Schema:**
```json
{
  "date": "2025-01-25",              // Optional: YYYY-MM-DD
  "start_date": "2025-01-20",        // Optional: YYYY-MM-DD
  "end_date": "2025-01-27",          // Optional: YYYY-MM-DD
  "status": "Scheduled"              // Optional: Scheduled|Completed|Canceled
}
```

**Output:** Array of appointment objects
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

**Use Cases:**
- View today's schedule
- Find all appointments for a specific date
- Get appointments in a date range
- Filter by status (scheduled, completed, canceled)

---

### 2. create_appointment

**Purpose:** Create a new appointment

**Input Schema:**
```json
{
  "customer_name": "Juan Pérez",     // Required
  "vehicle": "Toyota Corolla 2020",  // Required
  "service": "Cambio de aceite",     // Required
  "contact": "5551234567",           // Required
  "date": "2025-01-25T10:00:00",    // Required: ISO 8601
  "status": "Scheduled",             // Optional: default is Scheduled
  "tags": ["confirmado"]             // Optional: array of strings
}
```

**Output:** Created appointment object

**Use Cases:**
- Book new customer appointments
- Schedule follow-up services
- Create appointments from phone calls

---

### 3. list_vehicles

**Purpose:** List vehicles currently in the shop

**Input Schema:**
```json
{
  "delivered": false  // Optional: if true, show only delivered vehicles
}
```

**Output:** Array of vehicle objects
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
    "notes": "Cliente pidió presupuesto",
    "tags": ["en reparación"],
    "technician": "Carlos Méndez",
    "labor_hours": 8.5,
    "folio": "TM-2025-001",
    "delivered_at": null
  }
]
```

**Use Cases:**
- See all vehicles currently in shop
- View delivered vehicles history
- Check shop capacity

---

### 4. get_vehicle

**Purpose:** Get detailed information for a specific vehicle

**Input Schema:**
```json
{
  "id": "vehicle-uuid-here"  // Required: vehicle UUID
}
```

**Output:** Single vehicle object (same structure as list_vehicles)

**Use Cases:**
- View complete vehicle details
- Check specific vehicle status
- Review vehicle history

---

### 5. update_vehicle

**Purpose:** Update vehicle information, tags, status

**Input Schema:**
```json
{
  "id": "vehicle-uuid-here",         // Required: vehicle UUID
  "payload": {                       // Required: fields to update
    "customer_name": "María García",
    "vehicle": "Honda Civic 2019",
    "service": "Reparación de transmisión",
    "contact": "5559876543",
    "check_in_date": "2025-01-20T09:00:00",
    "estimated_completion": "2025-01-27T17:00:00",
    "notes": "Presupuesto aprobado",
    "tags": ["en reparación", "esperando refacciones"],
    "technician": "Carlos Méndez",
    "labor_hours": 12.5,
    "folio": "TM-2025-001"
  }
}
```

**Output:** Updated vehicle object

**Use Cases:**
- Change vehicle status/tags
- Update technician assignment
- Modify estimated completion
- Update labor hours
- Add notes

---

### 6. get_workflow

**Purpose:** Get workshop workflow with vehicles grouped by stage (Kanban view)

**Input Schema:**
```json
{}  // No parameters required
```

**Output:** Object with vehicles grouped by workflow stage
```json
{
  "en_diagnostico": [/* vehicle objects */],
  "esperando_aprobacion": [/* vehicle objects */],
  "esperando_refacciones": [/* vehicle objects */],
  "refacciones_en_recepcion": [/* vehicle objects */],
  "esperando_tecnico": [/* vehicle objects */],
  "en_reparacion": [/* vehicle objects */],
  "listo_para_entrega": [/* vehicle objects */],
  "garantia": [/* vehicle objects */]
}
```

**Use Cases:**
- View workshop status at a glance
- Identify bottlenecks
- Kanban board visualization
- Daily standup reports

---

### 7. list_vehicle_parts

**Purpose:** List all parts (refacciones) for a specific vehicle

**Input Schema:**
```json
{
  "vehicle_id": "vehicle-uuid-here"  // Required: vehicle UUID
}
```

**Output:** Array of part objects
```json
[
  {
    "id": "uuid",
    "vehicle_id": "vehicle-uuid",
    "description": "Bomba de agua",
    "oem_part_number": "19200-P2A-000",
    "alternative_part_numbers": ["WP-9158", "AW9381"],
    "supplier": "AutoZone",
    "supplier_quote": 850.00,
    "purchase_price": 800.00,
    "sell_price": 1200.00,
    "status": "installed",
    "ordered_at": "2025-01-21T10:00:00Z",
    "received_at": "2025-01-23T14:00:00Z",
    "installed_at": "2025-01-24T11:00:00Z",
    "notes": "Parte original Honda"
  }
]
```

**Use Cases:**
- View all parts for a vehicle
- Calculate total parts cost
- Check part status
- Track installation progress

---

### 8. add_vehicle_part

**Purpose:** Add a new part to a vehicle

**Input Schema:**
```json
{
  "vehicle_id": "vehicle-uuid-here",           // Required
  "description": "Bomba de agua",              // Required
  "oem_part_number": "19200-P2A-000",         // Optional
  "alternative_part_numbers": ["WP-9158"],     // Optional
  "supplier": "AutoZone",                      // Optional
  "supplier_quote": 850.00,                    // Optional: >= 0
  "purchase_price": 800.00,                    // Optional: >= 0
  "sell_price": 1200.00,                       // Optional: >= 0
  "status": "ordered",                         // Optional: quoted|ordered|in_transit|received|installed|returned|canceled
  "ordered_at": "2025-01-21T10:00:00",        // Optional: ISO 8601
  "received_at": null,                         // Optional: ISO 8601
  "installed_at": null,                        // Optional: ISO 8601
  "notes": "Original Honda part"               // Optional
}
```

**Output:** Created part object

**Use Cases:**
- Record ordered parts
- Track part quotes
- Document part suppliers
- Manage part inventory per vehicle

---

### 9. update_vehicle_part

**Purpose:** Update an existing part

**Input Schema:**
```json
{
  "vehicle_id": "vehicle-uuid-here",  // Required
  "part_id": "part-uuid-here",        // Required
  "payload": {                        // Required: fields to update
    "description": "Bomba de agua original",
    "status": "installed",
    "installed_at": "2025-01-24T11:00:00",
    "purchase_price": 780.00,
    "notes": "Installed successfully"
  }
}
```

**Output:** Updated part object

**Use Cases:**
- Mark part as received
- Update part status to installed
- Correct pricing information
- Add installation notes
- Track part lifecycle

---

### 10. get_stats

**Purpose:** Get global shop statistics

**Input Schema:**
```json
{}  // No parameters required
```

**Output:** Statistics object
```json
{
  "total_appointments": 464,
  "vehicles_in_shop": 14,
  "delivered_vehicles": 355,
  "scheduled_appointments": 12,
  "completed_appointments": 452
}
```

**Use Cases:**
- Dashboard overview
- Performance metrics
- Daily/weekly reports
- Capacity planning

---

### 11. list_quotes

**Purpose:** List quotes (cotizaciones) with optional filters

**Input Schema:**
```json
{
  "status": "APPROVED",              // Optional: DRAFT|SENT|APPROVED|REJECTED|EXPIRED
  "search": "Toyota",                // Optional: search customer, vehicle, folio, placa, VIN
  "from_date": "2025-01-01",        // Optional: YYYY-MM-DD
  "to_date": "2025-01-31"           // Optional: YYYY-MM-DD
}
```

**Output:** Array of quote summary objects
```json
[
  {
    "id": "uuid",
    "folio": "COT-2025-001",
    "customer_name": "Juan Pérez",
    "customer_contact": "5551234567",
    "vehicle": "Toyota Corolla 2020",
    "placa": "ABC-123",
    "vin": "1HGBH41JXMN109186",
    "status": "APPROVED",
    "quote_date": "2025-01-25T10:00:00",
    "valid_until": "2025-02-01T10:00:00",
    "subtotal": 5000.00,
    "total_discount": 500.00,
    "total_taxes": 720.00,
    "total": 5220.00
  }
]
```

**Use Cases:**
- Search quotes by customer or vehicle
- Filter quotes by status
- View quote history
- Track approved quotes

---

### 12. get_quote

**Purpose:** Get full details of a quote including trabajos, partidas, and proveedores

**Input Schema:**
```json
{
  "id": "quote-uuid-here"  // Required: quote UUID
}
```

**Output:** Full quote object with nested data
```json
{
  "id": "uuid",
  "folio": "COT-2025-001",
  "customer_name": "Juan Pérez",
  "vehicle": "Toyota Corolla 2020",
  "status": "APPROVED",
  "total": 5220.00,
  "trabajos": [
    {
      "id": "uuid",
      "name": "Mantenimiento Mayor",
      "partidas": [
        {
          "id": "uuid",
          "tipo": "REFACCION",
          "description": "Aceite sintético",
          "quantity": 4,
          "unit_price": 285.71,
          "total": 1191.99,
          "proveedores": [
            {
              "proveedor": "AutoZone",
              "costo": 200.00,
              "is_selected": true
            }
          ]
        }
      ]
    }
  ]
}
```

**Use Cases:**
- Review complete quote details
- Check pricing breakdown
- Verify supplier selection
- Print/export quote

---

## Common Patterns

### Filter by Date Range
```json
{
  "tool": "list_appointments",
  "arguments": {
    "start_date": "2025-01-20",
    "end_date": "2025-01-27"
  }
}
```

### Update Vehicle Status
```json
{
  "tool": "update_vehicle",
  "arguments": {
    "id": "vehicle-uuid",
    "payload": {
      "tags": ["listo para entrega"],
      "notes": "Trabajo completado"
    }
  }
}
```

### Track Part Lifecycle
```json
// 1. Add part as quoted
{
  "tool": "add_vehicle_part",
  "arguments": {
    "vehicle_id": "uuid",
    "description": "Bomba de agua",
    "status": "quoted"
  }
}

// 2. Update to ordered
{
  "tool": "update_vehicle_part",
  "arguments": {
    "vehicle_id": "uuid",
    "part_id": "part-uuid",
    "payload": {
      "status": "ordered",
      "ordered_at": "2025-01-21T10:00:00"
    }
  }
}

// 3. Update to installed
{
  "tool": "update_vehicle_part",
  "arguments": {
    "vehicle_id": "uuid",
    "part_id": "part-uuid",
    "payload": {
      "status": "installed",
      "installed_at": "2025-01-24T11:00:00"
    }
  }
}
```

## Error Handling

All tools return errors in this format:
```json
{
  "error": "Error description"
}
```

Common errors:
- `"Appointment not found"` - Invalid appointment ID
- `"Vehicle not found"` - Invalid vehicle ID
- `"Part not found"` - Invalid part ID
- `"Invalid status value"` - Status not in allowed enum
- `"API call failed: ..."` - Network or server error

---

**For complete API documentation, see:** [../API_DOCUMENTATION.md](../API_DOCUMENTATION.md)
