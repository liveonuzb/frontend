import {
  filter,
  get,
  isArray,
  join,
  map,
  size,
  slice,
  split,
  trim,
  uniq,
} from "lodash";
import React from "react";
import {
  FileTextIcon,
  LibraryIcon,
  NotebookPenIcon,
  SaveIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const parseTags = (value) =>
  slice(
    uniq(
      filter(
        map(split(String(value || ""), ","), (tag) => trim(tag)),
        Boolean,
      ),
    ),
    0,
    12,
  );

const formatDateTime = (value, locale) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getSnippetContent = (snippet) => get(snippet, "content") ?? get(snippet, "text") ?? "";

export default function ClientNotesPanel({
  notes = [],
  snippets = [],
  isLoading,
  isCreatingNote,
  isCreatingSnippet,
  isDeletingNote,
  onCreateNote,
  onCreateSnippet,
  onDeleteNote,
  clientName,
}) {
  const { t, i18n } = useTranslation();
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [saveAsTemplate, setSaveAsTemplate] = React.useState(false);

  const selectedTags = parseTags(tags);

  const handleUseTemplate = (snippet) => {
    React.startTransition(() => {
      setTitle(snippet.title || "");
      setContent(getSnippetContent(snippet));
      setTags(join(snippet.tags ?? [], ", "));
    });
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setTags("");
    setSaveAsTemplate(false);
  };

  const handleCreateNote = async (event) => {
    event.preventDefault();

    const normalizedContent = trim(content);
    if (!normalizedContent) {
      toast.error(
        t("coach.clients.clientDetail.notes.contentRequired", {
          defaultValue: "Note content is required.",
        }),
      );
      return;
    }

    const payload = {
      title: trim(title) || undefined,
      content: normalizedContent,
      tags: selectedTags,
    };

    try {
      await onCreateNote(payload);

      if (saveAsTemplate && onCreateSnippet) {
        await onCreateSnippet({
          title:
            payload.title ||
            t("coach.clients.clientDetail.notes.untitledTemplate", {
              defaultValue: "Client note template",
            }),
          content: normalizedContent,
          tags: selectedTags,
        });
      }

      resetForm();
      toast.success(
        t("coach.clients.clientDetail.notes.created", {
          defaultValue: "Note saved.",
        }),
      );
    } catch (error) {
      toast.error(
        get(error, "response.get")(data, "message") ||
          t("coach.clients.clientDetail.notes.createError", {
            defaultValue: "Could not save note.",
          }),
      );
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await onDeleteNote(noteId);
      toast.success(
        t("coach.clients.clientDetail.notes.deleted", {
          defaultValue: "Note deleted.",
        }),
      );
    } catch (error) {
      toast.error(
        get(error, "response.get")(data, "message") ||
          t("coach.clients.clientDetail.notes.deleteError", {
            defaultValue: "Could not delete note.",
          }),
      );
    }
  };

  return (
    <Card className="overflow-hidden border-none bg-card/70 py-6 shadow-sm backdrop-blur">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <NotebookPenIcon className="size-5 text-primary" />
            {t("coach.clients.clientDetail.notes.title", {
              defaultValue: "Client notes",
            })}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("coach.clients.clientDetail.notes.description", {
              defaultValue:
                "Keep private coaching notes and reuse templates for repeated follow-ups.",
            })}
          </p>
        </div>
        <Badge variant="outline" className="w-fit rounded-xl">
          {notes.length}{" "}
          {t("coach.clients.clientDetail.notes.badge", {
            defaultValue: "notes",
          })}
        </Badge>
      </CardHeader>

      <CardContent className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <form
          className="rounded-3xl border bg-background/60 p-4"
          onSubmit={handleCreateNote}
        >
          <div className="mb-4 flex items-center gap-2">
            <FileTextIcon className="size-4 text-primary" />
            <p className="text-sm font-bold">
              {t("coach.clients.clientDetail.notes.newNote", {
                defaultValue: "New private note",
              })}
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="coach-client-note-title">
                {t("coach.clients.clientDetail.notes.noteTitle", {
                  defaultValue: "Title",
                })}
              </Label>
              <Input
                id="coach-client-note-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t(
                  "coach.clients.clientDetail.notes.noteTitlePlaceholder",
                  { defaultValue: `${clientName || "Client"} progress review` },
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coach-client-note-content">
                {t("coach.clients.clientDetail.notes.noteContent", {
                  defaultValue: "Note",
                })}
              </Label>
              <Textarea
                id="coach-client-note-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={t(
                  "coach.clients.clientDetail.notes.noteContentPlaceholder",
                  {
                    defaultValue:
                      "Observation, context, blocker, next action...",
                  },
                )}
                rows={6}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coach-client-note-tags">
                {t("coach.clients.clientDetail.notes.tags", {
                  defaultValue: "Tags",
                })}
              </Label>
              <Input
                id="coach-client-note-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder={t(
                  "coach.clients.clientDetail.notes.tagsPlaceholder",
                  { defaultValue: "nutrition, risk, payment" },
                )}
              />
              {selectedTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {map(selectedTags, (tag) => (
                    <Badge key={tag} variant="secondary" className="rounded-lg">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border bg-muted/20 px-3 py-2 text-sm">
              <Checkbox
                checked={saveAsTemplate}
                onCheckedChange={(checked) =>
                  setSaveAsTemplate(Boolean(checked))
                }
              />
              <span>
                {t("coach.clients.clientDetail.notes.saveAsTemplate", {
                  defaultValue: "Save this note as a reusable template",
                })}
              </span>
            </label>

            <Button
              type="submit"
              className="w-full rounded-2xl"
              disabled={isCreatingNote || isCreatingSnippet}
            >
              <SaveIcon className="mr-2 size-4" />
              {isCreatingNote || isCreatingSnippet
                ? t("coach.clients.clientDetail.notes.saving", {
                    defaultValue: "Saving...",
                  })
                : t("coach.clients.clientDetail.notes.save", {
                    defaultValue: "Save note",
                  })}
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-3xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <LibraryIcon className="size-4 text-primary" />
              <p className="text-sm font-bold">
                {t("coach.clients.clientDetail.notes.templates", {
                  defaultValue: "Templates",
                })}
              </p>
            </div>
            {snippets.length === 0 ? null : (
              <div className="grid gap-2 md:grid-cols-2">
                {map(slice(snippets, 0, 6), (snippet) => (
                  <button
                    key={snippet.id}
                    type="button"
                    className={cn(
                      "group rounded-2xl border bg-background/70 p-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5",
                      snippet.isDefault && "border-dashed",
                    )}
                    onClick={() => handleUseTemplate(snippet)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-bold">
                        {snippet.title}
                      </p>
                      {snippet.isDefault ? (
                        <SparklesIcon className="size-3.5 text-primary" />
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {getSnippetContent(snippet)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border bg-background/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-bold">
                {t("coach.clients.clientDetail.notes.history", {
                  defaultValue: "Note history",
                })}
              </p>
              <Badge variant="secondary" className="rounded-xl">
                {notes.length}
              </Badge>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {map([0, 1, 2], (item) => (
                  <Skeleton key={item} className="h-24 rounded-2xl" />
                ))}
              </div>
            ) : notes.length === 0 ? null : (
              <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
                {map(notes, (note) => (
                  <article
                    key={note.id}
                    className="group rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-bold">
                          {note.title ||
                            t("coach.clients.clientDetail.notes.untitled", {
                              defaultValue: "Untitled note",
                            })}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDateTime(note.createdAt, i18n.language)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-xl text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                        disabled={isDeletingNote}
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                      {note.content}
                    </p>
                    {isArray(note.tags) && size(note.tags) > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {map(note.tags, (tag) => (
                          <Badge
                            key={`${note.id}-${tag}`}
                            variant="outline"
                            className="rounded-lg"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
