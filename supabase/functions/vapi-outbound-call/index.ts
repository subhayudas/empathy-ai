import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPI_API_KEY = Deno.env.get("VAPI_API_KEY");
    if (!VAPI_API_KEY) {
      throw new Error("VAPI_API_KEY is not configured");
    }

    const { phoneNumber, patientName, roomNumber, assistantId } = await req.json();

    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    if (!assistantId) {
      throw new Error("Assistant ID is required");
    }

    // Vapi phone number ID provided by user
    const phoneNumberId = "29364790-2d8f-4d24-acc8-7ca735a4f123";

    console.log("Starting outbound call to:", phoneNumber);

    const response = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantId: assistantId,
        phoneNumberId: phoneNumberId,
        customer: {
          number: phoneNumber,
        },
        assistantOverrides: {
          variableValues: {
            patientName: patientName || "Patient",
            roomNumber: roomNumber || "Unknown",
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Vapi API error:", data);
      throw new Error(data.message || data.error || "Failed to initiate call");
    }

    console.log("Call initiated successfully:", data);

    return new Response(JSON.stringify({ success: true, callId: data.id, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error initiating outbound call:", error);
    const message = error instanceof Error ? error.message : "Failed to initiate call";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
