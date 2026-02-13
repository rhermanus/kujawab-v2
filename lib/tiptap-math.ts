import { Node, mergeAttributes } from "@tiptap/react";
import katex from "katex";

export const MathInline = Node.create({
  name: "mathInline",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-latex]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const latex = HTMLAttributes["data-latex"] || HTMLAttributes.latex || "";
    let rendered: string;
    try {
      rendered = katex.renderToString(latex, { throwOnError: false });
    } catch {
      rendered = latex;
    }
    return [
      "span",
      mergeAttributes(
        { class: "math-tex", "data-latex": latex },
        HTMLAttributes
      ),
      ["span", { innerHTML: rendered }],
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("span");
      dom.classList.add("math-tex");
      dom.setAttribute("data-latex", node.attrs.latex);
      dom.contentEditable = "false";

      try {
        katex.render(node.attrs.latex, dom, {
          throwOnError: false,
          displayMode: false,
        });
      } catch {
        dom.textContent = node.attrs.latex;
      }

      return { dom };
    };
  },
});
