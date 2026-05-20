import { useAuthStore } from "@/store";
import { get, includes, isArray } from "lodash";
import { useGetQuery } from "@/hooks/api";

export const isSuperAdminRole = (roles) =>
  isArray(roles) && includes(roles, "SUPER_ADMIN");

export const hasAdminCapability = (roles, capability) =>
  isSuperAdminRole(roles) && Boolean(capability);

export const useAdminPermissions = () => {
  const roles = useAuthStore((state) => state.roles ?? []);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSuperAdmin = isSuperAdminRole(roles);
  const isAdmin = isSuperAdmin;
  const { data, isLoading } = useGetQuery({
    url: "/admin/me/permissions",
    queryProps: {
      queryKey: ["admin", "me", "permissions", roles],
      enabled: Boolean(isAuthenticated && isAdmin),
      staleTime: 60000,
    },
  });
  const backendCapabilities = get(data, "data.data.capabilities");
  const capabilitySet = isArray(backendCapabilities)
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
    canViewSensitiveSupportData: hasCapability("support.sensitive"),
    canBlockUsers: hasCapability("support.block"),
    canDeleteUsers: hasCapability("support.delete"),
    canExportUsers: hasCapability("support.export"),
    canRevokeUserSessions: hasCapability("support.revokeSession"),
    canReadFinance: hasCapability("finance.read"),
    canManageFinance: hasCapability("finance.manage"),
    canReadGrowth: hasCapability("growth.read"),
    canManageGrowth: hasCapability("growth.manage"),
    canGiftPremium: hasCapability("growth.gift"),
    canManageSettings: hasCapability("settings.manage"),
    hasCapability,
  };
};
