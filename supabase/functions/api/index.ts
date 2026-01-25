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
        const { data, error } = await supabase.rpc("rpc_get_appointments");
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
          p_contact: body.contact,
          p_date: body.date,
          p_status: body.status || "Scheduled",
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
        const { data, error } = await supabase.rpc("rpc_update_vehicle_in_shop", {
          p_id: segments[1],
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
