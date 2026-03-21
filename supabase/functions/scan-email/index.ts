import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Pando, the Iron Panda — a cybersecurity expert analyzing emails for scams and phishing.

Analyze the email provided and respond ONLY with valid JSON in this exact format:
{
  "level": "safe" | "caution" | "danger",
  "verdict": "A one-sentence plain-language verdict",
  "redFlags": ["array of specific red flags found"],
  "advice": "What the user should do next"
}

Analysis criteria:
- Check sender domain for misspellings or lookalike domains
- Look for urgency manipulation ("Act now!", "Account will be closed")
- Check for requests for personal info (SSN, passwords, bank details)
- Identify suspicious links or URL patterns
- Flag generic greetings vs personalized
- Note grammatical errors or unusual formatting

Be protective — when in doubt, mark as "caution" or "danger".
Use simple, warm language a non-technical person would understand.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { emailContent } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analyze this email:\n\n${emailContent}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "email_scan_result",
            description: "Return the email scan result",
            parameters: {
              type: "object",
              properties: {
                level: { type: "string", enum: ["safe", "caution", "danger"] },
                verdict: { type: "string" },
                redFlags: { type: "array", items: { type: "string" } },
                advice: { type: "string" },
              },
              required: ["level", "verdict", "redFlags", "advice"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "email_scan_result" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try parsing content as JSON
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return new Response(jsonMatch[0], {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Could not parse AI response");
  } catch (e) {
    console.error("scan-email error:", e);
    return new Response(JSON.stringify({
      level: "caution",
      verdict: "I had trouble analyzing this email. Please try again.",
      redFlags: [],
      advice: "If you're unsure, don't click any links or reply to it.",
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
