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
    const { name, phoneNumber, optInCall } = await req.json();

    console.log("Received lead submission:", { name, phoneNumber, optInCall });

    if (!name || !phoneNumber) {
      return new Response(
        JSON.stringify({ success: false, error: "Name and phone number are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert lead into database
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert({
        name,
        phone_number: phoneNumber,
        opt_in_call: optInCall ?? true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert lead:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save lead" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Lead saved:", lead);

    // If opt-in for call, trigger the call
    if (optInCall !== false) {
      console.log("Triggering call for lead:", lead.id);
      
      const triggerResponse = await fetch(
        `${supabaseUrl}/functions/v1/trigger-call`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ leadId: lead.id }),
        }
      );

      const triggerResult = await triggerResponse.json();
      console.log("Trigger call result:", triggerResult);

      if (!triggerResult.success) {
        // Lead was saved but call failed - still return success with warning
        return new Response(
          JSON.stringify({ 
            success: true, 
            lead, 
            callInitiated: false,
            callError: triggerResult.error 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, lead, callInitiated: true, call: triggerResult.call }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, lead, callInitiated: false }),
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
