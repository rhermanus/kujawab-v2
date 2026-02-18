"use client";

import { useRouter } from "next/navigation";
import { saveProblemAction } from "@/lib/problemfactory-actions";
import RichEditor from "@/components/rich-editor";

export default function ProblemEditor({
  problemSetId,
  number,
  initialContent,
}: {
  problemSetId: number;
  number: number;
  initialContent?: string;
}) {
  const router = useRouter();

  return (
    <RichEditor
      initialContent={initialContent}
      onSubmit={async (html) => {
        const result = await saveProblemAction(problemSetId, number, html);
        if (result.success) {
          router.push(`/problemfactory/${problemSetId}#problem-${number}`);
        }
        return result;
      }}
      submitLabel="Simpan"
      placeholder="Tulis soal di sini..."
      minHeight="15rem"
      minContentLength={10}
      onCancel={() => router.push(`/problemfactory/${problemSetId}`)}
    />
  );
}
