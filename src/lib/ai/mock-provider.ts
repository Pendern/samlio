import type { AiProvider, AiSuggestionInput, AiSuggestionOutput, AiChatMessage } from "./provider";

export class MockAiProvider implements AiProvider {
  async generateSuggestions(inputs: AiSuggestionInput[]): Promise<AiSuggestionOutput[]> {
    const suggestions: AiSuggestionOutput[] = [];

    for (const input of inputs) {
      const result = this.processInput(input);
      if (result) suggestions.push(result);
    }

    return suggestions;
  }

  async chat(messages: AiChatMessage[], context: Record<string, unknown>): Promise<string> {
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    const data = context as any;

    // Contextual responses based on keywords and available data
    if (lastMessage.includes("hms") || lastMessage.includes("avvik")) {
      const count = data.openDeviations || 0;
      if (count > 0) {
        return `Dere har ${count} åpne HMS-avvik. Jeg anbefaler å prioritere de med høy alvorlighetsgrad først. Gå til HMS-modulen for å se oversikten og lukke avvik som er utbedret.`;
      }
      return "HMS-statusen ser bra ut — ingen åpne avvik. Husk å gjennomføre planlagte kontroller til riktig tid.";
    }

    if (lastMessage.includes("vedlikehold") || lastMessage.includes("tiltak")) {
      const count = data.maintenanceThisYear || 0;
      return `Det er ${count} vedlikeholdstiltak planlagt i år. Sjekk vedlikeholdsplanen for å se om noe har forfalt eller nærmer seg frist. Tidlig planlegging gir bedre priser fra leverandører.`;
    }

    if (lastMessage.includes("økonomi") || lastMessage.includes("budsjett") || lastMessage.includes("faktura")) {
      const pending = data.pendingInvoices || 0;
      if (pending > 0) {
        return `Det er ${pending} fakturaer som venter på godkjenning. Gå til Økonomi-modulen for å godkjenne eller avvise dem. Ubetalte fakturaer kan gi forsinkelsesrenter.`;
      }
      return "Økonomien ser ryddig ut. Alle fakturaer er behandlet. Sjekk budsjettforbruket jevnlig for å unngå overforbruk.";
    }

    if (lastMessage.includes("forsikring") || lastMessage.includes("polise")) {
      const expiring = data.expiringPolicies || 0;
      if (expiring > 0) {
        return `${expiring} forsikringspolise(r) utløper snart. Kontakt forsikringsselskapet for å fornye, eller innhent tilbud fra flere leverandører for å sammenligne.`;
      }
      return "Alle forsikringer er aktive og gyldige. Husk å vurdere behovet for styreansvarsforsikring ved neste fornyelse.";
    }

    if (lastMessage.includes("møte") || lastMessage.includes("styremøte")) {
      return "For neste styremøte anbefaler jeg å forberede saksliste med alle åpne saker, gjennomgå HMS-status, og oppdatere vedlikeholdsplan. Bruk møte-modulen til å sende innkalling.";
    }

    if (lastMessage.includes("generalforsamling")) {
      return "For generalforsamling: Send innkalling minst 8 dager før (14 dager for vedtektsendringer). Husk årsregnskap, budsjettforslag, og valgkomitéens innstilling. Digital avstemning er aktivert.";
    }

    if (lastMessage.includes("leverandør") || lastMessage.includes("anbud")) {
      const count = data.totalSuppliers || 0;
      return `Dere har ${count} leverandør${count !== 1 ? "er" : ""} registrert. Sjekk leverandørregisteret under Drift-modulen. For større jobber anbefaler jeg minst 3 tilbud. Vurder leverandørenes rating og tidligere erfaringer før du velger.`;
    }

    if (lastMessage.includes("nøkkel") || lastMessage.includes("brikke")) {
      return "Nøkkelregisteret finner du under Drift. Hold oversikt over hvem som har hvilke nøkler, og sørg for at returnerte nøkler markeres. Vurder systemnøkler med sporing for bedre sikkerhet.";
    }

    if (lastMessage.includes("sak") || lastMessage.includes("styresak")) {
      const count = data.openCases || 0;
      if (count > 0) {
        return `Det er ${count} åpne styresak${count > 1 ? "er" : ""}. Gå til Saker-modulen for å se status og oppdatere. Saker som har stått lenge bør enten behandles i neste møte eller arkiveres.`;
      }
      return "Ingen åpne styresaker for øyeblikket. Bruk Saker-modulen til å opprette nye saker når behov oppstår.";
    }

    if (lastMessage.includes("booking") || lastMessage.includes("felleslokale") || lastMessage.includes("reserv")) {
      const count = data.upcomingBookings || 0;
      return `Det er ${count} kommende booking${count !== 1 ? "er" : ""}. Du kan booke felleslokale, gjesterom eller vaskerom under Drift-modulen.`;
    }

    if (lastMessage.includes("status") || lastMessage.includes("oversikt") || lastMessage.includes("oppsummering")) {
      const parts: string[] = [];
      if (data.openDeviations > 0) parts.push(`${data.openDeviations} åpne HMS-avvik`);
      if (data.pendingInvoices > 0) parts.push(`${data.pendingInvoices} fakturaer til godkjenning`);
      if (data.openCases > 0) parts.push(`${data.openCases} åpne styresaker`);
      if (data.expiringPolicies > 0) parts.push(`${data.expiringPolicies} forsikringer som utløper snart`);
      if (data.maintenanceThisYear > 0) parts.push(`${data.maintenanceThisYear} vedlikeholdstiltak i år`);
      if (data.upcomingBookings > 0) parts.push(`${data.upcomingBookings} kommende bookinger`);

      if (parts.length === 0) {
        return "Alt ser bra ut! Ingen åpne avvik, ventende fakturaer eller presserende saker. Fortsett det gode arbeidet.";
      }
      return `Her er en statusoversikt:\n\n${parts.map(p => `• ${p}`).join("\n")}\n\nSpør meg om et spesifikt område for mer detaljer.`;
    }

    if (lastMessage.includes("hjelp") || lastMessage.includes("hva kan du")) {
      return "Jeg kan hjelpe deg med:\n• HMS-status og avvikshåndtering\n• Vedlikeholdsplanlegging\n• Økonomioversikt og fakturaer\n• Forsikringsstatus\n• Møteforberedelser\n• Generalforsamling\n• Leverandører og anbud\n• Nøkkeladministrasjon\n• Statusoversikt\n• Bookinger og felleslokaler\n\nPrøv å si \"gi meg en statusoversikt\" for en komplett oppsummering!";
    }

    // Default response
    return "Jeg er AI-assistenten for styrearbeid. Spør meg om HMS, vedlikehold, økonomi, forsikring, møter, saker, booking, generalforsamling, leverandører eller nøkler \u2014 eller si \"gi meg en statusoversikt\" for en komplett oppsummering.";
  }

