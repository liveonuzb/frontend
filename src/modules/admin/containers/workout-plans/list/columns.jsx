import React from "react";
import { filter, find, get } from "lodash";
import { Globe2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataGridColumnHeader } from "@/components/reui/data-grid";
import ActionsMenu from "./actions-menu.jsx";

function resolveText(translations, fallback, language) {
  if (translations && typeof translations === "object") {
    const direct = String(get(translations, language, "")).trim();
    if (direct) return direct;

    const uzText = String(get(translations, "uz", "")).trim();
    if (uzText) return uzText;

    const firstValue = find(Object.values(translations), (value) =>
      String(value ?? "").trim(),
    );
    if (firstValue) {
      return String(firstValue).trim();
    }
  }

  return String(fallback ?? "").trim();
}

function countFilledTranslations(translations = {}) {
  return filter(Object.values(translations), (value) =>
    String(value ?? "").trim(),
  ).length;
}

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
  }).format(new Date(value));
}

const ITEMS_PER_PAGE = 10;

export const useColumns = ({
  currentLanguage,
  currentPage,
  languageCount,
  openEditDrawer,
  openTranslationsDrawer,
  setDeleteCandidate,
}) => {
  return React.useMemo(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: (info) => (currentPage - 1) * ITEMS_PER_PAGE + info.row.index + 1,
        size: 56,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Workout shablon" />
        ),
        enableSorting: true,
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
                {localizedDescription || "Ta'rif kiritilmagan"}
              </div>
            </div>
          );
        },
        size: 320,
      },
      {
        accessorKey: "difficulty",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Qiyinchilik" />
        ),
        enableSorting: true,
        cell: (info) => (
          <Badge variant="outline">{info.getValue() || "—"}</Badge>
        ),
        size: 120,
      },
      {
        accessorKey: "daysPerWeek",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Reja" />
        ),
        enableSorting: true,
        cell: (info) => {
          const template = info.row.original;
          return (
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">{template.daysPerWeek} kun/hafta</Badge>
              <Badge variant="outline">{template.days} kun</Badge>
              <Badge variant="outline">{template.totalExercises} mashq</Badge>
            </div>
          );
        },
        size: 220,
      },
      {
        accessorKey: "translations",
        header: "Tarjimalar",
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
                  Nom: {titleCount}/{languageCount}
                </span>
              </div>
              <div className="text-muted-foreground">
                Tavsif: {descriptionCount}/{languageCount}
              </div>
            </div>
          );
        },
        size: 140,
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Status" />
        ),
        enableSorting: true,
        cell: (info) => (
          <Badge variant={info.getValue() ? "default" : "outline"}>
            {info.getValue() ? "Faol" : "Nofaol"}
          </Badge>
        ),
        size: 110,
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Yangilangan" />
        ),
        enableSorting: true,
        cell: (info) => formatDate(info.getValue()),
        size: 140,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        enableSorting: false,
        cell: (info) => (
          <div className="flex justify-end">
            <ActionsMenu
              template={info.row.original}
              onEdit={openEditDrawer}
              onDelete={setDeleteCandidate}
              onTranslations={openTranslationsDrawer}
            />
          </div>
        ),
      },
    ],
    [
      currentLanguage,
      currentPage,
      languageCount,
      openEditDrawer,
      openTranslationsDrawer,
      setDeleteCandidate,
    ],
  );
};
