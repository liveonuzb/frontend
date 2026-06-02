import {
  ShieldCheckIcon,
  UserIcon,
  ArrowUpRightIcon,
} from "lucide-react";
import filter from "lodash/filter";
import find from "lodash/find";
import isArray from "lodash/isArray";

export const ROLE_CONFIG = {
  SUPER_ADMIN: {
    label: "Super Admin",
    description: "Tizim boshqaruvi",
    icon: ShieldCheckIcon,
    path: "/admin",
  },
  CONTENT_MANAGER: {
    label: "Content manager",
    description: "Kontent boshqaruvi",
    icon: ShieldCheckIcon,
    path: "/admin",
  },
  SUPPORT: {
    label: "Support",
    description: "Foydalanuvchi yordami",
    icon: ShieldCheckIcon,
    path: "/admin",
  },
  FINANCE: {
    label: "Finance",
    description: "Moliya operatsiyalari",
    icon: ShieldCheckIcon,
    path: "/admin",
  },
  GROWTH: {
    label: "Growth",
    description: "Marketing va premium",
    icon: ShieldCheckIcon,
    path: "/admin",
  },
  READONLY_ADMIN: {
    label: "Readonly admin",
    description: "Faqat ko'rish",
    icon: ShieldCheckIcon,
    path: "/admin",
  },
  USER: {
    label: "User",
    description: "Shaxsiy panel",
    icon: UserIcon,
    path: "/user",
  },
};

export const SELF_SERVICE_ROLE_OPTIONS = [
];

export const getAvailableSelfServiceRoles = (roles) => {
  const currentRoles = new Set(isArray(roles) ? roles : []);
  return filter(SELF_SERVICE_ROLE_OPTIONS, (item) => !currentRoles.has(item.key));
};

export const getSelfServiceRoleOption = (slug) =>
  find(SELF_SERVICE_ROLE_OPTIONS, (item) => item.slug === slug) || null;

export const RoleUpgradeActionIcon = ArrowUpRightIcon;
