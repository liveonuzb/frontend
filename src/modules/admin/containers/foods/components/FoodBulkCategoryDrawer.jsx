import React from "react";
import {
  get,
  map as lodashMap,
  filter as lodashFilter,
  includes,
  trim,
} from "lodash";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const resolveLabel = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = trim(String(get(translations, language, "")));
    if (direct) return direct;
    const uz = trim(String(get(translations, "uz", "")));
    if (uz) return uz;
  }
  return fallback;
};

const FoodBulkCategoryDrawer = ({
  open,
  onOpenChange,
  selectedFoodCount,
  assignableCategories,
  bulkCategoryIds,
  setBulkCategoryIds,
  currentLanguage,
  isAssigningCategories,
  onAssign,
}) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto">
        <DrawerHeader>
          <DrawerTitle>Bulk kategoriya biriktirish</DrawerTitle>
          <DrawerDescription>
            Tanlangan {selectedFoodCount} ta ovqatga qo&apos;shimcha
            kategoriyalar biriktiriladi.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 py-4 space-y-3 overflow-y-auto max-h-[50vh] no-scrollbar">
          {assignableCategories.length ? (
            lodashMap(assignableCategories, (category) => (
              <label
                key={category.id}
                className="flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {resolveLabel(
                      category.translations,
                      category.name,
                      currentLanguage,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ID: {category.id}
                  </p>
                </div>
                <Checkbox
                  checked={includes(bulkCategoryIds, category.id)}
                  onCheckedChange={(checked) =>
                    setBulkCategoryIds((cur) =>
                      checked
                        ? [...cur, category.id]
                        : lodashFilter(cur, (id) => id !== category.id),
                    )
                  }
                />
              </label>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Faol kategoriyalar topilmadi.
            </p>
          )}
        </div>

        <DrawerFooter className="border-t bg-muted/5 gap-2 px-6 py-4">
          <Button
            onClick={onAssign}
            disabled={!bulkCategoryIds.length || isAssigningCategories}
          >
            Kategoriyalarni biriktirish
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Bekor qilish</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default FoodBulkCategoryDrawer;
