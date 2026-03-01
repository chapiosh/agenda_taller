#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

const API_BASE_URL = 'https://fquuajdbnlipavxiaqah.supabase.co/functions/v1/api';

interface ApiError {
  error: string;
}

async function callApi(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        (data as ApiError).error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`API call failed: ${error.message}`);
    }
    throw error;
  }
}

function buildQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  }
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

const tools: Tool[] = [
  {
    name: 'list_appointments',
    description: 'List appointments with optional filters (date, date range, status)',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Filter by specific date (YYYY-MM-DD)',
        },
        start_date: {
          type: 'string',
          description: 'Filter from this date (YYYY-MM-DD)',
        },
        end_date: {
          type: 'string',
          description: 'Filter until this date (YYYY-MM-DD)',
        },
        status: {
          type: 'string',
          enum: ['Scheduled', 'Completed', 'Canceled'],
          description: 'Filter by appointment status',
        },
      },
    },
  },
  {
    name: 'create_appointment',
    description: 'Create a new appointment',
    inputSchema: {
      type: 'object',
      properties: {
        customer_name: {
          type: 'string',
          description: 'Customer name',
        },
        vehicle: {
          type: 'string',
          description: 'Vehicle description (e.g., "Toyota Corolla 2020")',
        },
        service: {
          type: 'string',
          description: 'Service description',
        },
        contact: {
          type: 'string',
          description: 'Contact phone number',
        },
        date: {
          type: 'string',
          description: 'Appointment date and time (ISO 8601 format)',
        },
        status: {
          type: 'string',
          enum: ['Scheduled', 'Completed', 'Canceled'],
          description: 'Appointment status (default: Scheduled)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for the appointment',
        },
      },
      required: ['customer_name', 'vehicle', 'service', 'contact', 'date'],
    },
  },
  {
    name: 'list_vehicles',
    description: 'List vehicles in the shop, optionally filter for delivered vehicles',
    inputSchema: {
      type: 'object',
      properties: {
        delivered: {
          type: 'boolean',
          description: 'If true, return only delivered vehicles',
        },
      },
    },
  },
  {
    name: 'get_vehicle',
    description: 'Get detailed information for a specific vehicle',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Vehicle UUID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'update_vehicle',
    description: 'Update vehicle information (tags, notes, technician, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Vehicle UUID',
        },
        payload: {
          type: 'object',
          description: 'Fields to update',
          properties: {
            customer_name: { type: 'string' },
            vehicle: { type: 'string' },
            service: { type: 'string' },
            contact: { type: 'string' },
            check_in_date: { type: 'string' },
            estimated_completion: { type: 'string' },
            notes: { type: 'string' },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
            technician: { type: 'string' },
            labor_hours: { type: 'number' },
            folio: { type: 'string' },
          },
        },
      },
      required: ['id', 'payload'],
    },
  },
  {
    name: 'get_workflow',
    description: 'Get workshop workflow with vehicles grouped by stage (diagnóstico, reparación, etc.)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_vehicle_parts',
    description: 'List all parts (refacciones) for a specific vehicle',
    inputSchema: {
      type: 'object',
      properties: {
        vehicle_id: {
          type: 'string',
          description: 'Vehicle UUID',
        },
      },
      required: ['vehicle_id'],
    },
  },
  {
    name: 'add_vehicle_part',
    description: 'Add a new part (refacción) to a vehicle',
    inputSchema: {
      type: 'object',
      properties: {
        vehicle_id: {
          type: 'string',
          description: 'Vehicle UUID',
        },
        description: {
          type: 'string',
          description: 'Part description',
        },
        oem_part_number: {
          type: 'string',
          description: 'OEM part number',
        },
        alternative_part_numbers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Alternative part numbers',
        },
        supplier: {
          type: 'string',
          description: 'Supplier name',
        },
        supplier_quote: {
          type: 'number',
          description: 'Supplier quote price',
        },
        purchase_price: {
          type: 'number',
          description: 'Actual purchase price',
        },
        sell_price: {
          type: 'number',
          description: 'Selling price to customer',
        },
        status: {
          type: 'string',
          enum: ['quoted', 'ordered', 'in_transit', 'received', 'installed', 'returned', 'canceled'],
          description: 'Part status',
        },
        ordered_at: {
          type: 'string',
          description: 'Date when part was ordered (ISO 8601)',
        },
        received_at: {
          type: 'string',
          description: 'Date when part was received (ISO 8601)',
        },
        installed_at: {
          type: 'string',
          description: 'Date when part was installed (ISO 8601)',
        },
        notes: {
          type: 'string',
          description: 'Additional notes',
        },
      },
      required: ['vehicle_id', 'description'],
    },
  },
  {
    name: 'update_vehicle_part',
    description: 'Update an existing part for a vehicle',
    inputSchema: {
      type: 'object',
      properties: {
        vehicle_id: {
          type: 'string',
          description: 'Vehicle UUID',
        },
        part_id: {
          type: 'string',
          description: 'Part UUID',
        },
        payload: {
          type: 'object',
          description: 'Fields to update',
          properties: {
            description: { type: 'string' },
            oem_part_number: { type: 'string' },
            alternative_part_numbers: {
              type: 'array',
              items: { type: 'string' },
            },
            supplier: { type: 'string' },
            supplier_quote: { type: 'number' },
            purchase_price: { type: 'number' },
            sell_price: { type: 'number' },
            status: {
              type: 'string',
              enum: ['quoted', 'ordered', 'in_transit', 'received', 'installed', 'returned', 'canceled'],
            },
            ordered_at: { type: 'string' },
            received_at: { type: 'string' },
            installed_at: { type: 'string' },
            notes: { type: 'string' },
          },
        },
      },
      required: ['vehicle_id', 'part_id', 'payload'],
    },
  },
  {
    name: 'get_stats',
    description: 'Get global statistics (total appointments, vehicles in shop, etc.)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_quotes',
    description: 'List quotes (cotizaciones) with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'],
          description: 'Filter by quote status',
        },
        search: {
          type: 'string',
          description: 'Search by customer name, vehicle, folio, placa, or VIN',
        },
        from_date: {
          type: 'string',
          description: 'Filter from this date (YYYY-MM-DD)',
        },
        to_date: {
          type: 'string',
          description: 'Filter until this date (YYYY-MM-DD)',
        },
      },
    },
  },
  {
    name: 'get_quote',
    description: 'Get full details of a quote including trabajos, partidas, and proveedores',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Quote UUID',
        },
      },
      required: ['id'],
    },
  },
];

