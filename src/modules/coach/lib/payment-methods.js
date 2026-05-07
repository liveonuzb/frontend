export const COACH_PAYMENT_METHOD_OPTIONS = [
  { value: "CASH", label: "Naqd", shortLabel: "Naqd" },
  { value: "CARD", label: "Karta", shortLabel: "Karta" },
  { value: "CLICK", label: "Click", shortLabel: "Click" },
  { value: "PAYME", label: "Payme", shortLabel: "Payme" },
  { value: "BANK_TRANSFER", label: "Bank o'tkazmasi", shortLabel: "Bank" },
  { value: "OTHER", label: "Boshqa", shortLabel: "Boshqa" },
];

const METHOD_ALIASES = {
  BANK: "BANK_TRANSFER",
  BANK_TRANSFER: "BANK_TRANSFER",
  CARD: "CARD",
  CASH: "CASH",
  CLICK: "CLICK",
  HUMO: "CARD",
  KARTA: "CARD",
  OTHER: "OTHER",
  PAYME: "PAYME",
  TRANSFER: "BANK_TRANSFER",
  UZCARD: "CARD",
};

export const normalizeCoachPaymentMethod = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  return METHOD_ALIASES[normalized] || "";
};

export const getCoachPaymentMethodLabel = (value, key = "shortLabel") => {
  const normalized = normalizeCoachPaymentMethod(value);
  const option = COACH_PAYMENT_METHOD_OPTIONS.find(
    (item) => item.value === normalized,
  );

  return option?.[key] || option?.label || "Boshqa";
};
