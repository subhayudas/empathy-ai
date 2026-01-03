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
      console.error("VAPI_API_KEY is not configured");
      throw new Error('VAPI_API_KEY is not configured in secrets');
    }

    console.log("VAPI_API_KEY exists:", !!VAPI_API_KEY, "Length:", VAPI_API_KEY.length);

    const { phoneNumber, assistantId } = await req.json();

    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    if (!assistantId) {
      throw new Error('Assistant ID is required');
    }

    console.log(`Initiating outbound call to: ${phoneNumber} with assistant: ${assistantId}`);

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

    // Get response as text first to handle non-JSON responses
    const responseText = await response.text();
    console.log("Vapi API response status:", response.status);
    console.log("Vapi API response:", responseText);


    if (!response.ok) {
      // Try to parse as JSON, otherwise use raw text
      let errorMessage: string;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || responseText;
      } catch {
        errorMessage = responseText || `HTTP ${response.status}`;
      }

      // Return 200 so the client can read the payload (avoid generic non-2xx invoke errors)
      return new Response(
        JSON.stringify({
          success: false,
          status: response.status,
          error: errorMessage,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse successful response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error("Invalid response from Vapi API");
    }

    console.log("Call initiated successfully:", data);

    return new Response(JSON.stringify({ success: true, call: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Return 200 so the client can render a friendly message instead of a generic invoke error
    return new Response(JSON.stringify({ success: false, status: 500, error: errorMessage }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
