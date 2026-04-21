import React from "react";
import {
  BanIcon,
  CheckCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  ReceiptTextIcon,
  RotateCcwIcon,
  SendIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBreadcrumbStore } from "@/store";
import {
  BulkActionsBar,
  EmptyState,
  ErrorState,
  ListHeader,
  LoadingSkeleton,
  RefreshButton,
} from "@/modules/coach/components/data-grid-helpers";
import { exportCsv } from "@/modules/coach/lib/api/coach-course-purchases-api";
import {
  useCoachCoursePurchases,
  useCoachCoursePurchasesMutations,
  useCoachCourses,
} from "@/modules/coach/lib/hooks";
import BulkPurchaseActionDrawer from "../components/BulkPurchaseActionDrawer.jsx";
import PurchaseActionDrawer from "../components/PurchaseActionDrawer.jsx";

const DEFAULT_META = {
  total: 0,
  page: 1,
  pageSize: 12,
  totalPages: 1,
};

const STATUS_OPTIONS = [
  { value: "all", label: "Barcha statuslar" },
  { value: "PENDING_RECEIPT", label: "Pending receipt" },
  { value: "PENDING_REVIEW", label: "Pending review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CANCELLED", label: "Cancelled" },
];

const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString("uz-UZ")} so'm`;

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("uz-UZ") : "—";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("uz-UZ") : "—";

const extractErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return message || error?.message || fallback;
};

const resolveUserLabel = (purchase) =>
  purchase?.user?.name ||
  purchase?.telegramUser?.firstName ||
  purchase?.telegramUser?.username ||
  "Noma'lum foydalanuvchi";

const resolveStatusVariant = (status) => {
  if (status === "APPROVED") {
    return "default";
  }

  if (status === "REJECTED" || status === "CANCELLED") {
    return "destructive";
  }

  if (status === "PENDING_REVIEW") {
    return "secondary";
  }

  return "outline";
};

const resolveBulkMeta = (response) =>
  response?.data?.meta || response?.data?.data?.meta || null;

