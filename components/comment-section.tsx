"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HtmlContent from "@/components/html-content";
import RichEditor from "@/components/rich-editor";
import { createCommentAction, deleteCommentAction } from "@/lib/comment-actions";
import { profilePicUrl, timeAgo } from "@/lib/format";
import { MessageSquare, Trash2, Loader2 } from "lucide-react";

interface Comment {
  id: number;
  content: string;
  createdAt: string | Date;
  author: {
    id: number;
    username: string;
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
    bio: string | null;
  };
}

interface CommentSectionProps {
  answerId: number;
  comments: Comment[];
  isLoggedIn: boolean;
  currentUserId: number | null;
}

export default function CommentSection({ answerId, comments, isLoggedIn, currentUserId }: CommentSectionProps) {
  const [showEditor, setShowEditor] = useState(false);
  const router = useRouter();

  const handleSubmit = async (html: string) => {
    const result = await createCommentAction(answerId, html);

    if (result.success) {
      setShowEditor(false);
      router.refresh();
      if (result.commentId) {
        setTimeout(() => {
          document
            .getElementById(`comment-${result.commentId}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
    }

    return result;
  };

  return (
    <div className="border-t bg-zinc-50 dark:bg-zinc-900/40 px-6 py-4">
      {/* Existing comments */}
      {comments.length > 0 && (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-700/50">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              canDelete={currentUserId === comment.author.id}
            />
          ))}
        </div>
      )}

      {/* Write comment */}
      {isLoggedIn && (
        <div className={comments.length > 0 ? "mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700/50" : ""}>
          {showEditor ? (
            <RichEditor
              onSubmit={handleSubmit}
              submitLabel="Kirim Komentar"
              placeholder="Tulis komentar di sini…"
              minHeight="8rem"
              minContentLength={5}
              onCancel={() => setShowEditor(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowEditor(true)}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              <MessageSquare size={14} />
              Tulis komentar...
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment, canDelete }: { comment: Comment; canDelete: boolean }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Hapus komentar ini?")) return;
    setDeleting(true);
    const result = await deleteCommentAction(comment.id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
      setDeleting(false);
    }
  };

  return (
    <div id={`comment-${comment.id}`} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <Link href={`/user/${comment.author.username}`} className="shrink-0">
        <img
          src={profilePicUrl(comment.author.profilePicture)}
          alt={`Foto profil ${comment.author.username}`}
          className="w-8 h-8 rounded-full object-cover border"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/user/${comment.author.username}`}
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {comment.author.firstName} {comment.author.lastName}
          </Link>
          <span className="text-xs text-zinc-500">{timeAgo(comment.createdAt)}</span>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-zinc-400 hover:text-red-600 disabled:opacity-50 ml-auto"
              title="Hapus komentar"
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            </button>
          )}
        </div>
        {comment.author.bio && (
          <p className="text-xs text-zinc-500">{comment.author.bio}</p>
        )}
        <HtmlContent html={comment.content} className="text-sm mt-1" />
      </div>
    </div>
  );
}
