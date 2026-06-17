import React from "react";
import { CheckIcon, ClockIcon, RotateCcwIcon, SlidersHorizontalIcon } from "lucide-react";
import map from "lodash/map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { cn } from "@/lib/utils.js";

const tagOptions = [
  "Yuqori protein",
  "Kam kaloriyali",
  "Oson",
  "Kam uglevodli",
  "Vegetarian",
  "Glutensiz",
];

const categoryOptions = ["Nonushta", "Tushlik", "Kechki ovqat", "Tamaddi"];
const difficultyOptions = ["Oson", "O'rtacha", "Qiyin"];

const maxTimeOptions = [
  { value: "", label: "Hammasi" },
  { value: "20", label: "20 daqiqagacha" },
  { value: "30", label: "30 daqiqagacha" },
  { value: "45", label: "45 daqiqagacha" },
];

const OptionButton = ({ active, children, onClick }) => (
  <button
    type="button"
    className={cn(
      "flex min-h-11 items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition-colors",
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-background text-foreground hover:bg-muted/50",
    )}
    onClick={onClick}
  >
    <span className="min-w-0 truncate">{children}</span>
    {active ? <CheckIcon className="size-4 shrink-0" /> : null}
  </button>
);

const OptionSection = ({ title, children }) => (
  <section className="flex flex-col gap-2">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    {children}
  </section>
);

const RecipeFilterDrawer = ({
  open,
  filters,
  resultsCount = 0,
  onOpenChange,
  onApply,
  onClear,
}) => {
  const [draft, setDraft] = React.useState(filters);

  React.useEffect(() => {
    if (open) {
      let isCurrent = true;

      queueMicrotask(() => {
        if (isCurrent) {
          setDraft(filters);
        }
      });

      return () => {
        isCurrent = false;
      };
    }

    return undefined;
  }, [filters, open]);

  const updateDraft = (patch) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const clearDraft = () => {
    const emptyFilters = {
      tag: "",
      category: "",
      difficulty: "",
      maxTime: "",
    };
    setDraft(emptyFilters);
    onClear?.();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-lg">
        <DrawerHeader className="border-b border-border/40">
          <DrawerTitle className="flex items-center justify-center gap-2">
            <SlidersHorizontalIcon className="size-4" />
            Filterlar
          </DrawerTitle>
          <DrawerDescription>
            Retseptlarni vaqt, kategoriya va parhez bo'yicha toraytiring.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="flex flex-col gap-5 px-4 pb-4">
          <OptionSection title="Parhez va maqsad">
            <div className="grid grid-cols-2 gap-2">
              {map(tagOptions, (tag) => (
                <OptionButton
                  key={tag}
                  active={draft.tag === tag}
                  onClick={() => updateDraft({ tag: draft.tag === tag ? "" : tag })}
                >
                  {tag}
                </OptionButton>
              ))}
            </div>
          </OptionSection>

          <OptionSection title="Kategoriya">
            <div className="grid grid-cols-2 gap-2">
              {map(categoryOptions, (category) => (
                <OptionButton
                  key={category}
                  active={draft.category === category}
                  onClick={() =>
                    updateDraft({
                      category: draft.category === category ? "" : category,
                    })
                  }
                >
                  {category}
                </OptionButton>
              ))}
            </div>
          </OptionSection>

          <OptionSection title="Qiyinchilik">
            <div className="grid grid-cols-3 gap-2">
              {map(difficultyOptions, (difficulty) => (
                <OptionButton
                  key={difficulty}
                  active={draft.difficulty === difficulty}
                  onClick={() =>
                    updateDraft({
                      difficulty:
                        draft.difficulty === difficulty ? "" : difficulty,
                    })
                  }
                >
                  {difficulty}
                </OptionButton>
              ))}
            </div>
          </OptionSection>

          <OptionSection title="Vaqt">
            <div className="grid grid-cols-2 gap-2">
              {map(maxTimeOptions, (option) => (
                <OptionButton
                  key={option.label}
                  active={draft.maxTime === option.value}
                  onClick={() => updateDraft({ maxTime: option.value })}
                >
                  <span className="inline-flex items-center gap-2">
                    <ClockIcon className="size-4" />
                    {option.label}
                  </span>
                </OptionButton>
              ))}
            </div>
          </OptionSection>
        </DrawerBody>

        <DrawerFooter className="border-t border-border/40 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary">{resultsCount} ta retsept</Badge>
            <Button type="button" variant="ghost" size="sm" onClick={clearDraft}>
              <RotateCcwIcon data-icon="inline-start" />
              Tozalash
            </Button>
          </div>
          <Button
            type="button"
            onClick={() => {
              onApply?.(draft);
              onOpenChange(false);
            }}
          >
            Natijalarni ko'rish
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default RecipeFilterDrawer;
