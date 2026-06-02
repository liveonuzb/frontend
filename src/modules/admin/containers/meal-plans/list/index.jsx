/* eslint-disable react-hooks/set-state-in-effect */
import React from "react";
import get from "lodash/get";
import isArray from "lodash/isArray";
import trim from "lodash/trim";
import map from "lodash/map";
import {
  CopyIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  PowerOffIcon,
  RefreshCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import MealPlanBuilder from "@/components/meal-plan-builder/index.jsx";
import MultipleDrawerPicker from "@/components/multiple-drawer-picker";
import { AdminConfirmDialog } from "@/modules/admin/components/admin-confirm-dialog.jsx";
import {
  DIETARY_TAG_OPTIONS,
  tagLabel,
} from "@/modules/admin/lib/nutrition-tags.js";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
} from "@/hooks/api";
import {
  mealPlanDaysToKanban,
  normalizeMealPlanDays,
} from "@/hooks/app/use-meal-plan";
import { useBreadcrumbStore, useLanguageStore } from "@/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OptionDrawerPicker from "@/components/option-drawer-picker";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const QUERY_KEY = ["admin", "meal-plans"];

const GOAL_OPTIONS = [
  { value: "maintenance", label: "Balans" },
  { value: "weight-loss", label: "Vazn kamaytirish" },
  { value: "muscle", label: "Mushak oshirish" },
  { value: "wellness", label: "Sog'lom odat" },
];

const getPayload = (response) =>
  get(response, "data.data", get(response, "data", response));

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  return isArray(message) ? message.join(", ") : message || fallback;
};

const resolveLabel = (translations, fallback, language) =>
  trim(get(translations, language, "")) ||
  trim(get(translations, "uz", "")) ||
  fallback;

