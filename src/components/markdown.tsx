import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
export function RichText({ children }: { children: string }) {
  return (
    <div className="prose">
      <Markdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[
          [rehypeKatex, { strict: false, trust: false }],
          [rehypeHighlight, { detect: false }],
        ]}
      >
        {children}
      </Markdown>
    </div>
  );
}
export function MathFormula({ latex }: { latex: string }) {
  return (
    <div className="math-block">
      <RichText>{`$$\n${latex}\n$$`}</RichText>
    </div>
  );
}
