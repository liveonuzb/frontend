import {
  concat,
  filter,
  find,
  get,
  includes,
  isEmpty,
  map,
  size,
  toLower,
  toNumber,
  toString,
  toUpper,
  trim,
} from "lodash";
import React from "react";
import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { UserPlusIcon, UsersIcon } from "lucide-react";
import CoachErrorState from "../../../components/coach-error-state";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { toast } from "sonner";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import {
  DataGrid,
  DataGridContainer,
  DataGridPagination,
  DataGridTable,
} from "@/components/reui/data-grid";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useCoachClients, useCoachGroups, useCoachMealPlans, useCoachWorkoutPlans } from "@/hooks/app/use-coach.js";
import { useClientTags } from "@/hooks/app/use-client-tags";
import { useColumns } from "./columns.jsx";
import { Filter, useClientFilters } from "./filter.jsx";
import { DeleteAlert } from "./delete-alert.jsx";
import { useClientsViewState } from "../hooks/use-clients-view-state";
import { useInviteFlow, InviteDrawers } from "../components/invite-flow";
import {
  ClientDetailDrawer,
  InvitationDetailDrawer,
  MarkPaymentDrawer,
  PaymentDayDrawer,
  CancelPaymentDialog,
  GroupSelectionDrawer,
  CreateGroupDrawer,
  MemberSelectionDrawer,
  PlanDrawer,
} from "../components/drawers";

const DEFAULT_PAGE_SIZE = 10;

