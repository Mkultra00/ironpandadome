import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const today = new Date().toISOString().split("T")[0];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a cybersecurity researcher specializing in consumer scam alerts. Today's date is ${today}. Research and report on the latest active scams, fraud alerts, and cyber threats targeting consumers — especially seniors and vulnerable populations. Focus on scams that are currently active or trending RIGHT NOW.`,
          },
          {
            role: "user",
            content: `List the 6 most urgent and current scam threats as of ${today}. For each, provide the title, a one-sentence summary, the threat level (Critical, High, or Emerging), and a 2-3 sentence explanation of how the scam works and how to stay safe. Focus on scams that are actively being reported right now.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_scam_alerts",
              description: "Return a list of current scam alerts with threat levels.",
              parameters: {
                type: "object",
                properties: {
                  alerts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Short, clear scam title" },
                        summary: { type: "string", description: "One-sentence summary" },
                        threatLevel: { type: "string", enum: ["Critical", "High", "Emerging"] },
                        content: { type: "string", description: "2-3 sentence explanation of how it works and how to stay safe" },
                      },
                      required: ["title", "summary", "threatLevel", "content"],
                      additionalProperties: false,
                    },
                  },
                  lastUpdated: { type: "string", description: "ISO date string of when this was researched" },
                },
                required: ["alerts", "lastUpdated"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_scam_alerts" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Service credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("research-scams error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
