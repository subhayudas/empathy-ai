import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      return new Response(
        JSON.stringify({ success: false, error: "VAPI_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const VAPI_PHONE_NUMBER_ID = Deno.env.get('VAPI_PHONE_NUMBER_ID');
    if (!VAPI_PHONE_NUMBER_ID) {
      console.error("VAPI_PHONE_NUMBER_ID is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "VAPI_PHONE_NUMBER_ID is not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { leadId, assistantId } = await req.json();

    if (!leadId) {
      return new Response(
        JSON.stringify({ success: false, error: "Lead ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch lead from database
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (fetchError || !lead) {
      console.error("Failed to fetch lead:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Found lead:", lead);

    // Validate opt-in
    if (!lead.opt_in_call) {
      console.log("Lead did not opt in for call");
      return new Response(
        JSON.stringify({ success: false, error: "Lead did not opt in for call" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already scheduled
    if (lead.call_scheduled) {
      console.log("Call already scheduled for this lead");
      return new Response(
        JSON.stringify({ success: false, error: "Call already scheduled for this lead" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use provided assistantId or fallback to env variable
    const vapiAssistantId = assistantId || Deno.env.get('VAPI_ASSISTANT_ID');
    if (!vapiAssistantId) {
      console.error("VAPI_ASSISTANT_ID is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "VAPI_ASSISTANT_ID is not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Initiating call to: ${lead.phone_number} with assistant: ${vapiAssistantId}`);

    // Call VAPI API
    const vapiResponse = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumberId: VAPI_PHONE_NUMBER_ID,
        customer: {
          number: lead.phone_number,
          name: lead.name,
        },
        assistantId: vapiAssistantId,
      }),
    });

    const responseText = await vapiResponse.text();
    console.log("Vapi API response status:", vapiResponse.status);
    console.log("Vapi API response:", responseText);

    if (!vapiResponse.ok) {
      let errorMessage: string;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || responseText;
      } catch {
        errorMessage = responseText || `HTTP ${vapiResponse.status}`;
      }

      return new Response(
        JSON.stringify({ success: false, status: vapiResponse.status, error: errorMessage }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let callData;
    try {
      callData = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid response from Vapi API" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Call initiated successfully:", callData);

    // Update lead with call info
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        call_scheduled: true,
        call_id: callData.id,
      })
      .eq('id', leadId);

    if (updateError) {
      console.error("Failed to update lead:", updateError);
      // Call was initiated but DB update failed - still return success
    }

    return new Response(
      JSON.stringify({ success: true, call: callData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
