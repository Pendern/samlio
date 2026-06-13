"use client";

import { useState, useTransition } from "react";
import { saveProtocol } from "@/app/moter/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Save, CheckCircle2 } from "lucide-react";

interface ProtocolEditorProps {
  meetingId: string;
  initialProtocol: string;
  meetingTitle: string;
  meetingDate: string;
  attendees: string[];
}

export function ProtocolEditor({
  meetingId,
  initialProtocol,
  meetingTitle,
  meetingDate,
  attendees,
}: ProtocolEditorProps) {
  const [protocol, setProtocol] = useState(initialProtocol);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function generateDraft() {
    const date = new Date(meetingDate).toLocaleDateString("no-NO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const draft = `PROTOKOLL

${meetingTitle}
Dato: ${date}
Sted: [Fyll inn sted]

TILSTEDE:
${attendees.length > 0 ? attendees.map((a, i) => `${i + 1}. ${a}`).join("\n") : "- Ingen registrerte deltakere"}

FORFALL:
- [Fyll inn eventuelle forfall]

---

SAK 1: [Sakstittel]
Saksfremstilling:
[Beskriv saken]

Vedtak:
[Beskriv vedtaket]

---

SAK 2: [Sakstittel]
Saksfremstilling:
[Beskriv saken]

Vedtak:
[Beskriv vedtaket]

---

EVENTUELT:
[Noter fra eventuelt]

---

Neste styremøte: [Dato og klokkeslett]

Protokollen er ført av: [Navn]
Protokollen er godkjent av:

____________________          ____________________
[Navn]                        [Navn]
Styreleder                    Styremedlem`;

    setProtocol(draft);
  }

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      const result = await saveProtocol(meetingId, protocol);
      if (!result.error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  return (
    <div className="space-y-4">
      {!protocol ? (
        <div className="text-center py-8">
          <p className="text-sm text-zinc-400 mb-4">
            Ingen protokoll er skrevet ennå
          </p>
          <Button
            onClick={generateDraft}
            className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generer protokollutkast
          </Button>
        </div>
      ) : (
        <>
          <Textarea
            value={protocol}
            onChange={(e) => setProtocol(e.target.value)}
            rows={24}
            className="bg-zinc-800 border-zinc-700 font-mono text-sm leading-relaxed resize-y"
          />
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={generateDraft}
              className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Regenerer utkast
            </Button>
            <div className="flex items-center gap-2">
              {saved && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Lagret
                </span>
              )}
              <Button
                onClick={handleSave}
                disabled={isPending}
                className="bg-violet-600 hover:bg-violet-500 text-white"
                size="sm"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {isPending ? "Lagrer..." : "Lagre protokoll"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
