import React from "react";
import {
  filter,
  find,
  get,
  includes,
  isArray,
  isEmpty,
  isNil,
  join,
  map,
  size,
  slice,
  split,
  toLower,
  toUpper,
  trim,
} from "lodash";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { createPortal } from "react-dom";
import {
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import PageTransition from "@/components/page-transition";
import {
  DataGridColumnHeader,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid";
import { useCoachClients, useCoachGroups } from "@/hooks/app/use-coach.js";
import ClientDetailDrawerContent from "@/modules/coach/components/client-detail-drawer-content.jsx";
import { useBreadcrumbStore } from "@/store";
import { cn } from "@/lib/utils";
import {
  MailIcon,
  MessageCircleIcon,
  PhoneIcon,
  RotateCcwIcon,
  UserPlusIcon,
  UsersIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon,
  CheckCircle2Icon,
  DumbbellIcon,
  UtensilsIcon,
  ArrowRightIcon,
} from "lucide-react";
import { toast } from "sonner";
import ClientActionsMenu from "./components/client-actions-menu";
import ClientFilterBar from "./components/client-filter-bar";
import ClientListTable from "./components/client-list-table";
import ClientInviteDrawer from "./components/client-invite-drawer";

const CLIENT_SORT_FIELDS = [
  "name",
  "goal",
  "currentWeight",
  "progress",
  "lastActivityDate",
  "status",
];
const CLIENT_SORT_DIRECTIONS = ["asc", "desc"];

const statusConfig = {
  active: {
    label: "Faol",
    className:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  paused: {
    label: "Pauza",
    className:
      "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  inactive: {
    label: "Faolsiz",
    className:
      "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
  pending: {
    label: "Kutilmoqda",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  declined: {
    label: "Rad etilgan",
    className:
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  },
};

const INVITE_METHOD_OPTIONS = [
  {
    value: "phone",
    label: "Telefon orqali",
    description: "Mijozning telefon raqami bilan taklif yuboriladi.",
    icon: PhoneIcon,
    placeholder: "+998 90 123 45 67",
  },
  {
    value: "email",
    label: "Email orqali",
    description: "Mijozning email manzili orqali taklif yuboriladi.",
    icon: MailIcon,
    placeholder: "client@example.com",
  },
  {
    value: "telegram",
    label: "Telegram orqali",
    description: "Telegram username orqali foydalanuvchi topiladi.",
    icon: MessageCircleIcon,
    placeholder: "@username",
  },
];

const PAYMENT_DAY_OPTIONS_FOR_INVITE = Array.from({ length: 31 }, (_, index) => {
  const day = index + 1;
  return {
    value: String(day),
    label: `${day}-kun`,
  };
});

const WEEKDAY_OPTIONS = [
  { value: "monday", label: "Dushanba" },
  { value: "tuesday", label: "Seshanba" },
  { value: "wednesday", label: "Chorshanba" },
  { value: "thursday", label: "Payshanba" },
  { value: "friday", label: "Juma" },
  { value: "saturday", label: "Shanba" },
  { value: "sunday", label: "Yakshanba" },
];

const createInviteDraft = () => ({
  contactMethod: "phone",
  identifier: "+998",
  agreedAmount: "",
  paymentDay: "",
  trainingSchedule: [{ day: "monday", time: "18:00" }],
  notes: "",
});

const PAYMENT_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => {
  const day = index + 1;

  return {
    value: String(day),
    label: `${day}-kun`,
  };
});

const formatPaymentDay = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getDate()}-kun`;
};

const getInitials = (name) => {
  const initials = join(
    map(split(get({ v: name }, "v", ""), " "), (part) => get(part, "[0]", "")),
    "",
  );
  return toUpper(initials);
};

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(value))
    : "—";

const formatLongDate = (value) =>
  value
    ? new Intl.DateTimeFormat("uz-UZ", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(value))
    : "—";

const formatMoney = (value) => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < 0) {
    return "Kelishiladi";
  }
  return `${new Intl.NumberFormat("uz-UZ").format(normalized)} so'm`;
};

const normalizeProgress = (value) => {
  const nextValue = Number(get({ v: value }, "v", 0));
  return Number.isFinite(nextValue) ? Math.max(0, Math.min(100, nextValue)) : 0;
};

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringEnum([
      "all",
      "active",
      "paused",
      "inactive",
      "pending",
      "declined",
    ]).withDefault("all"),
  );
  const [planFilter, setPlanFilter] = useQueryState(
    "plan",
    parseAsStringEnum(["all", "with", "without"]).withDefault("all"),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(CLIENT_SORT_FIELDS).withDefault("lastActivityDate"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(CLIENT_SORT_DIRECTIONS).withDefault("desc"),
  );
  const [rowSelection, setRowSelection] = React.useState({});
  const [isPortalReady, setIsPortalReady] = React.useState(false);
  const [isGroupDrawerOpen, setIsGroupDrawerOpen] = React.useState(false);
  const [isCreateGroupDrawerOpen, setIsCreateGroupDrawerOpen] =
    React.useState(false);
  const [isMemberSelectionDrawerOpen, setIsMemberSelectionDrawerOpen] =
    React.useState(false);
  const [memberSelectionIds, setMemberSelectionIds] = React.useState([]);
  const [memberSearch, setMemberSearch] = React.useState("");
  const [selectedGroupId, setSelectedGroupId] = React.useState("");
  const [newGroupName, setNewGroupName] = React.useState("");
  const [newGroupDesc, setNewGroupDesc] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPlanDrawerOpen, setIsPlanDrawerOpen] = React.useState(false);
  const [planType, setPlanType] = React.useState(null);
  const [activeClientIds, setActiveClientIds] = React.useState([]);
  const [clientId, setClientId] = useQueryState("clientId", parseAsString);
  const [activeInvitationId, setActiveInvitationId] = React.useState(null);
  const [inviteStep, setInviteStep] = React.useState(null);
  const [removeCandidate, setRemoveCandidate] = React.useState(null);
  const [paymentClient, setPaymentClient] = React.useState(null);
  const [paymentDayClient, setPaymentDayClient] = React.useState(null);
  const [cancelPaymentTarget, setCancelPaymentTarget] = React.useState(null);
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [paymentNote, setPaymentNote] = React.useState("");
  const [paymentPaidAt, setPaymentPaidAt] = React.useState("");
  const [paymentDay, setPaymentDay] = React.useState("");
  const [inviteDraft, setInviteDraft] = React.useState(createInviteDraft);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/clients", title: "Mijozlar" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    setIsPortalReady(true);
    return () => setIsPortalReady(false);
  }, []);

  React.useEffect(() => {
    setRowSelection({});
  }, [search, statusFilter, planFilter, sortBy, sortDir]);

  const deferredSearch = React.useDeferredValue(search);
  const queryParams = React.useMemo(
    () => ({
      ...(trim(deferredSearch) ? { q: trim(deferredSearch) } : {}),
      ...(statusFilter !== "all" && statusFilter !== "pending"
        ? { status: statusFilter }
        : {}),
    }),
    [deferredSearch, statusFilter],
  );

  const {
    clients,
    pendingInvitations,
    mealPlans,
    workoutPlans,
    inviteClient,
    removeClient,
    cancelInvitation,
    markClientPayment,
    updateClientPricing,
    cancelClientPayment,
    isLoading,
    isFetching,
    refetch,
    isInviting,
    isRemovingClient,
    isCancellingInvitation,
    isMarkingClientPayment,
    isUpdatingClientPricing,
    isCancellingClientPayment,
  } = useCoachClients(queryParams);

  const { groups, addClientsToGroup, createGroupWithClients } =
    useCoachGroups();

  const mergedRows = React.useMemo(() => {
    const invitationRows = map(pendingInvitations, (invitation) => ({
      id: `invite-${get(invitation, "id")}`,
      entityType: "invitation",
      invitationId: get(invitation, "id"),
      name: get(invitation, "client.name", "Nomsiz user"),
      email: get(invitation, "client.email"),
      phone: get(invitation, "client.phone"),
      avatar: get(invitation, "client.avatar"),
      goal: null,
      currentWeight: null,
      targetWeight: null,
      progress: null,
      activePlanName: null,
      lastActivityDate: get(invitation, "createdAt"),
      status: get(invitation, "status", "pending"),
      createdAt: get(invitation, "createdAt"),
      contactMethod: get(invitation, "contactMethod"),
      identifierValue: get(invitation, "identifierValue"),
      agreedAmount: get(invitation, "agreedAmount"),
      paymentDate: get(invitation, "paymentDate"),
      trainingSchedule: get(invitation, "trainingSchedule", []),
      declineReason: get(invitation, "declineReason", ""),
    }));

    const clientRows = map(clients, (client) => ({
      ...client,
      entityType: "client",
    }));

    return [...invitationRows, ...clientRows];
  }, [clients, pendingInvitations]);

  const filteredRows = React.useMemo(() => {
    let rows = mergedRows;

    if (statusFilter !== "all" && statusFilter !== "pending") {
      rows = filter(rows, (row) => get(row, "status") === statusFilter);
    }

    if (planFilter !== "all") {
      rows = filter(rows, (row) =>
        get(row, "entityType") === "client"
          ? planFilter === "with"
            ? Boolean(get(row, "activePlanName"))
            : !get(row, "activePlanName")
          : false,
      );
    }

    return rows;
  }, [mergedRows, planFilter, statusFilter]);

  const activeInvitation = React.useMemo(
    () =>
      activeInvitationId
        ? get(
            find(
              mergedRows,
              (row) =>
                get(row, "entityType") === "invitation" &&
                get(row, "invitationId") === activeInvitationId,
            ),
            null,
          )
        : null,
    [activeInvitationId, mergedRows],
  );
  const paymentAmountRaw = trim(String(get({ v: paymentAmount }, "v", "")));
  const hasPaymentAmount = paymentAmountRaw !== "";
  const paymentAmountNumber = Number(paymentAmountRaw);
  const isPaymentAmountValid =
    !hasPaymentAmount ||
    (Number.isFinite(paymentAmountNumber) && paymentAmountNumber >= 0);

  const sorting = React.useMemo(
    () => [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch = get(
        find(nextFilters, (filter) => get(filter, "field") === "q"),
        "values[0]",
        "",
      );
      const nextStatus = get(
        find(nextFilters, (filter) => get(filter, "field") === "status"),
        "values[0]",
        "all",
      );
      const nextPlan = get(
        find(nextFilters, (filter) => get(filter, "field") === "plan"),
        "values[0]",
        "all",
      );

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setStatusFilter(nextStatus);
        void setPlanFilter(nextPlan);
      });
    },
    [setPlanFilter, setSearch, setStatusFilter],
  );

  const handleSortingChange = React.useCallback(
    (updater) => {
      const nextSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      const nextSort = get(nextSorting, "[0]");

      React.startTransition(() => {
        if (!nextSort) {
          void setSortBy("lastActivityDate");
          void setSortDir("desc");
          return;
        }

        void setSortBy(nextSort.id);
        void setSortDir(nextSort.desc ? "desc" : "asc");
      });
    },
    [setSortBy, setSortDir, sorting],
  );

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "Ism, email, telefon yoki maqsad",
      },
      {
        label: "Status",
        key: "status",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha status" },
          { value: "active", label: "Faol" },
          { value: "paused", label: "Pauza" },
          { value: "inactive", label: "Faolsiz" },
          { value: "pending", label: "Kutilmoqda" },
          { value: "declined", label: "Rad etilgan" },
        ],
      },
      {
        label: "Reja",
        key: "plan",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barcha mijozlar" },
          { value: "with", label: "Rejasi bor" },
          { value: "without", label: "Rejasi yo'q" },
        ],
      },
    ],
    [],
  );

  const activeFilters = React.useMemo(() => {
    const items = [];

    if (trim(search)) {
      items.push({
        id: "q",
        field: "q",
        operator: "contains",
        values: [search],
      });
    }

    if (statusFilter !== "all") {
      items.push({
        id: "status",
        field: "status",
        operator: "is",
        values: [statusFilter],
      });
    }

    if (planFilter !== "all") {
      items.push({
        id: "plan",
        field: "plan",
        operator: "is",
        values: [planFilter],
      });
    }

    return items;
  }, [planFilter, search, statusFilter]);

  const resetInviteFlow = React.useCallback(() => {
    setInviteStep(null);
    setInviteDraft(createInviteDraft());
  }, []);

  const updateInviteDraft = React.useCallback((patch) => {
    setInviteDraft((current) => ({
      ...current,
      ...patch,
    }));
  }, []);

  const updateTrainingSlot = React.useCallback((index, patch) => {
    setInviteDraft((current) => ({
      ...current,
      trainingSchedule: map(
        get(current, "trainingSchedule", []),
        (slot, slotIndex) =>
          slotIndex === index ? { ...slot, ...patch } : slot,
      ),
    }));
  }, []);

  const addTrainingSlot = React.useCallback(() => {
    setInviteDraft((current) => ({
      ...current,
      trainingSchedule: [
        ...current.trainingSchedule,
        { day: "monday", time: "18:00" },
      ],
    }));
  }, []);

  const removeTrainingSlot = React.useCallback((index) => {
    setInviteDraft((current) => ({
      ...current,
      trainingSchedule:
        size(get(current, "trainingSchedule")) > 1
          ? filter(
              get(current, "trainingSchedule"),
              (_, slotIndex) => slotIndex !== index,
            )
          : get(current, "trainingSchedule"),
    }));
  }, []);

  const handleResendInvite = React.useCallback(
    async (row) => {
      const contactMethod = get(row, "contactMethod")
        ? get(row, "contactMethod")
        : get(row, "email")
          ? "email"
          : get(row, "phone")
            ? "phone"
            : null;
      const identifier =
        get(row, "identifierValue") ||
        get(row, "email") ||
        get(row, "phone") ||
        "";

      if (!contactMethod || !identifier) {
        toast.error("Taklifni qayta yuborish uchun ma'lumot yetarli emas");
        return;
      }

      await inviteClient({
        contactMethod: toUpper(get({ v: contactMethod }, "v", "")),
        identifier,
        agreedAmount: !isNil(get(row, "agreedAmount"))
          ? Number(get(row, "agreedAmount"))
          : undefined,
        paymentDay: get(row, "paymentDate") ? new Date(get(row, "paymentDate")).getUTCDate() : undefined,
        trainingSchedule: isArray(get(row, "trainingSchedule"))
          ? get(row, "trainingSchedule")
          : [],
        notes: get(row, "notes", ""),
      });

      toast.success("Taklif qayta yuborildi");
    },
    [inviteClient],
  );

  const handleInvite = React.useCallback(async () => {
    if (!trim(get(inviteDraft, "identifier", ""))) {
      toast.error("Qiymat kiriting");
      return;
    }

    const hasAgreedAmount =
      trim(String(get(inviteDraft, "agreedAmount", ""))) !== "";
    const amount = hasAgreedAmount
      ? Number(get(inviteDraft, "agreedAmount"))
      : null;
    if (hasAgreedAmount && (!Number.isFinite(amount) || amount < 0)) {
      toast.error("Kelishilgan summani to'g'ri kiriting");
      return;
    }

    const normalizedSchedule = filter(
      get(inviteDraft, "trainingSchedule", []),
      (slot) => get(slot, "day") && get(slot, "time"),
    );

    if (size(normalizedSchedule) === 0) {
      toast.error("Kamida bitta mashg'ulot kuni va soatini kiriting");
      return;
    }

    await inviteClient({
      contactMethod: toUpper(get(inviteDraft, "contactMethod", "")),
      identifier: trim(get(inviteDraft, "identifier", "")),
      agreedAmount: hasAgreedAmount ? amount : undefined,
      paymentDay: get(inviteDraft, "paymentDay") ? Number(get(inviteDraft, "paymentDay")) : undefined,
      trainingSchedule: normalizedSchedule,
      notes: trim(get(inviteDraft, "notes", "")),
    });

    toast.success("Taklif yuborildi");
    resetInviteFlow();
  }, [inviteClient, inviteDraft, resetInviteFlow]);

  const handleCancelInvitation = React.useCallback(
    async (invitationId) => {
      await cancelInvitation(invitationId);
      toast.success("Taklif bekor qilindi");
      if (activeInvitationId === invitationId) {
        setActiveInvitationId(null);
      }
    },
    [activeInvitationId, cancelInvitation],
  );

  const openPaymentDrawer = React.useCallback((client) => {
    setPaymentClient(client);
    const hasAgreedAmount = !isNil(get(client, "agreedAmount"));
    setPaymentAmount(
      hasAgreedAmount ? String(get(client, "agreedAmount")) : "",
    );
    setPaymentPaidAt(new slice(Date().toISOString(), 0, 10));
    setPaymentNote("");
  }, []);

  const openPaymentDayDrawer = React.useCallback((client) => {
    setPaymentDayClient(client);
    setPaymentDay(
      get(client, "paymentSummary.dayOfMonth")
        ? String(get(client, "paymentSummary.dayOfMonth"))
        : "",
    );
  }, []);

  const handleSaveClientPayment = React.useCallback(async () => {
    if (!get(paymentClient, "id")) return;
    if (!isPaymentAmountValid) {
      toast.error("To'lov summasini to'g'ri kiriting.");
      return;
    }

    try {
      await markClientPayment(paymentClient.id, {
        amount: hasPaymentAmount ? Math.round(paymentAmountNumber) : undefined,
        paidAt: paymentPaidAt || undefined,
        note: trim(paymentNote) || undefined,
      });
      toast.success("To'lov qo'shildi.");
      setPaymentClient(null);
      setPaymentAmount("");
      setPaymentPaidAt("");
      setPaymentNote("");
    } catch (error) {
      toast.error(
        get(error, "response.data.message", "To'lovni saqlab bo'lmadi"),
      );
    }
  }, [
    hasPaymentAmount,
    isPaymentAmountValid,
    markClientPayment,
    paymentAmountNumber,
    paymentClient,
    paymentNote,
    paymentPaidAt,
  ]);

  const handleSavePaymentDay = React.useCallback(async () => {
    if (!get(paymentDayClient, "id")) return;

    try {
      await updateClientPricing(paymentDayClient.id, {
        paymentDay: paymentDay ? Number(paymentDay) : null,
      });
      toast.success(
        paymentDay ? "To'lov kuni yangilandi." : "To'lov kuni olib tashlandi.",
      );
      setPaymentDayClient(null);
    } catch (error) {
      toast.error(
        get(error, "response.data.message", "To'lov kunini saqlab bo'lmadi"),
      );
    }
  }, [paymentDay, paymentDayClient, updateClientPricing]);

  const handleCancelClientPayment = React.useCallback(async () => {
    if (
      !get(cancelPaymentTarget, "clientId") ||
      !get(cancelPaymentTarget, "paymentId")
    )
      return;

    try {
      await cancelClientPayment(
        cancelPaymentTarget.clientId,
        cancelPaymentTarget.paymentId,
        {},
      );
      toast.success("To'lov bekor qilindi.");
      setCancelPaymentTarget(null);
    } catch (error) {
      toast.error(
        get(error, "response.data.message", "To'lovni bekor qilib bo'lmadi"),
      );
    }
  }, [cancelClientPayment, cancelPaymentTarget]);

  const paymentToCancel = React.useMemo(() => {
    if (!cancelPaymentTarget) return null;
    const client = find(clients, { id: cancelPaymentTarget.clientId });
    if (!client) return null;
    return find(get(client, "payments", []), {
      id: cancelPaymentTarget.paymentId,
    });
  }, [cancelPaymentTarget, clients]);

  const columns = React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => <DataGridTableRowSelectAll table={table} />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        size: 40,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "expand",
        header: "",
        size: 52,
        cell: (info) => (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(event) => {
              event.stopPropagation();
              info.row.toggleExpanded();
            }}
          >
            {info.row.getIsExpanded() ? (
              <ChevronUpIcon className="size-4" />
            ) : (
              <ChevronDownIcon className="size-4" />
            )}
          </Button>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Mijoz" />
        ),
        enableSorting: true,
        size: 280,
        cell: ({ row }) => {
          const client = get(row, "original");
          const isInvitation = get(client, "entityType") === "invitation";

          return (
            <div className="flex items-center gap-4 py-1 pr-4">
              <Avatar className="size-10 border shadow-sm shrink-0">
                <AvatarImage
                  src={get(client, "avatar")}
                  alt={get(client, "name")}
                />
                <AvatarFallback className="bg-primary/5 text-primary font-semibold">
                  {getInitials(get(client, "name")) || "M"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex flex-col gap-0.5">
                <button
                  type="button"
                  className="flex items-center text-left hover:underline text-primary w-full max-w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setClientId(get(client, "id"));
                  }}
                >
                  <span className="truncate font-semibold text-foreground text-sm tracking-tight">
                    {get(client, "name")}
                  </span>
                </button>
                <div className="flex flex-col gap-1 text-[11px] text-muted-foreground leading-none">
                  <div className="flex items-center gap-2 truncate">
                    {get(client, "email") && (
                      <span className="truncate">{get(client, "email")}</span>
                    )}
                    {get(client, "email") && get(client, "phone") && (
                      <span className="text-border">•</span>
                    )}
                    {get(client, "phone") && (
                      <span className="shrink-0">{get(client, "phone")}</span>
                    )}
                  </div>
                  {isInvitation && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge
                        variant="outline"
                        className="h-4 px-1.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border-amber-500/20"
                      >
                        {get(client, "contactMethod", "Taklif")} orqali
                      </Badge>
                      {get(client, "status") === "declined" &&
                        get(client, "declineReason") && (
                          <Badge
                            variant="outline"
                            className="h-4 px-1.5 text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 border-rose-500/20"
                          >
                            Rad etildi
                          </Badge>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        },
        meta: {
          expandedContent: (client) => {
            if (get(client, "entityType") === "invitation") {
              return (
                <div className="px-14 py-4 space-y-4 bg-muted/20 border-t">
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Aloqa usuli
                      </p>
                      <p className="text-sm font-medium">
                        {get(
                          find(
                            INVITE_METHOD_OPTIONS,
                            (o) =>
                              get(o, "value") === get(client, "contactMethod"),
                          ),
                          "label",
                          "—",
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Qiymat</p>
                      <p className="text-sm font-medium">
                        {get(client, "identifierValue", "—")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Tarif / summa
                      </p>
                      <p className="text-sm font-medium">
                        {get(client, "agreedAmount")
                          ? `${new Intl.NumberFormat("uz-UZ").format(get(client, "agreedAmount"))} so'm`
                          : "Kelishuv yo'q"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Mo'ljaldagi to'lov kuni
                      </p>
                      <p className="text-sm font-medium">
                        {formatPaymentDay(get(client, "paymentDate"))}
                      </p>
                    </div>
                  </div>
                  {get(client, "notes") ? (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Coach izohi
                      </p>
                      <p className="text-sm leading-relaxed">
                        {get(client, "notes")}
                      </p>
                    </div>
                  ) : null}
                  {get(client, "declineReason") ? (
                    <div className="p-3 bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-xl">
                      <p className="text-xs font-semibold mb-1">
                        Mijozning rad formasi (yoki izohi)
                      </p>
                      <p className="text-sm">{get(client, "declineReason")}</p>
                    </div>
                  ) : null}
                  {isArray(get(client, "trainingSchedule")) &&
                  size(get(client, "trainingSchedule")) > 0 ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Mo'ljaldagi jadval
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {map(get(client, "trainingSchedule"), (slot, i) => (
                          <div
                            key={i}
                            className="px-3 py-1.5 rounded-full border bg-background text-xs"
                          >
                            <span className="font-medium">
                              {get(
                                find(
                                  WEEKDAY_OPTIONS,
                                  (o) => o.value === get(slot, "day"),
                                ),
                                "label",
                                get(slot, "day"),
                              )}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              · {get(slot, "time")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            }

            return (
              <div className="px-14 py-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 bg-muted/20 border-t items-start">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Faol rejalari
                  </p>
                  <p className="text-sm">
                    {get(
                      client,
                      "activePlanName",
                      "Siz hali mijozi reja biriktirmadingiz.",
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Salomatlik / Maqsad
                  </p>
                  <p className="text-sm">
                    {get(client, "goal", "Maqsad belgilanmagan")}
                  </p>
                  {get(client, "currentWeight") ||
                  get(client, "targetWeight") ? (
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      {get(client, "currentWeight") ? (
                        <span>O'z vazni: {get(client, "currentWeight")}kg</span>
                      ) : null}
                      {get(client, "currentWeight") &&
                      get(client, "targetWeight") ? (
                        <span className="text-border">•</span>
                      ) : null}
                      {get(client, "targetWeight") ? (
                        <span>
                          Target vazn: {get(client, "targetWeight")}kg
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Progress
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all text-xs",
                          normalizeProgress(get(client, "progress")) >= 75
                            ? "bg-green-500"
                            : normalizeProgress(get(client, "progress")) >= 40
                              ? "bg-amber-500"
                              : "bg-slate-400",
                        )}
                        style={{
                          width: `${normalizeProgress(get(client, "progress"))}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold">
                      {normalizeProgress(get(client, "progress"))}%
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    To'lov holati
                  </p>
                  {get(client, "paymentSummary.label") ? (
                    <div className="text-sm">
                      {get(client, "paymentSummary.label")} (
                      {get(client, "paymentSummary.dayOfMonth")
                        ? `${get(client, "paymentSummary.dayOfMonth")}-kun`
                        : "Kun yo'q"}
                      )
                      <br />
                      {get(client, "agreedAmount") ? (
                        <span className="font-medium text-foreground">
                          {formatMoney(get(client, "agreedAmount"))}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm">To'lov ma'lumoti kiritilmagan.</p>
                  )}
                </div>
              </div>
            );
          },
        },
      },
      {
        accessorKey: "goal",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Maqsad" />
        ),
        enableSorting: true,
        size: 180,
        cell: ({ row }) => {
          const item = row.original;

          if (item.entityType === "invitation") {
            return (
              <div className="space-y-1.5 py-1">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    Narxi:
                  </span>
                  <p className="font-bold text-sm text-foreground">
                    {item.agreedAmount
                      ? `${new Intl.NumberFormat("uz-UZ").format(item.agreedAmount)} so'm`
                      : "Kelishilmagan"}
                  </p>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    To'lov:
                  </span>
                  <p className="text-xs font-medium text-muted-foreground">
                    {formatPaymentDay(item.paymentDate)}
                  </p>
                </div>
              </div>
            );
          }

          return item.goal ? (
            <Badge
              variant="outline"
              className="rounded-lg bg-primary/5 text-primary border-primary/20 font-medium"
            >
              {item.goal}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs italic">
              Belgilanmagan
            </span>
          );
        },
      },
      {
        id: "weight",
        accessorFn: (row) => Number(get(row, "currentWeight", 0)),
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Vazn" />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const client = get(row, "original");

          return (
            <div className="space-y-1">
              <p className="font-medium text-sm">
                {get(client, "currentWeight")
                  ? `${get(client, "currentWeight")} kg`
                  : "—"}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "progress",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Progress" />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          if (row.original.entityType === "invitation") {
            return <span className="text-muted-foreground">—</span>;
          }

          const progress = normalizeProgress(row.original.progress);

          return (
            <div className="min-w-28 space-y-1.5 py-1">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    progress >= 75
                      ? "bg-green-500"
                      : progress >= 40
                        ? "bg-amber-500"
                        : "bg-slate-400",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        id: "payment",
        header: "To'lov",
        cell: ({ row }) => {
          const item = get(row, "original");

          if (get(item, "entityType") !== "client") {
            return <span className="text-muted-foreground">—</span>;
          }

          const statusLabel = get(
            item,
            "paymentSummary.label",
            "Belgilanmagan",
          );
          const dayLabel = get(item, "paymentSummary.dayOfMonth")
            ? `${get(item, "paymentSummary.dayOfMonth")}-kun`
            : "Kun yo'q";

          return (
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {formatMoney(get(item, "agreedAmount"))}
              </p>
              <p className="text-xs text-muted-foreground">{statusLabel}</p>
              <p className="text-xs text-muted-foreground">{dayLabel}</p>
            </div>
          );
        },
      },
      {
        accessorKey: "activePlanName",
        header: "Reja",
        cell: ({ row }) => {
          if (get(row, "original.entityType") !== "client") {
            return <span className="text-muted-foreground">—</span>;
          }
          return get(row, "original.activePlanName") ? (
            <Badge
              variant="outline"
              className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
            >
              Biriktirilgan
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-slate-500/10 text-slate-500 border-slate-200 dark:border-slate-700"
            >
              Biriktirilmagan
            </Badge>
          );
        },
      },
      {
        accessorKey: "lastActivityDate",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="So'nggi faollik" />
        ),
        enableSorting: true,
        cell: ({ row }) =>
          row.original.entityType === "invitation"
            ? `Taklif: ${formatDate(row.original.createdAt)}`
            : formatDate(row.original.lastActivityDate),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Status" />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const status = get(row, "original.status");

          return (
            <Badge
              variant="outline"
              className={get(statusConfig, `${status}.className`)}
            >
              {get(statusConfig, `${status}.label`, status)}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 50,
        enableSorting: false,
        cell: ({ row }) => {
          const client = row.original;

          return (
            <div
              className="flex items-center justify-end"
              onClick={(event) => event.stopPropagation()}
            >
              <ClientActionsMenu
                client={client}
                onView={(c) => {
                  if (get(c, "entityType") === "client") {
                    setClientId(get(c, "id"));
                  } else {
                    setActiveInvitationId(get(c, "invitationId"));
                  }
                }}
                onPayment={openPaymentDrawer}
                onPaymentDay={openPaymentDayDrawer}
                onCancelPayment={(c) =>
                  setCancelPaymentTarget({
                    clientId: get(c, "id"),
                    clientName: get(c, "name"),
                    paymentId: get(c, "latestPayment.id", null),
                    paidAt: get(c, "latestPayment.paidAt", null),
                  })
                }
                onRemove={setRemoveCandidate}
                onResendInvite={handleResendInvite}
                onCancelInvitation={handleCancelInvitation}
                isInviting={isInviting}
                isCancellingPayment={isCancellingClientPayment}
                isRemoving={isRemovingClient}
                isCancellingInvitation={isCancellingInvitation}
                onAssignPlan={(c, type) => {
                  setActiveClientIds([get(c, "id")]);
                  setPlanType(type);
                  setIsPlanDrawerOpen(true);
                }}
              />
            </div>
          );
        },
      },
    ],
    [
      handleCancelInvitation,
      handleResendInvite,
      isCancellingClientPayment,
      isCancellingInvitation,
      isInviting,
      isRemovingClient,
      openPaymentDayDrawer,
      openPaymentDrawer,
      setClientId,
      setActiveClientIds,
      setPlanType,
      setIsPlanDrawerOpen,
    ],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    getRowCanExpand: () => true,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onSortingChange: handleSortingChange,
    state: {
      sorting,
      rowSelection,
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = size(selectedRows);

  const handleAddToGroup = React.useCallback(() => {
    const clientIds = map(
      filter(
        selectedRows,
        (row) => get(row, "original.entityType") === "client",
      ),
      (row) => get(row, "original.id"),
    );

    if (isEmpty(clientIds)) {
      toast.error("Faqat tasdiqlangan mijozlarni guruhga qo'shish mumkin");
      return;
    }

    if (selectedGroupId === "new") {
      setMemberSelectionIds(clientIds);
      setMemberSearch("");
      setIsGroupDrawerOpen(false);
      setIsCreateGroupDrawerOpen(true);
      return;
    }

    if (selectedGroupId) {
      addClientsToGroup(selectedGroupId, clientIds);
      toast.success("Mijozlar guruhga qo'shildi");
    } else {
      toast.error("Guruhni tanlang");
      return;
    }

    setIsGroupDrawerOpen(false);
    setRowSelection({});
    setSelectedGroupId("");
  }, [addClientsToGroup, selectedGroupId, selectedRows]);

  const handleNextCreateStep = () => {
    if (!trim(get({ v: newGroupName }, "v", ""))) {
      toast.error("Guruh nomini kiriting");
      return;
    }
    setIsCreateGroupDrawerOpen(false);
    setIsMemberSelectionDrawerOpen(true);
  };

  const handleCreateGroupWithClients = React.useCallback(async () => {
    if (isEmpty(memberSelectionIds)) {
      toast.error("Kamida bitta mijozni tanlang");
      return;
    }

    setIsSubmitting(true);
    try {
      await createGroupWithClients(
        newGroupName,
        newGroupDesc,
        memberSelectionIds,
      );
      toast.success("Yangi guruh yaratildi va mijozlar qo'shildi");

      setIsMemberSelectionDrawerOpen(false);
      setRowSelection({});
      setNewGroupName("");
      setNewGroupDesc("");
      setSelectedGroupId("");
      setMemberSelectionIds([]);
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  }, [createGroupWithClients, newGroupDesc, newGroupName, memberSelectionIds]);

  const filteredMembers = React.useMemo(() => {
    const query = toLower(trim(get({ v: memberSearch }, "v", "")));
    return filter(clients, (c) => {
      const name = toLower(get(c, "name", ""));
      const email = toLower(get(c, "email", ""));
      const phone = get(c, "phone", "");
      return (
        isEmpty(query) ||
        includes(name, query) ||
        includes(email, query) ||
        includes(phone, query)
      );
    });
  }, [clients, memberSearch]);

  const handlePlanAssigned = React.useCallback(() => {
    if (isEmpty(activeClientIds)) return;

    if (get({ v: planType }, "v") === "meal") {
      toast.success(
        size(activeClientIds) > 1
          ? `${size(activeClientIds)} ta mijozga ovqatlanish rejasi biriktirildi`
          : "Mijozga ovqatlanish rejasi biriktirildi",
      );
    } else {
      toast.success(
        size(activeClientIds) > 1
          ? `${size(activeClientIds)} ta mijozga mashg'ulot rejasi biriktirildi`
          : "Mijozga mashg'ulot rejasi biriktirildi",
      );
    }
    setIsPlanDrawerOpen(false);
    setActiveClientIds([]);
    setPlanType(null);
    setRowSelection({});
  }, [activeClientIds, planType]);

  const handleRemove = React.useCallback(async () => {
    if (!removeCandidate) {
      return;
    }

    await removeClient(removeCandidate.id);
    toast.success("Mijoz ro'yxatdan chiqarildi");
    setRemoveCandidate(null);
  }, [removeCandidate, removeClient]);

  return (
    <>
      <PageTransition>
        <div className="flex flex-col gap-6">
          <ClientFilterBar
            filterFields={filterFields}
            activeFilters={activeFilters}
            onFiltersChange={handleFiltersChange}
            isFetching={isFetching}
            onRefetch={() => refetch()}
            onInviteClick={() => {
              setInviteDraft(createInviteDraft());
              setInviteStep("method");
            }}
          />

          <ClientListTable
            table={table}
            isLoading={isLoading}
            filteredRows={filteredRows}
            onRowDoubleClick={(row) => {
              if (row.entityType === "client") {
                void setClientId(row.id);
                return;
              }
              if (row.entityType === "invitation") {
                setActiveInvitationId(row.invitationId);
              }
            }}
          />
        </div>
      </PageTransition>

      <ClientInviteDrawer
        inviteStep={inviteStep}
        inviteDraft={inviteDraft}
        isInviting={isInviting}
        onReset={resetInviteFlow}
        onSetStep={setInviteStep}
        onUpdateDraft={updateInviteDraft}
        onUpdateTrainingSlot={updateTrainingSlot}
        onAddTrainingSlot={addTrainingSlot}
        onRemoveTrainingSlot={removeTrainingSlot}
        onSubmit={handleInvite}
        INVITE_METHOD_OPTIONS={INVITE_METHOD_OPTIONS}
        WEEKDAY_OPTIONS={WEEKDAY_OPTIONS}
        PAYMENT_DAY_OPTIONS={PAYMENT_DAY_OPTIONS_FOR_INVITE}
      />

      <Drawer
        open={Boolean(clientId)}
        onOpenChange={(open) => {
          if (!open) {
            void setClientId(null);
          }
        }}
        direction="right"
      >
        <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-full p-0">
          <div className="flex h-[100dvh] flex-col">
            <ClientDetailDrawerContent
              clientId={clientId}
              onClose={() => void setClientId(null)}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={Boolean(activeInvitation)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveInvitationId(null);
          }
        }}
        direction="right"
      >
        <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-xl p-0">
          {activeInvitation ? (
            <div className="flex h-[100dvh] flex-col">
              <DrawerHeader className="border-b px-6 py-5 text-left">
                <DrawerTitle>Taklif tafsilotlari</DrawerTitle>
                <DrawerDescription>
                  Yuborilgan shartlar va mijoz javobi shu yerda ko'rinadi.
                </DrawerDescription>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 rounded-3xl border px-5 py-5">
                    <Avatar className="size-14 border">
                      <AvatarImage
                        src={get(activeInvitation, "avatar")}
                        alt={get(activeInvitation, "name")}
                      />
                      <AvatarFallback>
                        {getInitials(get(activeInvitation, "name")) || "M"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">
                          {get(activeInvitation, "name")}
                        </h2>
                        <Badge
                          variant="outline"
                          className={get(statusConfig, [
                            get(activeInvitation, "status"),
                            "className",
                          ])}
                        >
                          {get(
                            statusConfig,
                            [get(activeInvitation, "status"), "label"],
                            get(activeInvitation, "status"),
                          )}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>{get(activeInvitation, "email") || "Email yo'q"}</p>
                        <p>
                          {get(activeInvitation, "phone") || "Telefon yo'q"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Card className="py-6">
                    <CardHeader>
                      <CardTitle>Kelishuv tafsilotlari</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Aloqa usuli
                        </p>
                        <p className="font-medium">
                          {get(
                            find(
                              INVITE_METHOD_OPTIONS,
                              (o) =>
                                get(o, "value") ===
                                get(activeInvitation, "contactMethod"),
                            ),
                            "label",
                            "—",
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Qiymat</p>
                        <p className="font-medium">
                          {get(activeInvitation, "identifierValue") || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Kelishilgan summa
                        </p>
                        <p className="font-medium">
                          {get(activeInvitation, "agreedAmount")
                            ? `${new Intl.NumberFormat("uz-UZ").format(
                                get(activeInvitation, "agreedAmount"),
                              )} so'm`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          To'lov kuni
                        </p>
                        <p className="font-medium">
                          {formatPaymentDay(
                            get(activeInvitation, "paymentDate"),
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="py-6">
                    <CardHeader>
                      <CardTitle>Mashg'ulotlar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Array.isArray(
                        get(activeInvitation, "trainingSchedule"),
                      ) &&
                      size(get(activeInvitation, "trainingSchedule")) > 0 ? (
                        map(
                          get(activeInvitation, "trainingSchedule"),
                          (slot, index) => (
                            <div
                              key={`${get(slot, "day")}-${get(slot, "time")}-${index}`}
                              className="rounded-2xl border px-4 py-3 text-sm"
                            >
                              <span className="font-medium">
                                {get(
                                  find(
                                    WEEKDAY_OPTIONS,
                                    (option) =>
                                      get(option, "value") === get(slot, "day"),
                                  ),
                                  "label",
                                  get(slot, "day"),
                                )}
                              </span>
                              <span className="text-muted-foreground">
                                {" "}
                                · {get(slot, "time")}
                              </span>
                            </div>
                          ),
                        )
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Mashg'ulot jadvali yo'q.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="py-6">
                    <CardHeader>
                      <CardTitle>Izoh va javob</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Coach izohi
                        </p>
                        <p className="font-medium">
                          {get(activeInvitation, "notes") || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Mijoz javobi
                        </p>
                        <p className="font-medium">
                          {get(activeInvitation, "declineReason") ||
                            "Javob qoldirilmagan"}
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Yuborilgan sana
                          </p>
                          <p className="font-medium">
                            {formatDate(get(activeInvitation, "createdAt"))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Javob sanasi
                          </p>
                          <p className="font-medium">
                            {formatDate(get(activeInvitation, "respondedAt"))}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <DrawerFooter className="border-t px-6 py-4">
                {get(activeInvitation, "status") === "declined" ||
                get(activeInvitation, "status") === "inactive" ? (
                  <Button
                    disabled={isInviting}
                    onClick={async () => {
                      await handleResendInvite(activeInvitation);
                      setActiveInvitationId(null);
                    }}
                  >
                    <RotateCcwIcon data-icon="inline-start" />
                    Qayta yuborish
                  </Button>
                ) : null}
                {activeInvitation.status === "pending" ? (
                  <Button
                    variant="destructive"
                    disabled={isCancellingInvitation}
                    onClick={async () => {
                      await handleCancelInvitation(
                        activeInvitation.invitationId,
                      );
                    }}
                  >
                    Taklifni bekor qilish
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  onClick={() => setActiveInvitationId(null)}
                >
                  Yopish
                </Button>
              </DrawerFooter>
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>

      <Drawer
        open={Boolean(paymentClient)}
        onOpenChange={(open) => !open && setPaymentClient(null)}
        direction="bottom"
      >
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader>
            <DrawerTitle>Mijoz to&apos;lovini qo&apos;shish</DrawerTitle>
            <DrawerDescription>
              {get(paymentClient, "name")} uchun qo&apos;lda to&apos;lov
              yozuvini kiriting.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <Label>To&apos;lov summasi (so&apos;m)</Label>
              <NumberField
                minValue={0}
                step={10000}
                value={paymentAmount !== "" ? Number(paymentAmount) : undefined}
                onValueChange={(value) => {
                  setPaymentAmount(
                    value !== undefined ? String(Math.round(value)) : "",
                  );
                }}
                formatOptions={{
                  useGrouping: true,
                  maximumFractionDigits: 0,
                }}
              >
                <NumberFieldGroup className="h-11 rounded-2xl bg-card">
                  <NumberFieldDecrement className="rounded-s-2xl px-3" />
                  <NumberFieldInput
                    className="px-3 text-sm"
                    placeholder="Masalan: 500000"
                  />
                  <NumberFieldIncrement className="rounded-e-2xl px-3" />
                </NumberFieldGroup>
              </NumberField>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach-client-payment-date">
                To&apos;lov sanasi
              </Label>
              <Input
                id="coach-client-payment-date"
                type="date"
                value={paymentPaidAt}
                onChange={(event) => setPaymentPaidAt(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach-client-payment-note">Izoh</Label>
              <Textarea
                id="coach-client-payment-note"
                value={paymentNote}
                onChange={(event) => setPaymentNote(event.target.value)}
                placeholder="Masalan, naqd to'lov qilindi"
              />
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={handleSaveClientPayment}
              disabled={isMarkingClientPayment || !isPaymentAmountValid}
            >
              {isMarkingClientPayment ? "Saqlanmoqda..." : "To'lov qo'shish"}
            </Button>
            <Button variant="outline" onClick={() => setPaymentClient(null)}>
              Bekor qilish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={Boolean(paymentDayClient)}
        onOpenChange={(open) => !open && setPaymentDayClient(null)}
        direction="bottom"
      >
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader>
            <DrawerTitle>To&apos;lov kunini belgilash</DrawerTitle>
            <DrawerDescription>
              {get(paymentDayClient, "name")} uchun oylik to&apos;lov kunini
              tanlang.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <Label htmlFor="coach-client-payment-day-update">
                To&apos;lov kuni
              </Label>
              <select
                id="coach-client-payment-day-update"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
                value={paymentDay}
                onChange={(event) => setPaymentDay(event.target.value)}
              >
                <option value="">Belgilanmagan</option>
                {map(PAYMENT_DAY_OPTIONS, (option) => (
                  <option
                    key={get(option, "value")}
                    value={get(option, "value")}
                  >
                    {get(option, "label")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={handleSavePaymentDay}
              disabled={isUpdatingClientPricing}
            >
              {isUpdatingClientPricing ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            <Button variant="outline" onClick={() => setPaymentDayClient(null)}>
              Bekor qilish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={Boolean(cancelPaymentTarget)}
        onOpenChange={(open) => !open && setCancelPaymentTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>To&apos;lovni bekor qilish</AlertDialogTitle>
            <AlertDialogDescription>
              {get(cancelPaymentTarget, "clientName")} uchun oxirgi to&apos;lov
              yozuvi bekor qilinadi.
              {get(paymentToCancel, "paidAt")
                ? `${formatLongDate(get(paymentToCancel, "paidAt"))} to'lov yozuvi bekor qilinadi.`
                : "Ushbu to'lov yozuvi bekor qilinadi."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancellingClientPayment}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelClientPayment}
              disabled={isCancellingClientPayment}
            >
              {isCancellingClientPayment ? "Saqlanmoqda..." : "Tasdiqlash"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(removeCandidate)}
        onOpenChange={(open) => !open && setRemoveCandidate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mijozni ro'yxatdan chiqarish</AlertDialogTitle>
            <AlertDialogDescription>
              {get(removeCandidate, "name")} coach ro'yxatidan chiqariladi.
              Coachga bog'liq rejalari userda saqlanadi, lekin endi sync
              bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingClient}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isRemovingClient}
            >
              Davom etish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isPortalReady && selectedCount > 0
        ? createPortal(
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
              <div className="pointer-events-auto flex w-full max-w-6xl items-center gap-4 rounded-xl border bg-background px-6 py-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <Badge className="h-7 px-3 font-semibold">
                    {selectedCount} ta tanlandi
                  </Badge>
                </div>
                <div className="h-6 w-px bg-border mx-2" />
                <Button
                  size="sm"
                  className="rounded-lg h-9 font-semibold gap-2 transition-all hover:scale-105 active:scale-95 shadow-sm active:shadow-none"
                  onClick={() => setIsGroupDrawerOpen(true)}
                >
                  <UsersIcon className="size-4" />
                  Guruhga qo'shish
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg h-9 font-semibold gap-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all"
                  onClick={() => {
                    const clientIds = map(
                      filter(
                        selectedRows,
                        (row) => get(row, "original.entityType") === "client",
                      ),
                      (row) => get(row, "original.id"),
                    );
                    setActiveClientIds(clientIds);
                    setPlanType("workout");
                    setIsPlanDrawerOpen(true);
                  }}
                >
                  <DumbbellIcon className="size-4 text-primary" />
                  Mashg'ulot rejasi
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg h-9 font-semibold gap-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all"
                  onClick={() => {
                    const clientIds = map(
                      filter(
                        selectedRows,
                        (row) => get(row, "original.entityType") === "client",
                      ),
                      (row) => get(row, "original.id"),
                    );
                    setActiveClientIds(clientIds);
                    setPlanType("meal");
                    setIsPlanDrawerOpen(true);
                  }}
                >
                  <UtensilsIcon className="size-4 text-primary" />
                  Ovqatlanish rejasi
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-lg h-9 font-semibold"
                  onClick={() => setRowSelection({})}
                >
                  Tanlovni bekor qilish
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}

      <Drawer
        open={isGroupDrawerOpen}
        onOpenChange={(open) => !open && setIsGroupDrawerOpen(false)}
        direction="bottom"
      >
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader className="px-6 py-4">
            <DrawerTitle className="text-xl font-bold">
              Guruhga qo'shish
            </DrawerTitle>
            <DrawerDescription>
              Tanlangan {selectedCount} ta mijozni guruhga biriktiring
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="p-6 space-y-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center block">
                Guruhni tanlang
              </Label>
              <div className="grid gap-2">
                {map(groups, (group) => (
                  <button
                    key={get(group, "id")}
                    type="button"
                    onClick={() => setSelectedGroupId(String(get(group, "id")))}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                      selectedGroupId === String(get(group, "id"))
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50 border-input",
                    )}
                  >
                    <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <UsersIcon className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">
                        {get(group, "name")}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {size(get(group, "clientIds", []))} ta a'zo
                      </p>
                    </div>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setSelectedGroupId("new")}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all text-left border-dashed",
                    selectedGroupId === "new"
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50 border-input",
                  )}
                >
                  <div className="size-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <UserPlusIcon className="size-4 text-orange-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-orange-500">
                      Yangi guruh yaratish
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Mijozlar uchun yangi guruh ochish
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </DrawerBody>

          <DrawerFooter className="px-6 py-4">
            <Button
              className="w-full"
              size="lg"
              onClick={handleAddToGroup}
              disabled={!selectedGroupId}
            >
              Davom etish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={isCreateGroupDrawerOpen}
        onOpenChange={(open) => !open && setIsCreateGroupDrawerOpen(false)}
        direction="bottom"
      >
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader className="px-6 py-4">
            <DrawerTitle className="text-xl font-bold">
              Yangi guruh yaratish
            </DrawerTitle>
            <DrawerDescription>
              Yangi guruh ma'lumotlarini kiriting
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="p-6 space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="new-group-name"
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Guruh nomi
              </Label>
              <Input
                id="new-group-name"
                placeholder="Masalan: Ertalabki guruh"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="rounded-lg h-10"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="new-group-desc"
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Tavsif (ixtiyoriy)
              </Label>
              <Textarea
                id="new-group-desc"
                placeholder="Guruh haqida qisqacha ma'lumot..."
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                className="rounded-lg min-h-[80px] resize-none"
              />
            </div>
          </DrawerBody>

          <DrawerFooter className="px-6 py-4">
            <Button className="w-full" size="lg" onClick={handleNextCreateStep}>
              Davom etish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={isMemberSelectionDrawerOpen}
        onOpenChange={(open) => !open && setIsMemberSelectionDrawerOpen(false)}
        direction="bottom"
      >
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader className="px-6 py-4">
            <DrawerTitle className="text-xl font-bold">
              Mijozlarni tanlang
            </DrawerTitle>
            <DrawerDescription>
              Guruhga qo&apos;shish uchun mijozlarni tanlang.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="p-6 space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Mijozni qidirish..."
                className="pl-9 rounded-xl h-10"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {map(filteredMembers, (client) => {
                const isSelected = includes(
                  memberSelectionIds,
                  get(client, "id"),
                );
                return (
                  <div
                    key={get(client, "id")}
                    onClick={() => {
                      setMemberSelectionIds((p) =>
                        isSelected
                          ? filter(p, (id) => id !== get(client, "id"))
                          : [...p, get(client, "id")],
                      );
                    }}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/50 hover:bg-muted/30",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 border shadow-sm">
                        <AvatarImage
                          src={get(client, "avatar")}
                          alt={get(client, "name")}
                        />
                        <AvatarFallback className="font-semibold text-xs text-muted-foreground">
                          {join(
                            map(split(get(client, "name", ""), " "), (n) =>
                              get(n, "[0]"),
                            ),
                            "",
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold leading-tight">
                          {get(client, "name")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {get(client, "email") ||
                            get(client, "phone") ||
                            "Kontakt yo'q"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "size-5 rounded-full border flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30",
                      )}
                    >
                      {isSelected && <CheckCircle2Icon className="size-3" />}
                    </div>
                  </div>
                );
              })}
              {isEmpty(filteredMembers) && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Mijozlar topilmadi.
                </div>
              )}
            </div>
          </DrawerBody>

          <DrawerFooter className="px-6 py-4">
            <Button
              className="w-full"
              size="lg"
              onClick={handleCreateGroupWithClients}
              disabled={isSubmitting}
            >
              Yaratish va qo'shish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={isPlanDrawerOpen}
        onOpenChange={setIsPlanDrawerOpen}
        direction="bottom"
      >
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader>
            <DrawerTitle>
              {planType === "meal" ? "Ovqatlanish" : "Mashg'ulot"} rejasini
              tanlang
            </DrawerTitle>
            <DrawerDescription>
              Ushbu reja mijozga individual tarzda biriktiriladi.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <div className="grid gap-2">
              {map(planType === "meal" ? mealPlans : workoutPlans, (plan) => (
                <button
                  key={get(plan, "id")}
                  onClick={() => handleAssignPlanToClient(get(plan, "id"))}
                  className="flex items-center justify-between p-4 rounded-2xl border border-border/50 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10">
                      {planType === "meal" ? (
                        <UtensilsIcon className="size-5 text-muted-foreground group-hover:text-primary" />
                      ) : (
                        <DumbbellIcon className="size-5 text-muted-foreground group-hover:text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{get(plan, "title")}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {get(plan, "description")}
                      </p>
                    </div>
                  </div>
                  <ArrowRightIcon className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </DrawerBody>
          <DrawerFooter className="px-6 py-4">
            <Button
              className="w-full"
              size="lg"
              onClick={() => setIsPlanDrawerOpen(false)}
            >
              Yopish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Index;