const getDayNumber = (dayKey) => {
  const match = String(dayKey).match(/^day-(\d+)$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

const getDayLabel = (dayKey) => {
  const dayNumber = getDayNumber(dayKey);
  return Number.isFinite(dayNumber) && dayNumber !== Number.MAX_SAFE_INTEGER
    ? `${dayNumber}-kun`
    : dayKey;
};

const getTemplateDayEntries = (template) => {
  if (isArray(template?.days)) {
    return map(template.days, (day, index) => [
      `day-${day?.dayNumber || index + 1}`,
      isArray(day?.meals) ? day.meals : [],
    ]);
  }

  const weeklyKanban = template?.weeklyKanban;
  if (!weeklyKanban || typeof weeklyKanban !== "object") return [];
  return Object.entries(weeklyKanban).sort(
    ([leftKey], [rightKey]) => getDayNumber(leftKey) - getDayNumber(rightKey),
  );
};

const getColumns = (columns) => (isArray(columns) ? columns : []);

const getColumnItems = (column) =>
  isArray(column?.items) ? column.items : [];

const getDayMealCount = (columns) =>
  getColumns(columns).reduce(
    (total, column) => total + getColumnItems(column).length,
    0,
  );

const MealPlanPreviewDrawer = ({ template, open, onOpenChange, language }) => {
  const days = getTemplateDayEntries(template);
  const title = resolveLabel(
    template?.translations,
    template?.name ?? "",
    language,
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader className="px-6 text-left">
          <DrawerTitle>30 kunlik preview</DrawerTitle>
          <DrawerDescription>
            {title || "Meal plan shabloni"} · {template?.totalMeals ?? 0} taom
          </DrawerDescription>
        </DrawerHeader>
        <div className="max-h-[70vh] overflow-y-auto px-6 pb-6">
          {days.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {map(days, ([dayKey, columns]) => (
                <section key={dayKey} className="rounded-xl border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{getDayLabel(dayKey)}</h3>
                    <Badge variant="outline">
                      {getDayMealCount(columns)} taom
                    </Badge>
                  </div>
                  <div className="grid gap-3">
                    {map(getColumns(columns), (column) => (
                      <div
                        key={column.id ?? column.type}
                        className="rounded-lg bg-muted/40 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            {column.type || "Ovqat"}
                          </p>
                          {column.time ? (
                            <span className="text-xs text-muted-foreground">
                              {column.time}
                            </span>
                          ) : null}
                        </div>
                        <ul className="mt-2 grid gap-2">
                          {map(getColumnItems(column), (item) => (
                            <li
                              key={item.id ?? item.name}
                              className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2 text-sm"
                            >
                              <span className="min-w-0 truncate">
                                {item.name || item.title || "Taom"}
                              </span>
                              {item.cal ? (
                                <span className="shrink-0 text-xs text-muted-foreground">
                                  {item.cal} kcal
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border p-6 text-sm text-muted-foreground">
              Preview uchun kanban ma'lumoti topilmadi.
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const MealPlanFormDrawer = ({ mode, template, open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const createMutation = usePostQuery({ queryKey: QUERY_KEY });
  const updateMutation = usePatchQuery({ queryKey: QUERY_KEY });
  const isEdit = mode === "edit" && Boolean(template?.id);
  const [step, setStep] = React.useState("meta");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [goal, setGoal] = React.useState("maintenance");
  const [dietaryTags, setDietaryTags] = React.useState([]);
  const [isActive, setIsActive] = React.useState(true);
  const [planDays, setPlanDays] = React.useState([]);

  React.useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setName(
        resolveLabel(
          template?.translations,
          template?.name ?? "",
          currentLanguage,
        ),
      );
      setDescription(
        resolveLabel(
          template?.descriptionTranslations,
          template?.description ?? "",
          currentLanguage,
        ),
      );
      setGoal(template?.goal || "maintenance");
      setDietaryTags(
        isArray(template?.dietaryTags) ? template.dietaryTags : [],
      );
      setIsActive(template?.isActive !== false);
      setPlanDays(isArray(template?.days) ? template.days : []);
    } else {
      setName(`Meal plan ${new Date().toLocaleDateString("uz-UZ")}`);
      setDescription("");
      setGoal("maintenance");
      setDietaryTags([]);
      setIsActive(true);
      setPlanDays([]);
    }
    setStep("meta");
  }, [currentLanguage, isEdit, open, template]);

  const saveTemplate = React.useCallback(
    async (nextPlanDays = planDays) => {
      const normalizedName = trim(name);
      if (!normalizedName) {
        toast.error("Reja nomini kiriting");
        return;
      }

      const payload = {
        name: normalizedName,
        description: trim(description),
        goal,
        durationDays: 30,
        mealsPerDay: null,
        dietaryTags,
        days: nextPlanDays || [],
        source: "admin",
        isActive,
        translations: {
          ...(template?.translations ?? {}),
          [currentLanguage]: normalizedName,
        },
        descriptionTranslations: {
          ...(template?.descriptionTranslations ?? {}),
          [currentLanguage]: trim(description),
        },
      };

      try {
        if (isEdit) {
          await updateMutation.mutateAsync({
            url: `/admin/meal-plans/${template.id}`,
            attributes: payload,
          });
          toast.success("Meal plan shabloni yangilandi");
        } else {
          await createMutation.mutateAsync({
            url: "/admin/meal-plans",
            attributes: payload,
          });
          toast.success("Meal plan shabloni yaratildi");
        }
        await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        onOpenChange(false);
      } catch (error) {
        toast.error(getErrorMessage(error, "Saqlab bo'lmadi"));
      }
    },
    [
      createMutation,
      currentLanguage,
      description,
      dietaryTags,
      goal,
      isActive,
      isEdit,
      name,
      onOpenChange,
      queryClient,
      template,
      updateMutation,
      planDays,
    ],
  );

  if (step === "builder") {
    return (
      <MealPlanBuilder
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setStep("meta");
        }}
        initialData={mealPlanDaysToKanban(planDays)}
        dayCount={30}
        onSave={(nextWeeklyKanban) => {
          const nextPlanDays = normalizeMealPlanDays(nextWeeklyKanban || {});
          setPlanDays(nextPlanDays);
          void saveTemplate(nextPlanDays);
        }}
        onClose={() => setStep("meta")}
      />
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader className="px-6 text-left">
          <DrawerTitle>
            {isEdit ? "Meal plan shabloni" : "Yangi meal plan shabloni"}
          </DrawerTitle>
          <DrawerDescription>
            Admin fallback va AI generation uchun reusable ovqatlanish rejasini
            saqlang.
          </DrawerDescription>
        </DrawerHeader>
        <div className="grid gap-4 px-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="admin-meal-plan-name">Nomi</Label>
            <Input
              id="admin-meal-plan-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Masalan: 7 kunlik balans reja"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="admin-meal-plan-description">Izoh</Label>
            <Textarea
              id="admin-meal-plan-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Maqsad, budjet yoki diet talablari haqida qisqa izoh"
              className="min-h-24"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Maqsad</Label>
              <OptionDrawerPicker
                value={goal}
                onChange={setGoal}
                options={GOAL_OPTIONS}
                title="Maqsad"
                placeholder="Maqsad tanlang"
              />
            </div>
            <div className="grid gap-2">
              <Label>Dietary taglar</Label>
              <MultipleDrawerPicker
                value={dietaryTags}
                onChange={setDietaryTags}
                options={DIETARY_TAG_OPTIONS}
                title="Dietary taglar"
                placeholder="Tag tanlang"
                doneLabel="Tayyor"
              />
            </div>
          </div>
          <label className="flex items-center justify-between rounded-2xl border px-4 py-3">
            <span>
              <span className="block text-sm font-medium">Faol</span>
              <span className="text-xs text-muted-foreground">
                Faol shablonlar AI fallback uchun ishlatilishi mumkin.
              </span>
            </span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </label>
        </div>
        <DrawerFooter className="px-6">
          <Button onClick={() => setStep("builder")}>Builderni ochish</Button>
          <Button
            variant="secondary"
            onClick={() => void saveTemplate()}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            Faqat metani saqlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const ListPage = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const queryClient = useQueryClient();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const { canManageContent } = useAdminPermissions();
  const [query, setQuery] = React.useState("");
  const [drawerState, setDrawerState] = React.useState({
    open: false,
    mode: "create",
    template: null,
  });
  const [archiveTarget, setArchiveTarget] = React.useState(null);
  const [previewTemplate, setPreviewTemplate] = React.useState(null);
  const { data, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/meal-plans",
    params: {
      pageSize: 100,
      ...(trim(query) ? { q: trim(query) } : {}),
    },
    queryProps: { queryKey: [...QUERY_KEY, query] },
  });
  const cloneMutation = usePostQuery({ queryKey: QUERY_KEY });
  const statusMutation = usePatchQuery({ queryKey: QUERY_KEY });
  const deleteMutation = useDeleteQuery({ queryKey: QUERY_KEY });
  const templates = getPayload(data);
  const items = isArray(templates) ? templates : [];

  React.useEffect(() => {
    setBreadcrumbs([{ url: "/admin/meal-plans/list", title: "Meal plans" }]);
  }, [setBreadcrumbs]);

  const openCreate = () =>
    setDrawerState({ open: true, mode: "create", template: null });
  const openEdit = (template) =>
    setDrawerState({ open: true, mode: "edit", template });
  const closeDrawer = (open) =>
    setDrawerState((current) => ({ ...current, open }));
  const closePreview = (open) => {
    if (!open) setPreviewTemplate(null);
  };

  const cloneTemplate = async (template) => {
    try {
      await cloneMutation.mutateAsync({
        url: `/admin/meal-plans/${template.id}/clone`,
        attributes: { isActive: false },
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Meal plan shabloni nusxalandi");
    } catch (error) {
      toast.error(getErrorMessage(error, "Nusxalab bo'lmadi"));
    }
  };

  const toggleTemplateStatus = async (template) => {
    const isActive = template.isActive !== true;
    try {
      await statusMutation.mutateAsync({
        url: `/admin/meal-plans/${template.id}`,
        attributes: { isActive },
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(
        isActive
          ? "Meal plan shabloni faollashtirildi"
          : "Meal plan shabloni nofaol qilindi",
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Statusni yangilab bo'lmadi"));
    }
  };

  const archiveTemplate = async () => {
    if (!archiveTarget) return;
    try {
      await deleteMutation.mutateAsync({
        url: `/admin/meal-plans/${archiveTarget.id}`,
      });
      toast.success("Meal plan shabloni arxivlandi");
      setArchiveTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Arxivlab bo'lmadi"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meal plan shablonlari</h1>
          <p className="text-sm text-muted-foreground">
            AI fallback va admin reusable ovqatlanish rejalarini boshqaring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCcwIcon
              className={isFetching ? "size-4 animate-spin" : "size-4"}
            />
          </Button>
          {canManageContent ? (
            <Button onClick={openCreate} className="gap-1.5">
              <PlusIcon className="size-4" />
              Yangi shablon
            </Button>
          ) : null}
        </div>
      </div>
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Meal plan qidirish"
        className="max-w-sm"
      />
      {isLoading ? (
        <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
          Yuklanmoqda...
        </div>
      ) : items.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {map(items, (template) => (
            <article
              key={template.id}
              className="rounded-2xl border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">
                    {resolveLabel(
                      template.translations,
                      template.name,
                      currentLanguage,
                    )}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {resolveLabel(
                      template.descriptionTranslations,
                      template.description,
                      currentLanguage,
                    ) || "Izoh yo'q"}
                  </p>
                </div>
                {canManageContent ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Shablon amallari"
                      >
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => void cloneTemplate(template)}
                      >
                        <CopyIcon className="size-4" />
                        Nusxalash
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => void toggleTemplateStatus(template)}
                      >
                        {template.isActive ? (
                          <PowerOffIcon className="size-4" />
                        ) : (
                          <PowerIcon className="size-4" />
                        )}
                        {template.isActive ? "Nofaol qilish" : "Faollashtirish"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(template)}>
                        <PencilIcon className="size-4" />
                        Tahrirlash
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setArchiveTarget(template)}
                      >
                        <Trash2Icon className="size-4" />
                        Arxivlash
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant={template.isActive ? "default" : "secondary"}>
                  {template.isActive ? "Faol" : "Arxiv"}
                </Badge>
                {template.source === "ai_variant" ? (
                  <Badge variant="secondary">AI variant</Badge>
                ) : null}
                {template.goal ? (
                  <Badge variant="outline">{template.goal}</Badge>
                ) : null}
                <Badge variant="outline">
                  {template.totalMeals ?? 0} meals
                </Badge>
                {map(template.dietaryTags ?? [], (tag) => (
                  <Badge key={tag} variant="outline">
                    {tagLabel(tag)}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <EyeIcon className="size-4" />
                  Ko'rish
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
          Meal plan shabloni topilmadi.
        </div>
      )}
      <MealPlanFormDrawer
        mode={drawerState.mode}
        template={drawerState.template}
        open={drawerState.open}
        onOpenChange={closeDrawer}
      />
      <MealPlanPreviewDrawer
        template={previewTemplate}
        open={Boolean(previewTemplate)}
        onOpenChange={closePreview}
        language={currentLanguage}
      />
      <AdminConfirmDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title="Meal plan shablonini arxivlash?"
        description="Shablon o'chmaydi, lekin inactive bo'ladi va fallback uchun ishlatilmaydi."
        confirmText="Arxivlash"
        variant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => void archiveTemplate()}
      />
    </div>
  );
};

export default ListPage;
