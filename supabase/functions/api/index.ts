import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname.replace("/api/", "");
    const segments = path.split("/").filter(Boolean);
    const method = req.method;

    if (segments[0] === "appointments") {
      if (method === "GET" && segments.length === 1) {
        const date = url.searchParams.get("date");
        const startDate = url.searchParams.get("start_date");
        const endDate = url.searchParams.get("end_date");
        const status = url.searchParams.get("status");

        let query = supabase.from("appointments").select("*");

        if (date) {
          query = query.gte("date", `${date}T00:00:00Z`).lt("date", `${date}T23:59:59Z`);
        } else if (startDate && endDate) {
          query = query.gte("date", `${startDate}T00:00:00Z`).lte("date", `${endDate}T23:59:59Z`);
        } else if (startDate) {
          query = query.gte("date", `${startDate}T00:00:00Z`);
        } else if (endDate) {
          query = query.lte("date", `${endDate}T23:59:59Z`);
        }

        if (status) {
          query = query.eq("status", status);
        }

        query = query.order("date", { ascending: true });

        const { data, error } = await query;
        if (error) throw error;

        return new Response(JSON.stringify(data || []), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "GET" && segments.length === 2) {
        const { data, error } = await supabase
          .from("appointments")
          .select("*")
          .eq("id", segments[1])
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          return new Response(JSON.stringify({ error: "Appointment not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "POST" && segments.length === 1) {
        const body = await req.json();
        const { data, error } = await supabase.rpc("rpc_create_appointment", {
          p_customer_name: body.customer_name,
          p_vehicle: body.vehicle,
          p_service: body.service,
          p_date: body.date,
          p_contact: body.contact,
          p_tags: body.tags || [],
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "PUT" && segments.length === 2) {
        const body = await req.json();
        const { data, error } = await supabase.rpc("rpc_update_appointment", {
          p_id: segments[1],
          p_customer_name: body.customer_name,
          p_vehicle: body.vehicle,
          p_service: body.service,
          p_contact: body.contact,
          p_date: body.date,
          p_status: body.status,
          p_tags: body.tags || [],
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "DELETE" && segments.length === 2) {
        const { error } = await supabase
          .from("appointments")
          .delete()
          .eq("id", segments[1]);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (segments[0] === "vehicles") {
      if (method === "GET" && segments.length === 1) {
        const delivered = url.searchParams.get("delivered") === "true";
        const rpcFunction = delivered ? "rpc_get_delivered_vehicles" : "rpc_get_vehicles_in_shop";

        const { data, error } = await supabase.rpc(rpcFunction);
        if (error) throw error;

        return new Response(JSON.stringify(data || []), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "GET" && segments.length === 2) {
        const { data, error } = await supabase
          .from("vehicles_in_shop")
          .select("*")
          .eq("id", segments[1])
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          return new Response(JSON.stringify({ error: "Vehicle not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "POST" && segments.length === 1) {
        const body = await req.json();
        const { data, error } = await supabase.rpc("rpc_create_vehicle_in_shop", {
          p_customer_name: body.customer_name,
          p_vehicle: body.vehicle,
          p_service: body.service,
          p_contact: body.contact,
          p_check_in_date: body.check_in_date,
          p_estimated_completion: body.estimated_completion || null,
          p_notes: body.notes || "",
          p_tags: body.tags || [],
          p_technician: body.technician || null,
          p_labor_hours: body.labor_hours || 0,
          p_folio: body.folio || null,
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "PUT" && segments.length === 2) {
        const body = await req.json();

        const { data: currentVehicle, error: fetchError } = await supabase
          .from("vehicles_in_shop")
          .select("*")
          .eq("id", segments[1])
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!currentVehicle) {
          return new Response(JSON.stringify({ error: "Vehicle not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabase.rpc("rpc_update_vehicle_in_shop", {
          p_id: segments[1],
          p_customer_name: body.customer_name ?? currentVehicle.customer_name,
          p_vehicle: body.vehicle ?? currentVehicle.vehicle,
          p_service: body.service ?? currentVehicle.service,
          p_contact: body.contact ?? currentVehicle.contact,
          p_check_in_date: body.check_in_date ?? currentVehicle.check_in_date,
          p_estimated_completion: body.estimated_completion !== undefined ? body.estimated_completion : currentVehicle.estimated_completion,
          p_notes: body.notes !== undefined ? body.notes : currentVehicle.notes,
          p_tags: body.tags ?? currentVehicle.tags,
          p_technician: body.technician !== undefined ? body.technician : currentVehicle.technician,
          p_labor_hours: body.labor_hours !== undefined ? body.labor_hours : currentVehicle.labor_hours,
          p_folio: body.folio !== undefined ? body.folio : currentVehicle.folio,
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "DELETE" && segments.length === 2) {
        const { error } = await supabase
          .from("vehicles_in_shop")
          .delete()
          .eq("id", segments[1]);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "GET" && segments.length === 3 && segments[2] === "comments") {
        const { data, error } = await supabase.rpc("rpc_get_vehicle_comments", {
          p_vehicle_id: segments[1],
        });

        if (error) throw error;

        return new Response(JSON.stringify(data || []), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "POST" && segments.length === 3 && segments[2] === "comments") {
        const body = await req.json();
        const { data, error } = await supabase.rpc("rpc_create_vehicle_comment", {
          p_vehicle_id: segments[1],
          p_comment_text: body.comment_text,
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "POST" && segments.length === 3 && segments[2] === "deliver") {
        const { error } = await supabase
          .from("vehicles_in_shop")
          .update({ delivered_at: new Date().toISOString() })
          .eq("id", segments[1]);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "POST" && segments.length === 3 && segments[2] === "convert-to-appointment") {
        const { data, error } = await supabase.rpc("convert_vehicle_to_appointment", {
          vehicle_id: segments[1],
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "GET" && segments.length === 3 && segments[2] === "parts") {
        const { data, error } = await supabase
          .from("parts")
          .select("*")
          .eq("vehicle_id", segments[1])
          .order("created_at", { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify(data || []), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "POST" && segments.length === 3 && segments[2] === "parts") {
        const body = await req.json();

        const vehicleExists = await supabase
          .from("vehicles_in_shop")
          .select("id")
          .eq("id", segments[1])
          .maybeSingle();

        if (vehicleExists.error) throw vehicleExists.error;
        if (!vehicleExists.data) {
          return new Response(JSON.stringify({ error: "Vehicle not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const validStatuses = ["quoted", "ordered", "in_transit", "received", "installed", "returned", "canceled"];
        if (body.status && !validStatuses.includes(body.status)) {
          return new Response(JSON.stringify({ error: "Invalid status value" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if ((body.purchase_price !== undefined && body.purchase_price < 0) ||
            (body.sell_price !== undefined && body.sell_price < 0) ||
            (body.supplier_quote !== undefined && body.supplier_quote < 0)) {
          return new Response(JSON.stringify({ error: "Prices must be non-negative" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabase
          .from("parts")
          .insert({
            vehicle_id: segments[1],
            description: body.description,
            oem_part_number: body.oem_part_number || null,
            alternative_part_numbers: body.alternative_part_numbers || null,
            supplier: body.supplier || null,
            supplier_quote: body.supplier_quote || null,
            purchase_price: body.purchase_price || null,
            sell_price: body.sell_price || null,
            status: body.status || "quoted",
            ordered_at: body.ordered_at || null,
            received_at: body.received_at || null,
            installed_at: body.installed_at || null,
            notes: body.notes || null,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "GET" && segments.length === 4 && segments[2] === "parts") {
        const { data, error } = await supabase
          .from("parts")
          .select("*")
          .eq("vehicle_id", segments[1])
          .eq("id", segments[3])
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          return new Response(JSON.stringify({ error: "Part not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "PUT" && segments.length === 4 && segments[2] === "parts") {
        const body = await req.json();

        const validStatuses = ["quoted", "ordered", "in_transit", "received", "installed", "returned", "canceled"];
        if (body.status && !validStatuses.includes(body.status)) {
          return new Response(JSON.stringify({ error: "Invalid status value" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if ((body.purchase_price !== undefined && body.purchase_price < 0) ||
            (body.sell_price !== undefined && body.sell_price < 0) ||
            (body.supplier_quote !== undefined && body.supplier_quote < 0)) {
          return new Response(JSON.stringify({ error: "Prices must be non-negative" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const updateData: any = {};
        if (body.description !== undefined) updateData.description = body.description;
        if (body.oem_part_number !== undefined) updateData.oem_part_number = body.oem_part_number;
        if (body.alternative_part_numbers !== undefined) updateData.alternative_part_numbers = body.alternative_part_numbers;
        if (body.supplier !== undefined) updateData.supplier = body.supplier;
        if (body.supplier_quote !== undefined) updateData.supplier_quote = body.supplier_quote;
        if (body.purchase_price !== undefined) updateData.purchase_price = body.purchase_price;
        if (body.sell_price !== undefined) updateData.sell_price = body.sell_price;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.ordered_at !== undefined) updateData.ordered_at = body.ordered_at;
        if (body.received_at !== undefined) updateData.received_at = body.received_at;
        if (body.installed_at !== undefined) updateData.installed_at = body.installed_at;
        if (body.notes !== undefined) updateData.notes = body.notes;

        const { data, error } = await supabase
          .from("parts")
          .update(updateData)
          .eq("vehicle_id", segments[1])
          .eq("id", segments[3])
          .select()
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          return new Response(JSON.stringify({ error: "Part not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "DELETE" && segments.length === 4 && segments[2] === "parts") {
        const { error } = await supabase
          .from("parts")
          .delete()
          .eq("vehicle_id", segments[1])
          .eq("id", segments[3]);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "GET" && segments.length === 2 && segments[1] === "workflow") {
        const { data: vehicles, error } = await supabase.rpc("rpc_get_vehicles_in_shop");

        if (error) throw error;

        const workflow = {
          en_diagnostico: vehicles?.filter((v: any) => v.tags?.includes("en diagnóstico")) || [],
          esperando_aprobacion: vehicles?.filter((v: any) => v.tags?.includes("esperando aprobación")) || [],
          esperando_refacciones: vehicles?.filter((v: any) => v.tags?.includes("esperando refacciones")) || [],
          refacciones_en_recepcion: vehicles?.filter((v: any) => v.tags?.includes("refacciones en recepción")) || [],
          esperando_tecnico: vehicles?.filter((v: any) => v.tags?.includes("esperando técnico")) || [],
          en_reparacion: vehicles?.filter((v: any) => v.tags?.includes("en reparación")) || [],
          listo_para_entrega: vehicles?.filter((v: any) => v.tags?.includes("listo para entrega")) || [],
          garantia: vehicles?.filter((v: any) => v.tags?.includes("garantía")) || [],
        };

        return new Response(JSON.stringify(workflow), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (segments[0] === "cotizaciones") {
      if (method === "GET" && segments.length === 1) {
        const status = url.searchParams.get("status");
        const search = url.searchParams.get("search");
        const fromDate = url.searchParams.get("from_date");
        const toDate = url.searchParams.get("to_date");

        const { data, error } = await supabase.rpc("rpc_get_cotizaciones", {
          p_status: status,
          p_search: search,
          p_from_date: fromDate,
          p_to_date: toDate,
        });

        if (error) throw error;

        return new Response(JSON.stringify(data || []), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "GET" && segments.length === 2 && segments[1] !== "trabajos" && segments[1] !== "partidas") {
        const { data, error } = await supabase.rpc("rpc_get_cotizacion_by_id", {
          p_id: segments[1],
        });

        if (error) throw error;
        if (!data) {
          return new Response(JSON.stringify({ error: "Cotización not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "POST" && segments.length === 1) {
        const body = await req.json();
        const { data, error } = await supabase.rpc("rpc_create_cotizacion", {
          p_customer_name: body.customer_name,
          p_vehicle: body.vehicle,
          p_customer_contact: body.customer_contact || null,
          p_vehicle_id: body.vehicle_id || null,
          p_placa: body.placa || null,
          p_vin: body.vin || null,
          p_quote_date: body.quote_date || null,
          p_valid_until: body.valid_until || null,
          p_default_parts_margin_percent: body.default_parts_margin_percent || null,
          p_default_labor_rate: body.default_labor_rate || null,
          p_notes: body.notes || null,
          p_terms_and_conditions: body.terms_and_conditions || null,
          p_created_by: body.created_by || null,
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "PUT" && segments.length === 2) {
        const body = await req.json();
        const { data, error } = await supabase.rpc("rpc_update_cotizacion", {
          p_id: segments[1],
          p_customer_name: body.customer_name || null,
          p_vehicle: body.vehicle || null,
          p_customer_contact: body.customer_contact || null,
          p_vehicle_id: body.vehicle_id || null,
          p_placa: body.placa || null,
          p_vin: body.vin || null,
          p_quote_date: body.quote_date || null,
          p_valid_until: body.valid_until || null,
          p_default_parts_margin_percent: body.default_parts_margin_percent || null,
          p_default_labor_rate: body.default_labor_rate || null,
          p_notes: body.notes || null,
          p_terms_and_conditions: body.terms_and_conditions || null,
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "DELETE" && segments.length === 2) {
        const { error } = await supabase.rpc("rpc_delete_cotizacion", {
          p_id: segments[1],
        });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "POST" && segments.length === 3 && segments[2] === "duplicate") {
        const body = await req.json();
        const { data, error } = await supabase.rpc("rpc_duplicate_cotizacion", {
          p_id: segments[1],
          p_created_by: body.created_by || null,
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "POST" && segments.length === 3 && segments[2] === "trabajos") {
        const body = await req.json();
        const { data, error } = await supabase.rpc("rpc_add_trabajo", {
          p_cotizacion_id: segments[1],
          p_name: body.name,
          p_description: body.description || null,
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "GET" && segments.length === 4 && segments[2] === "partidas" && segments[3] === "proveedores") {
        const { data, error } = await supabase.rpc("rpc_get_partida_proveedores", {
          p_partida_id: segments[1],
        });

        if (error) throw error;

        return new Response(JSON.stringify(data || []), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "POST" && segments[0] === "cotizaciones" && segments.length >= 4 && segments[2] === "partidas" && segments[3] === "proveedores") {
        const body = await req.json();
        const { data, error } = await supabase.rpc("rpc_add_partida_proveedor", {
          p_partida_id: segments[1],
          p_proveedor: body.proveedor,
          p_costo: body.costo,
          p_is_selected: body.is_selected || false,
          p_incluye_iva: body.incluye_iva !== undefined ? body.incluye_iva : true,
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (segments[0] === "trabajos") {
      if (method === "PUT" && segments.length === 2) {
        const body = await req.json();
        const { data, error } = await supabase.rpc("rpc_update_trabajo", {
          p_id: segments[1],
          p_name: body.name || null,
          p_description: body.description || null,
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "DELETE" && segments.length === 2) {
        const { error } = await supabase.rpc("rpc_delete_trabajo", {
          p_id: segments[1],
        });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "POST" && segments.length === 3 && segments[2] === "partidas") {
        const body = await req.json();

        if (body.tipo === "REFACCION") {
          const { data, error } = await supabase.rpc("rpc_add_partida_refaccion", {
            p_trabajo_id: segments[1],
            p_description: body.description,
            p_quantity: body.quantity,
            p_unit: body.unit || "PZA",
            p_cost: body.cost || 0,
            p_margin_percent: body.margin_percent || null,
            p_discount_type: body.discount_type || "NONE",
            p_discount_value: body.discount_value || 0,
            p_tax_percent: body.tax_percent || null,
          });

          if (error) throw error;

          return new Response(JSON.stringify(data), {
            status: 201,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else if (body.tipo === "MANO_DE_OBRA") {
          const { data, error } = await supabase.rpc("rpc_add_partida_mano_obra", {
            p_trabajo_id: segments[1],
            p_description: body.description,
            p_hours: body.hours || 1,
            p_labor_rate: body.labor_rate || null,
            p_discount_type: body.discount_type || "NONE",
            p_discount_value: body.discount_value || 0,
            p_tax_percent: body.tax_percent || null,
          });

          if (error) throw error;

          return new Response(JSON.stringify(data), {
            status: 201,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          throw new Error("tipo must be REFACCION or MANO_DE_OBRA");
        }
      }
    }

    if (segments[0] === "partidas") {
      if (method === "PUT" && segments.length === 2) {
        const body = await req.json();

        if (body.tipo === "REFACCION") {
          const { data, error } = await supabase.rpc("rpc_update_partida_refaccion", {
            p_id: segments[1],
            p_description: body.description || null,
            p_quantity: body.quantity || null,
            p_unit: body.unit || null,
            p_cost: body.cost || null,
            p_margin_percent: body.margin_percent || null,
            p_discount_type: body.discount_type || null,
            p_discount_value: body.discount_value || null,
            p_tax_percent: body.tax_percent || null,
          });

          if (error) throw error;

          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else if (body.tipo === "MANO_DE_OBRA") {
          const { data, error } = await supabase.rpc("rpc_update_partida_mano_obra", {
            p_id: segments[1],
            p_description: body.description || null,
            p_hours: body.hours || null,
            p_labor_rate: body.labor_rate || null,
            p_discount_type: body.discount_type || null,
            p_discount_value: body.discount_value || null,
            p_tax_percent: body.tax_percent || null,
          });

          if (error) throw error;

          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          throw new Error("tipo must be REFACCION or MANO_DE_OBRA");
        }
      }

      if (method === "DELETE" && segments.length === 2) {
        const { error } = await supabase.rpc("rpc_delete_partida", {
          p_id: segments[1],
        });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "GET" && segments.length === 3 && segments[2] === "proveedores") {
        const { data, error } = await supabase.rpc("rpc_get_partida_proveedores", {
          p_partida_id: segments[1],
        });

        if (error) throw error;

        return new Response(JSON.stringify(data || []), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "POST" && segments.length === 3 && segments[2] === "proveedores") {
        const body = await req.json();
        const { data, error } = await supabase.rpc("rpc_add_partida_proveedor", {
          p_partida_id: segments[1],
          p_proveedor: body.proveedor,
          p_costo: body.costo,
          p_is_selected: body.is_selected || false,
          p_incluye_iva: body.incluye_iva !== undefined ? body.incluye_iva : true,
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (segments[0] === "proveedores") {
      if (method === "PUT" && segments.length === 2) {
        const body = await req.json();
        const { data, error } = await supabase.rpc("rpc_update_partida_proveedor", {
          p_id: segments[1],
          p_proveedor: body.proveedor || null,
          p_costo: body.costo || null,
          p_is_selected: body.is_selected || null,
          p_incluye_iva: body.incluye_iva || null,
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (method === "DELETE" && segments.length === 2) {
        const { error } = await supabase.rpc("rpc_delete_partida_proveedor", {
          p_id: segments[1],
        });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (segments[0] === "stats") {
      if (method === "GET" && segments.length === 1) {
        const [appointmentsResult, vehiclesResult, deliveredResult] = await Promise.all([
          supabase.rpc("rpc_get_appointments"),
          supabase.rpc("rpc_get_vehicles_in_shop"),
          supabase.rpc("rpc_get_delivered_vehicles"),
        ]);

        const stats = {
          total_appointments: appointmentsResult.data?.length || 0,
          vehicles_in_shop: vehiclesResult.data?.length || 0,
          delivered_vehicles: deliveredResult.data?.length || 0,
          scheduled_appointments: appointmentsResult.data?.filter((a: any) => a.status === "Scheduled").length || 0,
          completed_appointments: appointmentsResult.data?.filter((a: any) => a.status === "Completed").length || 0,
        };

        return new Response(JSON.stringify(stats), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
