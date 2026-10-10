import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

/** Model/user text is untrusted: only server-owned source cards may navigate.
 * Rendering, rather than regex URL stripping, enforces this for reference-style
 * Markdown too. Images never reach React, so they cannot trigger preloads.
 */
export function TutorMessage({ children }: { children: string }) {
  return (
    <div className="prose">
      <Markdown
        skipHtml
        urlTransform={() => ""}
        components={{
          a: ({ children }) => <span>{children}</span>,
          img: ({ alt }) => <span>{alt}</span>,
        }}
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, trust: false }]]}
      >
        {children}
      </Markdown>
    </div>
  );
}
