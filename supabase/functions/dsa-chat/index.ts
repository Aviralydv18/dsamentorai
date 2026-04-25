// DSA Mentor edge function — streams responses from Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a DSA (Data Structures and Algorithms) chatbot.

Rules:

1. You ONLY answer questions related to Data Structures and Algorithms.

2. If a question is not related to DSA, respond with:
   "I can only answer DSA-related queries."

3. Your answers must be:
   - Conceptually correct
   - Simple and structured
   - Include examples when necessary
   - Include time and space complexity if applicable

4. Supported topics:
   - Arrays, Strings
   - Linked Lists
   - Stacks, Queues
   - Trees, Graphs
   - Recursion, Backtracking
   - Dynamic Programming
   - Sorting and Searching Algorithms

5. If the question is ambiguous:
   Ask for clarification instead of guessing.

6. Do NOT answer:
   - Personal questions
   - General knowledge
   - Non-technical topics

7. Always maintain technical accuracy.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, code, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build messages with optional code context
    const finalMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

    if (code && code.trim().length > 0) {
      // Inject the latest editor code as additional context on the most recent user turn
      const lastIdx = finalMessages.length - 1;
      if (lastIdx >= 0 && finalMessages[lastIdx].role === "user") {
        finalMessages[lastIdx] = {
          ...finalMessages[lastIdx],
          content: `${finalMessages[lastIdx].content}\n\n---\nMy current code (${language || "code"}):\n\`\`\`${language || ""}\n${code}\n\`\`\``,
        };
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: finalMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("dsa-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
