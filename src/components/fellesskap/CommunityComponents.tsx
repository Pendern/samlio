"use client";

import { useState, useTransition } from "react";
import { createPost, createComment, toggleReaction, togglePin } from "@/app/fellesskap/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, MessageCircle, Pin, Send, Shield } from "lucide-react";

// ── Nytt innlegg ───────────────────────────────────────────────

export function PostComposer({ isBoard }: { isBoard: boolean }) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    setError("");
    if (!body.trim()) { setError("Skriv noe først"); return; }

    // Styremedlemmer poster som "announcement" når de er i styremodus
    if (isBoard) {
      formData.set("type", "announcement");
    }

    startTransition(async () => {
      const result = await createPost(formData);
      if (result?.error) setError(result.error);
      else setBody("");
    });
  }

  return (
    <form action={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          isBoard ? "bg-violet-600 text-white" : "bg-zinc-700 text-zinc-300"
        }`}>
          {isBoard ? <Shield className="w-4 h-4" /> : "DU"}
        </div>
        <div className="flex-1">
          <Textarea
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={isBoard ? "Skriv et oppslag fra styret..." : "Hva skjer i sameiet?"}
            rows={2}
            className="bg-zinc-800 border-zinc-700 resize-none text-sm"
          />
          <input type="hidden" name="type" value={isBoard ? "announcement" : "post"} />
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-zinc-600">
              {isBoard ? "Publiseres som styreoppslag" : "Synlig for alle i sameiet"}
            </p>
            <Button type="submit" disabled={isPending || !body.trim()} size="sm" className="bg-violet-600 hover:bg-violet-500 text-white h-8 text-xs">
              <Send className="w-3 h-3 mr-1.5" />
              {isPending ? "Publiserer..." : "Publiser"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

// ── Kommentarfelt ──────────────────────────────────────────────

export function CommentForm({ postId, isBoard }: { postId: string; isBoard: boolean }) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!body.trim()) return;
    startTransition(async () => {
      await createComment(postId, body);
      setBody("");
    });
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
        isBoard ? "bg-violet-600 text-white" : "bg-zinc-700 text-zinc-400"
      }`}>
        {isBoard ? <Shield className="w-3 h-3" /> : "DU"}
      </div>
      <input
        type="text"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
        placeholder={isBoard ? "Kommenter som styret..." : "Skriv en kommentar..."}
        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
      />
      <Button
        onClick={handleSubmit}
        disabled={isPending || !body.trim()}
        variant="ghost"
        size="sm"
        className="text-violet-400 hover:text-violet-300 h-7 px-2"
      >
        <Send className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

// ── Reaksjonsknapp ─────────────────────────────────────────────

export function ReactionButton({ postId, count, hasReacted }: { postId: string; count: number; hasReacted: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(async () => { await toggleReaction(postId); })}
      disabled={isPending}
      className={`flex items-center gap-1.5 text-xs transition ${
        hasReacted ? "text-violet-400" : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      <ThumbsUp className={`w-3.5 h-3.5 ${hasReacted ? "fill-violet-400" : ""}`} />
      {count > 0 && count}
    </button>
  );
}

// ── Pinne-knapp (kun styre) ────────────────────────────────────

export function PinButton({ postId, isPinned }: { postId: string; isPinned: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(async () => { await togglePin(postId); })}
      disabled={isPending}
      className={`text-xs transition ${isPinned ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"}`}
      title={isPinned ? "Fjern pin" : "Pin innlegg"}
    >
      <Pin className={`w-3.5 h-3.5 ${isPinned ? "fill-amber-400" : ""}`} />
    </button>
  );
}