const Index = () => {
  const { t } = useTranslation();
  const { groups, addClientsToGroup, createGroupWithClients } = useCoachGroups();
  const { mealPlans, assignMealPlan: assignMealPlanToClient } = useCoachMealPlans();
  const { workoutPlans, assignWorkoutPlan: assignWorkoutPlanToClient } = useCoachWorkoutPlans();

  const {
    currentPage,
    pageSize,
    setPageQuery,
    setPageSizeQuery,
    filterFields,
    activeFilters,
    handleFiltersChange,
    search,
    statusFilter,
    sorting,
    setSorting,
  } = useClientFilters();

  const [sortBy, order] = React.useMemo(() => {
    const first = get(sorting, "[0]");
    if (!first) return [undefined, undefined];
    return [first.id, first.desc ? "desc" : "asc"];
  }, [sorting]);

  // ── Data Fetching ────────────────────────────────────────────────────────
  const deferredSearch = React.useDeferredValue(search);

  const queryParams = React.useMemo(() => {
    const params = {};
    if (get(deferredSearch, "trim")()) {
      params.q = trim(deferredSearch);
    }
    if (statusFilter !== "all" && statusFilter !== "pending") {
      params.status = statusFilter;
    }
    if (sortBy) params.sortBy = sortBy;
    if (order) params.order = order;
    params.page = currentPage;
    params.pageSize = pageSize;
    return params;
  }, [deferredSearch, statusFilter, sortBy, order, currentPage, pageSize]);

  const {
    clients,
    pendingInvitations,
    inviteClient,
    removeClient,
    cancelInvitation,
    markClientPayment,
    updateClientPricing,
    cancelClientPayment,
    isLoading,
    isFetching,
    isError,
    refetch,
    isInviting,
    isRemovingClient,
    isCancellingInvitation,
    isMarkingClientPayment,
    isUpdatingClientPricing,
    isCancellingClientPayment,
  } = useCoachClients(queryParams);
  const { getClientTags, toggleTag } = useClientTags(clients);

  // ── Merge rows (invitations + clients) ────────────────────────────────────
  const mergedRows = React.useMemo(() => {
    const invitationRows = map(pendingInvitations, (inv) => ({
      ...inv,
      id: `invite-${get(inv, "id")}`,
      entityType: "invitation",
      source: "coach",
      invitationId: get(inv, "id"),
      name: get(inv, "client.name", t("coach.clients.table.unnamedUser")),
      email: get(inv, "client.email"),
      phone: get(inv, "client.phone"),
      avatar: get(inv, "client.avatar"),
      lastActivityDate: get(inv, "createdAt"),
    }));

    const clientRows = map(clients, (c) => ({
      ...c,
      id: String(c.id),
      entityType: "client",
      source: get(c, "source", "coach"),
    }));

    return concat(invitationRows, clientRows);
  }, [clients, pendingInvitations, t]);

  const filteredRows = React.useMemo(() => {
    let rows = mergedRows;
    if (statusFilter === "pending") {
      rows = filter(rows, (r) => get(r, "entityType") === "invitation");
    }
    return rows;
  }, [mergedRows, statusFilter]);

  const totalCount = size(filteredRows);

  // ── UI State ─────────────────────────────────────────────────────────────
  const ui = useClientsViewState();
  const {
    clientId,
    setClientId,
    activeInvitationId,
    setActiveInvitationId,
    paymentClient,
    setPaymentClient,
    paymentAmount,
    setPaymentAmount,
    paymentPaidAt,
    setPaymentPaidAt,
    paymentNote,
    setPaymentNote,
    paymentDayClient,
    setPaymentDayClient,
    paymentDay,
    setPaymentDay,
    paymentBillingCycle,
    setPaymentBillingCycle,
    cancelPaymentTarget,
    setCancelPaymentTarget,
    removeCandidate,
    setRemoveCandidate,
    isGroupDrawerOpen,
    setIsGroupDrawerOpen,
    selectedGroupId,
    setSelectedGroupId,
    isCreateGroupDrawerOpen,
    setIsCreateGroupDrawerOpen,
    newGroupName,
    setNewGroupName,
    newGroupDesc,
    setNewGroupDesc,
    isMemberSelectionDrawerOpen,
    setIsMemberSelectionDrawerOpen,
    memberSearch,
    setMemberSearch,
    memberSelectionIds,
    setMemberSelectionIds,
    isPlanDrawerOpen,
    setIsPlanDrawerOpen,
    planType,
    setPlanType,
    activeClientIds,
    setActiveClientIds,
    isSubmitting,
    setIsSubmitting,
  } = ui;

  const inviteFlow = useInviteFlow({ inviteClient });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleView = React.useCallback(
    (c) => {
      const entityType = get(c, "entityType");
      if (entityType === "client") {
        setClientId(get(c, "id"));
      } else {
        setActiveInvitationId(get(c, "invitationId"));
      }
    },
    [setClientId, setActiveInvitationId],
  );

  const handleOpenPayment = React.useCallback(
    (c) => {
      setPaymentClient(c);
      setPaymentAmount(toString(get(c, "agreedAmount", "")));
      setPaymentPaidAt(new Date().toISOString().slice(0, 10));
    },
    [setPaymentClient, setPaymentAmount, setPaymentPaidAt],
  );

  const handleOpenPaymentDay = React.useCallback(
    (c) => {
      setPaymentDayClient(c);
      setPaymentDay(toString(get(c, "paymentSummary.dayOfMonth", "")));
      setPaymentBillingCycle(toUpper(get(c, "billingCycle", "monthly")));
    },
    [setPaymentBillingCycle, setPaymentDayClient, setPaymentDay],
  );

  const handleCancelPayment = React.useCallback(
    (c) => {
      setCancelPaymentTarget({
        clientId: get(c, "id"),
        clientName: get(c, "name"),
        paymentId: get(c, "latestPayment.id"),
      });
    },
    [setCancelPaymentTarget],
  );

  const handleRemove = React.useCallback(
    (client) => {
      setRemoveCandidate(client);
    },
    [setRemoveCandidate],
  );

  const confirmRemove = React.useCallback(async () => {
    if (!removeCandidate) return;
    try {
      await removeClient(get(removeCandidate, "id"));
      toast.success(t("coach.clients.messages.removeSuccess", { defaultValue: "Mijoz o'chirildi" }));
      setRemoveCandidate(null);
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        Array.isArray(message)
          ? message[0]
          : message || t("coach.clients.messages.error", { defaultValue: "Xatolik yuz berdi" }),
      );
    }
  }, [removeClient, removeCandidate, setRemoveCandidate, t]);

  const handleResendInvite = React.useCallback(
    (inv) => {
      cancelInvitation(get(inv, "invitationId"));
      toast.success(t("coach.clients.messages.resendSuccess"));
    },
    [cancelInvitation, t],
  );

  const handleCancelInvitation = React.useCallback(
    (id) => {
      cancelInvitation(id);
      toast.success(t("coach.clients.messages.cancelSuccess"));
    },
    [cancelInvitation, t],
  );

  const handleAssignPlan = React.useCallback(
    (c, type) => {
      setActiveClientIds([get(c, "id")]);
      setPlanType(type);
      setIsPlanDrawerOpen(true);
    },
    [setActiveClientIds, setPlanType, setIsPlanDrawerOpen],
  );

  // ── Payment Handlers ────────────────────────────────────────────────────
  const handleSavePayment = React.useCallback(async () => {
    if (!paymentClient) return;
    await markClientPayment(get(paymentClient, "id"), {
      amount: toNumber(paymentAmount),
      paidAt: paymentPaidAt,
      note: paymentNote,
    });
    toast.success(t("coach.clients.messages.markingSuccess"));
    setPaymentClient(null);
  }, [
    markClientPayment,
    paymentClient,
    paymentAmount,
    paymentPaidAt,
    paymentNote,
    setPaymentClient,
    t,
  ]);

  const handleSavePaymentDay = React.useCallback(async () => {
    if (!paymentDayClient) return;
    await updateClientPricing(get(paymentDayClient, "id"), {
      paymentDay: toNumber(paymentDay),
      billingCycle: paymentBillingCycle,
    });
    toast.success(t("coach.clients.messages.pricingSuccess"));
    setPaymentDayClient(null);
  }, [
    updateClientPricing,
    paymentDayClient,
    paymentDay,
    paymentBillingCycle,
    setPaymentDayClient,
    t,
  ]);

  const handleConfirmCancelPayment = React.useCallback(async () => {
    if (!cancelPaymentTarget) return;
    await cancelClientPayment(
      cancelPaymentTarget.clientId,
      cancelPaymentTarget.paymentId,
      {},
    );
    toast.success(t("coach.clients.messages.cancelled"));
    setCancelPaymentTarget(null);
  }, [cancelClientPayment, cancelPaymentTarget, setCancelPaymentTarget, t]);

  // ── Active Invitation for detail drawer ──────────────────────────────────
  const activeInvitation = React.useMemo(() => {
    return activeInvitationId
      ? find(mergedRows, { invitationId: activeInvitationId })
      : null;
  }, [activeInvitationId, mergedRows]);

  // ── Group Handlers ──────────────────────────────────────────────────────
  const [rowSelection, setRowSelection] = React.useState({});
  const selectedRows = React.useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => find(filteredRows, { id: key }))
      .filter(Boolean);
  }, [rowSelection, filteredRows]);
  const selectedCount = size(selectedRows);

  const handleAddToGroup = React.useCallback(async () => {
    const ids = map(
      filter(selectedRows, (r) => get(r, "entityType") === "client"),
      "id",
    );

    if (isEmpty(ids)) return toast.error(t("coach.clients.messages.selectValidClients"));

    if (selectedGroupId === "new") {
      setMemberSelectionIds(ids);
      setIsGroupDrawerOpen(false);
      setIsCreateGroupDrawerOpen(true);
    } else if (selectedGroupId) {
      try {
        await addClientsToGroup(Number(selectedGroupId), ids);
        toast.success(t("coach.clients.messages.groupAddSuccess"));
        setIsGroupDrawerOpen(false);
        setRowSelection({});
      } catch {
        toast.error(t("coach.clients.messages.error", { defaultValue: "Xatolik yuz berdi" }));
      }
    }
  }, [
    selectedRows,
    selectedGroupId,
    setMemberSelectionIds,
    setIsGroupDrawerOpen,
    setIsCreateGroupDrawerOpen,
    addClientsToGroup,
    t,
  ]);

  const handleAssignPlanBulk = React.useCallback(
    async (planId) => {
      try {
        if (planType === "meal") {
          await assignMealPlanToClient(planId, activeClientIds);
        } else {
          await assignWorkoutPlanToClient(planId, activeClientIds);
        }
        toast.success(t("coach.clients.messages.planAssignSuccess"));
        setIsPlanDrawerOpen(false);
        setRowSelection({});
      } catch {
        toast.error(t("coach.clients.messages.error"));
      }
    },
    [
      planType,
      activeClientIds,
      assignMealPlanToClient,
      assignWorkoutPlanToClient,
      setIsPlanDrawerOpen,
      t,
    ],
  );

  const filteredMembers = React.useMemo(() => {
    return memberSearch
      ? filter(clients, (c) =>
          includes(toLower(get(c, "name", "")), toLower(memberSearch)),
        )
      : clients;
  }, [memberSearch, clients]);

  const handleConfirmMemberSelection = React.useCallback(async () => {
    setIsSubmitting(true);
    try {
      await createGroupWithClients(
        newGroupName,
        newGroupDesc,
        memberSelectionIds,
      );
      toast.success(t("coach.clients.messages.groupCreateSuccess"));
      setIsMemberSelectionDrawerOpen(false);
    } catch {
      toast.error(t("coach.clients.messages.error", { defaultValue: "Xatolik yuz berdi" }));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    createGroupWithClients,
    newGroupName,
    newGroupDesc,
    memberSelectionIds,
    setIsSubmitting,
    setIsMemberSelectionDrawerOpen,
    t,
  ]);

  const handleCreateGroupNext = React.useCallback(() => {
    setIsCreateGroupDrawerOpen(false);
    setIsMemberSelectionDrawerOpen(true);
  }, [setIsCreateGroupDrawerOpen, setIsMemberSelectionDrawerOpen]);

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns = useColumns({
    currentPage,
    pageSize,
    handleView,
    handleOpenPayment,
    handleOpenPaymentDay,
    handleCancelPayment,
    handleRemove,
    handleResendInvite,
    handleCancelInvitation,
    handleAssignPlan,
    isInviting,
    isRemoving: isRemovingClient,
    getClientTags,
    toggleTag,
  });

  // ── Table Instance ───────────────────────────────────────────────────────
  const table = useReactTable({
    data: filteredRows,
    columns,
    state: {
      sorting,
      pagination: { pageIndex: currentPage - 1, pageSize },
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const previous = { pageIndex: currentPage - 1, pageSize };
      const next = typeof updater === "function" ? updater(previous) : updater;
      React.startTransition(() => {
        void setPageQuery(String(get(next, "pageIndex", 0) + 1));
        void setPageSizeQuery(String(get(next, "pageSize", DEFAULT_PAGE_SIZE)));
      });
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    rowCount: totalCount,
    enableRowSelection: true,
    getRowId: (row) => String(get(row, "id")),
  });

  if (isError) {
    return (
      <PageTransition>
        <CoachErrorState onRetry={refetch} />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <UsersIcon className="size-6" /> {t("coach.clients.title")}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("coach.clients.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <Button
                variant="outline"
                onClick={() => setIsGroupDrawerOpen(true)}
              >
                <UsersIcon className="size-4" />
                {t("coach.clients.actions.addToGroup")}
              </Button>
            )}
            <Button onClick={inviteFlow.open}>
              <UserPlusIcon className="size-4" />
              {t("coach.clients.actions.addClient")}
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Filter
            filterFields={filterFields}
            activeFilters={activeFilters}
            handleFiltersChange={handleFiltersChange}
          />
        </div>

        <DataGrid
          table={table}
          isLoading={isLoading || isFetching}
          recordCount={totalCount}
        >
          <DataGridContainer>
            <ScrollArea className="w-full">
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          <DataGridPagination table={table} />
        </DataGrid>

        <DeleteAlert
          client={removeCandidate}
          open={Boolean(removeCandidate)}
          onOpenChange={(open) => !open && setRemoveCandidate(null)}
          onConfirm={confirmRemove}
          isDeleting={isRemovingClient}
        />

        {/* Drawers */}
        <ClientDetailDrawer
          clientId={clientId}
          onClose={() => setClientId(null)}
        />

        <InvitationDetailDrawer
          invitation={activeInvitation}
          onClose={() => setActiveInvitationId(null)}
          onResend={handleResendInvite}
          onCancel={cancelInvitation}
          isInviting={isInviting}
          isCancelling={isCancellingInvitation}
        />

        <MarkPaymentDrawer
          client={paymentClient}
          amount={paymentAmount}
          setAmount={setPaymentAmount}
          paidAt={paymentPaidAt}
          setPaidAt={setPaymentPaidAt}
          note={paymentNote}
          setNote={setPaymentNote}
          onSave={handleSavePayment}
          onClose={() => setPaymentClient(null)}
          isSubmitting={isMarkingClientPayment}
        />

        <PaymentDayDrawer
          client={paymentDayClient}
          day={paymentDay}
          setDay={setPaymentDay}
          billingCycle={paymentBillingCycle}
          setBillingCycle={setPaymentBillingCycle}
          onSave={handleSavePaymentDay}
          onClose={() => setPaymentDayClient(null)}
          isSubmitting={isUpdatingClientPricing}
        />

        <CancelPaymentDialog
          target={cancelPaymentTarget}
          isSubmitting={isCancellingClientPayment}
          onConfirm={handleConfirmCancelPayment}
          onClose={() => setCancelPaymentTarget(null)}
        />

        <GroupSelectionDrawer
          open={isGroupDrawerOpen}
          onOpenChange={setIsGroupDrawerOpen}
          groups={groups}
          selectedGroupId={selectedGroupId}
          setSelectedGroupId={setSelectedGroupId}
          onConfirm={handleAddToGroup}
          selectedCount={selectedCount}
        />

        <CreateGroupDrawer
          open={isCreateGroupDrawerOpen}
          onOpenChange={setIsCreateGroupDrawerOpen}
          name={newGroupName}
          setName={setNewGroupName}
          desc={newGroupDesc}
          setDesc={setNewGroupDesc}
          onNext={handleCreateGroupNext}
        />

        <MemberSelectionDrawer
          open={isMemberSelectionDrawerOpen}
          onOpenChange={setIsMemberSelectionDrawerOpen}
          search={memberSearch}
          setSearch={setMemberSearch}
          filteredMembers={filteredMembers}
          selectedIds={memberSelectionIds}
          setSelectedIds={setMemberSelectionIds}
          isSubmitting={isSubmitting}
          onConfirm={handleConfirmMemberSelection}
        />

        <PlanDrawer
          open={isPlanDrawerOpen}
          onOpenChange={setIsPlanDrawerOpen}
          planType={planType}
          plans={planType === "meal" ? mealPlans : workoutPlans}
          onAssign={handleAssignPlanBulk}
          selectedCount={size(activeClientIds)}
        />

        <InviteDrawers {...inviteFlow} isInviting={isInviting} />

        <Outlet />
      </div>
    </PageTransition>
  );
};

export default Index;
