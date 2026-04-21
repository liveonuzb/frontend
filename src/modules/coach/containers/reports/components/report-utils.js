import { get } from "lodash";

export const REPORT_TYPES = [
  { value: "business_report_pdf", label: "Business PDF", extension: "PDF" },
  { value: "client_progress_pdf", label: "Client progress PDF", extension: "PDF" },
  { value: "clients_csv", label: "Clients CSV", extension: "CSV" },
  { value: "sessions_csv", label: "Sessions CSV", extension: "CSV" },
];

export const REPORT_TYPE_LABELS = Object.fromEntries(
  REPORT_TYPES.map((item) => [item.value, item.label]),
);

export const resolveHistoryItems = (data) => get(data, "data.items", []);
export const resolveHistoryMeta = (data) =>
  get(data, "data.meta", { total: 0, page: 1, pageSize: 10, totalPages: 1 });

export const formatReportDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};
