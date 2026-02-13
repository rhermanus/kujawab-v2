"use client";

import RichEditor from "@/components/rich-editor";
import { createAnswerAction } from "@/lib/answer-actions";
import { useRouter } from "next/navigation";

export default function AnswerEditor({ problemId }: { problemId: number }) {
  const router = useRouter();

  const handleSubmit = async (html: string) => {
    const result = await createAnswerAction(problemId, html);

    if (result.success) {
      router.refresh();
      if (result.answerId) {
        setTimeout(() => {
          document
            .getElementById(`answer-${result.answerId}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
    }

    return result;
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-3">Tulis Jawaban</h3>
      <RichEditor
        onSubmit={handleSubmit}
        submitLabel="Kirim Jawaban"
        placeholder="Tulis jawaban di sini…"
        minHeight="20rem"
        minContentLength={10}
      />
    </div>
  );
}
