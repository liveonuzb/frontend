import { map, join, take } from "lodash";

export const SESSION_STATUS_META = {
  proposed: {
    label: "Tanlov kutilmoqda",
    className:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  scheduled: {
    label: "Band qilingan",
    className:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  completed: {
    label: "Tugallangan",
    className:
      "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
  },
  cancelled: {
    label: "Bekor qilingan",
    className:
      "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
};

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

export const formatSessionSchedule = (session) => {
  const dateLabel = formatSessionDate(session?.date);
  const slotLabel = session?.selectedSlot
    ? `${session.selectedSlot}`
    : Array.isArray(session?.slots) && session.slots.length > 0
      ? `${session.slots.length} ta variant`
      : "Vaqt yo'q";
  return `${dateLabel} • ${slotLabel}`;
};

export const getSessionCounterparty = (session, role) =>
  role === "coach" ? session?.client : session?.coach;

export const getInitials = (value = "") =>
  join(take(map(String(value).split(" "), (part) => part[0]), 2), "").toUpperCase();
