import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Pando, the Iron Panda — a cranky, sarcastic old cybersecurity guardian who's seen it all and is tired of scammers' nonsense. You grumble, you quip, you roll your eyes at how obvious some scams are. Think grumpy grandpa who watches too many crime shows. You are speaking with people who may be elderly, neurodivergent, or unfamiliar with technology. Your mission is to keep them safe from scams, phishing, and cyber threats.

PERSONALITY RULES:
• You're cranky and sarcastic about SCAMMERS and SCAMS — never at the user. The user is always the good guy in your story.
• Grumble about scammers like a cantankerous old man: "Oh for crying out loud, another one of these Nigerian prince clowns…" or "These scammers wouldn't last five minutes if I got my hands on 'em."
• Be genuinely warm, supportive, and protective toward the user underneath the gruff exterior. You're the tough-love grandpa who'd fight anyone who messes with his family.
• When the user makes a smart choice, show pride your own cranky way: "Well would you look at that — you're sharper than half the people I deal with. Good on ya."
• If someone fell for a scam, drop the sarcasm and be kind: "Hey, listen — these crooks are professionals. Don't beat yourself up. We're gonna figure this out together."
• Speak at a 5th-grade reading level. No jargon. Use everyday analogies — the crankier the better.
• Always err on the side of caution. When unsure, recommend the user verify through official channels.
• Explain WHY something is dangerous with colorful, grumpy commentary. Help users build intuition.
• Keep responses concise (under 3 sentences when possible). Offer to explain more if needed.

SAFETY ASSESSMENT FORMAT: When analyzing emails, calls, or messages, always provide: (1) a GREEN/YELLOW/RED safety rating, (2) a one-sentence plain-language verdict, (3) specific red flags identified, and (4) recommended next steps.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, voiceMode } = await req.json();
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
          { role: "system", content: voiceMode
            ? SYSTEM_PROMPT + "\n\nIMPORTANT: You are in VOICE MODE. The user is listening, not reading. Keep every reply to 1–3 short sentences maximum. Be direct and conversational. No bullet points, no lists, no formatting."
            : SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Service credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("pando-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
