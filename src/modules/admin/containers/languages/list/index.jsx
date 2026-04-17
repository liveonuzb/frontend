import React, { useState } from "react";
import { useNavigate, Outlet } from "react-router";
import { get, map, isArray, join, toString } from "lodash";
import { useBreadcrumbStore } from "@/store";
import {
  useGetQuery,
  usePatchQuery,
  useDeleteQuery,
} from "@/hooks/api";
import {
  DataGrid,
  DataGridContainer,
  DataGridTableDndRows,
} from "@/components/reui/data-grid";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { GlobeIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { useColumns } from "./columns.jsx";
import { DeleteAlert } from "./delete-alert.jsx";

const Index = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const LANGUAGES_QUERY_KEY = ["admin", "languages"];

  const { data: languagesData, isLoading } = useGetQuery({
    url: "/admin/languages",
    queryProps: {
      queryKey: LANGUAGES_QUERY_KEY,
    },
  });
  const languages = get(languagesData, "data.data", []);

  const { mutateAsync: patchLanguage, isPending: isUpdating } = usePatchQuery({
    queryKey: LANGUAGES_QUERY_KEY,
  });
  const { mutateAsync: removeLanguage, isPending: isDeleting } = useDeleteQuery({
    queryKey: LANGUAGES_QUERY_KEY,
  });
  const { mutateAsync: patchReorder } = usePatchQuery({
    queryKey: LANGUAGES_QUERY_KEY,
  });

  const updateLanguage = React.useCallback(
    async (id, payload) =>
      patchLanguage({
        url: `/admin/languages/${id}`,
        attributes: payload,
      }),
    [patchLanguage],
  );

  const deleteLanguage = React.useCallback(
    async (id) =>
      removeLanguage({
        url: `/admin/languages/${id}`,
      }),
    [removeLanguage],
  );

  const reorderLanguages = React.useCallback(
    async (payload) =>
      patchReorder({
        url: "/admin/languages/reorder",
        attributes: payload,
      }),
    [patchReorder],
  );

  const [languageToDelete, setLanguageToDelete] = useState(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/languages", title: "Tillar" },
    ]);
  }, [setBreadcrumbs]);

  const handleToggleActive = async (language) => {
    try {
      await updateLanguage(get(language, "id"), {
        isActive: !get(language, "isActive"),
      });
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Statusni yangilab bo'lmadi",
      );
    }
  };

  const handleDeleteLanguage = async () => {
    if (!languageToDelete) return;

    try {
      await deleteLanguage(get(languageToDelete, "id"));
      toast.success("Til o'chirildi");
      setLanguageToDelete(null);
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Tilni o'chirib bo'lmadi",
      );
    }
  };

  const columns = useColumns({
    isUpdating,
    onToggleActive: handleToggleActive,
    onEdit: (language) => navigate(`edit/${get(language, "id")}`),
    onDelete: setLanguageToDelete,
  });

  const table = useReactTable({
    data: languages,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => toString(get(row, "id")),
  });

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!active || !over || active.id === over.id) {
      return;
    }

    const currentIds = map(languages, (language) =>
      toString(get(language, "id")),
    );
    const oldIndex = currentIds.indexOf(active.id);
    const newIndex = currentIds.indexOf(over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const nextIds = [...currentIds];
    const [movedId] = nextIds.splice(oldIndex, 1);
    nextIds.splice(newIndex, 0, movedId);

    const movedIndex = nextIds.indexOf(movedId);
    const prevId = movedIndex > 0 ? nextIds[movedIndex - 1] : undefined;
    const nextId =
      movedIndex < nextIds.length - 1 ? nextIds[movedIndex + 1] : undefined;

    try {
      await reorderLanguages({
        movedId,
        prevId,
        nextId,
      });
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Tartibni saqlab bo'lmadi",
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GlobeIcon className="text-primary" />
            Tillar
          </h1>
          <p className="text-muted-foreground">
            Ilovadagi tillarni qo'shing, tahrirlang va tartibini o'zgartiring
          </p>
        </div>
        <Button onClick={() => navigate("create")} className="gap-1.5">
          <PlusIcon />
          Til qo'shish
        </Button>
      </div>

      <DataGridContainer>
        <ScrollArea className="w-full">
          <DataGrid table={table}>
            <DataGridTableDndRows
              dataIds={map(languages, (language) =>
                toString(get(language, "id")),
              )}
              handleDragEnd={handleDragEnd}
            />
          </DataGrid>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        {isLoading ? (
          <div className="px-4 pb-4 text-sm text-muted-foreground">
            Yuklanmoqda...
          </div>
        ) : null}
      </DataGridContainer>

      <DeleteAlert
        language={languageToDelete}
        open={!!languageToDelete}
        onOpenChange={(open) => !open && setLanguageToDelete(null)}
        onConfirm={handleDeleteLanguage}
        isDeleting={isDeleting}
      />

      <Outlet />
    </div>
  );
};

export default Index;
