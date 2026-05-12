import React from "react";
import { PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import OnboardingSelectCard from "../components/onboarding-select-card.jsx";

const OtherSelectionCard = ({
  open,
  tone,
  title,
  description,
  onClick,
}) => (
  <OnboardingSelectCard
    active={open}
    className="border-dashed"
    description={description}
    icon={PlusIcon}
    onClick={onClick}
    title={title}
    tone={tone}
    variant="row"
  />
);

const OtherSelectionSelectedItems = ({ items, title }) => {
  if (!items?.length) return null;

  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onRemove}
            className={cn(
              "inline-flex max-w-full items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              item.className ??
                "border-primary/20 bg-primary/10 text-primary hover:bg-primary/15",
            )}
          >
            <span className="truncate">{item.label}</span>
            <XIcon className="size-3.5 shrink-0" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
};

const OtherSelectionDrawer = ({
  open,
  onOpenChange,
  title,
  description,
  searchId,
  searchLabel,
  search,
  onSearchChange,
  placeholder,
  doneLabel,
  children,
}) => (
  <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>{title}</DrawerTitle>
        <DrawerDescription>{description}</DrawerDescription>
      </DrawerHeader>
      <DrawerBody className="flex flex-col gap-3 pb-3">
        <label htmlFor={searchId} className="sr-only">
          {searchLabel}
        </label>
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={searchId}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            name={searchId}
            autoComplete="off"
            autoFocus
            placeholder={placeholder}
            className="h-12 pl-9"
          />
        </div>
        <div className="grid gap-2">{children}</div>
      </DrawerBody>
      <DrawerFooter>
        <Button type="button" onClick={() => onOpenChange(false)}>
          {doneLabel}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
);

export {
  OtherSelectionCard,
  OtherSelectionDrawer,
  OtherSelectionSelectedItems,
};
