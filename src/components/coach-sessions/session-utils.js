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
  const timezone = session?.timezone ? ` (${session.timezone})` : "";
  return `${dateLabel} • ${slotLabel}${timezone}`;
};

export const getSessionCounterparty = (session, role) =>
  role === "coach" ? session?.client : session?.coach;

export const getInitials = (value = "") =>
  join(take(map(String(value).split(" "), (part) => part[0]), 2), "").toUpperCase();

const padIcs = (value) => String(value).padStart(2, "0");

const toIcsDate = (date) =>
  `${date.getUTCFullYear()}${padIcs(date.getUTCMonth() + 1)}${padIcs(date.getUTCDate())}T${padIcs(date.getUTCHours())}${padIcs(date.getUTCMinutes())}00Z`;

const escapeIcsText = (value = "") =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

export const getSessionStartDate = (session) => {
  if (session?.startsAt) {
    const parsed = new Date(session.startsAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (!session?.date || !session?.selectedSlot) return null;
  const parsed = new Date(`${session.date}T${session.selectedSlot}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const canExportSessionCalendar = (session) =>
  Boolean(getSessionStartDate(session) && session?.selectedSlot);

export const downloadSessionCalendarInvite = (session) => {
  const startsAt = getSessionStartDate(session);
  if (!startsAt) return false;

  const durationMinutes = Number(session?.durationMinutes) || 60;
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
  const title = session?.title || "Coach session";
  const description = [
    session?.note,
    session?.clientSummary,
    session?.timezone ? `Timezone: ${session.timezone}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  const fileName = `${String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "coach-session"}.ics`;
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LiveOn//Coach Session//EN",
    "BEGIN:VEVENT",
    `UID:${session?.id || session?.bookingId || Date.now()}@liveon`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(startsAt)}`,
    `DTEND:${toIcsDate(endsAt)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    description ? `DESCRIPTION:${escapeIcsText(description)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};