const CoursePurchasesListPage = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [courseId, setCourseId] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [selectedMap, setSelectedMap] = React.useState({});
  const [actionState, setActionState] = React.useState({
    open: false,
    mode: null,
    purchase: null,
  });
  const [bulkState, setBulkState] = React.useState({
    open: false,
    mode: null,
  });
  const [isExporting, setIsExporting] = React.useState(false);

  const deferredSearch = React.useDeferredValue(search);

  const queryParams = React.useMemo(() => {
    const params = {
      page,
      pageSize: 12,
      sortBy: "requestedAt",
      sortDir: "desc",
    };

    if (deferredSearch.trim()) {
      params.q = deferredSearch.trim();
    }

    if (status !== "all") {
      params.status = status;
    }

    if (courseId !== "all") {
      params.courseId = courseId;
    }

    return params;
  }, [courseId, deferredSearch, page, status]);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useCoachCoursePurchases(queryParams);
  const { data: coursesData } = useCoachCourses(
    {
      page: 1,
      pageSize: 100,
      sortBy: "title",
      sortDir: "asc",
    },
    { staleTime: 30000 },
  );
  const mutations = useCoachCoursePurchasesMutations();

  const purchases = data?.data?.data ?? [];
  const meta = data?.data?.meta ?? DEFAULT_META;
  const courseOptions = coursesData?.data?.data ?? [];

  const selectedPurchases = React.useMemo(
    () => purchases.filter((purchase) => selectedMap[purchase.id]),
    [purchases, selectedMap],
  );
  const selectedIds = React.useMemo(
    () => selectedPurchases.map((purchase) => purchase.id),
    [selectedPurchases],
  );
  const canBulkApprove =
    selectedPurchases.length > 0 &&
    selectedPurchases.every((purchase) => purchase.status === "PENDING_REVIEW");
  const canBulkReject = canBulkApprove;

  const isMutating =
    mutations.approveMutation.isPending ||
    mutations.rejectMutation.isPending ||
    mutations.revokeMutation.isPending ||
    mutations.extendMutation.isPending ||
    mutations.resendInviteMutation.isPending ||
    mutations.bulkApproveMutation.isPending ||
    mutations.bulkRejectMutation.isPending;

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/course-purchases", title: "Kurs xaridlari" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    const totalPages = meta?.totalPages || 1;

    if (page > totalPages) {
      React.startTransition(() => {
        setPage(totalPages);
      });
    }
  }, [meta?.totalPages, page]);

  React.useEffect(() => {
    setSelectedMap({});
  }, [courseId, deferredSearch, page, status]);

  const handleActionSubmit = async (payload) => {
    const currentMode = actionState.mode;
    const purchase = actionState.purchase;

    if (!currentMode || !purchase) {
      return;
    }

    try {
      if (currentMode === "approve") {
        await mutations.approvePurchase(purchase.id, payload);
        toast.success("Purchase approve qilindi");
      } else if (currentMode === "reject") {
        await mutations.rejectPurchase(purchase.id, payload);
        toast.success("Purchase reject qilindi");
      } else if (currentMode === "extend") {
        await mutations.extendPurchase(purchase.id, payload);
        toast.success("Access muddati uzaytirildi");
      } else {
        await mutations.revokePurchase(purchase.id, payload);
        toast.success("Access bekor qilindi");
      }

      setActionState({ open: false, mode: null, purchase: null });
    } catch (submitError) {
      toast.error(extractErrorMessage(submitError, "Action bajarilmadi"));
    }
  };

  const handleResendInvite = async (purchase) => {
    try {
      await mutations.resendPurchaseInvite(purchase.id);
      toast.success("Invite qayta yuborildi");
    } catch (inviteError) {
      toast.error(extractErrorMessage(inviteError, "Invite yuborilmadi"));
    }
  };

  const handleBulkSubmit = async (payload) => {
    if (!bulkState.mode || !selectedIds.length) {
      return;
    }

    try {
      const response =
        bulkState.mode === "approve"
          ? await mutations.bulkApprovePurchases({
              ids: selectedIds,
              ...payload,
            })
          : await mutations.bulkRejectPurchases({
              ids: selectedIds,
              ...payload,
            });
      const bulkMeta = resolveBulkMeta(response);

      if (bulkMeta) {
        toast.success(
          `${bulkMeta.succeeded} ta muvaffaqiyatli, ${bulkMeta.failed} ta xato`,
        );
      } else {
        toast.success("Bulk action bajarildi");
      }

      setSelectedMap({});
      setBulkState({ open: false, mode: null });
    } catch (bulkError) {
      toast.error(extractErrorMessage(bulkError, "Bulk action bajarilmadi"));
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await exportCsv(queryParams, {
        responseType: "blob",
      });
      const contentType =
        response?.headers?.["content-type"] || "text/csv;charset=utf-8";
      const blob =
        response?.data instanceof Blob
          ? response.data
          : new Blob([response?.data ?? ""], { type: contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `coach-course-purchases-${status}-${page}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success("CSV eksport tayyorlandi");
    } catch (exportError) {
      toast.error(extractErrorMessage(exportError, "CSV eksport qilib bo'lmadi"));
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSelection = (id, checked) => {
    setSelectedMap((current) => {
      const next = { ...current };

      if (checked) {
        next[id] = true;
      } else {
        delete next[id];
      }

      return next;
    });
  };

  if (isLoading) {
    return <LoadingSkeleton rows={5} />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Xaridlarni yuklab bo'lmadi"
        description={extractErrorMessage(
          error,
          "Keyinroq qayta urinib ko'ring.",
        )}
      />
    );
  }

  return (
    <PageTransition className="space-y-4">
      <ListHeader
        eyebrow="Commerce"
        title="Kurs xaridlari"
        description="Receipt review, approve/reject oqimi, invite resend va access lifecycle shu inboxda boshqariladi."
        actions={[
          {
            key: "export",
            label: isExporting ? "Eksport..." : "CSV eksport",
            icon: DownloadIcon,
            variant: "outline",
            onClick: () => void handleExport(),
            disabled: isExporting,
          },
          {
            key: "refresh",
            label: isFetching ? "Yangilanmoqda..." : "Yangilash",
            icon: RotateCcwIcon,
            variant: "outline",
            onClick: () => refetch(),
            disabled: isFetching,
          },
        ]}
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 md:grid-cols-3 xl:max-w-3xl xl:flex-1">
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                React.startTransition(() => {
                  setPage(1);
                });
              }}
              placeholder="User, telegram yoki kurs bo'yicha qidirish"
            />
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                React.startTransition(() => {
                  setPage(1);
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={courseId}
              onValueChange={(value) => {
                setCourseId(value);
                React.startTransition(() => {
                  setPage(1);
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kurs tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha kurslar</SelectItem>
                {courseOptions.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{meta.total} ta purchase</Badge>
            <Badge variant="outline">{selectedIds.length} ta tanlandi</Badge>
          </div>
        </div>
      </ListHeader>

      <BulkActionsBar
        selectedCount={selectedIds.length}
        title="Tanlangan kurs xaridlari"
        description={
          canBulkApprove
            ? "Tanlangan pending-review purchase'lar uchun bulk approve/reject ishlatishingiz mumkin."
            : "Bulk approve/reject faqat pending-review purchase'lar uchun yoqiladi."
        }
        onClear={() => setSelectedMap({})}
        actions={[
          {
            key: "bulk-approve",
            label: "Bulk approve",
            icon: CheckCheckIcon,
            onClick: () => setBulkState({ open: true, mode: "approve" }),
            disabled: !canBulkApprove || isMutating,
          },
          {
            key: "bulk-reject",
            label: "Bulk reject",
            icon: XIcon,
            variant: "outline",
            onClick: () => setBulkState({ open: true, mode: "reject" }),
            disabled: !canBulkReject || isMutating,
          },
        ]}
      />

      {purchases.length === 0 ? (
        <EmptyState
          icon={ReceiptTextIcon}
          title="Xaridlar hali yo'q"
          description="Telegram bot receipt oqimi yoki qo'lda purchase kelgach shu yerda review boshlanadi."
        />
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => {
            const latestReceipt = purchase.receipts?.[0] || null;
            const isSelected = Boolean(selectedMap[purchase.id]);

            return (
              <article
                key={purchase.id}
                className="rounded-[2rem] border border-border/60 bg-card/60 p-5 backdrop-blur-sm"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        toggleSelection(purchase.id, Boolean(checked))
                      }
                      className="mt-1"
                    />

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">
                          {purchase.course?.title || "Kurs"}
                        </h2>
                        <Badge variant={resolveStatusVariant(purchase.status)}>
                          {purchase.status}
                        </Badge>
                        <Badge variant="outline">
                          {purchase.reviewSource || "manual"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {resolveUserLabel(purchase)} · {formatMoney(purchase.amount)}
                      </p>
                      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <span>So&apos;rov: {formatDateTime(purchase.requestedAt)}</span>
                        <span>Approve: {formatDateTime(purchase.approvedAt)}</span>
                        <span>Access tugashi: {formatDate(purchase.accessEndsAt)}</span>
                        <span>
                          Group: {purchase.course?.groupStatus || "UNLINKED"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    {purchase.status === "PENDING_REVIEW" ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            setActionState({
                              open: true,
                              mode: "approve",
                              purchase,
                            })
                          }
                        >
                          <CheckCheckIcon className="size-4" />
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setActionState({
                              open: true,
                              mode: "reject",
                              purchase,
                            })
                          }
                        >
                          <XIcon className="size-4" />
                          Reject
                        </Button>
                      </>
                    ) : null}

                    {purchase.status === "APPROVED" ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setActionState({
                              open: true,
                              mode: "extend",
                              purchase,
                            })
                          }
                        >
                          <RotateCcwIcon className="size-4" />
                          Extend
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void handleResendInvite(purchase)}
                        >
                          <SendIcon className="size-4" />
                          Resend invite
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setActionState({
                              open: true,
                              mode: "revoke",
                              purchase,
                            })
                          }
                        >
                          <BanIcon className="size-4" />
                          Revoke
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="rounded-[1.5rem] border border-border/60 bg-background/60 p-4">
                    <p className="text-sm font-medium">Review note</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {purchase.reviewNote || "Review note yo'q"}
                    </p>

                    {purchase.inviteLinkUrl ? (
                      <div className="mt-4 rounded-2xl border border-border/60 bg-muted/30 p-3 text-sm">
                        <p className="font-medium">Invite link</p>
                        <a
                          href={purchase.inviteLinkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex break-all text-primary underline-offset-4 hover:underline"
                        >
                          {purchase.inviteLinkUrl}
                        </a>
                        <p className="mt-1 text-muted-foreground">
                          Expire: {formatDateTime(purchase.inviteLinkExpiresAt)}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-[1.5rem] border border-border/60 bg-background/60 p-4">
                    <p className="text-sm font-medium">Receiptlar</p>
                    {latestReceipt ? (
                      <div className="mt-3 space-y-3">
                        <img
                          src={latestReceipt.imageUrl}
                          alt="Receipt preview"
                          className="h-44 w-full rounded-[1.25rem] object-cover"
                        />
                        <div className="text-sm text-muted-foreground">
                          <p>{latestReceipt.note || latestReceipt.fileName || "Telegram receipt"}</p>
                          <p>{formatDateTime(latestReceipt.createdAt)}</p>
                        </div>
                        <a
                          href={latestReceipt.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-sm text-primary underline-offset-4 hover:underline"
                        >
                          Receiptni ochish
                        </a>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Receipt yo&apos;q yoki hali kelmagan.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-[1.75rem] border border-border/60 bg-card/50 p-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          {meta.page} / {meta.totalPages} sahifa · {meta.total} ta purchase
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() =>
              React.startTransition(() => {
                setPage((current) => Math.max(1, current - 1));
              })
            }
          >
            <ChevronLeftIcon className="size-4" />
            Oldingi
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() =>
              React.startTransition(() => {
                setPage((current) => current + 1);
              })
            }
          >
            Keyingi
            <ChevronRightIcon className="size-4" />
          </Button>
          <RefreshButton isLoading={isFetching} onRefresh={() => refetch()} />
        </div>
      </div>

      <PurchaseActionDrawer
        open={actionState.open}
        mode={actionState.mode}
        purchase={actionState.purchase}
        onOpenChange={(open) =>
          setActionState((current) =>
            open ? current : { open: false, mode: null, purchase: null },
          )
        }
        onSubmit={handleActionSubmit}
        isSubmitting={isMutating}
      />

      <BulkPurchaseActionDrawer
        open={bulkState.open}
        mode={bulkState.mode}
        selectedCount={selectedIds.length}
        onOpenChange={(open) =>
          setBulkState((current) =>
            open ? current : { open: false, mode: null },
          )
        }
        onSubmit={handleBulkSubmit}
        isSubmitting={
          mutations.bulkApproveMutation.isPending ||
          mutations.bulkRejectMutation.isPending
        }
      />
    </PageTransition>
  );
};

export default CoursePurchasesListPage;
