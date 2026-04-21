import React from "react";
import { get, isArray } from "lodash";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { useBreadcrumbStore } from "@/store";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { ListHeader } from "@/modules/coach/components/data-grid-helpers";
import {
  useCoachReferralDashboard,
  useCoachReferrals,
  useCoachReferralsMutations,
} from "@/modules/coach/lib/hooks/useCoachReferrals";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useReferralFilters } from "./use-filters.js";

const DEFAULT_META = { total: 0, page: 1, pageSize: 10, totalPages: 1 };

const getErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;
  return isArray(message) ? message.join(", ") : message || fallback;
};

const getClipboard = () => {
  if (typeof window === "undefined") return null;
  return window.navigator?.clipboard ?? null;
};

const formatTiyin = (amount) =>
  `${Intl.NumberFormat("uz-UZ").format(Math.round((amount ?? 0) / 100))} so'm`;

const ReferralsListPage = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();

  const {
    search,
    status,
    event,
    sortBy,
    sortDir,
    currentPage,
    pageSize,
    setPageQuery,
    sorting,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = useReferralFilters();

  const deferredSearch = React.useDeferredValue(search);

  const queryParams = React.useMemo(
    () => ({
      ...(deferredSearch.trim() ? { q: deferredSearch.trim() } : {}),
      ...(status !== "all" ? { status } : {}),
      ...(event !== "all" ? { event } : {}),
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    }),
    [currentPage, deferredSearch, event, pageSize, sortBy, sortDir, status],
  );

  const { data, isLoading } = useCoachReferrals(queryParams);
  const { data: dashboardData, isLoading: isDashboardLoading } =
    useCoachReferralDashboard();
  const mutations = useCoachReferralsMutations();

  const responsePayload = get(data, "data", {});
  const referrals = get(
    responsePayload,
    "data",
    get(responsePayload, "items", []),
  );
  const meta = get(responsePayload, "meta", DEFAULT_META);
  const dashboard = get(dashboardData, "data", dashboardData ?? {});
  const dashboardReferralLink = get(dashboard, "referralLink", "");
  const liveonAppBotLink = get(dashboard, "liveonAppBotLink", "");
  const liveonAppBotMention = get(
    dashboard,
    "liveonAppBotMention",
    "@liveonappbot",
  );
  const liveonAppBotSignups = get(dashboard, "stats.liveonAppBotSignups", 0);
  const totalRewardAmount = get(dashboard, "stats.rewardAmount", 0);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/referrals", title: "Takliflar" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    const totalPages = get(meta, "totalPages", 1);
    if (currentPage > totalPages) {
      void setPageQuery(String(totalPages));
    }
  }, [currentPage, meta, setPageQuery]);

  const buildReferralLink = React.useCallback(
    (referral = {}) => {
      const directLink =
        get(referral, "referralLink") ||
        get(referral, "link") ||
        get(referral, "url") ||
        dashboardReferralLink;

      if (directLink) return directLink;

      const code =
        get(referral, "referralCode") ||
        get(referral, "code") ||
        get(dashboard, "referralCode");

      if (!code) return "";

      if (typeof window === "undefined") {
        return `/r/${encodeURIComponent(code)}`;
      }

      return `${window.location.origin}/r/${encodeURIComponent(code)}`;
    },
    [dashboard, dashboardReferralLink],
  );

  const copyText = React.useCallback(async (text) => {
    const clipboard = getClipboard();
    if (!text || !clipboard?.writeText) {
      toast.error("Havola topilmadi");
      return false;
    }

    await clipboard.writeText(text);
    toast.success("Havola nusxalandi");
    return true;
  }, []);

  const handleCopyLink = React.useCallback(
    async (referral) => {
      try {
        await copyText(buildReferralLink(referral));
      } catch {
        toast.error("Nusxalab bo'lmadi");
      }
    },
    [buildReferralLink, copyText],
  );

  const handleCopyDashboardLink = React.useCallback(async () => {
    try {
      await copyText(buildReferralLink());
    } catch {
      toast.error("Nusxalab bo'lmadi");
    }
  }, [buildReferralLink, copyText]);

  const handleCancelReferral = React.useCallback(
    async (referral) => {
      try {
        await mutations.cancelReferral(referral.id);
        toast.success("Referral bekor qilindi");
      } catch (error) {
        toast.error(getErrorMessage(error, "Referralni bekor qilib bo'lmadi"));
      }
    },
    [mutations],
  );

  const handleResendReferral = React.useCallback(
    async (referral) => {
      try {
        const response = await mutations.resendReferral(referral.id);
        const nextLink =
          get(response, "data.referralLink") || buildReferralLink(referral);

        await copyText(nextLink);
        toast.success("Referral havolasi qayta yuborishga tayyor");
      } catch (error) {
        toast.error(
          getErrorMessage(error, "Referralni qayta yuborib bo'lmadi"),
        );
      }
    },
    [buildReferralLink, copyText, mutations],
  );

  const columns = useColumns({
    currentPage,
    pageSize,
    onCopyLink: (referral) => void handleCopyLink(referral),
    onResend: (referral) => void handleResendReferral(referral),
    onCancel: (referral) => void handleCancelReferral(referral),
  });

  const table = useReactTable({
    data: referrals,
    columns,
    manualSorting: true,
    manualPagination: true,
    pageCount: get(meta, "totalPages", 1),
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row, index) => String(row.id ?? index),
    onSortingChange: handleSortingChange,
    onPaginationChange: (updater) => {
      const prev = { pageIndex: currentPage - 1, pageSize };
      const next = typeof updater === "function" ? updater(prev) : updater;
      React.startTransition(() => {
        void setPageQuery(String(next.pageIndex + 1));
      });
    },
    state: {
      sorting,
      pagination: { pageIndex: currentPage - 1, pageSize },
    },
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <ListHeader
        title="Takliflar"
        description="Coach referral havolasini kuzating, bekor qiling va qayta yuboring."
        actions={[
          {
            key: "copy-referral-link",
            label: "Havolani nusxalash",
            icon: CopyIcon,
            onClick: () => void handleCopyDashboardLink(),
            disabled:
              isDashboardLoading ||
              (!dashboardReferralLink && !get(dashboard, "referralCode")),
          },
          {
            key: "copy-liveonappbot-link",
            label: "Bot promo link",
            icon: CopyIcon,
            onClick: () => void copyText(liveonAppBotLink),
            disabled: isDashboardLoading || !liveonAppBotLink,
          },
        ]}
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center">
          <div className="grid gap-3 md:grid-cols-2 lg:col-span-2">
            <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Asosiy referral havola
              </p>
              <p className="mt-1 truncate font-mono text-sm text-foreground">
                {isDashboardLoading
                  ? "Yuklanmoqda..."
                  : buildReferralLink() || "Referral havola topilmadi"}
              </p>
            </div>
            <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {liveonAppBotMention} promo link
              </p>
              <p className="mt-1 truncate font-mono text-sm text-foreground">
                {isDashboardLoading
                  ? "Yuklanmoqda..."
                  : liveonAppBotLink || "Bot promo link topilmadi"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Shu bot orqali kelgan signup: {liveonAppBotSignups}
              </p>
            </div>
          </div>
          <div className="grid gap-2 text-xs sm:grid-cols-4 lg:min-w-[28rem]">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-700">
              <p className="font-bold">30%</p>
              <p>Shogird to'lovi</p>
            </div>
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-700">
              <p className="font-bold">20%</p>
              <p>Boshqa referral user</p>
            </div>
            <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-700">
              <p className="font-bold">10%</p>
              <p>Oddiy user</p>
            </div>
            <div className="rounded-2xl bg-muted p-3 text-foreground">
              <p className="font-bold">{formatTiyin(totalRewardAmount)}</p>
              <p>Jami komissiya</p>
            </div>
          </div>
        </div>
      </ListHeader>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Filter
          filterFields={filterFields}
          activeFilters={activeFilters}
          handleFiltersChange={handleFiltersChange}
        />
      </div>

      <DataGrid
        table={table}
        isLoading={isLoading}
        recordCount={get(meta, "total", 0)}
      >
        <div className="flex w-full flex-col gap-2.5">
          <DataGridContainer>
            <ScrollArea className="w-full">
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          <DataGridPagination
            info="{from} - {to} / {count} ta referral"
            rowsPerPageLabel="Sahifada:"
            sizes={[10, 25, 50]}
          />
        </div>
      </DataGrid>
    </div>
  );
};

export default ReferralsListPage;
