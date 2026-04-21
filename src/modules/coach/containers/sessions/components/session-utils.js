import { get, groupBy, orderBy } from "lodash";

export const SESSION_STATUS_LABELS = {
  proposed: "Tanlov kutilmoqda",
  scheduled: "Band qilingan",
  completed: "Tugallangan",
  cancelled: "Bekor qilingan",
};

export const resolveListPayload = (data) => {
  const nestedList = get(data, "data.data");
  if (Array.isArray(nestedList)) return nestedList;

  const directList = get(data, "data");
  if (Array.isArray(directList)) return directList;

  return [];
};

export const resolveMeta = (data) =>
  get(data, "data.meta", { total: 0, page: 1, pageSize: 12, totalPages: 1 });

export const formatSessionDate = (value) => {
  if (!value) return "Sana belgilanmagan";

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("uz-UZ", {
    weekday: "short",
    day: "2-digit",
    month: "long",
  }).format(parsed);
};

export const groupSessionsByDate = (sessions = []) => {
  const grouped = groupBy(orderBy(sessions, ["date", "selectedSlot"], ["asc", "asc"]), "date");
  return Object.entries(grouped).map(([date, items]) => ({ date, items }));
};

export const buildSessionPayload = (values) => ({
  title: values.title.trim(),
  date: values.date,
  slots: [values.slot],
  slot: values.slot,
  durationMinutes: Number(values.durationMinutes) || 60,
  note: values.note?.trim() || undefined,
  timezone: values.timezone || "Asia/Tashkent",
});
