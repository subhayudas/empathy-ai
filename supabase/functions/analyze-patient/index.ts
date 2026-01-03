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
    const { conversation, emotions, patientName, roomNumber } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build emotion summary
    const emotionSummary = emotions && emotions.length > 0
      ? emotions.map((e: any) => `${e.emotion} (${Math.round(e.confidence * 100)}%) at ${e.timestamp}`).join(", ")
      : "No emotion data captured";

    // Calculate dominant emotion
    let dominantEmotion = "neutral";
    if (emotions && emotions.length > 0) {
      const emotionCounts: Record<string, number> = {};
      emotions.forEach((e: any) => {
        emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
      });
      dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral";
    }

    const systemPrompt = `You are a medical analysis AI assistant. Analyze the following patient check-in call and provide a comprehensive assessment.

Patient Information:
- Name: ${patientName}
- Room: ${roomNumber}

Emotion Analysis During Call:
- Detected emotions: ${emotionSummary}
- Dominant emotion: ${dominantEmotion}

Based on the conversation transcript and emotion data, provide:
1. A condition summary (2-3 sentences about their overall state)
2. A mood assessment (their emotional and mental state)
3. Immediate needs (list any urgent needs mentioned or implied)
4. Priority level (low/medium/high based on urgency)
5. Recommendations for nursing staff

Respond in this exact JSON format:
{
  "condition_summary": "...",
  "mood_assessment": "...",
  "immediate_needs": ["need1", "need2"],
  "priority_level": "low|medium|high",
  "recommendations": "..."
}`;

    const conversationText = conversation && conversation.length > 0
      ? conversation.map((m: any) => `${m.role === "user" ? "Patient" : "Assistant"}: ${m.content}`).join("\n")
      : "No conversation recorded";

    console.log("Analyzing patient with conversation:", conversationText.substring(0, 200));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Conversation transcript:\n${conversationText}` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI analysis response:", content);

    // Parse JSON from response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      analysis = {
        condition_summary: "Unable to generate detailed analysis. Please review manually.",
        mood_assessment: dominantEmotion,
        immediate_needs: [],
        priority_level: "medium",
        recommendations: "Manual review recommended",
      };
    }

    return new Response(JSON.stringify({
      ...analysis,
      dominant_emotion: dominantEmotion,
      emotion_history: emotions || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error analyzing patient:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
