import { filter, includes, isArray, uniq } from "lodash";

const roleColors = {
  USER: "secondary",
  COACH: "default",
  SUPER_ADMIN: "outline",
};

const roleBgColors = {
  USER: "",
  COACH:
    "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  SUPER_ADMIN:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
};

const roleLabels = {
  USER: "User",
  COACH: "Coach",
  SUPER_ADMIN: "Super Admin",
};

const PRIVILEGED_ROLES = ["SUPER_ADMIN"];

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

const coachStatusConfig = {
  approved: {
    label: "Coach tasdiqlangan",
    className:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  pending: {
    label: "Coach kutilmoqda",
    className:
      "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  rejected: {
    label: "Coach rad etilgan",
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
  const total = String(id)
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarColors[total % avatarColors.length];
};

const getInitials = (firstName, lastName) =>
  `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

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

  const normalized = value.toLowerCase();

  if (normalized.includes("iphone")) return "iPhone";
  if (normalized.includes("ipad")) return "iPad";
  if (normalized.includes("android")) return "Android";
  if (normalized.includes("mac os") || normalized.includes("macintosh")) {
    return "Mac";
  }
  if (normalized.includes("windows")) return "Windows";
  if (normalized.includes("linux")) return "Linux";

  return value;
};

const formatNumber = (value) =>
  new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

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
  coachStatusConfig,
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
