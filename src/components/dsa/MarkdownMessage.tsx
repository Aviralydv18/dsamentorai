import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Props {
  content: string;
  streaming?: boolean;
}

export const MarkdownMessage = ({ content, streaming }: Props) => {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const text = String(children).replace(/\n$/, "");
            if (!inline && match) {
              return (
                <div className="my-3 rounded-lg overflow-hidden border border-code-border">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-code text-[11px] font-mono text-muted-foreground border-b border-code-border">
                    <span>{match[1]}</span>
                  </div>
                  <SyntaxHighlighter
                    language={match[1]}
                    style={vscDarkPlus}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      background: "hsl(var(--code-bg))",
                      fontSize: "0.78rem",
                      padding: "0.9rem 1rem",
                    }}
                    codeTagProps={{
                      style: { fontFamily: '"JetBrains Mono", monospace' },
                    }}
                  >
                    {text}
                  </SyntaxHighlighter>
                </div>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {streaming && <span className="caret" aria-hidden />}
    </div>
  );
};
