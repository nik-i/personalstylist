"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type UploadStatus = "idle" | "uploading" | "done" | "error";

type FileEntry = {
  id: string;
  file: File;
  preview: string;
  status: UploadStatus;
  garmentId?: string;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_MB = 10;

function StatusBadge({ status }: { status: UploadStatus }) {
  const map: Record<UploadStatus, { label: string; bg: string; color: string }> = {
    idle: { label: "Queued", bg: "#F0E8DB", color: "#554C41" },
    uploading: { label: "Uploading…", bg: "#F5DCD3", color: "#D6402B" },
    done: { label: "Saved", bg: "#E3EDE4", color: "#4F7B58" },
    error: { label: "Failed", bg: "#FFF0F0", color: "#C0392B" },
  };
  const s = map[status];
  return (
    <span
      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function FileRow({ entry, onRetry }: { entry: FileEntry; onRetry: () => void }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl p-2"
      style={{ background: "#FAF6F1" }}
    >
      {/* Thumbnail */}
      <div
        className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-frock-cream-2"
        style={{ border: "1px solid rgba(32,27,21,0.08)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={entry.preview} alt="" className="w-full h-full object-cover" />
      </div>

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-frock-ink truncate">{entry.file.name}</p>
        <p className="text-xs text-frock-muted mt-0.5">
          {(entry.file.size / 1024 / 1024).toFixed(1)} MB
        </p>
      </div>

      <div className="flex flex-col items-end gap-1">
        <StatusBadge status={entry.status} />
        {entry.status === "error" && (
          <button
            onClick={onRetry}
            className="text-[10px] underline text-frock-muted hover:text-frock-ink"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export default function UploadPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function addFiles(files: File[]) {
    const valid = files.filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast.error(`${f.name}: unsupported type`);
        return false;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        toast.error(`${f.name}: exceeds ${MAX_MB} MB`);
        return false;
      }
      return true;
    });
    const newEntries: FileEntry[] = valid.map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      preview: URL.createObjectURL(f),
      status: "idle",
    }));
    setEntries((prev) => [...prev, ...newEntries]);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadEntry(id: string, file: File) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "uploading" } : e))
    );
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/garments", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json() as { id: string };
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "done", garmentId: data.id } : e))
      );
    } catch {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "error" } : e))
      );
    }
  }

  async function uploadAll() {
    const queue = entries.filter((e) => e.status === "idle" || e.status === "error");
    if (!queue.length) return;
    setUploading(true);
    await Promise.all(queue.map((e) => uploadEntry(e.id, e.file)));
    setUploading(false);
  }

  const doneCount = entries.filter((e) => e.status === "done").length;
  const hasQueued = entries.some((e) => e.status === "idle" || e.status === "error");

  return (
    <div className="flex flex-col gap-5 py-2 animate-[frkFade_0.35s_ease]">
      <div>
        <p className="text-xs tracking-widest uppercase text-frock-muted" style={{ letterSpacing: "0.14em" }}>
          Wardrobe
        </p>
        <h1
          className="text-3xl text-frock-ink leading-tight mt-0.5"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Add clothes
        </h1>
        <p className="text-sm text-frock-muted mt-1">
          One photo per garment — jpeg, png, webp, or heic, up to 10 MB each.
        </p>
      </div>

      {/* Drop zone */}
      <div
        ref={dropRef}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition-colors select-none"
        style={{
          borderColor: dragOver ? "#D6402B" : "rgba(32,27,21,0.15)",
          background: dragOver ? "#FFF4F2" : "#FAF6F1",
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "#F5DCD3" }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 14V4M7 8l4-4 4 4" stroke="#D6402B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 17h16" stroke="#D6402B" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-frock-ink">Drop photos here</p>
          <p className="text-xs text-frock-muted mt-0.5">or tap to browse</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          className="sr-only"
          onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
        />
      </div>

      {/* File list */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <FileRow
              key={entry.id}
              entry={entry}
              onRetry={() => uploadEntry(entry.id, entry.file)}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-3">
          {hasQueued && (
            <button
              onClick={uploadAll}
              disabled={uploading}
              className="w-full rounded-full py-4 font-medium text-base text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50"
              style={{ background: "#D6402B" }}
            >
              {uploading ? "Uploading…" : `Upload ${entries.filter((e) => e.status === "idle" || e.status === "error").length} photo${entries.filter((e) => e.status === "idle" || e.status === "error").length !== 1 ? "s" : ""}`}
            </button>
          )}
          {doneCount > 0 && !hasQueued && (
            <button
              onClick={() => router.push("/wardrobe")}
              className="w-full rounded-full py-4 font-medium text-base text-white transition-opacity hover:opacity-90"
              style={{ background: "#D6402B" }}
            >
              View wardrobe →
            </button>
          )}
          {doneCount > 0 && (
            <p className="text-xs text-center text-frock-muted">
              {doneCount} saved — classification running in the background
            </p>
          )}
        </div>
      )}
    </div>
  );
}
