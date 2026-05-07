import React from "react";
import { get, map, size, trim } from "lodash";
import { PlusIcon, TagIcon, XIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PREDEFINED_TAGS } from "@/hooks/app/use-client-tags";

const resolveTag = (tagId, tagsCatalog = PREDEFINED_TAGS) =>
  tagsCatalog.find((t) => t.id === tagId || t.slug === tagId) || {
    id: tagId,
    slug: tagId,
    label: tagId,
    color: "bg-slate-500/10 text-slate-700 border-slate-500/20",
  };

export const ClientTagBadge = ({
  tagId,
  onRemove,
  className,
  tagsCatalog = PREDEFINED_TAGS,
}) => {
  const tag = resolveTag(tagId, tagsCatalog);

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold",
        tag.color,
        className,
      )}
    >
      {tag.label}
      {onRemove ? (
        <button
          type="button"
          className="ml-0.5 rounded-full hover:opacity-70"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tagId);
          }}
        >
          <XIcon className="size-2.5" />
        </button>
      ) : null}
    </Badge>
  );
};

const ClientTagsEditor = ({
  clientId,
  clientTags = [],
  onToggle,
  tagsCatalog = PREDEFINED_TAGS,
  onCreateTag,
  isCreatingTag = false,
}) => {
  const [label, setLabel] = React.useState("");

  const handleCreateTag = async () => {
    const nextLabel = trim(label);
    if (!nextLabel || !onCreateTag) return;
    const response = await onCreateTag({ label: nextLabel });
    const created = get(response, "data.data", get(response, "data", response));
    const tagId = get(created, "id") || get(created, "slug");
    if (tagId) {
      await onToggle(clientId, tagId);
    }
    setLabel("");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-lg"
          title="Teglarni boshqarish"
        >
          <TagIcon className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Teglar
        </p>
        <div className="flex flex-wrap gap-1.5">
          {map(tagsCatalog, (tag) => {
            const tagId = get(tag, "id") || get(tag, "slug");
            const isActive = clientTags.includes(tagId);
            return (
              <button
                key={tagId}
                type="button"
                className={cn(
                  "inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-semibold transition-all",
                  isActive
                    ? [tag.color, "ring-2 ring-offset-1 ring-primary/30"]
                    : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40",
                )}
                onClick={() => {
                  void onToggle(clientId, tagId);
                }}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
        {onCreateTag ? (
          <div className="mt-3 flex gap-2">
            <Input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Yangi teg"
              className="h-8 text-xs"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleCreateTag();
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-8 rounded-lg"
              disabled={!trim(label) || isCreatingTag}
              onClick={() => void handleCreateTag()}
            >
              <PlusIcon className="size-3.5" />
            </Button>
          </div>
        ) : null}
        {size(clientTags) > 0 ? (
          <p className="mt-2 text-[10px] text-muted-foreground">
            {size(clientTags)} ta teg tanlangan
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
};

export default ClientTagsEditor;
