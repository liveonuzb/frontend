import React from "react";
import { get, isArray, join, map, size, trim } from "lodash";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  ShieldCheckIcon,
  ExternalLinkIcon,
  RotateCcwIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { useBreadcrumbStore } from "@/store";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import {
  useColumns,
  coachStatusConfig,
  marketplaceStatusConfig,
  getCoachFirstName,
  getCoachLastName,
  getCoachAvatar,
  getCoachBio,
  getCoachSpecializations,
} from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useCoachFilters } from "./use-filters.js";

const ITEMS_PER_PAGE = 10;

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    currentPage,
    pageSize,
    filterFields,
    activeFilters,
    handleFiltersChange,
    search,
    coachStatusFilter,
  } = useCoachFilters();

  const [viewCoach, setViewCoach] = React.useState(null);

  const queryParams = React.useMemo(
    () => ({
      role: "COACH",
      coachStatus: coachStatusFilter === "all" ? undefined : coachStatusFilter,
      q: trim(search) || undefined,
      page: currentPage,
      pageSize: ITEMS_PER_PAGE,
      sortBy: "createdAt",
      sortDir: "desc",
    }),
    [coachStatusFilter, search, currentPage],
  );

  const {
    data: usersData,
    isLoading,
    isFetching,
    refetch,
  } = useGetQuery({
    url: "/admin/users",
    params: queryParams,
    queryProps: {
      queryKey: ["admin", "users", queryParams],
    },
  });
  const coaches = get(usersData, "data.data", []);

  const { mutateAsync: patchCoachStatus } = usePatchQuery({
    queryKey: ["admin", "users"],
    listKey: ["admin", "dashboard"],
  });
  const { mutateAsync: patchMarketplaceStatus } = usePatchQuery({
    queryKey: ["admin", "users"],
    listKey: ["admin", "dashboard"],
  });

  const updateCoachStatus = React.useCallback(
    async (userId, status) =>
      patchCoachStatus({
        url: `/admin/coaches/${userId}/status`,
        attributes: { status },
      }),
    [patchCoachStatus],
  );

  const updateCoachMarketplaceStatus = React.useCallback(
    async (userId, status, note) =>
      patchMarketplaceStatus({
        url: `/admin/coaches/${userId}/marketplace-status`,
        attributes: {
          status,
          ...(note ? { note } : {}),
        },
      }),
    [patchMarketplaceStatus],
  );
  const [pendingCoachIds, setPendingCoachIds] = React.useState({});

  const setCoachPendingState = React.useCallback((coachId, isPending) => {
    if (!coachId) return;

    setPendingCoachIds((current) => {
      if (isPending) {
        if (get(current, coachId)) return current;
        return { ...current, [coachId]: true };
      }

      if (!get(current, coachId)) return current;
      const next = { ...current };
      delete next[coachId];
      return next;
    });
  }, []);

  const isCoachActionPending = React.useCallback(
    (coachId) => Boolean(coachId && get(pendingCoachIds, coachId)),
    [pendingCoachIds],
  );

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/coaches", title: "Murabbiylar" },
    ]);
  }, [setBreadcrumbs]);

  const handleStatusUpdate = React.useCallback(
    async (coachId, status) => {
      setCoachPendingState(coachId, true);
      try {
        await updateCoachStatus(coachId, status);
        toast.success(
          status === "approved"
            ? "Murabbiy tasdiqlandi"
            : "Murabbiy rad etildi",
        );
        if (get(viewCoach, "id") === coachId) setViewCoach(null);
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || "Xatolik yuz berdi",
        );
      } finally {
        setCoachPendingState(coachId, false);
      }
    },
    [setCoachPendingState, updateCoachStatus, get(viewCoach, "id")],
  );

  const handleMarketplaceStatusUpdate = React.useCallback(
    async (coachId, status, successText) => {
      setCoachPendingState(coachId, true);
      try {
        await updateCoachMarketplaceStatus(coachId, status);
        toast.success(successText);
        if (get(viewCoach, "id") === coachId && status !== "pending") {
          setViewCoach((current) =>
            current
              ? {
                  ...current,
                  coachMarketplaceStatus: status,
                }
              : current,
          );
        }
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || "Marketplace holatini yangilab bo'lmadi",
        );
      } finally {
        setCoachPendingState(coachId, false);
      }
    },
    [setCoachPendingState, updateCoachMarketplaceStatus, get(viewCoach, "id")],
  );

  const columns = useColumns({
    isCoachActionPending,
    onView: setViewCoach,
    onStatusUpdate: handleStatusUpdate,
    onMarketplaceUpdate: handleMarketplaceStatusUpdate,
  });

  const table = useReactTable({
    data: coaches || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <ShieldCheckIcon className="text-primary" />
            Murabbiylarni boshqarish
          </h1>
          <p className="text-sm text-muted-foreground">
            Platformaga qo'shilish uchun ariza topshirgan mutaxassislarni ko'rib
            chiqing va tasdiqlang.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Filter
            filterFields={filterFields}
            activeFilters={activeFilters}
            handleFiltersChange={handleFiltersChange}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="hidden sm:flex"
            disabled={isFetching}
          >
            <RotateCcwIcon
              className={cn("size-4", isFetching && "animate-spin")}
            />
          </Button>
        </div>

        <DataGridContainer>
          <ScrollArea className="w-full">
            <DataGrid table={table} isLoading={isLoading}>
              <DataGridTable />
            </DataGrid>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DataGridContainer>

        {/* Coach Detail Drawer */}
        <Drawer
          open={Boolean(viewCoach)}
          onOpenChange={(open) => !open && setViewCoach(null)}
        >
          <DrawerContent className="max-w-3xl mx-auto">
            <div className="mx-auto w-full max-h-[85vh] overflow-y-auto">
              <DrawerHeader className="border-b pb-6">
                <div className="flex items-center gap-6">
                  <Avatar className="size-20 border-2 border-primary/20 shadow-xl">
                    <AvatarImage src={getCoachAvatar(viewCoach)} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">
                      {get(getCoachFirstName(viewCoach), "[0]")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DrawerTitle className="text-3xl font-black mb-1">
                      {getCoachFirstName(viewCoach)}{" "}
                      {getCoachLastName(viewCoach)}
                    </DrawerTitle>
                    <DrawerDescription className="text-base flex items-center gap-2">
                      {get(viewCoach, "email")}
                      <Badge
                        variant="secondary"
                        className="bg-primary/5 text-primary border-none"
                      >
                        ID: {get(viewCoach, "id", "").slice(0, 8)}
                      </Badge>
                    </DrawerDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    {get(viewCoach, "coachStatus") === "pending" ? (
                      <>
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                          onClick={() =>
                            handleStatusUpdate(get(viewCoach, "id"), "approved")
                          }
                          disabled={isCoachActionPending(get(viewCoach, "id"))}
                        >
                          Tasdiqlash
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full border-red-200 text-red-600 hover:bg-red-50 font-bold"
                          onClick={() =>
                            handleStatusUpdate(get(viewCoach, "id"), "rejected")
                          }
                          disabled={isCoachActionPending(get(viewCoach, "id"))}
                        >
                          Rad etish
                        </Button>
                      </>
                    ) : (
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          className={cn(
                            "h-10 px-6 text-sm font-bold",
                            get(coachStatusConfig, [
                              get(viewCoach, "coachStatus"),
                              "className",
                            ]),
                          )}
                        >
                          {get(coachStatusConfig, [
                            get(viewCoach, "coachStatus"),
                            "label",
                          ])}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={get(marketplaceStatusConfig, [
                            get(viewCoach, "coachMarketplaceStatus", "none"),
                            "className",
                          ])}
                        >
                          {get(marketplaceStatusConfig, [
                            get(viewCoach, "coachMarketplaceStatus", "none"),
                            "label",
                          ])}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </DrawerHeader>

              <div className="p-8 grid md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                      <ExternalLinkIcon />
                      Mutaxassislik
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {size(getCoachSpecializations(viewCoach)) > 0 ? (
                        map(getCoachSpecializations(viewCoach), (spec, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="bg-muted hover:bg-muted font-medium"
                          >
                            {spec}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm italic">
                          Ko'rsatilmagan
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Tajriba va Bio
                    </h3>
                    <div className="bg-muted/30 rounded-2xl p-5 border border-border/50 italic text-foreground leading-relaxed">
                      &quot;
                      {getCoachBio(viewCoach) ||
                        "Ushbu murabbiy haqida ma'lumot kiritilmagan."}
                      &quot;
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Bog'lanish
                    </h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border">
                        <span className="text-xs font-bold text-muted-foreground">
                          Telefon:
                        </span>
                        <span className="font-semibold text-sm">
                          {get(viewCoach, "phone", "Kiritilmagan")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border">
                        <span className="text-xs font-bold text-muted-foreground">
                          Telegram/Instagram:
                        </span>
                        <span className="font-semibold text-sm">
                          Mavjud emas
                        </span>
                      </div>
                    </div>
                  </div>

                  {get(viewCoach, "coachStatus") === "approved" ? (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                        Marketplace nazorati
                      </h3>
                      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 flex flex-col gap-3">
                        <p className="text-xs text-muted-foreground">
                          Murabbiy coach bo'lib ishlaydi, marketplacega chiqishi
                          alohida admin review bilan boshqariladi.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            disabled={isCoachActionPending(
                              get(viewCoach, "id"),
                            )}
                            onClick={() =>
                              handleMarketplaceStatusUpdate(
                                get(viewCoach, "id"),
                                "approved",
                                "Coach marketplacega chiqarildi",
                              )
                            }
                          >
                            Marketplacega chiqarish
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            disabled={isCoachActionPending(
                              get(viewCoach, "id"),
                            )}
                            onClick={() =>
                              handleMarketplaceStatusUpdate(
                                get(viewCoach, "id"),
                                "rejected",
                                "Marketplace arizasi rad etildi",
                              )
                            }
                          >
                            Marketplace rad etish
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isCoachActionPending(
                              get(viewCoach, "id"),
                            )}
                            onClick={() =>
                              handleMarketplaceStatusUpdate(
                                get(viewCoach, "id"),
                                "none",
                                "Coach marketplacedan olib tashlandi",
                              )
                            }
                          >
                            Marketplacedan olish
                          </Button>
                        </div>
                        {get(viewCoach, "coachMarketplaceReviewNote") ? (
                          <p className="text-xs text-muted-foreground">
                            Oxirgi review izohi:{" "}
                            {get(viewCoach, "coachMarketplaceReviewNote")}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Sertifikatlar
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="aspect-video rounded-xl bg-muted dark:bg-muted/50 border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                        <ShieldCheckIcon className="opacity-20" />
                        Fayl mavjud emas
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </PageTransition>
  );
};

export default Index;
