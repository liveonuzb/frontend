import React from "react";
import { useTranslation } from "react-i18next";
import filter from "lodash/filter";
import find from "lodash/find";
import get from "lodash/get";
import fromPairs from "lodash/fromPairs";
import trim from "lodash/trim";
import lodashValues from "lodash/values";
import map from "lodash/map";
import { Globe2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DataGridColumnHeader } from "@/components/reui/data-grid";
import { adminListSkeletons } from "@/modules/admin/components/admin-list-skeletons.jsx";
import ActionsMenu from "./actions-menu.jsx";
import { APPROVAL_STATUS_OPTIONS } from "./workout-plan-utils.js";

function resolveText(translations, fallback, language) {
  if (translations && typeof translations === "object") {
    const direct = trim(String(get(translations, language, "")));
    if (direct) return direct;

    const uzText = trim(String(get(translations, "uz", "")));
    if (uzText) return uzText;

    const firstValue = find(lodashValues(translations), (value) =>
      trim(String(value ?? "")),
    );
    if (firstValue) {
      return trim(String(firstValue));
    }
  }

  return trim(String(fallback ?? ""));
}

function countFilledTranslations(translations = {}) {
  return filter(lodashValues(translations), (value) =>
    trim(String(value ?? "")),
  ).length;
}

function formatDate(value, language = "uz") {
  if (!value) return "—";

  return new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
  }).format(new Date(value));
}

const ITEMS_PER_PAGE = 10;
const APPROVAL_STATUS_LABELS = fromPairs(map(APPROVAL_STATUS_OPTIONS, (option) => [option.value, option.label]));

function getApprovalBadgeClass(status) {
  switch (status) {
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending_review":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-muted bg-muted/40 text-muted-foreground";
  }
}

export const useColumns = ({
  currentLanguage,
  currentPage,
  languageCount,
  isSaving,
  canAssignTemplates,
  onToggleStatus,
  openAssignDrawer,
  openEditDrawer,
  openTranslationsDrawer,
  setDeleteCandidate,
}) => {
  const { t, i18n } = useTranslation();

  return React.useMemo(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: (info) => (currentPage - 1) * ITEMS_PER_PAGE + info.row.index + 1,
        meta: { skeleton: adminListSkeletons.index },
        size: 56,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("admin.workoutPlans.columns.template")}
          />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.avatarText },
        cell: (info) => {
          const template = info.row.original;
          const localizedName = resolveText(
            template.translations,
            template.name,
            currentLanguage,
          );
          const localizedDescription = resolveText(
            template.descriptionTranslations,
            template.description,
            currentLanguage,
          );

          return (
            <div className="min-w-0">
              <div className="font-medium">{localizedName}</div>
              <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {localizedDescription ||
                  t("admin.workoutPlans.columns.noDescription")}
              </div>
            </div>
          );
        },
        size: 320,
      },
      {
        accessorKey: "difficulty",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("admin.workoutPlans.columns.difficulty")}
          />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.badge },
        cell: (info) => (
          <Badge variant="outline">{info.getValue() || "—"}</Badge>
        ),
        size: 120,
      },
      {
        accessorKey: "daysPerWeek",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("admin.workoutPlans.columns.plan")}
          />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.badge },
        cell: (info) => {
          const template = info.row.original;
          return (
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">
                {t("admin.workoutPlans.columns.daysPerWeek", {
                  count: template.daysPerWeek,
                })}
              </Badge>
              <Badge variant="outline">
                {t("admin.workoutPlans.columns.days", {
                  count: template.days,
                })}
              </Badge>
              <Badge variant="outline">
                {t("admin.workoutPlans.columns.exercises", {
                  count: template.totalExercises,
                })}
              </Badge>
            </div>
          );
        },
        size: 220,
      },
      {
        accessorKey: "approvalStatus",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("admin.workoutPlans.form.approval")}
          />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.badge },
        cell: (info) => {
          const status = info.getValue() || "draft";

          return (
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant="outline"
                className={getApprovalBadgeClass(status)}
              >
                {APPROVAL_STATUS_LABELS[status] || status}
              </Badge>
              <Badge variant="outline">v{info.row.original.version || 1}</Badge>
            </div>
          );
        },
        size: 180,
      },
      {
        accessorKey: "translations",
        header: t("admin.workoutPlans.columns.translations"),
        meta: { skeleton: adminListSkeletons.translations },
        cell: (info) => {
          const template = info.row.original;
          const titleCount = countFilledTranslations(
            template.translations || {},
          );
          const descriptionCount = countFilledTranslations(
            template.descriptionTranslations || {},
          );

          return (
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <Globe2Icon className="size-3.5 text-primary" />
                <span>
                  {t("admin.workoutPlans.columns.translationNames", {
                    count: titleCount,
                    total: languageCount,
                  })}
                </span>
              </div>
              <div className="text-muted-foreground">
                {t("admin.workoutPlans.columns.translationDescriptions", {
                  count: descriptionCount,
                  total: languageCount,
                })}
              </div>
            </div>
          );
        },
        size: 140,
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t("admin.common.status")} />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.status },
        cell: (info) => {
          const template = info.row.original;

          return (
            <div className="flex justify-center">
              <Switch
                checked={Boolean(info.getValue())}
                disabled={isSaving}
                onCheckedChange={() => onToggleStatus(template)}
              />
            </div>
          );
        },
        size: 110,
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("admin.common.updatedAt")}
          />
        ),
        enableSorting: true,
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) => formatDate(info.getValue(), i18n.resolvedLanguage),
        size: 140,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        enableSorting: false,
        meta: { skeleton: adminListSkeletons.action },
        cell: (info) => (
          <div className="flex justify-end">
            <ActionsMenu
              template={info.row.original}
              onEdit={openEditDrawer}
              onDelete={setDeleteCandidate}
              onTranslations={openTranslationsDrawer}
              onAssign={openAssignDrawer}
              canAssign={canAssignTemplates}
            />
          </div>
        ),
      },
    ],
    [
      currentLanguage,
      currentPage,
      i18n.resolvedLanguage,
      isSaving,
      languageCount,
      canAssignTemplates,
      onToggleStatus,
      openAssignDrawer,
      openEditDrawer,
      openTranslationsDrawer,
      setDeleteCandidate,
      t,
    ],
  );
};
