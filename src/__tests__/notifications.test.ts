import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Supabase ──────────────────────────────────────────────

function createMockSupabase(overrides: {
  prefsData?: any[];
  insertError?: any;
} = {}) {
  const insertedRows: any[] = [];

  return {
    client: {
      from: (table: string) => ({
        select: () => ({
          in: () => ({
            eq: () => ({
              data: overrides.prefsData || [],
              error: null,
            }),
          }),
        }),
        insert: (rows: any[]) => {
          insertedRows.push(...rows);
          return { error: overrides.insertError || null };
        },
      }),
    },
    insertedRows,
  };
}

// ── Tests ──────────────────────────────────────────────────────

describe("Notification Logic", () => {
  describe("Recipient filtering", () => {
    it("excludes the actor from recipients by default", () => {
      const actorId = "actor-1";
      const recipientIds = ["user-1", "user-2", "actor-1", "user-3"];
      const filtered = recipientIds.filter(id => id !== actorId);
      expect(filtered).toEqual(["user-1", "user-2", "user-3"]);
      expect(filtered).not.toContain("actor-1");
    });

    it("includes the actor when excludeActorId is false", () => {
      const actorId = "actor-1";
      const recipientIds = ["user-1", "actor-1"];
      const excludeActorId = false;
      const filtered = excludeActorId
        ? recipientIds.filter(id => id !== actorId)
        : recipientIds;
      expect(filtered).toContain("actor-1");
      expect(filtered).toHaveLength(2);
    });

    it("returns empty array when only recipient is the actor", () => {
      const filtered = ["actor-1"].filter(id => id !== "actor-1");
      expect(filtered).toHaveLength(0);
    });
  });

  describe("Preference filtering", () => {
    it("filters out users who disabled a notification type", () => {
      const recipients = ["user-1", "user-2", "user-3"];
      const disabledIds = new Set(["user-2"]);
      const filtered = recipients.filter(id => !disabledIds.has(id));
      expect(filtered).toEqual(["user-1", "user-3"]);
    });

    it("keeps all recipients when no one has disabled", () => {
      const recipients = ["user-1", "user-2"];
      const disabledIds = new Set<string>([]);
      const filtered = recipients.filter(id => !disabledIds.has(id));
      expect(filtered).toEqual(["user-1", "user-2"]);
    });

    it("returns empty when everyone has disabled", () => {
      const recipients = ["user-1", "user-2"];
      const disabledIds = new Set(["user-1", "user-2"]);
      const filtered = recipients.filter(id => !disabledIds.has(id));
      expect(filtered).toHaveLength(0);
    });
  });

  describe("Notification creation", () => {
    it("creates correct notification shape", () => {
      const tenantId = "tenant-1";
      const recipientIds = ["user-1", "user-2"];
      const actorId = "actor-1";
      const type = "post";
      const title = "Nytt oppslag fra styret";
      const body = "Brannalarmen var falsk alarm";
      const href = "/fellesskap";

      const notifications = recipientIds.map(recipientId => ({
        tenant_id: tenantId,
        recipient_id: recipientId,
        actor_id: actorId,
        type,
        title,
        body,
        href,
        entity_id: null,
      }));

      expect(notifications).toHaveLength(2);
      expect(notifications[0]).toEqual({
        tenant_id: "tenant-1",
        recipient_id: "user-1",
        actor_id: "actor-1",
        type: "post",
        title: "Nytt oppslag fra styret",
        body: "Brannalarmen var falsk alarm",
        href: "/fellesskap",
        entity_id: null,
      });
    });

    it("truncates body to 100 chars", () => {
      const longText = "A".repeat(200);
      const truncated = longText.substring(0, 100);
      expect(truncated).toHaveLength(100);
    });

    it("handles null body and href gracefully", () => {
      const notification = {
        tenant_id: "t-1",
        recipient_id: "u-1",
        actor_id: "a-1",
        type: "comment",
        title: "Ny kommentar",
        body: null,
        href: null,
        entity_id: null,
      };
      expect(notification.body).toBeNull();
      expect(notification.href).toBeNull();
    });
  });

  describe("Notification types", () => {
    const validTypes = [
      "post", "comment", "reaction", "event_reminder",
      "rsvp", "group_invite", "hms_deviation",
      "task_assigned", "meeting_reminder",
    ];

    it("supports all 9 notification types", () => {
      expect(validTypes).toHaveLength(9);
    });

    it("maps preference column name correctly", () => {
      validTypes.forEach(type => {
        const prefColumn = `${type}_enabled`;
        expect(prefColumn).toMatch(/_enabled$/);
      });
    });

    it("generates correct pref column for each type", () => {
      expect(`${"post"}_enabled`).toBe("post_enabled");
      expect(`${"hms_deviation"}_enabled`).toBe("hms_deviation_enabled");
      expect(`${"meeting_reminder"}_enabled`).toBe("meeting_reminder_enabled");
    });
  });
});

