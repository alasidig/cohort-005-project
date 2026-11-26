import { useState } from "react";
import { useFetcher } from "react-router";
import { NotebookPen } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { noteDraftState, type NoteDraftState } from "~/modules/lesson-notes";

type SavedNote = { body: string; updatedAt: string } | null;

/**
 * The Student's private Note on a Lesson. It has no frame of its own: the
 * Lesson page attaches it to the bottom of the video panel, or wraps it in
 * the same panel style when the Lesson has no video.
 */
export function LessonNote({ note }: { note: SavedNote }) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const [draft, setDraft] = useState(note?.body ?? "");
  // Read once: a save that lands after mount is still "just now".
  const [now] = useState(() => Date.now());
  const { canSave, length, status } = noteDraftState({
    draft,
    saved: note,
    pending: fetcher.state !== "idle",
    error: fetcher.data?.error,
    now,
  });

  return (
    <fetcher.Form method="post" className="space-y-3 p-4">
      <input type="hidden" name="intent" value="save-note" />
      <label
        htmlFor="lesson-note-body"
        className="flex items-center gap-2 text-sm font-medium"
      >
        <NotebookPen className="size-4 text-muted-foreground" />
        Your notes
      </label>
      <Textarea
        id="lesson-note-body"
        name="body"
        rows={4}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Jot down what you want to remember from this lesson..."
        className="resize-y bg-background"
      />
      <NoteFooter canSave={canSave} length={length} status={status} />
    </fetcher.Form>
  );
}

function NoteFooter({ canSave, length, status }: NoteDraftState) {
  return (
    <div className="flex items-center gap-3">
      <Button type="submit" size="sm" disabled={!canSave}>
        Save note
      </Button>
      <span
        suppressHydrationWarning
        role={status.tone === "error" ? "alert" : "status"}
        className={cn(
          "text-xs",
          status.tone === "error" ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {status.text}
      </span>
      <span
        className={cn(
          "ml-auto text-xs tabular-nums",
          length.over ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {length.count} / {length.max}
      </span>
    </div>
  );
}
