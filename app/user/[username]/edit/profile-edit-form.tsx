"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { profilePicUrl } from "@/lib/format";
import { updateProfileAction } from "@/lib/profile-actions";

interface User {
  username: string;
  firstName: string;
  lastName: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  profilePicture: string | null;
}

export default function ProfileEditForm({ user }: { user: User }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [location, setLocation] = useState(user.location ?? "");
  const [website, setWebsite] = useState(user.website ?? "");

  const [profilePicture, setProfilePicture] = useState(user.profilePicture);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload gagal");
      setProfilePicture(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await updateProfileAction({
      firstName,
      lastName,
      bio,
      location,
      website,
      profilePicture,
    });

    if (result.success) {
      router.push(`/user/${user.username}`);
    } else {
      setError(result.error ?? "Terjadi kesalahan.");
      setSubmitting(false);
    }
  }

  const displayPic = previewUrl ?? profilePicUrl(profilePicture);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile picture */}
      <div>
        <label className="block text-sm font-medium mb-2">Foto profil</label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative group cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayPic}
            alt="Foto profil"
            className={`w-20 h-20 rounded-full object-cover border${uploading ? " opacity-50" : ""}`}
          />
          {uploading ? (
            <span className="absolute inset-0 flex items-center justify-center rounded-full">
              <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </span>
          ) : (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              Ubah
            </span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Name fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium mb-1">
            Nama depan <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            maxLength={50}
            required
            className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium mb-1">
            Nama belakang
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            maxLength={50}
            className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-1">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          rows={3}
          className="w-full rounded-md border px-3 py-2 text-sm bg-transparent resize-none"
        />
        <p className="text-xs text-zinc-500 mt-1">{bio.length}/160</p>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium mb-1">
          Lokasi
        </label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={30}
          className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
        />
      </div>

      {/* Website */}
      <div>
        <label htmlFor="website" className="block text-sm font-medium mb-1">
          Website
        </label>
        <input
          id="website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          maxLength={100}
          placeholder="https://"
          className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Menyimpan..." : "Simpan"}
        </button>
        <Link
          href={`/user/${user.username}`}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
