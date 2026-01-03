import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY');
    if (!VAPI_API_KEY) {
      throw new Error('VAPI_API_KEY is not set');
    }

    const { phoneNumber, assistantId } = await req.json();

    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    console.log(`Initiating outbound call to: ${phoneNumber}`);

    // Vapi phone number ID provided by user
    const vapiPhoneNumberId = "29364790-2d8f-4d24-acc8-7ca735a4f123";

    const response = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumberId: vapiPhoneNumberId,
        customer: {
          number: phoneNumber,
        },
        assistantId: assistantId,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Vapi API error:", data);
      throw new Error(data.message || "Failed to initiate call");
    }

    console.log("Call initiated successfully:", data);

    return new Response(JSON.stringify({ success: true, call: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
