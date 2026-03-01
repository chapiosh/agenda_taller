# MCP Server Quick Start Guide

Get the Mechanic Shop MCP server running in 3 minutes.

## Step 1: Build the Server

```bash
cd mcp-server
npm install
npm run build
```

You should see output like:
```
added 94 packages
✓ built successfully
```

## Step 2: Test the Server

Run the server to verify it works:

```bash
npm start
```

You should see:
```
Mechanic Shop MCP Server running on stdio
Base API URL: https://fquuajdbnlipavxiaqah.supabase.co/functions/v1/api
```

Press `Ctrl+C` to stop.

## Step 3: Configure Your MCP Client

### For Claude Desktop

1. Find your config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add this configuration:

```json
{
  "mcpServers": {
    "mechanic-shop": {
      "command": "node",
      "args": ["/FULL/PATH/TO/mcp-server/dist/index.js"]
    }
  }
}
```

**Important:** Replace `/FULL/PATH/TO/` with the actual full path to your project.

3. Restart Claude Desktop

4. Look for the 🔌 icon - you should see "mechanic-shop" connected

### For Cline (VSCode)

1. Open VSCode settings
2. Search for "MCP"
3. Add the server configuration:

```json
{
  "mechanic-shop": {
    "command": "node",
    "args": ["/FULL/PATH/TO/mcp-server/dist/index.js"]
  }
}
```

## Step 4: Test with AI Assistant

Try these example queries in Claude:

### Example 1: List Today's Appointments
```
Can you list all appointments for today using the mechanic shop tools?
```

### Example 2: Check Workshop Status
```
Show me the current workshop workflow - which vehicles are in each stage?
```

### Example 3: Get Shop Statistics
```
What are the current shop statistics?
```

### Example 4: List Vehicles
```
Show me all vehicles currently in the shop
```

## Available Tools

The server provides 12 tools:

1. **list_appointments** - List appointments with filters
2. **create_appointment** - Create new appointment
3. **list_vehicles** - List vehicles in shop
4. **get_vehicle** - Get vehicle details
5. **update_vehicle** - Update vehicle info
6. **get_workflow** - Get Kanban workflow view
7. **list_vehicle_parts** - List parts for a vehicle
8. **add_vehicle_part** - Add new part to vehicle
9. **update_vehicle_part** - Update existing part
10. **get_stats** - Get shop statistics
11. **list_quotes** - List quotes/cotizaciones
12. **get_quote** - Get full quote details

## Troubleshooting

### "Cannot find module"
Make sure you ran `npm run build` before starting.

### "ENOENT: no such file"
Double-check the full path in your config file. Use absolute paths, not relative.

### "Server not connecting"
- Restart your MCP client (Claude Desktop, etc.)
- Check that the server builds without errors
- Verify the API is accessible:
  ```bash
  curl https://fquuajdbnlipavxiaqah.supabase.co/functions/v1/api/stats
  ```

### "Tool not found"
The AI assistant should automatically discover available tools. If not:
- Restart the MCP client
- Check the server logs for errors
- Verify the server is connected (look for 🔌 icon)

## Next Steps

- Read [README.md](./README.md) for complete documentation
- Check [../API_DOCUMENTATION.md](../API_DOCUMENTATION.md) for REST API details
- Explore tool schemas in `src/index.ts`

## Getting Help

If you encounter issues:
1. Check server logs (stderr output)
2. Verify the REST API is working
3. Review the tool schemas in the code
4. Test individual endpoints with curl

---

**Ready to go!** Your AI assistant can now manage the mechanic shop. 🚗🔧