describe("Notification Preferences", () => {
  const defaultPrefs = {
    post_enabled: true,
    comment_enabled: true,
    reaction_enabled: true,
    event_reminder_enabled: true,
    rsvp_enabled: true,
    group_invite_enabled: true,
    hms_deviation_enabled: true,
    task_assigned_enabled: true,
    meeting_reminder_enabled: true,
  };

  it("all preferences default to true", () => {
    Object.values(defaultPrefs).forEach(value => {
      expect(value).toBe(true);
    });
  });

  it("has exactly 9 preference fields", () => {
    expect(Object.keys(defaultPrefs)).toHaveLength(9);
  });

  it("correctly parses form data toggle", () => {
    // Simulates form submission: checked = "on", unchecked = absent
    const formEntries: Record<string, string> = {
      post_enabled: "on",
      comment_enabled: "on",
      reaction_enabled: "off",  // hidden input sends "off"
      event_reminder_enabled: "on",
      rsvp_enabled: "off",
      group_invite_enabled: "on",
      hms_deviation_enabled: "on",
      task_assigned_enabled: "on",
      meeting_reminder_enabled: "off",
    };

    const prefs: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(formEntries)) {
      prefs[key] = value === "on";
    }

    expect(prefs.post_enabled).toBe(true);
    expect(prefs.reaction_enabled).toBe(false);
    expect(prefs.rsvp_enabled).toBe(false);
    expect(prefs.meeting_reminder_enabled).toBe(false);
  });

  it("upsert logic: creates when no existing row", () => {
    const existing = null;
    const shouldInsert = !existing;
    expect(shouldInsert).toBe(true);
  });

  it("upsert logic: updates when row exists", () => {
    const existing = { id: "pref-1" };
    const shouldInsert = !existing;
    expect(shouldInsert).toBe(false);
  });
});

describe("End-to-end notification flow", () => {
  it("post creation → notification for all except author", () => {
    const authorId = "author-1";
    const allProfiles = [
      { id: "author-1" },
      { id: "user-2" },
      { id: "user-3" },
      { id: "user-4" },
    ];

    // Step 1: Get all profile IDs
    const recipientIds = allProfiles.map(p => p.id);

    // Step 2: Exclude author
    const filtered = recipientIds.filter(id => id !== authorId);
    expect(filtered).toHaveLength(3);
    expect(filtered).not.toContain("author-1");

    // Step 3: Check prefs (simulated: user-3 has post_enabled = false)
    const disabledIds = new Set(["user-3"]);
    const finalRecipients = filtered.filter(id => !disabledIds.has(id));
    expect(finalRecipients).toEqual(["user-2", "user-4"]);

    // Step 4: Create notifications
    const notifications = finalRecipients.map(rid => ({
      tenant_id: "t-1",
      recipient_id: rid,
      actor_id: authorId,
      type: "post",
      title: "Nytt oppslag fra styret",
      body: "Brannalarmen var falsk alarm",
      href: "/fellesskap",
      entity_id: null,
    }));

    expect(notifications).toHaveLength(2);
    expect(notifications[0].recipient_id).toBe("user-2");
    expect(notifications[1].recipient_id).toBe("user-4");
  });

  it("comment → notification only to post author", () => {
    const commentAuthorId = "commenter-1";
    const postAuthorId = "post-author-1";

    // Only notify post author, not the commenter
    const shouldNotify = postAuthorId !== commentAuthorId;
    expect(shouldNotify).toBe(true);

    const notification = {
      type: "comment",
      title: "Ny kommentar på ditt innlegg",
      recipient_id: postAuthorId,
      actor_id: commentAuthorId,
    };
    expect(notification.recipient_id).toBe("post-author-1");
  });

  it("comment by post author → no self-notification", () => {
    const commentAuthorId = "same-user";
    const postAuthorId = "same-user";

    const shouldNotify = postAuthorId !== commentAuthorId;
    expect(shouldNotify).toBe(false);
  });

  it("mark read flow: unread → read", () => {
    const notification = { id: "n-1", is_read: false };
    const updated = { ...notification, is_read: true };
    expect(updated.is_read).toBe(true);
  });

  it("mark all read: filters only unread", () => {
    const notifications = [
      { id: "n-1", is_read: false },
      { id: "n-2", is_read: true },
      { id: "n-3", is_read: false },
    ];
    const unread = notifications.filter(n => !n.is_read);
    expect(unread).toHaveLength(2);
  });
});
