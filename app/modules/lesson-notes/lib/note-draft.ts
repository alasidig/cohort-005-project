import { MAX_NOTE_LENGTH } from "~/lib/notes";
import { formatRelativeTime } from "~/lib/utils";

export type NoteDraftInput = {
  /** What is in the textarea now. */
  draft: string;
  /** The note as last saved, or null when the Student has never saved one. */
  saved: { body: string; updatedAt: string } | null;
  /** A save is in flight. */
  pending: boolean;
  /** The error the last save came back with, if it failed. */
  error?: string;
  /** Epoch milliseconds, injected so the "last edited" text is testable. */
  now: number;
};

export type NoteDraftState = {
  canSave: boolean;
  length: { count: number; max: number; over: boolean };
  status: { tone: "muted" | "error"; text: string };
};

export function noteDraftState(input: NoteDraftInput): NoteDraftState {
  const { draft, saved, pending, error, now } = input;
  const count = draft.length;
  const over = count > MAX_NOTE_LENGTH;
  // The server trims before it stores, so trailing whitespace is not an edit.
  const dirty = draft.trim() !== (saved?.body ?? "");
  const empty = draft.trim().length === 0;

  return {
    canSave: !pending && !over && !empty && dirty,
    length: { count, max: MAX_NOTE_LENGTH, over },
    status: statusFor({ over, dirty, pending, error, saved, now, count }),
  };
}

function statusFor({
  over,
  dirty,
  pending,
  error,
  saved,
  now,
  count,
}: {
  over: boolean;
  dirty: boolean;
  pending: boolean;
  error?: string;
  saved: NoteDraftInput["saved"];
  now: number;
  count: number;
}): NoteDraftState["status"] {
  if (pending) return { tone: "muted", text: "Saving..." };
  if (over) {
    const excess = (count - MAX_NOTE_LENGTH).toLocaleString("en");
    return { tone: "error", text: `${excess} characters over the limit` };
  }
  if (error) return { tone: "error", text: error };
  if (dirty) return { tone: "muted", text: "Unsaved changes" };
  if (saved) {
    const when = formatRelativeTime(saved.updatedAt, now);
    return { tone: "muted", text: when ? `Saved ${when}` : "Saved" };
  }
  return { tone: "muted", text: "Only you can read your notes." };
}
