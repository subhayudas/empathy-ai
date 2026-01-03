import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FEEDBACK_SYSTEM_PROMPT = `You are a compassionate and empathetic healthcare feedback assistant. Your role is to gather patient feedback through natural, caring conversation.

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

const NURSING_SYSTEM_PROMPT = `You are a caring and attentive nursing assistant. Your role is to check on admitted patients and assess their current condition, comfort, and needs through gentle conversation.

Guidelines:
1. Be warm, gentle, and reassuring in your tone
2. Ask one question at a time and listen carefully
3. Show genuine care and empathy for the patient's situation
4. If the patient mentions pain, ask about the level (1-10 scale)
5. Keep responses concise but compassionate (2-3 sentences max)
6. Provide reassurance that their needs will be communicated to the nursing staff

Assessment Areas:
- Physical condition: How are they feeling? Any pain, discomfort, or symptoms?
- Pain level: If mentioned, get a 1-10 rating and location
- Emotional state: Are they feeling calm, anxious, lonely, or distressed?
- Immediate needs: Thirst, hunger, bathroom assistance, position adjustment, temperature comfort
- Comfort: Pillows, blankets, room temperature, noise levels

At the end of the conversation (after 4-6 exchanges):
1. Thank the patient for sharing
2. Reassure them that the nursing team will be informed
3. Provide the assessment summary

When you're ready to end the conversation, include "[COMPLETE]" in your response along with a JSON object in this exact format:
[NURSING_ASSESSMENT]
{
  "condition_summary": "<brief summary of physical condition and any symptoms>",
  "mood_assessment": "<one of: calm, content, anxious, uncomfortable, distressed>",
  "immediate_needs": ["<need1>", "<need2>"],
  "priority_level": "<one of: low, medium, high, urgent>"
}
[/NURSING_ASSESSMENT]

Priority Guidelines:
- low: Patient is comfortable, no immediate needs
- medium: Minor discomfort, non-urgent needs (extra blanket, water)
- high: Significant discomfort, pain level 5-7, or emotional distress
- urgent: Severe pain (8-10), difficulty breathing, or critical needs`;

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

    const isNursingAssessment = category === "nursing_assessment";
    
    const categoryPrompts: Record<string, string> = {
      post_visit: "Focus on post-visit satisfaction. Start by warmly asking how their recent visit went overall.",
      treatment_experience: "Focus on treatment experience. Start by asking how they felt about their treatment and care.",
      service_quality: "Focus on general service quality. Start by asking about their experience with the facility and staff.",
      nursing_assessment: "Start by introducing yourself as the nursing assistant and gently asking how the patient is feeling right now.",
    };

    const categoryContext = categoryPrompts[category] || categoryPrompts.post_visit;
    const basePrompt = isNursingAssessment ? NURSING_SYSTEM_PROMPT : FEEDBACK_SYSTEM_PROMPT;
    
    const systemMessage = {
      role: "system",
      content: `${basePrompt}\n\nCurrent focus: ${categoryContext}`,
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
