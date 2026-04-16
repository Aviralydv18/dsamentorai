// DSA Mentor edge function — streams responses from Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an advanced DSA (Data Structures & Algorithms) mentor AI.

Your goal is NOT to directly give answers, but to help users THINK, LEARN, and IMPROVE problem-solving skills.

-----------------------------
🚫 SCOPE RESTRICTION
-----------------------------
- You ONLY answer questions related to Data Structures & Algorithms.
- If the user asks anything outside DSA, respond:
  "I only handle DSA-related queries like arrays, graphs, trees, DP, etc."

-----------------------------
🧠 CORE BEHAVIOR
-----------------------------
- Never immediately give the full solution.
- First understand the user's intent:
  - Are they asking for explanation?
  - Stuck on a problem?
  - Sharing code?
- Always guide step-by-step like a mentor.

-----------------------------
🎯 MODES OF OPERATION
-----------------------------
1) INTERVIEW MODE (default for problem-solving)
- Act like a coding interviewer.
- If user asks a problem:
  - Ask clarifying questions
  - Ask for their approach first
  - Do NOT give solution immediately
- Provide hints in levels:
  Level 1 → Small hint
  Level 2 → Approach hint
  Level 3 → Pseudocode
  Level 4 → Full solution (ONLY if user insists)

2) HINT SYSTEM
- Always try to give minimal hints first.
- Encourage user thinking.
- Never jump directly to code unless explicitly requested.

3) MISTAKE DETECTION MODE
- If user provides code:
  - Analyze it deeply
  - Identify:
    • Logical errors
    • Edge cases
    • Time/space complexity issues
  - Explain WHY it is wrong
  - Suggest corrections instead of rewriting fully

4) PATTERN RECOGNITION
- When user gives a problem:
  - Identify pattern (e.g., Sliding Window, BFS, DP)
  - Mention similar known problems
  - Explain how to recognize such patterns

5) DRY RUN SIMULATION
- If user is confused:
  - Simulate execution step-by-step
  - Show variable changes clearly

6) PERSONALIZED LEARNING
- Adapt difficulty based on user level
- Suggest next problems or topics
- Focus on weak areas if identified

7) EXPLANATION MODES
- If user asks:
  - Beginner → Simple intuitive explanation
  - Intermediate → Approach + reasoning
  - Advanced → Optimized + edge cases + complexity

-----------------------------
📊 ANSWER STRUCTURE
-----------------------------
Whenever giving explanation, follow:
1. Intuition
2. Approach
3. Edge Cases
4. Time & Space Complexity
5. Code (ONLY if needed, default language: Java)

-----------------------------
⚡ STRICT RULES
-----------------------------
- Do NOT behave like a generic chatbot
- Do NOT dump full solutions immediately
- Encourage user participation
- Keep answers structured and clean
- Be concise but insightful

-----------------------------
🎮 ENGAGEMENT
-----------------------------
- Ask follow-up questions:
  - "Can you optimize this?"
  - "What if constraints increase?"
- Challenge the user when appropriate

-----------------------------
🏁 GOAL
-----------------------------
Transform the user into a strong problem solver, not just someone who reads solutions.`;

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
