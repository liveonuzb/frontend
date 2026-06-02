import filter from "lodash/filter";
import includes from "lodash/includes";
import isArray from "lodash/isArray";
import uniq from "lodash/uniq";
import reduce from "lodash/reduce";
import toLower from "lodash/toLower";
import toNumber from "lodash/toNumber";
import toUpper from "lodash/toUpper";
import split from "lodash/split";

const roleColors = {
  USER: "secondary",
  SUPER_ADMIN: "outline",
  CONTENT_MANAGER: "outline",
  SUPPORT: "outline",
  FINANCE: "outline",
  GROWTH: "outline",
  READONLY_ADMIN: "outline",
  ADMIN: "outline",
  MODERATOR: "outline",
  NUTRITION_MANAGER: "outline",
  WORKOUT_MANAGER: "outline",
};

const roleBgColors = {
  USER: "",
  SUPER_ADMIN:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  CONTENT_MANAGER:
    "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",
  SUPPORT:
    "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
  FINANCE:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  GROWTH:
    "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800",
  READONLY_ADMIN:
    "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  ADMIN:
    "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  MODERATOR:
    "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800",
  NUTRITION_MANAGER:
    "bg-lime-500/10 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-800",
  WORKOUT_MANAGER:
    "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
};

const roleLabels = {
  USER: "User",
  SUPER_ADMIN: "Super Admin",
  CONTENT_MANAGER: "Content manager",
  SUPPORT: "Support",
  FINANCE: "Finance",
  GROWTH: "Growth",
  READONLY_ADMIN: "Readonly admin",
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  NUTRITION_MANAGER: "Nutrition manager",
  WORKOUT_MANAGER: "Workout manager",
};

const PRIVILEGED_ROLES = [
  "SUPER_ADMIN",
  "CONTENT_MANAGER",
  "SUPPORT",
  "FINANCE",
  "GROWTH",
  "READONLY_ADMIN",
  "ADMIN",
  "MODERATOR",
  "NUTRITION_MANAGER",
  "WORKOUT_MANAGER",
];

const statusConfig = {
  active: {
    label: "Faol",
    className:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  banned: {
    label: "Bloklangan",
    className:
      "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  inactive: {
    label: "Nofaol",
    className:
      "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  },
};

const premiumStatusConfig = {
  active: {
    label: "Premium faol",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  expired: {
    label: "Premium tugagan",
    className:
      "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
  cancelled: {
    label: "Premium bekor qilingan",
    className:
      "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  },
};

const sessionStatusConfig = {
  active: {
    label: "Faol",
    className:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  revoked: {
    label: "Bekor qilingan",
    className:
      "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  expired: {
    label: "Tugagan",
    className:
      "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
};

const avatarColors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-rose-500",
];

const getAvatarColor = (id) => {
  if (!id) return avatarColors[0];
  const total = reduce(split(String(id), ""), (sum, char) => sum + char.charCodeAt(0), 0);
  return avatarColors[total % avatarColors.length];
};

const getInitials = (firstName, lastName) =>
  toUpper(`${firstName?.[0] || ""}${lastName?.[0] || ""}`);

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("uz-UZ", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

const formatUserAgentLabel = (value) => {
  if (!value) {
    return "Noma'lum qurilma";
  }

  const normalized = toLower(value);

  if (includes(normalized, "iphone")) return "iPhone";
  if (includes(normalized, "ipad")) return "iPad";
  if (includes(normalized, "android")) return "Android";
  if (includes(normalized, "mac os") || includes(normalized, "macintosh")) {
    return "Mac";
  }
  if (includes(normalized, "windows")) return "Windows";
  if (includes(normalized, "linux")) return "Linux";

  return value;
};

const formatNumber = (value) =>
  new Intl.NumberFormat("uz-UZ").format(toNumber(value || 0));

const formatCurrency = (value = 0) => `${formatNumber(value)} so'm`;

const formatMetricValue = (value, suffix = "") =>
  value === null || value === undefined || value === ""
    ? "—"
    : `${value}${suffix}`;

const createInitialUserForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  roles: ["USER"],
});

const createInitialGiftForm = (planCode = "MONTHLY") => ({
  planCode,
  days: "",
  note: "",
});

const normalizeFormRoles = (roles) => {
  const nextRoles = isArray(roles) ? filter(roles, Boolean) : [];

  if (!includes(nextRoles, "USER")) {
    nextRoles.unshift("USER");
  }

  return uniq(nextRoles);
};

const toggleFormRole = (roles, role, checked) => {
  if (role === "USER") {
    return ["USER"];
  }

  let nextRoles = normalizeFormRoles(roles);

  if (checked) {
    nextRoles = uniq([...nextRoles, role, "USER"]);
  } else {
    nextRoles = filter(nextRoles, (r) => r !== role);
  }

  return normalizeFormRoles(nextRoles);
};

export {
  PRIVILEGED_ROLES,
  createInitialGiftForm,
  createInitialUserForm,
  formatCurrency,
  formatDateTime,
  formatMetricValue,
  formatNumber,
  formatUserAgentLabel,
  getAvatarColor,
  getInitials,
  normalizeFormRoles,
  premiumStatusConfig,
  roleBgColors,
  roleColors,
  roleLabels,
  sessionStatusConfig,
  statusConfig,
  toggleFormRole,
};
