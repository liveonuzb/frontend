/* eslint-disable react-hooks/set-state-in-effect */
import React from "react";
import { get, isArray, trim, map } from "lodash";
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
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
  const [weeklyKanban, setWeeklyKanban] = React.useState({});

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
      setWeeklyKanban(template?.weeklyKanban || {});
    } else {
      setName(`Meal plan ${new Date().toLocaleDateString("uz-UZ")}`);
      setDescription("");
      setGoal("maintenance");
      setDietaryTags([]);
      setIsActive(true);
      setWeeklyKanban({});
    }
    setStep("meta");
  }, [currentLanguage, isEdit, open, template]);

  const saveTemplate = React.useCallback(
    async (nextWeeklyKanban = weeklyKanban) => {
      const normalizedName = trim(name);
      if (!normalizedName) {
        toast.error("Reja nomini kiriting");
        return;
      }

      const payload = {
        name: normalizedName,
        description: trim(description),
        goal,
        days: 30,
        mealsPerDay: null,
        dietaryTags,
        weeklyKanban: nextWeeklyKanban || {},
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
      weeklyKanban,
    ],
  );

  if (step === "builder") {
    return (
      <MealPlanBuilder
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setStep("meta");
        }}
        initialData={weeklyKanban}
        dayCount={30}
        onSave={(nextWeeklyKanban) => {
          setWeeklyKanban(nextWeeklyKanban || {});
          void saveTemplate(nextWeeklyKanban || {});
        }}
        onClose={() => setStep("meta")}
      />
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-w-xl rounded-t-[2rem]">
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
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const { canManageContent } = useAdminPermissions();
  const [query, setQuery] = React.useState("");
  const [drawerState, setDrawerState] = React.useState({
    open: false,
    mode: "create",
    template: null,
  });
  const [archiveTarget, setArchiveTarget] = React.useState(null);
  const { data, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/meal-plans",
    params: {
      pageSize: 100,
      ...(trim(query) ? { q: trim(query) } : {}),
    },
    queryProps: { queryKey: [...QUERY_KEY, query] },
  });
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
                      <Button variant="ghost" size="icon">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
