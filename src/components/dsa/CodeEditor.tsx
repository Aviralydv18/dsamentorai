import { Code2, Eraser, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  code: string;
  setCode: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  onAsk: (prompt: string) => void;
  disabled?: boolean;
}

const LANGUAGES = [
  "java",
  "python",
  "cpp",
  "c",
  "javascript",
  "typescript",
  "go",
  "rust",
  "kotlin",
];

export const CodeEditor = ({
  code,
  setCode,
  language,
  setLanguage,
  onAsk,
  disabled,
}: Props) => {
  const lineCount = code.split("\n").length;

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <Code2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold">Scratchpad</h2>
            <p className="text-[11px] text-muted-foreground">
              Paste code · ask for review
            </p>
          </div>
        </div>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="h-8 w-[130px] font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l} value={l} className="font-mono text-xs">
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Editor body */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 flex">
          {/* Line numbers */}
          <div
            aria-hidden
            className="select-none border-r border-border bg-code/60 py-4 px-3 font-mono text-[12px] leading-[1.55] text-muted-foreground/60 text-right"
          >
            {Array.from({ length: Math.max(lineCount, 16) }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            placeholder={`// Paste or write your ${language} solution here\n// Then ask the mentor to review, dry-run, or find bugs.`}
            className="flex-1 resize-none bg-code/40 p-4 font-mono text-[12.5px] leading-[1.55] text-foreground/95 outline-none placeholder:text-muted-foreground/50 scrollbar-thin"
          />
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-background/50 px-3 py-2.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => setCode("")}
          disabled={!code}
        >
          <Eraser className="mr-1.5 h-3.5 w-3.5" />
          Clear
        </Button>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={disabled || !code.trim()}
            onClick={() => onAsk("Review my code: find bugs, edge cases, and complexity issues. Don't rewrite it — guide me.")}
          >
            Review code
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={disabled || !code.trim()}
            onClick={() => onAsk("Dry-run my code on a small input and show how variables change step by step.")}
          >
            Dry run
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-8 text-xs shadow-[0_0_20px_-4px_hsl(var(--primary)/0.5)]"
            disabled={disabled || !code.trim()}
            onClick={() => onAsk("What pattern does my code use, and how can I optimize its time/space complexity?")}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Analyze
          </Button>
        </div>
      </div>
    </div>
  );
};
