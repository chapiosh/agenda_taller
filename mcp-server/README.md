# Mechanic Shop MCP Server

A Model Context Protocol (MCP) server that wraps the Mechanic Shop Management REST API, enabling AI assistants to interact with appointments, vehicles, parts, quotes, and workflow data.

## Overview

This MCP server provides a clean, type-safe interface to the mechanic shop REST API. It exposes 12 tools that allow AI assistants to:

- Manage appointments (list, create)
- Manage vehicles in the shop (list, get, update)
- Track parts/refacciones (list, add, update)
- View workshop workflow (Kanban-style stages)
- Access quotes/cotizaciones
- Get shop statistics

## Architecture

```
┌─────────────────┐
│  AI Assistant   │
│  (Claude, etc)  │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────┐
│   MCP Server    │
│  (This Server)  │
└────────┬────────┘
         │ HTTP/JSON
         ▼
┌─────────────────┐
│   REST API      │
│  (Supabase EF)  │
└─────────────────┘
```

## Installation

1. Install dependencies:
```bash
cd mcp-server
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

## Running the Server

The MCP server communicates over stdio (standard input/output):

```bash
npm start
```

For development with auto-rebuild:
```bash
npm run dev
```

## Available Tools

### 1. list_appointments
List appointments with optional filters.

**Parameters:**
- `date?: string` - Filter by specific date (YYYY-MM-DD)
- `start_date?: string` - Filter from this date (YYYY-MM-DD)
- `end_date?: string` - Filter until this date (YYYY-MM-DD)
- `status?: "Scheduled" | "Completed" | "Canceled"` - Filter by status

**Returns:** Array of appointment objects

**Example:**
```json
{
  "date": "2025-01-25",
  "status": "Scheduled"
}
```

### 2. create_appointment
Create a new appointment.

**Parameters:**
- `customer_name: string` - Customer name (required)
- `vehicle: string` - Vehicle description (required)
- `service: string` - Service description (required)
- `contact: string` - Contact phone (required)
- `date: string` - ISO 8601 datetime (required)
- `status?: string` - Appointment status
- `tags?: string[]` - Tags array

**Returns:** Created appointment object

**Example:**
```json
{
  "customer_name": "Juan Pérez",
  "vehicle": "Toyota Corolla 2020",
  "service": "Cambio de aceite",
  "contact": "5551234567",
  "date": "2025-01-25T10:00:00"
}
```

### 3. list_vehicles
List vehicles in the shop.

**Parameters:**
- `delivered?: boolean` - If true, return only delivered vehicles

**Returns:** Array of vehicle objects

**Example:**
```json
{
  "delivered": false
}
```

### 4. get_vehicle
Get detailed information for a specific vehicle.

**Parameters:**
- `id: string` - Vehicle UUID (required)

**Returns:** Vehicle object

**Example:**
```json
{
  "id": "uuid-here"
}
```

### 5. update_vehicle
Update vehicle information.

**Parameters:**
- `id: string` - Vehicle UUID (required)
- `payload: object` - Fields to update (required)
  - `customer_name?: string`
  - `vehicle?: string`
  - `service?: string`
  - `contact?: string`
  - `check_in_date?: string`
  - `estimated_completion?: string`
  - `notes?: string`
  - `tags?: string[]`
  - `technician?: string`
  - `labor_hours?: number`
  - `folio?: string`

**Returns:** Updated vehicle object

**Example:**
```json
{
  "id": "uuid-here",
  "payload": {
    "tags": ["en reparación"],
    "technician": "Carlos Méndez",
    "labor_hours": 8.5
  }
}
```

### 6. get_workflow
Get workshop workflow with vehicles grouped by stage.

**Parameters:** None

**Returns:** Object with vehicles grouped by workflow stage:
- `en_diagnostico`
- `esperando_aprobacion`
- `esperando_refacciones`
- `refacciones_en_recepcion`
- `esperando_tecnico`
- `en_reparacion`
- `listo_para_entrega`
- `garantia`

**Example:**
```json
{}
```

### 7. list_vehicle_parts
List all parts for a specific vehicle.

**Parameters:**
- `vehicle_id: string` - Vehicle UUID (required)

**Returns:** Array of part objects

**Example:**
```json
{
  "vehicle_id": "uuid-here"
}
```

### 8. add_vehicle_part
Add a new part to a vehicle.

**Parameters:**
- `vehicle_id: string` - Vehicle UUID (required)
- `description: string` - Part description (required)
- `oem_part_number?: string` - OEM part number
- `alternative_part_numbers?: string[]` - Alternative part numbers
- `supplier?: string` - Supplier name
- `supplier_quote?: number` - Supplier quote price
- `purchase_price?: number` - Purchase price
- `sell_price?: number` - Sell price to customer
- `status?: string` - Part status (quoted, ordered, in_transit, received, installed, returned, canceled)
- `ordered_at?: string` - ISO 8601 datetime
- `received_at?: string` - ISO 8601 datetime
- `installed_at?: string` - ISO 8601 datetime
- `notes?: string` - Additional notes

**Returns:** Created part object

**Example:**
```json
{
  "vehicle_id": "uuid-here",
  "description": "Bomba de agua",
  "oem_part_number": "19200-P2A-000",
  "supplier": "AutoZone",
  "purchase_price": 800.00,
  "sell_price": 1200.00,
  "status": "ordered"
}
```

### 9. update_vehicle_part
Update an existing part.

**Parameters:**
- `vehicle_id: string` - Vehicle UUID (required)
- `part_id: string` - Part UUID (required)
- `payload: object` - Fields to update (required)
  - `description?: string`
  - `oem_part_number?: string`
  - `alternative_part_numbers?: string[]`
  - `supplier?: string`
  - `supplier_quote?: number`
  - `purchase_price?: number`
  - `sell_price?: number`
  - `status?: string`
  - `ordered_at?: string`
  - `received_at?: string`
  - `installed_at?: string`
  - `notes?: string`

**Returns:** Updated part object

**Example:**
```json
{
  "vehicle_id": "uuid-here",
  "part_id": "part-uuid-here",
  "payload": {
    "status": "installed",
    "installed_at": "2025-01-24T11:00:00"
  }
}
```

### 10. get_stats
Get global shop statistics.

**Parameters:** None

**Returns:** Statistics object with:
- `total_appointments`
- `vehicles_in_shop`
- `delivered_vehicles`
- `scheduled_appointments`
- `completed_appointments`

**Example:**
```json
{}
```

### 11. list_quotes
List quotes (cotizaciones) with optional filters.

**Parameters:**
- `status?: string` - Filter by status (DRAFT, SENT, APPROVED, REJECTED, EXPIRED)
- `search?: string` - Search by customer, vehicle, folio, placa, or VIN
- `from_date?: string` - Filter from date (YYYY-MM-DD)
- `to_date?: string` - Filter to date (YYYY-MM-DD)

**Returns:** Array of quote objects

**Example:**
```json
{
  "status": "APPROVED",
  "search": "Toyota"
}
```

### 12. get_quote
Get full details of a quote including trabajos, partidas, and proveedores.

**Parameters:**
- `id: string` - Quote UUID (required)

**Returns:** Full quote object with nested trabajos, partidas, and proveedores

**Example:**
```json
{
  "id": "quote-uuid-here"
}
```

## Configuration for MCP Clients

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mechanic-shop": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"]
    }
  }
}
```

