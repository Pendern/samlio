import OpenAI from "openai";
import type { AiProvider, AiSuggestionInput, AiSuggestionOutput, AiChatMessage } from "./provider";

const SYSTEM_PROMPT = `Du er en AI-assistent for styrearbeid i norske borettslag og sameier.
Du heter Samlio AI og gir konkrete, handlingsrettede råd på norsk (bokmål).
Du har tilgang til sanntidsdata fra systemet via konteksten du mottar.
Vær kortfattet og direkte. Bruk punktlister når det er naturlig.
Referer til spesifikke moduler i systemet (HMS, Vedlikehold, Økonomi, Drift, Saker, Møter) når relevant.
Ikke dikter opp data — bruk kun tallene fra konteksten.`;

export class OpenAiProvider implements AiProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateSuggestions(inputs: AiSuggestionInput[]): Promise<AiSuggestionOutput[]> {
    if (inputs.length === 0) return [];

    const prompt = `Analyser følgende data fra et boligselskap og gi konkrete forslag til styret.
For hvert punkt, gi ett kort forslag (1-2 setninger) med handling.

Data:
${inputs.map(i => `- Type: ${i.type}, Kontekst: ${JSON.stringify(i.context)}`).join("\n")}

Svar i JSON-array-format:
[{"type": "kategori", "suggestion_text": "forslag", "source_refs": ["kilde1"]}]

Gyldige typer: hms, vedlikehold, okonomi, forsikring, saker, moter
Hold source_refs relevante (f.eks. "HMS-kontroller", "Vedlikeholdsplan", "Fakturaer").`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      const items = Array.isArray(parsed) ? parsed : parsed.suggestions || parsed.items || [];

      return items.map((item: any) => ({
        type: item.type || "generelt",
        suggestion_text: item.suggestion_text || item.text || "",
        source_refs: item.source_refs || [],
        context_json: {},
        model_used: this.model,
      })).filter((s: AiSuggestionOutput) => s.suggestion_text.length > 0);
    } catch (error) {
      console.error("OpenAI suggestion error:", error);
      // Fallback: return empty — mock provider will be used on next call
      return [];
    }
  }

  async chat(messages: AiChatMessage[], context: Record<string, unknown>): Promise<string> {
    const contextSummary = Object.entries(context)
      .filter(([, v]) => v !== 0 && v !== null)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    const systemMessage = `${SYSTEM_PROMPT}

Nåværende data fra systemet:
${contextSummary || "Ingen spesielle funn."}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemMessage },
          ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        ],
        temperature: 0.5,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || "Beklager, jeg fikk ikke generert et svar.";
    } catch (error) {
      console.error("OpenAI chat error:", error);
      return "Beklager, noe gikk galt med AI-tjenesten. Prøv igjen.";
    }
  }
}