  private processInput(input: AiSuggestionInput): AiSuggestionOutput | null {
    switch (input.type) {
      case "hms_overdue_controls":
        return this.hmsOverdueControls(input);
      case "hms_open_deviations":
        return this.hmsOpenDeviations(input);
      case "maintenance_upcoming":
        return this.maintenanceUpcoming(input);
      case "maintenance_condition":
        return this.maintenanceCondition(input);
      case "economy_pending_invoices":
        return this.economyPendingInvoices(input);
      case "economy_budget_overrun":
        return this.economyBudgetOverrun(input);
      case "insurance_expiring":
        return this.insuranceExpiring(input);
      case "cases_stale":
        return this.casesStaleCases(input);
      case "meeting_preparation":
        return this.meetingPreparation(input);
      default:
        return null;
    }
  }

  private hmsOverdueControls(input: AiSuggestionInput): AiSuggestionOutput | null {
    const count = (input.context.count as number) || 0;
    if (count === 0) return null;
    return {
      type: "hms",
      suggestion_text: `${count} HMS-kontroll${count > 1 ? "er" : ""} har passert fristen. Planlegg gjennomføring snarest for å opprettholde internkontrollkravene. Ugjorte kontroller kan gi styreansvar ved uhell.`,
      source_refs: ["HMS-kontroller", "Internkontrollforskriften"],
      context_json: input.context,
      model_used: "mock-rules-v1",
    };
  }

  private hmsOpenDeviations(input: AiSuggestionInput): AiSuggestionOutput | null {
    const critical = (input.context.critical as number) || 0;
    const total = (input.context.total as number) || 0;
    if (total === 0) return null;
    if (critical > 0) {
      return {
        type: "hms",
        suggestion_text: `${critical} kritisk${critical > 1 ? "e" : ""} HMS-avvik krever umiddelbar oppfølging. Alvorlige avvik bør lukkes innen 7 dager for å ivareta beboernes sikkerhet.`,
        source_refs: ["HMS-avvik", "Forskrift om systematisk HMS-arbeid"],
        context_json: input.context,
        model_used: "mock-rules-v1",
      };
    }
    return {
      type: "hms",
      suggestion_text: `${total} åpne HMS-avvik bør gjennomgås. Vurder å sette frister og ansvarlige for hvert avvik i neste styremøte.`,
      source_refs: ["HMS-avvik"],
      context_json: input.context,
      model_used: "mock-rules-v1",
    };
  }

