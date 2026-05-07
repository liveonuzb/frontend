import { get } from "lodash";
import { normalizeCoachPaymentMethod } from "@/modules/coach/lib/payment-methods";

export const LARGE_PAYMENT_AMOUNT = 5000000;

export const formatMoney = (value) => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return "Kelishiladi";
  }
  return `${new Intl.NumberFormat("uz-UZ").format(normalized)} so'm`;
};

export const parseCurrencyAmount = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";

  return String(Number(digits));
};

export const formatCurrencyInput = (value) => {
  const parsed = parseCurrencyAmount(value);
  if (!parsed) return "";

  return new Intl.NumberFormat("uz-UZ").format(Number(parsed));
};

export const toPositiveAmount = (value) => {
  const amount = Number(parseCurrencyAmount(value));
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

export const formatDate = (value) => {
  if (!value) return "Belgilanmagan";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belgilanmagan";

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const formatDuePeriod = (due) => {
  if (!due) return "";
  return `${formatDate(due.periodStart)} - ${formatDate(due.periodEnd)}`;
};

export const getDueRemainingAmount = (due) =>
  Math.max(Number(get(due, "remainingAmount", 0)), 0);

export const getClientExpectedAmount = (client) =>
  Math.max(
    Number(
      get(client, "paymentSummary.remainingAmount") ??
        get(client, "paymentSummary.price") ??
        get(client, "paymentSummary.agreedAmount") ??
        get(client, "agreedAmount") ??
        0,
    ),
    0,
  );

export const unwrapMutationPayload = (response) =>
  get(response, "data.data", get(response, "data", response));

export const buildDuplicatePaymentWarning = ({
  payments = [],
  selectedClientId,
  selectedClientName,
  paymentAmount,
  paymentMethod,
  selectedPaymentDueId,
}) => {
  const amount = Number(paymentAmount);
  if (!selectedClientId || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const normalizedMethod = normalizeCoachPaymentMethod(paymentMethod) || "OTHER";
  const normalizedName = String(selectedClientName || "").trim().toLowerCase();
  const duplicate = payments.find((payment) => {
    const paymentClientId = String(get(payment, "client.id", ""));
    const paymentClientName = String(get(payment, "client.name", ""))
      .trim()
      .toLowerCase();
    const sameClient =
      paymentClientId === String(selectedClientId) ||
      (normalizedName && paymentClientName === normalizedName);
    const sameAmount = Number(payment.amount) === amount;
    const sameMethod =
      (normalizeCoachPaymentMethod(payment.method) || "OTHER") ===
      normalizedMethod;
    const sameDue = selectedPaymentDueId
      ? String(payment.paymentDueId || "") === String(selectedPaymentDueId)
      : true;

    return (
      sameClient &&
      sameAmount &&
      sameMethod &&
      sameDue &&
      !payment.cancelledAt &&
      !payment.refundedAt &&
      !payment.deletedAt
    );
  });

  if (!duplicate) return null;

  return {
    payment: duplicate,
    title: "Dublikat ehtimoli bor",
    description: `${formatMoney(amount)} ${normalizedMethod} orqali oldin qayd etilgan bo'lishi mumkin.`,
  };
};

export const buildAmountRisk = ({
  amount,
  expectedAmount = 0,
  previousAmount = 0,
  duplicateWarning,
  type = "payment",
}) => {
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    return null;
  }

  if (duplicateWarning) {
    return {
      severity: "warning",
      title: "Dublikatni tasdiqlang",
      description:
        "Bu to'lov mavjud yozuvga o'xshaydi. Davom etishdan oldin summa, mijoz va periodni tekshiring.",
      requiresConfirmation: true,
    };
  }

  if (normalizedAmount >= LARGE_PAYMENT_AMOUNT) {
    return {
      severity: "danger",
      title:
        type === "refund" ? "Katta refund summasi" : "Katta to'lov summasi",
      description: `${formatMoney(normalizedAmount)} uchun alohida tasdiq kerak.`,
      requiresConfirmation: true,
    };
  }

  if (
    expectedAmount > 0 &&
    normalizedAmount > Math.max(expectedAmount * 1.5, expectedAmount + 500000)
  ) {
    return {
      severity: "warning",
      title: "Summa kutilgandan yuqori",
      description: `Kutilgan qoldiq ${formatMoney(expectedAmount)}, kiritilgan summa ${formatMoney(normalizedAmount)}.`,
      requiresConfirmation: true,
    };
  }

  if (
    type === "edit" &&
    previousAmount > 0 &&
    normalizedAmount > Math.max(previousAmount * 2, previousAmount + 500000)
  ) {
    return {
      severity: "warning",
      title: "Keskin summa o'zgarishi",
      description: `Oldingi summa ${formatMoney(previousAmount)}, yangi summa ${formatMoney(normalizedAmount)}.`,
      requiresConfirmation: true,
    };
  }

  return null;
};