### Cline (VSCode Extension)

Add to MCP settings:

```json
{
  "mcpServers": {
    "mechanic-shop": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"]
    }
  }
}
```

## REST API Details

**Base URL:** `https://fquuajdbnlipavxiaqah.supabase.co/functions/v1/api`

The server wraps the following endpoints:
- `GET /appointments` - List appointments
- `POST /appointments` - Create appointment
- `GET /vehicles` - List vehicles
- `GET /vehicles/{id}` - Get vehicle
- `PUT /vehicles/{id}` - Update vehicle
- `GET /vehicles/workflow` - Get workflow
- `GET /vehicles/{id}/parts` - List parts
- `POST /vehicles/{id}/parts` - Add part
- `PUT /vehicles/{vehicle_id}/parts/{part_id}` - Update part
- `GET /stats` - Get statistics
- `GET /cotizaciones` - List quotes
- `GET /cotizaciones/{id}` - Get quote

## Development

### Project Structure

```
mcp-server/
├── src/
│   └── index.ts          # Main MCP server implementation
├── dist/                 # Compiled JavaScript (after build)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

### Build Process

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Testing Tools

You can test individual tools using the MCP Inspector or by connecting an MCP client.

Example tool call (conceptual):
```json
{
  "tool": "list_appointments",
  "arguments": {
    "date": "2025-01-25",
    "status": "Scheduled"
  }
}
```

## Error Handling

The server handles errors gracefully:

- API errors are caught and returned with the original error message
- HTTP errors include status codes and messages
- Network errors are wrapped with descriptive messages
- All errors are returned in JSON format: `{ "error": "message" }`

## Security

- The REST API is public (no authentication required)
- The server is stateless and doesn't store any data
- All data passes through to the existing REST API
- Suitable for internal/trusted network use

## Support

For issues or questions:
1. Check the REST API documentation: `/API_DOCUMENTATION.md`
2. Verify the API is accessible: `curl https://fquuajdbnlipavxiaqah.supabase.co/functions/v1/api/stats`
3. Check MCP server logs for error messages

## License

Private - Internal use only

---

**Built with the Model Context Protocol SDK**
