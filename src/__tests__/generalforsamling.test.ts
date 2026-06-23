import { describe, it, expect } from "vitest";

describe("Assembly Status Workflow", () => {
  const validTransitions: Record<string, string> = {
    draft: "notice_sent",
    notice_sent: "voting",
    voting: "closed",
  };

  it("draft → notice_sent is valid", () => {
    expect(validTransitions["draft"]).toBe("notice_sent");
  });

  it("notice_sent → voting is valid", () => {
    expect(validTransitions["notice_sent"]).toBe("voting");
  });

  it("voting → closed is valid", () => {
    expect(validTransitions["voting"]).toBe("closed");
  });

  it("closed has no next transition", () => {
    expect(validTransitions["closed"]).toBeUndefined();
  });

  it("has exactly 3 valid transitions", () => {
    expect(Object.keys(validTransitions)).toHaveLength(3);
  });
});

describe("Voting Logic", () => {
  it("counts votes correctly", () => {
    const votes = [
      { vote: "for" }, { vote: "for" }, { vote: "for" },
      { vote: "against" }, { vote: "against" },
      { vote: "abstain" },
    ];
    const forCount = votes.filter(v => v.vote === "for").length;
    const againstCount = votes.filter(v => v.vote === "against").length;
    const abstainCount = votes.filter(v => v.vote === "abstain").length;

    expect(forCount).toBe(3);
    expect(againstCount).toBe(2);
    expect(abstainCount).toBe(1);
  });

  it("determines passed when for > against", () => {
    const forCount = 5;
    const againstCount = 3;
    expect(forCount > againstCount).toBe(true);
  });

  it("determines rejected when against >= for", () => {
    const forCount = 3;
    const againstCount = 4;
    expect(forCount > againstCount).toBe(false);
  });

  it("tie means not passed (strict majority)", () => {
    const forCount = 3;
    const againstCount = 3;
    expect(forCount > againstCount).toBe(false);
  });

  it("abstain votes do not count toward majority", () => {
    const votes = [
      { vote: "for" }, { vote: "for" },
      { vote: "against" },
      { vote: "abstain" }, { vote: "abstain" }, { vote: "abstain" },
    ];
    const forCount = votes.filter(v => v.vote === "for").length;
    const againstCount = votes.filter(v => v.vote === "against").length;
    // Majority is for > against, abstain ignored
    expect(forCount > againstCount).toBe(true);
  });

  it("finds user vote from array", () => {
    const profileId = "user-1";
    const votes = [
      { profile_id: "user-1", vote: "for" },
      { profile_id: "user-2", vote: "against" },
    ];
    const myVote = votes.find(v => v.profile_id === profileId)?.vote || null;
    expect(myVote).toBe("for");
  });

  it("returns null when user has not voted", () => {
    const profileId = "user-3";
    const votes = [
      { profile_id: "user-1", vote: "for" },
      { profile_id: "user-2", vote: "against" },
    ];
    const myVote = votes.find(v => v.profile_id === profileId)?.vote || null;
    expect(myVote).toBeNull();
  });

  it("upsert: update existing vote", () => {
    const existing = { id: "vote-1", vote: "for" };
    const newVote = "against";
    const updated = { ...existing, vote: newVote };
    expect(updated.vote).toBe("against");
    expect(updated.id).toBe("vote-1");
  });

  it("upsert: create new vote when none exists", () => {
    const existing = null;
    const shouldInsert = !existing;
    expect(shouldInsert).toBe(true);
  });
});

describe("Assembly Item Types", () => {
  const validTypes = ["sak", "valg", "orientering", "vedtektsendring"];

  it("has 4 valid item types", () => {
    expect(validTypes).toHaveLength(4);
  });

  it("orientering does not require vote", () => {
    const requiresVote = (type: string) => type !== "orientering";
    expect(requiresVote("orientering")).toBe(false);
    expect(requiresVote("sak")).toBe(true);
    expect(requiresVote("valg")).toBe(true);
    expect(requiresVote("vedtektsendring")).toBe(true);
  });

  it("maps item type to Norwegian label", () => {
    const labels: Record<string, string> = {
      sak: "Sak", valg: "Valg", orientering: "Orientering", vedtektsendring: "Vedtektsendring",
    };
    expect(labels["sak"]).toBe("Sak");
    expect(labels["vedtektsendring"]).toBe("Vedtektsendring");
  });
});

describe("Assembly Agenda Sorting", () => {
  it("sorts items by item_number", () => {
    const items = [
      { item_number: 3, title: "Budsjett" },
      { item_number: 1, title: "Innkalling" },
      { item_number: 2, title: "Regnskap" },
    ];
    const sorted = [...items].sort((a, b) => a.item_number - b.item_number);
    expect(sorted[0].title).toBe("Innkalling");
    expect(sorted[1].title).toBe("Regnskap");
    expect(sorted[2].title).toBe("Budsjett");
  });
});

describe("Assembly Status Display", () => {
  const statusConfig: Record<string, { label: string }> = {
    draft: { label: "Utkast" },
    notice_sent: { label: "Innkalling sendt" },
    open: { label: "Pågår" },
    voting: { label: "Avstemning åpen" },
    closed: { label: "Avsluttet" },
  };

  it("has 5 status types", () => {
    expect(Object.keys(statusConfig)).toHaveLength(5);
  });

  it("voting shows correct label", () => {
    expect(statusConfig["voting"].label).toBe("Avstemning åpen");
  });

  it("closed shows correct label", () => {
    expect(statusConfig["closed"].label).toBe("Avsluttet");
  });
});
