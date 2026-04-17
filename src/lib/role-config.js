import {
  ShieldCheckIcon,
  UserIcon,
  GraduationCapIcon,
  ArrowUpRightIcon,
} from "lucide-react";
import { filter, find } from "lodash";

export const ROLE_CONFIG = {
  SUPER_ADMIN: {
    label: "Super Admin",
    description: "Tizim boshqaruvi",
    icon: ShieldCheckIcon,
    path: "/admin",
  },
  COACH: {
    label: "Coach",
    description: "Murabbiy paneli",
    icon: GraduationCapIcon,
    path: "/coach",
  },
  USER: {
    label: "User",
    description: "Shaxsiy panel",
    icon: UserIcon,
    path: "/user",
  },
};

export const SELF_SERVICE_ROLE_OPTIONS = [
  {
    key: "COACH",
    slug: "coach",
    title: "Murabbiy bo'lish",
    description: "Klientlar bilan ishlash, marketplacega chiqish va coaching dashboard olish.",
    route: "/coach/onboarding",
    accent: "from-orange-500/20 via-amber-400/10 to-transparent",
    icon: GraduationCapIcon,
    badge: "Coach onboarding",
    bullets: [
      "Profil, tajriba va ixtisoslikni yig'adi",
      "Marketplace review opsiyasi bor",
      "Tugatgach coach panel ochiladi",
    ],
    cta: "Boshlash",
  },
];

export const getAvailableSelfServiceRoles = (roles) => {
  const currentRoles = new Set(Array.isArray(roles) ? roles : []);
  return filter(SELF_SERVICE_ROLE_OPTIONS, (item) => !currentRoles.has(item.key));
};

export const getSelfServiceRoleOption = (slug) =>
  find(SELF_SERVICE_ROLE_OPTIONS, (item) => item.slug === slug) || null;

export const RoleUpgradeActionIcon = ArrowUpRightIcon;
