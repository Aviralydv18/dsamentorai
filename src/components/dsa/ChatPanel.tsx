import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Sparkles, User2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownMessage } from "./MarkdownMessage";
import type { ChatMsg } from "@/lib/streamChat";

interface Props {
  messages: ChatMsg[];
  isStreaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  starters: { label: string; prompt: string }[];
}

export const ChatPanel = ({
  messages,
  isStreaming,
  onSend,
  onStop,
  starters,
}: Props) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isStreaming]);

  const submit = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setInput("");
  };

  const requestHint = (level: 1 | 2 | 3 | 4) => {
    if (isStreaming) return;
    const prompts: Record<number, string> = {
      1: "Give me a Level 1 hint — just a tiny nudge to point me in the right direction. Don't reveal the approach yet.",
      2: "Give me a Level 2 hint — describe the high-level approach or pattern to use, without pseudocode or code.",
      3: "Give me a Level 3 hint — walk me through the pseudocode / step-by-step logic, but no full code yet.",
      4: "Give me a Level 4 hint — the full solution with code, complexity analysis, and explanation.",
    };
    onSend(prompts[level]);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 sm:px-8"
      >
        {messages.length === 0 ? (
          <Welcome starters={starters} onPick={onSend} />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {messages.map((m, i) => (
              <MessageBubble
                key={i}
                role={m.role}
                content={m.content}
                streaming={
                  isStreaming && i === messages.length - 1 && m.role === "assistant"
                }
              />
            ))}
            {isStreaming && messages[messages.length - 1]?.role === "user" && (
              <MessageBubble role="assistant" content="" streaming />
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-background/80 px-4 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto max-w-3xl">
          {hasMessages && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Hint:
              </span>
              {([1, 2, 3, 4] as const).map((lvl) => {
                const labels = ["Tiny nudge", "Approach", "Pseudocode", "Solution"];
                return (
                  <button
                    key={lvl}
                    onClick={() => requestHint(lvl)}
                    disabled={isStreaming}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-[11px] font-medium transition-all hover:bg-card/70 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      borderColor: `hsl(var(--hint-${lvl}) / 0.4)`,
                      color: `hsl(var(--hint-${lvl}))`,
                    }}
                    aria-label={`Request level ${lvl} hint: ${labels[lvl - 1]}`}
                  >
                    <span className="font-mono font-bold">L{lvl}</span>
                    <span className="text-foreground/80">{labels[lvl - 1]}</span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="group relative rounded-xl border border-border bg-card focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] transition-all">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask a DSA question, share a problem, or paste code…  (Shift+Enter for newline)"
              className="min-h-[64px] resize-none border-0 bg-transparent px-4 py-3 pr-14 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="absolute bottom-2 right-2">
              {isStreaming ? (
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-9 w-9 rounded-lg"
                  onClick={onStop}
                  aria-label="Stop"
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.6)]"
                  onClick={submit}
                  disabled={!input.trim()}
                  aria-label="Send"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Mentor mode: hints first, full solutions only on request. DSA topics only.
          </p>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({
  role,
  content,
  streaming,
}: {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}) => {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
          isUser
            ? "border-border bg-secondary text-foreground"
            : "border-primary/30 bg-primary/10 text-primary"
        }`}
      >
        {isUser ? <User2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={`min-w-0 max-w-[88%] rounded-2xl border px-4 py-3 ${
          isUser
            ? "border-border bg-secondary"
            : "border-border bg-card"
        }`}
      >
        {!content && streaming ? (
          <ThinkingDots />
        ) : isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        ) : (
          <MarkdownMessage content={content} streaming={streaming} />
        )}
      </div>
    </div>
  );
};

const ThinkingDots = () => (
  <div className="flex items-center gap-1.5 py-1">
    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "0s" }} />
    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
  </div>
);

const Welcome = ({
  starters,
  onPick,
}: {
  starters: { label: string; prompt: string }[];
  onPick: (s: string) => void;
}) => (
  <div className="mx-auto flex max-w-2xl flex-col items-center text-center pt-8 sm:pt-16">
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary">
      <Sparkles className="h-3.5 w-3.5" />
      Mentor mode · Hints first
    </div>
    <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
      Think. Solve.{" "}
      <span className="text-gradient-primary">Master Algorithms.</span>
    </h1>
    <p className="mt-3 max-w-md text-sm text-muted-foreground">
      An AI mentor that won't hand you the answer. Get progressive hints, dry
      runs, pattern recognition, and code reviews — built for serious DSA prep.
    </p>

    <div className="mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
      {starters.map((s) => (
        <button
          key={s.label}
          onClick={() => onPick(s.prompt)}
          className="group rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-card/80"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            {s.label}
          </div>
          <div className="mt-1 text-sm text-foreground/90 line-clamp-2">
            {s.prompt}
          </div>
        </button>
      ))}
    </div>

    <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full text-left">
      {[
        { l: "1", c: "Tiny nudge" },
        { l: "2", c: "Approach" },
        { l: "3", c: "Pseudocode" },
        { l: "4", c: "Solution" },
      ].map((h, i) => (
        <div
          key={h.l}
          className="rounded-lg border border-border bg-card/50 p-3"
        >
          <div
            className="text-xs font-mono font-semibold"
            style={{ color: `hsl(var(--hint-${i + 1}))` }}
          >
            HINT {h.l}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">{h.c}</div>
        </div>
      ))}
    </div>
  </div>
);
