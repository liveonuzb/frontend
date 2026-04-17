import { map, filter } from "lodash";

export const BRANCH_WORKING_DAY_OPTIONS = [
  { key: "monday", label: "Du", value: "Dushanba" },
  { key: "tuesday", label: "Se", value: "Seshanba" },
  { key: "wednesday", label: "Ch", value: "Chorshanba" },
  { key: "thursday", label: "Pa", value: "Payshanba" },
  { key: "friday", label: "Ju", value: "Juma" },
  { key: "saturday", label: "Sh", value: "Shanba" },
  { key: "sunday", label: "Ya", value: "Yakshanba" },
];

const DEFAULT_OPEN_TIME = "09:00";
const DEFAULT_CLOSE_TIME = "18:00";

export const createDefaultBranchWorkingHoursState = () =>
  map(BRANCH_WORKING_DAY_OPTIONS, (day) => ({
    day: day.value,
    enabled: false,
    open: DEFAULT_OPEN_TIME,
    close: DEFAULT_CLOSE_TIME,
  }));

export const hydrateBranchWorkingHoursState = (workingHours = []) => {
  const normalizedMap = new Map(
    map(
      filter(Array.isArray(workingHours) ? workingHours : [], (item) => item?.day),
      (item) => [String(item.day).trim().toLowerCase(), item],
    ),
  );
  const everyDayEntry =
    normalizedMap.get("har kuni") || normalizedMap.get("every day");

  return map(BRANCH_WORKING_DAY_OPTIONS, (day) => {
    const existingEntry =
      normalizedMap.get(day.value.toLowerCase()) || everyDayEntry || null;

    return {
      day: day.value,
      enabled: Boolean(existingEntry),
      open: existingEntry?.open || DEFAULT_OPEN_TIME,
      close: existingEntry?.close || DEFAULT_CLOSE_TIME,
    };
  });
};

export const serializeBranchWorkingHours = (workingHours = []) =>
  filter(
    map(
      filter(Array.isArray(workingHours) ? workingHours : [], (item) => item?.enabled),
      (item) => ({
        day: String(item.day || "").trim(),
        open: String(item.open || DEFAULT_OPEN_TIME).trim(),
        close: String(item.close || DEFAULT_CLOSE_TIME).trim(),
      }),
    ),
    (item) => item.day,
  );
