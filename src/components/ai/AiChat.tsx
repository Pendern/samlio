"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { chatWithAi } from "@/app/ai/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hei! Jeg er AI-assistenten for styrearbeid. Spør meg om HMS, vedlikehold, økonomi, forsikring, møter, generalforsamling, leverandører eller nøkler — så gir jeg deg kontekstuelle råd basert på dataene i systemet.\n\nPrøv for eksempel: \"Hvordan er HMS-statusen?\" eller \"Hjelp meg med neste styremøte\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isPending) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");

    startTransition(async () => {
      const result = await chatWithAi(updatedMessages);
      setMessages(prev => [...prev, { role: "assistant", content: result.response }]);
    });
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
            )}
            <div
              className={`rounded-xl px-4 py-3 max-w-[80%] ${
                msg.role === "user"
                  ? "bg-zinc-800 border border-zinc-700 text-zinc-200"
                  : "bg-violet-950/30 border border-violet-900/30 text-zinc-200"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
            )}
          </div>
        ))}
        {isPending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
            </div>
            <div className="bg-violet-950/30 border border-violet-900/30 rounded-xl px-4 py-3">
              <p className="text-sm text-zinc-400">Tenker...</p>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3 pt-4 border-t border-zinc-800">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Spør om HMS, vedlikehold, økonomi..."
          className="bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 flex-1"
          disabled={isPending}
        />
        <Button
          type="submit"
          disabled={isPending || !input.trim()}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