async function handleToolCall(name: string, args: any): Promise<any> {
  switch (name) {
    case 'list_appointments': {
      const queryString = buildQueryString({
        date: args.date,
        start_date: args.start_date,
        end_date: args.end_date,
        status: args.status,
      });
      return await callApi(`/appointments${queryString}`);
    }

    case 'create_appointment': {
      return await callApi('/appointments', 'POST', args);
    }

    case 'list_vehicles': {
      const queryString = args.delivered
        ? '?delivered=true'
        : '';
      return await callApi(`/vehicles${queryString}`);
    }

    case 'get_vehicle': {
      return await callApi(`/vehicles/${args.id}`);
    }

    case 'update_vehicle': {
      return await callApi(`/vehicles/${args.id}`, 'PUT', args.payload);
    }

    case 'get_workflow': {
      return await callApi('/vehicles/workflow');
    }

    case 'list_vehicle_parts': {
      return await callApi(`/vehicles/${args.vehicle_id}/parts`);
    }

    case 'add_vehicle_part': {
      const { vehicle_id, ...partData } = args;
      return await callApi(`/vehicles/${vehicle_id}/parts`, 'POST', partData);
    }

    case 'update_vehicle_part': {
      const { vehicle_id, part_id, payload } = args;
      return await callApi(
        `/vehicles/${vehicle_id}/parts/${part_id}`,
        'PUT',
        payload
      );
    }

    case 'get_stats': {
      return await callApi('/stats');
    }

    case 'list_quotes': {
      const queryString = buildQueryString({
        status: args.status,
        search: args.search,
        from_date: args.from_date,
        to_date: args.to_date,
      });
      return await callApi(`/cotizaciones${queryString}`);
    }

    case 'get_quote': {
      return await callApi(`/cotizaciones/${args.id}`);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const server = new Server(
  {
    name: 'mechanic-shop-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const result = await handleToolCall(request.params.name, request.params.arguments ?? {});

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Mechanic Shop MCP Server running on stdio');
  console.error(`Base API URL: ${API_BASE_URL}`);
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
