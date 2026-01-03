import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a compassionate and empathetic healthcare feedback assistant. Your role is to gather patient feedback through natural, caring conversation.

Guidelines:
1. Be warm, understanding, and professional in your tone
2. Ask one question at a time and wait for responses
3. Show empathy when patients express concerns or negative experiences
4. Acknowledge positive feedback with genuine appreciation
5. Keep responses concise but caring (2-3 sentences max)
6. Guide the conversation naturally without being robotic

Feedback Categories:
- Post-visit satisfaction: Ask about their overall visit experience, wait times, communication with staff
- Treatment experience: Ask about their treatment, how well procedures were explained, pain management
- Service quality: Ask about facility cleanliness, staff professionalism, appointment scheduling

At the end of the conversation:
1. Thank the patient sincerely for their feedback
2. Summarize the key points they shared
3. Generate a satisfaction score from 1-5 based on their responses

When you're ready to end the conversation, include "[COMPLETE]" in your response along with a JSON object in this exact format:
[FEEDBACK_SUMMARY]
{
  "score": <1-5>,
  "summary": "<brief summary of main feedback points>"
}
[/FEEDBACK_SUMMARY]`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, category, sessionId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const categoryPrompts: Record<string, string> = {
      post_visit: "Focus on post-visit satisfaction. Start by warmly asking how their recent visit went overall.",
      treatment_experience: "Focus on treatment experience. Start by asking how they felt about their treatment and care.",
      service_quality: "Focus on general service quality. Start by asking about their experience with the facility and staff.",
    };

    const categoryContext = categoryPrompts[category] || categoryPrompts.post_visit;
    
    const systemMessage = {
      role: "system",
      content: `${SYSTEM_PROMPT}\n\nCurrent focus: ${categoryContext}`,
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [systemMessage, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Feedback chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