  private maintenanceUpcoming(input: AiSuggestionInput): AiSuggestionOutput | null {
    const items = input.context.items as string[] || [];
    if (items.length === 0) return null;
    const itemList = items.slice(0, 3).join(", ");
    return {
      type: "vedlikehold",
      suggestion_text: `${items.length} vedlikeholdstiltak nærmer seg frist: ${itemList}${items.length > 3 ? " m.fl." : ""}. Innhent tilbud nå for å sikre gode priser og tilgjengelighet.`,
      source_refs: ["Vedlikeholdsplan"],
      context_json: input.context,
      model_used: "mock-rules-v1",
    };
  }

  private maintenanceCondition(input: AiSuggestionInput): AiSuggestionOutput | null {
    const parts = input.context.parts as string[] || [];
    if (parts.length === 0) return null;
    return {
      type: "vedlikehold",
      suggestion_text: `Bygningsdeler med dårlig eller kritisk tilstand: ${parts.join(", ")}. Vurder befaring og kostnadsoversikt for å planlegge utbedring.`,
      source_refs: ["Tilstandsvurdering", "NS 3451"],
      context_json: input.context,
      model_used: "mock-rules-v1",
    };
  }

  private economyPendingInvoices(input: AiSuggestionInput): AiSuggestionOutput | null {
    const count = (input.context.count as number) || 0;
    const amount = (input.context.totalAmount as number) || 0;
    if (count === 0) return null;
    return {
      type: "okonomi",
      suggestion_text: `${count} faktura${count > 1 ? "er" : ""} (${amount.toLocaleString("no-NO")} kr) venter på godkjenning. Behandle disse før forfallsdato for å unngå purregebyr og forsinkelsesrenter.`,
      source_refs: ["Fakturaer", "Økonomimodul"],
      context_json: input.context,
      model_used: "mock-rules-v1",
    };
  }

  private economyBudgetOverrun(input: AiSuggestionInput): AiSuggestionOutput | null {
    const categories = input.context.categories as string[] || [];
    if (categories.length === 0) return null;
    return {
      type: "okonomi",
      suggestion_text: `Budsjettoverskridelse i ${categories.join(", ")}. Vurder om det er behov for budsjettjustering eller om utgiftene kan reduseres i kommende måneder.`,
      source_refs: ["Budsjett", "Økonomirapport"],
      context_json: input.context,
      model_used: "mock-rules-v1",
    };
  }

  private insuranceExpiring(input: AiSuggestionInput): AiSuggestionOutput | null {
    const policies = input.context.policies as string[] || [];
    if (policies.length === 0) return null;
    return {
      type: "forsikring",
      suggestion_text: `Forsikring${policies.length > 1 ? "er" : ""} som utløper snart: ${policies.join(", ")}. Kontakt forsikringsselskapet for fornyelse eller innhent konkurransedyktige tilbud.`,
      source_refs: ["Forsikringspoliser", "Drift-modul"],
      context_json: input.context,
      model_used: "mock-rules-v1",
    };
  }

  private casesStaleCases(input: AiSuggestionInput): AiSuggestionOutput | null {
    const count = (input.context.count as number) || 0;
    if (count === 0) return null;
    return {
      type: "saker",
      suggestion_text: `${count} styresak${count > 1 ? "er" : ""} har stått ubehandlet i over 30 dager. Vurder å sette dem på neste møteagenda eller arkivere saker som ikke lenger er relevante.`,
      source_refs: ["Styresaker"],
      context_json: input.context,
      model_used: "mock-rules-v1",
    };
  }

  private meetingPreparation(input: AiSuggestionInput): AiSuggestionOutput | null {
    const daysUntil = (input.context.daysUntil as number) || 0;
    const title = (input.context.title as string) || "Styremøte";
    if (daysUntil > 14 || daysUntil < 0) return null;
    return {
      type: "moter",
      suggestion_text: `${title} om ${daysUntil} dager. ${daysUntil <= 3 ? "Sørg for at saksliste og dokumenter er klare." : "Begynn å forberede saksliste og send innkalling til styremedlemmene."}`,
      source_refs: ["Møtekalender"],
      context_json: input.context,
      model_used: "mock-rules-v1",
    };
  }
}
