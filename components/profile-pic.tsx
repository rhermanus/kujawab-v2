import { CircleUser } from "lucide-react";
import { profilePicUrl } from "@/lib/format";

export default function ProfilePic({
  path,
  alt = "",
  className = "w-10 h-10",
}: {
  path: string | null;
  alt?: string;
  className?: string;
}) {
  const isPlaceholder = !path || path === "/profpic_placeholder.jpg";

  if (isPlaceholder) {
    return (
      <CircleUser className={`${className} text-zinc-400 shrink-0`} strokeWidth={1.5} />
    );
  }

  return (
    <img
      src={profilePicUrl(path)}
      alt={alt}
      className={`${className} rounded-full object-cover shrink-0`}
    />
  );
}
