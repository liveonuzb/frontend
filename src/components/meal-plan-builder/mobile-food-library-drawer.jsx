import React, { useState, useMemo } from "react";
import { filter, map, includes } from "lodash";
import { SearchIcon, FlameIcon } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { Input } from "@/components/ui/input.jsx";
import { cn } from "@/lib/utils.js";

const MobileFoodLibraryDrawer = ({
  open,
  onClose,
  onSelect,
  categories,
  foods,
  isLoading = false,
  isError = false,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");

  const filteredFoods = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return filter(foods, (food) => {
      const matchesCategory =
        selectedCategoryId === "all"
          ? true
          : includes(food.categoryIds, Number(selectedCategoryId));

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        includes(food.name.toLowerCase(), normalizedSearch) ||
        includes(food.originalName?.toLowerCase(), normalizedSearch)
      );
    });
  }, [foods, search, selectedCategoryId]);

  const categoryCounts = useMemo(() => {
    const counts = new Map();
    counts.set("all", foods.length);

    foods.forEach((food) => {
      (food.categoryIds || []).forEach((categoryId) => {
        const key = String(categoryId);
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });

    return counts;
  }, [foods]);

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      onClose();
      setSearch("");
      setSelectedCategoryId("all");
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="max-h-[85vh]! flex flex-col">
        <DrawerHeader className="pb-2 shrink-0">
          <DrawerTitle className="font-black text-base">
            Ovqat qo'shish
          </DrawerTitle>
          <div className="relative mt-2">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Ovqat qidirish..."
              className="pl-9 h-10 bg-muted/40 border-border/40 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </DrawerHeader>

        {/* Category pills */}
        <div
          className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none shrink-0"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {map(categories, (category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategoryId(category.id)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap border transition-all",
                selectedCategoryId === category.id
                  ? "bg-foreground text-background border-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground border-border/40 hover:bg-muted",
              )}
            >
              {category.label}
              <span className="ml-2 text-[10px] opacity-70">
                {categoryCounts.get(category.id) || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Food list */}
        <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-2 min-h-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/70">
              <p className="text-sm font-bold">Katalog yuklanmoqda</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground/70">
              <p className="text-sm font-bold">Katalogni yuklab bo'lmadi</p>
              <p className="mt-1 text-xs">Keyinroq qayta urinib ko'ring</p>
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
              <p className="text-sm font-bold">Ovqat topilmadi</p>
            </div>
          ) : (
            map(filteredFoods, (food) => (
              <button
                key={food.barcode}
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-muted/20 hover:bg-muted/60 hover:border-primary/30 transition-all text-left active:scale-[0.98]"
                onClick={() => onSelect(food)}
              >
                <div className="size-12 rounded-xl bg-muted/60 flex items-center justify-center text-xl shrink-0 overflow-hidden border border-border/30">
                  {food.image ? (
                    <img
                      src={food.image}
                      alt={food.name}
                      loading="lazy"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{food.emoji}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate text-foreground/90">
                    {food.name}
                  </p>
                  {food.brand && (
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                      {food.brand}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/10 shrink-0">
                  <FlameIcon className="size-3 text-orange-500" />
                  {food.cal}
                </div>
              </button>
            ))
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileFoodLibraryDrawer;
