import React from "react";
import { useNavigate, useParams } from "react-router";
import { find, get, isArray, join, map, trim } from "lodash";
import { toast } from "sonner";
import { PaletteIcon, PencilIcon, TagIcon } from "lucide-react";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { useLanguageStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import {
  CATEGORY_BADGE_PRESETS,
  DEFAULT_CATEGORY_BADGE_CLASS,
  createCustomCategoryBadgeColor,
  getCategoryBadgeAppearance,
  getCustomCategoryBadgeHex,
  isCustomCategoryBadgeColor,
} from "@/lib/category-badge";

const resolveLabel = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = get(translations, language);
    if (typeof direct === "string" && trim(direct)) return trim(direct);
    const uz = get(translations, "uz");
    if (typeof uz === "string" && trim(uz)) return trim(uz);
    const first = find(
      Object.values(translations),
      (v) => typeof v === "string" && trim(v),
    );
    if (typeof first === "string" && trim(first)) return trim(first);
  }
  return fallback;
};

const getStoredColorValue = (form) =>
  form.colorMode === "custom"
    ? createCustomCategoryBadgeColor(form.customColor)
    : form.presetColor || DEFAULT_CATEGORY_BADGE_CLASS;

const createFormFromCategory = (category, language) => {
  const color = get(category, "color") || DEFAULT_CATEGORY_BADGE_CLASS;
  const localizedName = resolveLabel(
    get(category, "translations"),
    get(category, "name", ""),
    language,
  );

  if (isCustomCategoryBadgeColor(color)) {
    return {
      name: localizedName,
      colorMode: "custom",
      presetColor: DEFAULT_CATEGORY_BADGE_CLASS,
      customColor: getCustomCategoryBadgeHex(color),
    };
  }

  return {
    name: localizedName,
    colorMode: "preset",
    presetColor: color,
    customColor: "#64748b",
  };
};

const emptyForm = {
  name: "",
  colorMode: "preset",
  presetColor: DEFAULT_CATEGORY_BADGE_CLASS,
  customColor: "#64748b",
};

const EditFoodCategory = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const { data: categoriesData, isLoading } = useGetQuery({
    url: "/admin/food-categories",
    queryProps: { queryKey: ["admin", "food-categories"] },
  });
  const categories = get(categoriesData, "data.data", []);
  const category = find(categories, (c) => String(get(c, "id")) === String(id));

  const [form, setForm] = React.useState(emptyForm);

  React.useEffect(() => {
    if (category) {
      setForm(createFormFromCategory(category, currentLanguage));
    }
  }, [category, currentLanguage]);

  const patchMutation = usePatchQuery({
    queryKey: ["admin", "food-categories"],
  });
  const isUpdating = patchMutation.isPending;

  const previewAppearance = React.useMemo(
    () => getCategoryBadgeAppearance(getStoredColorValue(form)),
    [form],
  );

  const handleSave = React.useCallback(async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Kategoriya nomini kiriting");
      return;
    }

    try {
      await patchMutation.mutateAsync({
        url: `/admin/food-categories/${id}`,
        attributes: {
          name,
          color: getStoredColorValue(form),
        },
      });
      toast.success("Kategoriya yangilandi");
      navigate("/admin/food-categories/list");
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Kategoriyani saqlab bo'lmadi",
      );
    }
  }, [form, id, navigate, patchMutation]);

  const handleOpenChange = (open) => {
    if (!open) navigate("/admin/food-categories/list");
  };

  if (isLoading) return null;

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-h-[90vh] data-[vaul-drawer-direction=bottom]:md:max-w-lg">
        <div className="mx-auto flex w-full min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <PencilIcon className="size-5" />
              Kategoriyani tahrirlash
            </DrawerTitle>
            <DrawerDescription>
              Joriy locale uchun nom va badge style shu drawer orqali
              boshqariladi.
            </DrawerDescription>
          </DrawerHeader>

          <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <TagIcon className="text-primary" />
                Kategoriya nomi
              </Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Masalan: Oqsillar"
              />
            </div>

            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium">Badge style</Label>
              <div className="rounded-2xl border border-border/60 bg-muted/15 p-4">
                <div className="flex flex-wrap gap-3">
                  {map(CATEGORY_BADGE_PRESETS, (option) => {
                    const isSelected =
                      form.colorMode === "preset" &&
                      form.presetColor === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        title={option.label}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            colorMode: "preset",
                            presetColor: option.value,
                          }))
                        }
                        className={cn(
                          "relative flex size-8 items-center justify-center rounded-full border-2 transition-all",
                          isSelected
                            ? "scale-105 border-foreground shadow-sm"
                            : "border-transparent hover:scale-105 hover:border-border",
                        )}
                      >
                        <span
                          className="block size-7 rounded-full border border-black/10"
                          style={{ backgroundColor: option.swatch }}
                        />
                        {isSelected ? (
                          <span className="absolute inset-0 rounded-full ring-2 ring-background" />
                        ) : null}
                      </button>
                    );
                  })}

                  <label
                    title="Custom rang"
                    className={cn(
                      "relative flex size-8 cursor-pointer items-center justify-center rounded-full border-2 transition-all",
                      form.colorMode === "custom"
                        ? "scale-105 border-foreground shadow-sm"
                        : "border-dashed border-border/80 hover:scale-105 hover:border-foreground/40",
                    )}
                  >
                    <span
                      className="relative flex size-7 items-center justify-center rounded-full border border-black/10"
                      style={{ backgroundColor: form.customColor }}
                    >
                      <span className="absolute inset-0 rounded-full bg-black/10" />
                      <PaletteIcon className="relative z-10 size-3.5 text-white drop-shadow-sm" />
                    </span>
                    <input
                      type="color"
                      value={form.customColor}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          colorMode: "custom",
                          customColor: event.target.value,
                        }))
                      }
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-label="Custom rang tanlash"
                    />
                    {form.colorMode === "custom" ? (
                      <span className="absolute inset-0 rounded-full ring-2 ring-background" />
                    ) : null}
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-4">
                <p className="mb-2 text-xs text-muted-foreground">Preview</p>
                <Badge
                  variant="outline"
                  className={cn(
                    "h-7 rounded-full px-3",
                    previewAppearance.className,
                  )}
                  style={previewAppearance.style}
                >
                  {trim(get(form, "name")) || "Kategoriya badge"}
                </Badge>
              </div>
            </div>
          </div>

          <DrawerFooter className="gap-2 border-t bg-muted/5 px-6 py-4">
            <Button onClick={handleSave} disabled={isUpdating}>
              Saqlash
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Bekor qilish</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EditFoodCategory;
