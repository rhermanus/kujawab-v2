"use client";

import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import { MathInline } from "@/lib/tiptap-math";
import { createAnswerAction } from "@/lib/answer-actions";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading2,
  List,
  ListOrdered,
  Quote,
  CodeSquare,
  Minus,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  Sigma,
  Link as LinkIcon,
  ImageIcon,
  TableIcon,
  Loader2,
  X,
  Omega,
} from "lucide-react";

// ─── Special characters data ─────────────────────────────────────────

const SPECIAL_CHARS = [
  { label: "Greek", chars: "α β γ δ ε ζ η θ ι κ λ μ ν ξ π ρ σ τ υ φ χ ψ ω Γ Δ Θ Λ Ξ Π Σ Φ Ψ Ω".split(" ") },
  { label: "Math", chars: "± × ÷ √ ∞ ≈ ≠ ≡ ≤ ≥ ∑ ∏ ∫ ∂ ∇ ∈ ∉ ⊂ ⊃ ⊆ ⊇ ∪ ∩ ∅ ∀ ∃ ∧ ∨ ¬".split(" ") },
  { label: "Arrows", chars: "→ ← ↑ ↓ ↔ ⇒ ⇐ ⇔ ↦".split(" ") },
  { label: "Other", chars: "° ℃ µ ℏ ½ ⅓ ¼ ‰ † ‡ • … ∴ ∵".split(" ") },
];

// ─── Resizable Image extension ───────────────────────────────────────

