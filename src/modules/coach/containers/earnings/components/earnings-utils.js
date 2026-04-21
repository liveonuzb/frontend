import {
  filter,
  get,
  groupBy,
  map,
  orderBy,
  reduce,
  round,
  size,
  take,
  toNumber,
} from "lodash";

export const STATUS_COLORS = {
  completed: "hsl(var(--primary))",
  pending: "var(--color-amber-500)",
  overdue: "var(--color-rose-500)",
  cancelled: "var(--color-zinc-400)",
  refunded: "var(--color-sky-500)",
};

export const STATUS_LABELS = {
  completed: "To'langan",
  pending: "Kutilmoqda",
  overdue: "Muddati o'tgan",
  cancelled: "Bekor qilingan",
  refunded: "Qaytarilgan",
};

export const formatMoney = (value, locale = "uz-UZ") => {
  const normalized = toNumber(value);
  if (!Number.isFinite(normalized) || normalized <= 0) return "0 so'm";
  return `${new Intl.NumberFormat(locale).format(round(normalized))} so'm`;
};

export const formatDate = (value, locale = "uz-UZ") => {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

export const resolveListPayload = (data) => {
  const nestedList = get(data, "data.data");
  if (Array.isArray(nestedList)) return nestedList;

  const directList = get(data, "data");
  if (Array.isArray(directList)) return directList;

  return [];
};

export const getGrowthTrend = (revenue = {}) => {
  const growth = toNumber(get(revenue, "growth", 0));
  if (growth === 0) return null;
  return { pct: Math.abs(growth), up: growth >= 0 };
};

export const buildMonthlyRevenueTrend = (payments = []) => {
  const completedPayments = filter(
    payments,
    (payment) =>
      get(payment, "status") === "completed" && get(payment, "paidAt"),
  );
  const grouped = groupBy(completedPayments, (payment) => {
    const date = new Date(get(payment, "paidAt"));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });

  return take(Object.keys(grouped).sort().reverse(), 6)
    .reverse()
    .map((key) => {
      const [year, month] = key.split("-");
      const label = new Intl.DateTimeFormat("uz-UZ", { month: "short" }).format(
        new Date(Number(year), Number(month) - 1),
      );
      const total = reduce(
        grouped[key],
        (sum, payment) => sum + toNumber(get(payment, "amount", 0)),
        0,
      );

      return { name: label, revenue: round(total) };
    });
};

export const buildStatusDistribution = (counts = {}) => {
  const entries = [
    {
      name: STATUS_LABELS.completed,
      status: "completed",
      value: toNumber(get(counts, "completed", 0)),
      fill: STATUS_COLORS.completed,
    },
    {
      name: STATUS_LABELS.pending,
      status: "pending",
      value: toNumber(get(counts, "pending", 0)),
      fill: STATUS_COLORS.pending,
    },
    {
      name: STATUS_LABELS.overdue,
      status: "overdue",
      value: toNumber(get(counts, "overdue", 0)),
      fill: STATUS_COLORS.overdue,
    },
    {
      name: STATUS_LABELS.cancelled,
      status: "cancelled",
      value: toNumber(get(counts, "cancelled", 0)),
      fill: STATUS_COLORS.cancelled,
    },
    {
      name: STATUS_LABELS.refunded,
      status: "refunded",
      value: toNumber(get(counts, "refunded", 0)),
      fill: STATUS_COLORS.refunded,
    },
  ];

  return filter(entries, (entry) => entry.value > 0);
};

export const buildRecentPayments = (payments = []) =>
  take(
    orderBy(
      payments,
      [(payment) => new Date(get(payment, "paidAt", 0))],
      ["desc"],
    ),
    8,
  );

export const buildCurrentMonthDailyRevenue = (payments = []) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const completedThisMonth = filter(payments, (payment) => {
    if (get(payment, "status") !== "completed" || !get(payment, "paidAt")) {
      return false;
    }

    const date = new Date(get(payment, "paidAt"));
    return date.getFullYear() === year && date.getMonth() === month;
  });
  const byDay = groupBy(completedThisMonth, (payment) =>
    new Date(get(payment, "paidAt")).getDate(),
  );

  return map(Array.from({ length: daysInMonth }, (_, index) => index + 1), (day) => ({
    day: `${day}`,
    revenue: round(
      reduce(
        byDay[day] || [],
        (sum, payment) => sum + toNumber(get(payment, "amount", 0)),
        0,
      ),
    ),
  }));
};

export const calculateAvgPaymentPerClient = (payments = []) => {
  const completedPayments = filter(payments, { status: "completed" });
  if (!size(completedPayments)) return 0;

  const totalRevenue = reduce(
    completedPayments,
    (sum, payment) => sum + toNumber(get(payment, "amount", 0)),
    0,
  );
  const uniqueClients = new Set(
    completedPayments.map(
      (payment) => get(payment, "client.id") || get(payment, "clientId"),
    ),
  );

  return uniqueClients.size > 0 ? round(totalRevenue / uniqueClients.size) : 0;
};

export const buildTopClients = (payments = []) => {
  const completedPayments = filter(payments, { status: "completed" });
  const grouped = groupBy(
    completedPayments,
    (payment) => get(payment, "client.id") || get(payment, "clientId"),
  );
  const clientRevenues = map(grouped, (clientPayments, clientId) => {
    const sample = clientPayments[0];

    return {
      id: clientId,
      name:
        get(sample, "client.fullName") ||
        get(sample, "client.name") ||
        "Noma'lum",
      total: reduce(
        clientPayments,
        (sum, payment) => sum + toNumber(get(payment, "amount", 0)),
        0,
      ),
      count: size(clientPayments),
    };
  });

  return take(orderBy(clientRevenues, ["total"], ["desc"]), 5);
};
