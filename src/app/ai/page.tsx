import { Sparkles } from "lucide-react";
import { AiChat } from "@/components/ai/AiChat";

export default function AiPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 h-[calc(100vh-2rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          Spør AI
        </h1>
        <p className="text-sm text-zinc-500 mt-2">
          Still spørsmål om HMS, vedlikehold, økonomi, forsikring, møter og mer.
          Svarene er basert på data i systemet.
        </p>
      </div>
      <AiChat />
    </div>
  );
}
