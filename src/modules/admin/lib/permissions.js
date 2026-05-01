import { useAuthStore } from "@/store";
import { get } from "lodash";
import { useGetQuery } from "@/hooks/api";

const CAPABILITY_ROLES = {
  "admin.read": [
    "SUPER_ADMIN",
    "CONTENT_MANAGER",
    "SUPPORT",
    "FINANCE",
    "GROWTH",
    "READONLY_ADMIN",
  ],
  "content.read": ["SUPER_ADMIN", "CONTENT_MANAGER", "READONLY_ADMIN"],
  "content.manage": ["SUPER_ADMIN", "CONTENT_MANAGER"],
  "support.read": ["SUPER_ADMIN", "SUPPORT", "READONLY_ADMIN"],
  "support.manage": ["SUPER_ADMIN", "SUPPORT"],
  "finance.read": ["SUPER_ADMIN", "FINANCE", "READONLY_ADMIN"],
  "finance.manage": ["SUPER_ADMIN", "FINANCE"],
  "growth.read": ["SUPER_ADMIN", "GROWTH", "FINANCE", "READONLY_ADMIN"],
  "growth.manage": ["SUPER_ADMIN", "GROWTH"],
  "settings.manage": ["SUPER_ADMIN"],
};

export const hasAdminCapability = (roles, capability) => {
  const allowedRoles = CAPABILITY_ROLES[capability] || [];
  if (!Array.isArray(roles) || !roles.length || !allowedRoles.length) {
    return false;
  }

  return roles.some((role) => allowedRoles.includes(role));
};

export const isSuperAdminRole = (roles) =>
  Array.isArray(roles) && roles.includes("SUPER_ADMIN");

export const useAdminPermissions = () => {
  const roles = useAuthStore((state) => state.roles ?? []);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSuperAdmin = isSuperAdminRole(roles);
  const isAdmin = roles.some((role) =>
    [
      "SUPER_ADMIN",
      "CONTENT_MANAGER",
      "SUPPORT",
      "FINANCE",
      "GROWTH",
      "READONLY_ADMIN",
    ].includes(role),
  );
  const { data, isLoading } = useGetQuery({
    url: "/admin/me/permissions",
    queryProps: {
      queryKey: ["admin", "me", "permissions", roles],
      enabled: Boolean(isAuthenticated && isAdmin),
      staleTime: 60_000,
    },
  });
  const backendCapabilities = get(data, "data.data.capabilities");
  const capabilitySet = Array.isArray(backendCapabilities)
    ? new Set(backendCapabilities)
    : null;
  const hasCapability = (capability) =>
    capabilitySet
      ? capabilitySet.has(capability)
      : hasAdminCapability(roles, capability);

  return {
    roles,
    isSuperAdmin,
    isLoading,
    capabilities: backendCapabilities ?? [],
    canReadContent: hasCapability("content.read"),
    canManageContent: hasCapability("content.manage"),
    canReadSupport: hasCapability("support.read"),
    canManageSupport: hasCapability("support.manage"),
    canReadFinance: hasCapability("finance.read"),
    canManageFinance: hasCapability("finance.manage"),
    canReadGrowth: hasCapability("growth.read"),
    canManageGrowth: hasCapability("growth.manage"),
    canManageSettings: hasCapability("settings.manage"),
    hasCapability,
  };
};
