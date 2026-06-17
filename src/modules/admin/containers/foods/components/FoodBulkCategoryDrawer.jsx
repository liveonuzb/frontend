import React from "react";
import get from "lodash/get";
import lodashMap from "lodash/map";
import lodashFilter from "lodash/filter";
import includes from "lodash/includes";
import trim from "lodash/trim";
import {
  Drawer,
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
  assignableItems,
  bulkCategoryIds,
  setBulkCategoryIds,
  selectedIds,
  setSelectedIds,
  currentLanguage,
  isAssigningCategories,
  isSaving,
  onAssign,
  title = "Bulk kategoriya biriktirish",
  description,
  emptyLabel = "Faol kategoriyalar topilmadi.",
  saveLabel = "Kategoriyalarni biriktirish",
}) => {
  const items = assignableItems ?? assignableCategories ?? [];
  const checkedIds = selectedIds ?? bulkCategoryIds ?? [];
  const setCheckedIds = setSelectedIds ?? setBulkCategoryIds;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>
            {description ??
              `Tanlangan ${selectedFoodCount} ta ovqatga qo'shimcha kategoriyalar biriktiriladi.`}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 py-4 space-y-3 overflow-y-auto max-h-[50vh] no-scrollbar">
          {items.length ? (
            lodashMap(items, (item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {resolveLabel(
                      item.translations,
                      item.name,
                      currentLanguage,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ID: {item.id}
                  </p>
                </div>
                <Checkbox
                  checked={includes(checkedIds, item.id)}
                  onCheckedChange={(checked) =>
                    setCheckedIds((cur) =>
                      checked
                        ? [...cur, item.id]
                        : lodashFilter(cur, (id) => id !== item.id),
                    )
                  }
                />
              </label>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {emptyLabel}
            </p>
          )}
        </div>

        <DrawerFooter className="border-t bg-muted/5 gap-2 px-6 py-4">
          <Button
            onClick={onAssign}
            disabled={!checkedIds.length || (isSaving ?? isAssigningCategories)}
          >
            {saveLabel}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default FoodBulkCategoryDrawer;
