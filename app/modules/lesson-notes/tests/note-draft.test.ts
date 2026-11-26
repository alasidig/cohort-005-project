import { describe, it, expect } from "vitest";
import { noteDraftState } from "../index";
import { MAX_NOTE_LENGTH } from "~/lib/notes";

const now = Date.parse("2026-11-26T12:00:00Z");
const fiveMinutesAgo = "2026-11-26T11:55:00Z";
const saved = {
  body: "Generics are type parameters.",
  updatedAt: fiveMinutesAgo,
};

function state(overrides: Partial<Parameters<typeof noteDraftState>[0]>) {
  return noteDraftState({
    draft: "",
    saved: null,
    pending: false,
    now,
    ...overrides,
  });
}

describe("noteDraftState", () => {
  describe("status", () => {
    it("tells a Student with no note that it is private", () => {
      expect(state({}).status).toEqual({
        tone: "muted",
        text: "Only you can read your notes.",
      });
    });

    it("says when a saved note was last edited", () => {
      expect(state({ draft: saved.body, saved }).status).toEqual({
        tone: "muted",
        text: "Saved 5m ago",
      });
    });

    it("says only Saved when the timestamp cannot be read", () => {
      const broken = { body: "x", updatedAt: "not a date" };
      expect(state({ draft: "x", saved: broken }).status.text).toBe("Saved");
    });

    it("flags edits that have not been saved", () => {
      expect(state({ draft: `${saved.body} More.`, saved }).status).toEqual({
        tone: "muted",
        text: "Unsaved changes",
      });
    });

    it("ignores whitespace the server trims away on save", () => {
      const state1 = state({ draft: `${saved.body}\n\n`, saved });
      expect(state1.status.text).toBe("Saved 5m ago");
      expect(state1.canSave).toBe(false);
    });

    it("flags a first note that has not been saved", () => {
      expect(state({ draft: "First thought" }).status.text).toBe(
        "Unsaved changes"
      );
    });

    it("shows saving while a save is in flight", () => {
      expect(state({ draft: "a", pending: true, error: "old" }).status).toEqual(
        { tone: "muted", text: "Saving..." }
      );
    });

    it("shows the error the last save came back with", () => {
      expect(state({ draft: "a", error: "Nope." }).status).toEqual({
        tone: "error",
        text: "Nope.",
      });
    });

    it("counts how far over the limit the draft is", () => {
      const draft = "a".repeat(MAX_NOTE_LENGTH + 1500);
      expect(state({ draft, error: "old" }).status).toEqual({
        tone: "error",
        text: "1,500 characters over the limit",
      });
    });
  });

  describe("length", () => {
    it("counts the draft against the note limit", () => {
      expect(state({ draft: "abc" }).length).toEqual({
        count: 3,
        max: MAX_NOTE_LENGTH,
        over: false,
      });
    });

    it("allows a draft exactly at the limit", () => {
      const draft = "a".repeat(MAX_NOTE_LENGTH);
      expect(state({ draft }).length.over).toBe(false);
      expect(state({ draft }).canSave).toBe(true);
    });

    it("marks a draft one past the limit as over", () => {
      const draft = "a".repeat(MAX_NOTE_LENGTH + 1);
      expect(state({ draft }).length.over).toBe(true);
    });
  });

  describe("canSave", () => {
    it("allows saving a changed, non-empty draft", () => {
      expect(state({ draft: "changed", saved }).canSave).toBe(true);
    });

    it("refuses an unchanged note", () => {
      expect(state({ draft: saved.body, saved }).canSave).toBe(false);
    });

    it("refuses a blank draft", () => {
      expect(state({ draft: "   \n" }).canSave).toBe(false);
    });

    it("refuses blanking out a saved note, which the server would reject", () => {
      expect(state({ draft: "  ", saved }).canSave).toBe(false);
    });

    it("refuses while a save is in flight", () => {
      expect(state({ draft: "changed", pending: true }).canSave).toBe(false);
    });

    it("refuses a draft over the limit", () => {
      const draft = "a".repeat(MAX_NOTE_LENGTH + 1);
      expect(state({ draft }).canSave).toBe(false);
    });
  });
});