function ImageNodeView({ node, updateAttributes, selected }: {
  node: { attrs: Record<string, string | null | undefined> };
  updateAttributes: (attrs: Record<string, unknown>) => void;
  selected: boolean;
}) {
  const [customWidth, setCustomWidth] = useState("");

  return (
    <NodeViewWrapper className="my-2">
      {selected && (
        <div className="flex gap-1 mb-1 items-center flex-wrap">
          {["25%", "50%", "75%", "100%"].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => updateAttributes({ width: w })}
              className={`px-2 py-0.5 text-xs rounded border ${
                node.attrs.width === w
                  ? "bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                  : "border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
            >
              {w}
            </button>
          ))}
          <input
            type="text"
            placeholder="e.g. 300px"
            value={customWidth}
            onChange={(e) => setCustomWidth(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customWidth) {
                updateAttributes({ width: customWidth });
                setCustomWidth("");
              }
            }}
            className="w-20 px-1.5 py-0.5 text-xs border rounded border-zinc-300 dark:border-zinc-600 bg-transparent"
          />
          {node.attrs.width && (
            <button
              type="button"
              onClick={() => updateAttributes({ width: null })}
              className="px-2 py-0.5 text-xs rounded border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500"
            >
              Reset
            </button>
          )}
        </div>
      )}
      <img
        src={node.attrs.src ?? ""}
        alt={node.attrs.alt ?? ""}
        title={node.attrs.title ?? undefined}
        style={{ width: node.attrs.width || undefined }}
        className={`max-w-full ${selected ? "ring-2 ring-blue-500 rounded" : ""}`}
      />
    </NodeViewWrapper>
  );
}

const ResizableImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.style.width || element.getAttribute("width") || null,
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.width) return {};
          return { style: `width: ${attributes.width}` };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

// ─── Modal shell ─────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-5 max-w-lg w-full mx-4 border dark:border-zinc-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-sm">{title}</h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Math modal with live preview ────────────────────────────────────

const LATEX_EXAMPLES = [
  { label: "Pecahan", code: "\\frac{a}{b}" },
  { label: "Pangkat", code: "x^{2}" },
  { label: "Indeks", code: "a_{n}" },
  { label: "Akar", code: "\\sqrt{x}" },
  { label: "Akar-n", code: "\\sqrt[n]{x}" },
  { label: "Sigma", code: "\\sum_{i=1}^{n} x_i" },
  { label: "Integral", code: "\\int_{a}^{b} f(x)\\,dx" },
  { label: "Limit", code: "\\lim_{x \\to \\infty} f(x)" },
  { label: "Matriks", code: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" },
  { label: "Sistem", code: "\\begin{cases} x + y = 1 \\\\ x - y = 0 \\end{cases}" },
  { label: "Vektor", code: "\\vec{v} = \\hat{i} + \\hat{j}" },
  { label: "Trigonometri", code: "\\sin^2\\theta + \\cos^2\\theta = 1" },
  { label: "Logaritma", code: "\\log_{a} b" },
  { label: "Tidak sama", code: "a \\neq b" },
  { label: "Kurang lebih", code: "a \\leq b \\leq c" },
];

function MathModal({
  open,
  onClose,
  onInsert,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (latex: string) => void;
}) {
  const [latex, setLatex] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!previewRef.current) return;
    if (latex.trim()) {
      try {
        katex.render(latex, previewRef.current, { throwOnError: false, displayMode: false });
      } catch {
        previewRef.current.textContent = latex;
      }
    } else {
      previewRef.current.textContent = "";
    }
  }, [latex]);

  const handleInsert = () => {
    if (latex.trim()) {
      onInsert(latex);
      setLatex("");
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Sisipkan Rumus (LaTeX)">
      <textarea
        value={latex}
        onChange={(e) => setLatex(e.target.value)}
        placeholder="e.g. \frac{a}{b}, x^2 + y^2 = r^2"
        className="w-full border rounded-md p-2 text-sm font-mono bg-transparent dark:border-zinc-700 min-h-[4rem] resize-y"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleInsert();
        }}
      />
      <div className="mt-3 border rounded-md p-3 min-h-[2.5rem] bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700">
        <p className="text-xs text-zinc-400 mb-1">Preview:</p>
        <div ref={previewRef} className="text-base" />
      </div>

      {/* Quick examples */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showHelp ? "Sembunyikan contoh" : "Tampilkan contoh LaTeX"}
        </button>
        {showHelp && (
          <div className="mt-2 grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
            {LATEX_EXAMPLES.map((ex) => (
              <button
                key={ex.code}
                type="button"
                onClick={() => setLatex((prev) => (prev ? prev + " " + ex.code : ex.code))}
                className="text-left border dark:border-zinc-700 rounded px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 group"
              >
                <span className="text-[10px] text-zinc-400 block">{ex.label}</span>
                <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{ex.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          Batal
        </button>
        <button type="button" onClick={handleInsert} disabled={!latex.trim()} className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
          Sisipkan
        </button>
      </div>
    </Modal>
  );
}

// ─── Code block modal ────────────────────────────────────────────────

function CodeBlockModal({
  open,
  onClose,
  onInsert,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
}) {
  const [code, setCode] = useState("");

  const handleInsert = () => {
    if (code.trim()) {
      onInsert(code);
      setCode("");
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Sisipkan Kode">
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste atau tulis kode di sini..."
        className="w-full border rounded-md p-3 text-sm font-mono bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 min-h-[12rem] resize-y"
        autoFocus
        onKeyDown={(e) => {
          // Allow Tab for indentation
          if (e.key === "Tab") {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;
            setCode(code.substring(0, start) + "  " + code.substring(end));
            setTimeout(() => {
              e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
            }, 0);
          }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleInsert();
        }}
      />
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          Batal
        </button>
        <button type="button" onClick={handleInsert} disabled={!code.trim()} className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
          Sisipkan
        </button>
      </div>
    </Modal>
  );
}

// ─── Special character picker ────────────────────────────────────────

function CharPicker({
  open,
  onClose,
  onInsert,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (char: string) => void;
}) {
  const [tab, setTab] = useState(0);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-lg shadow-lg p-3 w-72">
        {/* Tabs */}
        <div className="flex gap-1 mb-2 border-b dark:border-zinc-700 pb-2">
          {SPECIAL_CHARS.map((group, i) => (
            <button
              key={group.label}
              type="button"
              onClick={() => setTab(i)}
              className={`px-2 py-0.5 text-xs rounded ${
                tab === i
                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>
        {/* Chars grid */}
        <div className="grid grid-cols-10 gap-0.5">
          {SPECIAL_CHARS[tab].chars.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => { onInsert(ch); onClose(); }}
              className="w-6 h-6 flex items-center justify-center text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title={ch}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Toolbar button ──────────────────────────────────────────────────

function Btn({ onClick, active, title, children }: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 ${
        active ? "bg-zinc-200 dark:bg-zinc-700 text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Main editor ─────────────────────────────────────────────────────

export default function AnswerEditor({ problemId }: { problemId: number }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mathModalOpen, setMathModalOpen] = useState(false);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [charPickerOpen, setCharPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [3, 4] },
        codeBlock: { HTMLAttributes: { class: "editor-code-block" } },
      }),
      Underline,
      Superscript,
      Subscript,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      TiptapLink.configure({ openOnClick: false }),
      ResizableImage,
      MathInline,
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "html-content tiptap",
      },
    },
  });

  if (!editor) return null;

  const handleSubmit = async () => {
    const html = editor.getHTML();
    if (html === "<p></p>" || html.trim().length < 10) {
      setError("Jawaban terlalu pendek.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await createAnswerAction(problemId, html);

    if (result.success) {
      editor.commands.clearContent();
      router.refresh();
    } else {
      setError(result.error ?? "Gagal mengirim jawaban.");
    }
    setSubmitting(false);
  };

  const insertLink = () => {
    const url = window.prompt("URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
      } else {
        setError(data.error ?? "Gagal mengunggah gambar.");
      }
    } catch {
      setError("Gagal mengunggah gambar.");
    }
    e.target.value = "";
  };

  const iconSize = 16;
  const Sep = () => <div className="w-px bg-zinc-300 dark:bg-zinc-600 mx-1" />;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-3">Tulis Jawaban</h3>
      <div className="border rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-0.5 p-2 border-b bg-zinc-50 dark:bg-zinc-900/40">
          {/* Format */}
          <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
            <Bold size={iconSize} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
            <Italic size={iconSize} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
            <UnderlineIcon size={iconSize} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
            <Strikethrough size={iconSize} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline Code">
            <Code size={iconSize} />
          </Btn>

          <Sep />

          {/* Block */}
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading">
            <Heading2 size={iconSize} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
            <List size={iconSize} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
            <ListOrdered size={iconSize} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
            <Quote size={iconSize} />
          </Btn>
          <Btn onClick={() => setCodeModalOpen(true)} active={editor.isActive("codeBlock")} title="Code Block">
            <CodeSquare size={iconSize} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
            <Minus size={iconSize} />
          </Btn>

          <Sep />

          {/* Science */}
          <Btn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="Superscript">
            <SuperscriptIcon size={iconSize} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="Subscript">
            <SubscriptIcon size={iconSize} />
          </Btn>
          <Btn onClick={() => setMathModalOpen(true)} title="Insert Math (LaTeX)">
            <Sigma size={iconSize} />
          </Btn>
          <div className="relative">
            <Btn onClick={() => setCharPickerOpen(!charPickerOpen)} title="Special Characters">
              <Omega size={iconSize} />
            </Btn>
            <CharPicker
              open={charPickerOpen}
              onClose={() => setCharPickerOpen(false)}
              onInsert={(ch) => editor.chain().focus().insertContent(ch).run()}
            />
          </div>

          <Sep />

          {/* Insert */}
          <Btn onClick={insertLink} active={editor.isActive("link")} title="Insert Link">
            <LinkIcon size={iconSize} />
          </Btn>
          <Btn onClick={() => fileInputRef.current?.click()} title="Upload Image">
            <ImageIcon size={iconSize} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table">
            <TableIcon size={iconSize} />
          </Btn>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
      >
        {submitting && <Loader2 size={16} className="animate-spin" />}
        Kirim Jawaban
      </button>

      {/* Modals */}
      <MathModal
        open={mathModalOpen}
        onClose={() => setMathModalOpen(false)}
        onInsert={(latex) => {
          editor.chain().focus().insertContent({
            type: "mathInline",
            attrs: { latex },
          }).run();
        }}
      />
      <CodeBlockModal
        open={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        onInsert={(code) => {
          editor.chain().focus().insertContent({
            type: "codeBlock",
            content: [{ type: "text", text: code }],
          }).run();
        }}
      />
    </div>
  );
}
