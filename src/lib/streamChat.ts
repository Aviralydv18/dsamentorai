// Streaming client for the dsa-chat edge function (SSE token-by-token).

export type ChatMsg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dsa-chat`;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function streamChat({
  messages,
  code,
  language,
  signal,
  onDelta,
  onDone,
  onError,
}: {
  messages: ChatMsg[];
  code?: string;
  language?: string;
  signal?: AbortSignal;
  onDelta: (chunk: string) => void;
  onDone: () => void;
  onError: (err: { status?: number; message: string }) => void;
}) {
  let resp: Response;
  try {
    resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, code, language }),
      signal,
    });
  } catch (e) {
    onError({ message: e instanceof Error ? e.message : "Network error" });
    return;
  }

  if (!resp.ok) {
    let message = "Request failed";
    try {
      const data = await resp.json();
      message = data.error || message;
    } catch {
      // ignore
    }
    onError({ status: resp.status, message });
    return;
  }
  if (!resp.body) {
    onError({ message: "Empty response body" });
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  try {
    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore partial */
        }
      }
    }

    onDone();
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      onDone();
      return;
    }
    onError({ message: e instanceof Error ? e.message : "Stream error" });
  }
}
