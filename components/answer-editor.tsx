"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { MathInline } from "@/lib/tiptap-math";
import { createAnswerAction } from "@/lib/answer-actions";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

interface AnswerEditorProps {
  problemId: number;
}

export default function AnswerEditor({ problemId }: AnswerEditorProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [3, 4] },
      }),
      Underline,
      Superscript,
      Subscript,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      Link.configure({ openOnClick: false }),
      Image,
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

  const insertMath = () => {
    const latex = window.prompt("Masukkan LaTeX:");
    if (latex) {
      editor.chain().focus().insertContent({
        type: "mathInline",
        attrs: { latex },
      }).run();
    }
  };

  const insertLink = () => {
    const url = window.prompt("URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
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

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  type BtnProps = {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  };

  const Btn = ({ onClick, active, title, children }: BtnProps) => (
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

  const iconSize = 16;

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

          <div className="w-px bg-zinc-300 dark:bg-zinc-600 mx-1" />

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
          <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block">
            <CodeSquare size={iconSize} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
            <Minus size={iconSize} />
          </Btn>

          <div className="w-px bg-zinc-300 dark:bg-zinc-600 mx-1" />

          {/* Science */}
          <Btn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="Superscript">
            <SuperscriptIcon size={iconSize} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="Subscript">
            <SubscriptIcon size={iconSize} />
          </Btn>
          <Btn onClick={insertMath} title="Insert Math (LaTeX)">
            <Sigma size={iconSize} />
          </Btn>

          <div className="w-px bg-zinc-300 dark:bg-zinc-600 mx-1" />

          {/* Insert */}
          <Btn onClick={insertLink} active={editor.isActive("link")} title="Insert Link">
            <LinkIcon size={iconSize} />
          </Btn>
          <Btn onClick={() => fileInputRef.current?.click()} title="Upload Image">
            <ImageIcon size={iconSize} />
          </Btn>
          <Btn onClick={insertTable} title="Insert Table">
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
    </div>
  );
}
