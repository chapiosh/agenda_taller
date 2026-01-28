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
