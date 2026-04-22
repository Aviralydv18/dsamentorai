import { useCallback, useRef, useState } from "react";
import { Brain, Github } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ChatPanel } from "@/components/dsa/ChatPanel";
import { CodeEditor } from "@/components/dsa/CodeEditor";
import { streamChat, type ChatMsg } from "@/lib/streamChat";
import { toast } from "sonner";

const STARTERS = [
  {
    label: "Sliding window",
    prompt:
      "I want to learn the sliding window pattern. Can you walk me through it with the 'longest substring without repeating characters' problem?",
  },
  {
    label: "Graph traversal",
    prompt:
      "Help me understand when to use BFS vs DFS, and quiz me with a problem.",
  },
  {
    label: "DP intuition",
    prompt:
      "I struggle to recognize DP problems. Teach me how to spot them and start with an easy one.",
  },
  {
    label: "Code review",
    prompt:
      "I'll paste my solution in the editor — review it for bugs, edge cases, and complexity.",
  },
];

const Index = () => {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("java");
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      if (isStreaming) return;
      const userMsg: ChatMsg = { role: "user", content: text };
      const next = [...messages, userMsg];
      setMessages(next);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let acc = "";
      const upsert = (chunk: string) => {
        acc += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: acc } : m
            );
          }
          return [...prev, { role: "assistant", content: acc }];
        });
      };

      await streamChat({
        messages: next,
        code: code.trim() ? code : undefined,
        language,
        signal: controller.signal,
        onDelta: upsert,
        onDone: () => {
          setIsStreaming(false);
          abortRef.current = null;
        },
        onError: (err) => {
          setIsStreaming(false);
          abortRef.current = null;
          if (err.status === 429) {
            toast.error("Rate limited", { description: err.message });
          } else if (err.status === 402) {
            toast.error("AI credits exhausted", { description: err.message });
          } else {
            toast.error("Something went wrong", { description: err.message });
          }
          // Roll back the empty assistant placeholder if any
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && !last.content) {
              return prev.slice(0, -1);
            }
            return prev;
          });
        },
      });
    },
    [messages, isStreaming, code, language]
  );

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-[0_0_24px_-4px_hsl(var(--primary)/0.6)]">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold leading-tight">
              DSA Mentor
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Think · Solve · Master
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://docs.lovable.dev/features/cloud"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            aria-label="Docs"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </header>

      {/* Split view */}
      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={58} minSize={35}>
            <ChatPanel
              messages={messages}
              isStreaming={isStreaming}
              onSend={send}
              onStop={stop}
              starters={STARTERS}
            />
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-border" />
          <ResizablePanel defaultSize={42} minSize={25}>
            <CodeEditor
              code={code}
              setCode={setCode}
              language={language}
              setLanguage={setLanguage}
              onAsk={send}
              disabled={isStreaming}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
};

export default Index;
