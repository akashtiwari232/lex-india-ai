import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function LegalMarkdown({ children }: { children: string }) {
  return (
    <div className="prose-legal">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
