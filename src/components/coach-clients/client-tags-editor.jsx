import React from "react";
import { map, size } from "lodash";
import { TagIcon, XIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PREDEFINED_TAGS } from "@/hooks/app/use-client-tags";

export const ClientTagBadge = ({ tagId, onRemove, className }) => {
  const tag = PREDEFINED_TAGS.find((t) => t.id === tagId);
  if (!tag) return null;

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

const ClientTagsEditor = ({ clientId, clientTags = [], onToggle }) => {
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
          {map(PREDEFINED_TAGS, (tag) => {
            const isActive = clientTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                className={cn(
                  "inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-semibold transition-all",
                  isActive
                    ? [tag.color, "ring-2 ring-offset-1 ring-primary/30"]
                    : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40",
                )}
                onClick={() => {
                  void onToggle(clientId, tag.id);
                }}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
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
