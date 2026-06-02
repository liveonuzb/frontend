import React from "react";
import { Outlet, useNavigate } from "react-router";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import get from "lodash/get";
import isArray from "lodash/isArray";
import map from "lodash/map";
import trim from "lodash/trim";
import filter from "lodash/filter";
import find from "lodash/find";
import toNumber from "lodash/toNumber";
import dayjs from "dayjs";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  DownloadIcon,
  PlusIcon,
  RotateCcwIcon,
  UploadIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
  DataGridTableDndRowHandle,
  DataGridTableDndRows,
} from "@/components/reui/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { Filters } from "@/components/reui/filters.jsx";
import { useDeleteQuery, useGetQuery, usePatchQuery } from "@/hooks/api";
import useApi from "@/hooks/api/use-api.js";
import { cn } from "@/lib/utils";
import { adminListSkeletons } from "@/modules/admin/components/admin-list-skeletons.jsx";
import { useAdminDrawerListNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import {
  ALLERGEN_TAG_OPTIONS,
  DIETARY_TAG_OPTIONS,
  tagLabel,
} from "@/modules/admin/lib/nutrition-tags.js";
import { useBreadcrumbStore, useLanguageStore } from "@/store";

import {
  budgetTierClassName,
  budgetTierLabel,
  formatMoney,
  getErrorMessage,
  getPayload,
  ITEMS_PER_PAGE,
  QUERY_KEY,
  resolveLabel,
  SELECT_OPERATORS,
  SORT_DIRECTIONS,
  SORT_FIELDS,
  TEXT_OPERATORS,
} from "../components/utils.jsx";
import ActionsMenu from "./actions-menu.jsx";

const downloadBlob = ({ blob, fileName }) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName || "ingredients.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const ListPage = () => {
  const navigate = useNavigate();
  const navigateAdminDrawer = useAdminDrawerListNavigation();
  const { canReadContent, canManageContent } = useAdminPermissions();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const queryClient = useQueryClient();
  const { request } = useApi();
  const importFileInputRef = React.useRef(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [name, setName] = useQueryState("name", parseAsString.withDefault(""));
  const [nameOp, setNameOp] = useQueryState(
    "nameOp",
    parseAsStringEnum(TEXT_OPERATORS).withDefault("contains"),
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringEnum(["all", "active", "inactive"]).withDefault("all"),
  );
  const [statusOp, setStatusOp] = useQueryState(
    "statusOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [isAllergic, setIsAllergic] = useQueryState(
    "isAllergic",
    parseAsStringEnum(["all", "yes", "no"]).withDefault("all"),
  );
  const [isAllergicOp, setIsAllergicOp] = useQueryState(
    "isAllergicOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [dietaryTag, setDietaryTag] = useQueryState(
    "dietaryTag",
    parseAsStringEnum([
      "all",
      ...map(DIETARY_TAG_OPTIONS, (item) => item.value),
    ]).withDefault("all"),
  );
  const [dietaryTagOp, setDietaryTagOp] = useQueryState(
    "dietaryTagOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [allergenTag, setAllergenTag] = useQueryState(
    "allergenTag",
    parseAsStringEnum([
      "all",
      ...map(ALLERGEN_TAG_OPTIONS, (item) => item.value),
    ]).withDefault("all"),
  );
  const [allergenTagOp, setAllergenTagOp] = useQueryState(
    "allergenTagOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [onboarding, setOnboarding] = useQueryState(
    "onboarding",
    parseAsStringEnum(["all", "yes", "no"]).withDefault("all"),
  );
  const [onboardingOp, setOnboardingOp] = useQueryState(
    "onboardingOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [hasImage, setHasImage] = useQueryState(
    "hasImage",
    parseAsStringEnum(["all", "yes", "no"]).withDefault("all"),
  );
  const [hasImageOp, setHasImageOp] = useQueryState(
    "hasImageOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [translations, setTranslations] = useQueryState(
    "translations",
    parseAsStringEnum(["all", "complete", "missing"]).withDefault("all"),
  );
  const [translationsOp, setTranslationsOp] = useQueryState(
    "translationsOp",
    parseAsStringEnum(SELECT_OPERATORS).withDefault("is"),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const [pageSizeQuery, setPageSizeQuery] = useQueryState(
    "pageSize",
    parseAsString.withDefault(String(ITEMS_PER_PAGE)),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(SORT_FIELDS).withDefault("orderKey"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(SORT_DIRECTIONS).withDefault("asc"),
  );
  const currentPage = Math.max(1, toNumber(pageQuery) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, toNumber(pageSizeQuery) || ITEMS_PER_PAGE),
  );
  const sorting = React.useMemo(
    () =>
      sortBy === "orderKey" && sortDir === "asc"
        ? []
        : [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );
  const canReorder =
    trim(name) === "" &&
    nameOp === "contains" &&
    status === "all" &&
    statusOp === "is" &&
    isAllergic === "all" &&
    isAllergicOp === "is" &&
    dietaryTag === "all" &&
    dietaryTagOp === "is" &&
    allergenTag === "all" &&
    allergenTagOp === "is" &&
    onboarding === "all" &&
    onboardingOp === "is" &&
    hasImage === "all" &&
    hasImageOp === "is" &&
    translations === "all" &&
    translationsOp === "is" &&
    sortBy === "orderKey" &&
    sortDir === "asc" &&
    currentPage === 1;

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin/ingredients/list", title: "Ingredientlar" },
    ]);
  }, [setBreadcrumbs]);

  const deferredName = React.useDeferredValue(name);
  const params = React.useMemo(
    () => ({
      ...(trim(deferredName) ? { name: trim(deferredName) } : {}),
      ...(trim(deferredName) || nameOp !== "contains" ? { nameOp } : {}),
      ...(status !== "all" ? { status } : {}),
      ...(status !== "all" || statusOp !== "is" ? { statusOp } : {}),
      ...(isAllergic !== "all" ? { isAllergic } : {}),
      ...(isAllergic !== "all" || isAllergicOp !== "is"
        ? { isAllergicOp }
        : {}),
      ...(dietaryTag !== "all" ? { dietaryTag } : {}),
      ...(dietaryTag !== "all" || dietaryTagOp !== "is"
        ? { dietaryTagOp }
        : {}),
      ...(allergenTag !== "all" ? { allergenTag } : {}),
      ...(allergenTag !== "all" || allergenTagOp !== "is"
        ? { allergenTagOp }
        : {}),
      ...(onboarding !== "all" ? { onboarding } : {}),
      ...(onboarding !== "all" || onboardingOp !== "is"
        ? { onboardingOp }
        : {}),
      ...(hasImage !== "all" ? { hasImage } : {}),
      ...(hasImage !== "all" || hasImageOp !== "is" ? { hasImageOp } : {}),
      ...(translations !== "all" ? { translations } : {}),
      ...(translations !== "all" || translationsOp !== "is"
        ? { translationsOp }
        : {}),
      page: currentPage,
      pageSize,
      sortBy,
      sortDir,
    }),
    [
      currentPage,
      deferredName,
      allergenTag,
      allergenTagOp,
      dietaryTag,
      dietaryTagOp,
      hasImage,
      hasImageOp,
      isAllergic,
      isAllergicOp,
      onboarding,
      onboardingOp,
      nameOp,
      pageSize,
      sortBy,
      sortDir,
      status,
      statusOp,
      translations,
      translationsOp,
    ],
  );
  const { data, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/ingredients",
    params,
    queryProps: { queryKey: [...QUERY_KEY, params] },
  });
  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const items = get(data, "data.data", []);
  const meta = get(data, "data.meta", { total: 0, totalPages: 1 });
  const activeLanguages = React.useMemo(() => {
    const languages = getPayload(languagesData);
    return isArray(languages)
      ? filter(languages, (language) => get(language, "isActive") !== false)
      : [];
  }, [languagesData]);
  const patchMutation = usePatchQuery({ queryKey: QUERY_KEY });
  const deleteMutation = useDeleteQuery({ queryKey: QUERY_KEY });
  const exportIngredients = React.useCallback(async () => {
    const response = await request.get("/admin/ingredients/export", {
      params,
      responseType: "blob",
    });

    return {
      blob: get(response, "data"),
      fileName:
        response.headers?.["content-disposition"]?.match(
          /filename="?([^"]+)"?/,
        )?.[1] || "ingredients.xlsx",
    };
  }, [params, request]);
  const importIngredients = React.useCallback(
    async (file) => {
      const buildFormData = () => {
        const formData = new FormData();
        formData.append("file", file);
        return formData;
      };
      const previewResponse = await request.post(
        "/admin/ingredients/import/preview",
        buildFormData(),
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const preview = get(
        previewResponse,
        "data.data",
        get(previewResponse, "data"),
      );

      if (get(preview, "invalidCount", 0) > 0) {
        return { preview, job: null };
      }

      const jobResponse = await request.post(
        "/admin/ingredients/import/jobs",
        buildFormData(),
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      return {
        preview,
        job: get(jobResponse, "data.data", get(jobResponse, "data")),
      };
    },
    [request],
  );
  const handleExportIngredients = React.useCallback(async () => {
    if (!canReadContent) return;

    try {
      setIsExporting(true);
      downloadBlob(await exportIngredients());
      toast.success("Ingredientlar Excel formatda yuklandi");
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Ingredientlarni Excelga export qilib bo'lmadi"),
      );
    } finally {
      setIsExporting(false);
    }
  }, [canReadContent, exportIngredients]);
  const handleImportIngredients = React.useCallback(
    async (event) => {
      if (!canManageContent) return;

      const file = event.target.files?.[0];
      if (!file) return;

      try {
        setIsImporting(true);
        const result = await importIngredients(file);
        const invalidCount = get(result, "preview.invalidCount", 0);

        if (invalidCount > 0) {
          const firstError = get(result, "preview.errors.0.error");
          const firstQualityTitle = get(
            result,
            "preview.quality.groups.0.title",
          );
          toast.error(
            `${invalidCount} ta qatorda xato bor. ${
              firstQualityTitle ? `${firstQualityTitle}: ` : ""
            }${firstError || "Import boshlanmadi."}`
          );
          return;
        }

        const warningCount = get(result, "preview.quality.warnCount", 0);
        if (warningCount > 0) {
          toast.warning(
            `${warningCount} ta Content Quality ogohlantirishi bor. /admin/content-quality sahifasida ko'rinadi.`
          );
        }

        await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        toast.success("Ingredient import job sifatida boshlandi");
      } catch (error) {
        toast.error(
          getErrorMessage(error, "Ingredientlarni Excel import qilib bo'lmadi"),
        );
      } finally {
        setIsImporting(false);
        event.target.value = "";
      }
    },
    [canManageContent, importIngredients, queryClient],
  );
  const columns = React.useMemo(
    () => [
      {
        id: "dnd",
        header: "",
        cell: () => (canReorder ? <DataGridTableDndRowHandle /> : null),
        meta: { skeleton: adminListSkeletons.action },
        size: 36,
      },
      {
        accessorKey: "imageUrl",
        header: "Rasm",
        meta: { skeleton: adminListSkeletons.image },
        size: 72,
        cell: (info) =>
          info.getValue() ? (
            <img
              src={info.getValue()}
              alt=""
              className="size-10 rounded-xl object-cover"
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-xl border bg-muted text-xs">
              No
            </div>
          ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Nomi" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.avatarText },
        cell: (info) => (
          <div className="font-medium">
            {resolveLabel(
              info.row.original.translations,
              info.row.original.name,
              currentLanguage,
            )}
          </div>
        ),
      },
      {
        id: "translations",
        header: "Tarjimalar",
        enableSorting: false,
        meta: { skeleton: adminListSkeletons.translations },
        size: 120,
        cell: (info) => (
          <div className="flex items-center gap-1">
            {map(activeLanguages, (language) => {
              const code = get(language, "code");
              const hasTranslation = Boolean(
                trim(get(info.row.original, `translations.${code}`, "")),
              );
              return (
                <div
                  key={get(language, "id", code)}
                  title={`${get(language, "name", code)}: ${
                    hasTranslation ? "Bor" : "Yo'q"
                  }`}
                  className={cn(
                    "flex size-5 items-center justify-center rounded border text-[10px]",
                    hasTranslation
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-transparent bg-muted opacity-40",
                  )}
                >
                  {get(language, "flag") || code}
                </div>
              );
            })}
          </div>
        ),
      },
      {
        accessorKey: "calories",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Kaloriya" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.text },
        size: 100,
      },
      {
        id: "macros",
        header: "Makrolar",
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) => (
          <span className="text-xs text-muted-foreground">
            P {info.row.original.protein} / C {info.row.original.carbs} / F{" "}
            {info.row.original.fat}
          </span>
        ),
      },
      {
        accessorKey: "servingUnit",
        header: "Birlik",
        meta: { skeleton: adminListSkeletons.text },
        size: 80,
      },
      {
        accessorKey: "isAllergic",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Allergen" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.status },
        size: 100,
        cell: (info) =>
          info.getValue() ? (
            <Badge
              variant="outline"
              className="border-rose-200 bg-rose-50 text-rose-700"
            >
              Ha
            </Badge>
          ) : (
            <span className="text-muted-foreground">Yo'q</span>
          ),
      },
      {
        id: "nutritionTags",
        header: "Taglar",
        meta: { skeleton: adminListSkeletons.badge },
        size: 180,
        cell: (info) => {
          const tags = [
            ...(info.row.original.dietaryTags ?? []),
            ...(info.row.original.allergenTags ?? []),
          ];

          return tags.length ? (
            <div className="flex flex-wrap gap-1">
              {map(tags, (tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="h-5 px-1.5 text-[10px]"
                >
                  {tagLabel(tag)}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: "pricePer100g",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Narx / 100g" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.text },
        size: 130,
        cell: (info) => (
          <span className="whitespace-nowrap text-sm">
            {formatMoney(info.getValue(), info.row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "budgetTier",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Budget" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.badge },
        size: 110,
        cell: (info) =>
          info.getValue() ? (
            <Badge
              variant="outline"
              className={budgetTierClassName(info.getValue())}
            >
              {budgetTierLabel(info.getValue())}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: "priceUpdatedAt",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Narx sanasi" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.text },
        size: 150,
        cell: (info) =>
          info.getValue() ? (
            <span className="whitespace-nowrap text-sm">
              {dayjs(info.getValue()).format("DD.MM.YYYY HH:mm")}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: "isOnboarding",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Onboarding" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.status },
        size: 120,
        cell: (info) => (
          <Switch
            checked={Boolean(info.getValue())}
            onCheckedChange={(checked) =>
              patchMutation.mutate({
                url: `/admin/ingredients/${info.row.original.id}`,
                attributes: { isOnboarding: checked },
              })
            }
          />
        ),
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Status" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.status },
        size: 90,
        cell: (info) => (
          <Switch
            checked={Boolean(info.getValue())}
            onCheckedChange={(checked) =>
              patchMutation.mutate({
                url: `/admin/ingredients/${info.row.original.id}`,
                attributes: { isActive: checked },
              })
            }
          />
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Yaratilgan" />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.text },
        size: 150,
        cell: (info) =>
          info.getValue() ? (
            <span className="whitespace-nowrap text-sm">
              {dayjs(info.getValue()).format("DD.MM.YYYY HH:mm")}
            </span>
          ) : (
            "-"
          ),
      },
      {
        id: "actions",
        header: "",
        meta: { skeleton: adminListSkeletons.action },
        size: 52,
        cell: (info) => (
          <div className="flex justify-end">
            <ActionsMenu
              row={info.row.original}
              onEdit={(row) => navigateAdminDrawer(`edit/${row.id}`)}
              onTranslate={(row) => navigate(`translate/${row.id}`)}
              onPrice={(row) => navigate(`price/${row.id}`)}
              onDelete={async (row) => {
                try {
                  await deleteMutation.mutateAsync({
                    url: `/admin/ingredients/${row.id}`,
                  });
                  toast.success("Ingredient o'chirildi");
                } catch (error) {
                  toast.error(
                    getErrorMessage(error, "Ingredientni o'chirib bo'lmadi"),
                  );
                }
              }}
            />
          </div>
        ),
      },
    ],
    [
      activeLanguages,
      canReorder,
      currentLanguage,
      deleteMutation,
      navigate,
      navigateAdminDrawer,
      patchMutation,
    ],
  );
  const filterFields = React.useMemo(
    () => [
      {
        label: "Nomi",
        key: "name",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Ingredient qidirish",
      },
      {
        label: "Status",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "active", label: "Faol" },
          { value: "inactive", label: "Nofaol" },
        ],
      },
      {
        label: "Allergen",
        key: "isAllergic",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "yes", label: "Allergen" },
          { value: "no", label: "Allergen emas" },
        ],
      },
      {
        label: "Dietary tag",
        key: "dietaryTag",
        type: "select",
        defaultOperator: "is",
        options: [{ value: "all", label: "Barchasi" }, ...DIETARY_TAG_OPTIONS],
      },
      {
        label: "Allergen tag",
        key: "allergenTag",
        type: "select",
        defaultOperator: "is",
        options: [{ value: "all", label: "Barchasi" }, ...ALLERGEN_TAG_OPTIONS],
      },
      {
        label: "Onboarding",
        key: "onboarding",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "yes", label: "Onboarding uchun" },
          { value: "no", label: "Qo'shimcha" },
        ],
      },
      {
        label: "Rasm",
        key: "hasImage",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "yes", label: "Rasmli" },
          { value: "no", label: "Rasmsiz" },
        ],
      },
      {
        label: "Tarjimalar",
        key: "translations",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "complete", label: "To'liq" },
          { value: "missing", label: "Kam" },
        ],
      },
    ],
    [],
  );
  const activeFilters = React.useMemo(() => {
    const list = [];
    if (trim(name) || nameOp !== "contains") {
      list.push({
        id: "name",
        field: "name",
        operator: nameOp,
        values: trim(name) ? [name] : [],
      });
    }
    if (status !== "all" || statusOp !== "is") {
      list.push({
        id: "status",
        field: "status",
        operator: statusOp,
        values: status !== "all" ? [status] : [],
      });
    }
    if (isAllergic !== "all" || isAllergicOp !== "is") {
      list.push({
        id: "isAllergic",
        field: "isAllergic",
        operator: isAllergicOp,
        values: isAllergic !== "all" ? [isAllergic] : [],
      });
    }
    if (dietaryTag !== "all" || dietaryTagOp !== "is") {
      list.push({
        id: "dietaryTag",
        field: "dietaryTag",
        operator: dietaryTagOp,
        values: dietaryTag !== "all" ? [dietaryTag] : [],
      });
    }
    if (allergenTag !== "all" || allergenTagOp !== "is") {
      list.push({
        id: "allergenTag",
        field: "allergenTag",
        operator: allergenTagOp,
        values: allergenTag !== "all" ? [allergenTag] : [],
      });
    }
    if (onboarding !== "all" || onboardingOp !== "is") {
      list.push({
        id: "onboarding",
        field: "onboarding",
        operator: onboardingOp,
        values: onboarding !== "all" ? [onboarding] : [],
      });
    }
    if (hasImage !== "all" || hasImageOp !== "is") {
      list.push({
        id: "hasImage",
        field: "hasImage",
        operator: hasImageOp,
        values: hasImage !== "all" ? [hasImage] : [],
      });
    }
    if (translations !== "all" || translationsOp !== "is") {
      list.push({
        id: "translations",
        field: "translations",
        operator: translationsOp,
        values: translations !== "all" ? [translations] : [],
      });
    }
    return list;
  }, [
    hasImage,
    hasImageOp,
    allergenTag,
    allergenTagOp,
    dietaryTag,
    dietaryTagOp,
    isAllergic,
    isAllergicOp,
    name,
    nameOp,
    onboarding,
    onboardingOp,
    status,
    statusOp,
    translations,
    translationsOp,
  ]);
  const handleFiltersChange = React.useCallback(
    (next) => {
      const byField = (field) => find(next, (item) => item.field === field);
      React.startTransition(() => {
        void setName(byField("name")?.values?.[0] ?? "");
        void setNameOp(byField("name")?.operator ?? "contains");
        void setStatus(byField("status")?.values?.[0] ?? "all");
        void setStatusOp(byField("status")?.operator ?? "is");
        void setIsAllergic(byField("isAllergic")?.values?.[0] ?? "all");
        void setIsAllergicOp(byField("isAllergic")?.operator ?? "is");
        void setDietaryTag(byField("dietaryTag")?.values?.[0] ?? "all");
        void setDietaryTagOp(byField("dietaryTag")?.operator ?? "is");
        void setAllergenTag(byField("allergenTag")?.values?.[0] ?? "all");
        void setAllergenTagOp(byField("allergenTag")?.operator ?? "is");
        void setOnboarding(byField("onboarding")?.values?.[0] ?? "all");
        void setOnboardingOp(byField("onboarding")?.operator ?? "is");
        void setHasImage(byField("hasImage")?.values?.[0] ?? "all");
        void setHasImageOp(byField("hasImage")?.operator ?? "is");
        void setTranslations(byField("translations")?.values?.[0] ?? "all");
        void setTranslationsOp(byField("translations")?.operator ?? "is");
        void setPageQuery("1");
      });
    },
    [
      setHasImage,
      setHasImageOp,
      setAllergenTag,
      setAllergenTagOp,
      setDietaryTag,
      setDietaryTagOp,
      setIsAllergic,
      setIsAllergicOp,
      setName,
      setNameOp,
      setOnboarding,
      setOnboardingOp,
      setPageQuery,
      setStatus,
      setStatusOp,
      setTranslations,
      setTranslationsOp,
    ],
  );
  const table = useReactTable({
    data: items,
    columns,
    manualPagination: true,
    manualSorting: true,
    pageCount: get(meta, "totalPages", 1),
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const nextSort = next?.[0];
      React.startTransition(() => {
        void setPageQuery("1");
        if (!nextSort) {
          void setSortBy("orderKey");
          void setSortDir("asc");
          return;
        }
        void setSortBy(nextSort.id);
        void setSortDir(nextSort.desc ? "desc" : "asc");
      });
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: currentPage - 1, pageSize })
          : updater;
      const nextPageSize = toNumber(next.pageSize) || pageSize;
      React.startTransition(() => {
        void setPageQuery(
          String(nextPageSize === pageSize ? toNumber(next.pageIndex) + 1 : 1),
        );
        void setPageSizeQuery(String(nextPageSize));
      });
    },
    state: { sorting, pagination: { pageIndex: currentPage - 1, pageSize } },
  });
  const handleDragEnd = async ({ active, over }) => {
    if (!canReorder || !active || !over || active.id === over.id) return;
    const ids = map(items, (item) => String(item.id));
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    const ordered = [...items];
    const [moved] = ordered.splice(oldIndex, 1);
    ordered.splice(newIndex, 0, moved);
    await patchMutation.mutateAsync({
      url: "/admin/ingredients/reorder",
      attributes: {
        movedId: String(moved.id),
        prevId: ordered[newIndex - 1]
          ? String(ordered[newIndex - 1].id)
          : undefined,
        nextId: ordered[newIndex + 1]
          ? String(ordered[newIndex + 1].id)
          : undefined,
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ingredientlar</h1>
          <p className="text-sm text-muted-foreground">
            100g asosidagi nutrition katalog
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManageContent ? (
            <>
              <input
                ref={importFileInputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                aria-label="Ingredientlarni import qilish faylini tanlash"
                className="hidden"
                onChange={(event) => void handleImportIngredients(event)}
              />
              <Button
                variant="outline"
                onClick={() => importFileInputRef.current?.click()}
                disabled={isImporting}
                className="gap-1.5"
              >
                <UploadIcon className="size-4" />
                <span className="hidden sm:inline">
                  {isImporting ? "Import..." : "Excel import"}
                </span>
              </Button>
            </>
          ) : null}
          {canReadContent ? (
            <Button
              variant="outline"
              onClick={() => void handleExportIngredients()}
              disabled={isExporting}
              className="gap-1.5"
            >
              <DownloadIcon className="size-4" />
              <span className="hidden sm:inline">
                {isExporting ? "Export..." : "Excel export"}
              </span>
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RotateCcwIcon
              className={cn("size-4", isFetching && "animate-spin")}
            />
          </Button>
          <Button onClick={() => navigateAdminDrawer("create")}>
            <PlusIcon data-icon="inline-start" />
            Yangi ingredient
          </Button>
        </div>
      </div>
      <Filters
        fields={filterFields}
        filters={activeFilters}
        onChange={handleFiltersChange}
      />
      <DataGrid
        table={table}
        isLoading={isLoading}
        recordCount={get(meta, "total", 0)}
      >
        <div className="flex flex-col gap-2.5">
          <DataGridContainer>
            <ScrollArea className="w-full">
              {canReorder ? (
                <DataGridTableDndRows
                  table={table}
                  dataIds={map(items, (item) => String(item.id))}
                  handleDragEnd={handleDragEnd}
                />
              ) : (
                <DataGridTable />
              )}
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          <DataGridPagination
            info="{from} - {to} / {count} ta ingredient"
            rowsPerPageLabel="Sahifada:"
            sizes={[10, 25, 50, 100]}
          />
        </div>
      </DataGrid>
      <Outlet />
    </div>
  );
};

export default ListPage;
