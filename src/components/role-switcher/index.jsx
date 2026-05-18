import React, { useMemo } from "react";
import { filter, find, includes, keys, map, uniq, isArray } from "lodash";
import { useNavigate, useLocation } from "react-router";
import { 
    ChevronsUpDown, 
    CheckIcon, 
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/store";
import { ROLE_CONFIG } from "@/lib/role-config";

export { ROLE_CONFIG } from "@/lib/role-config";

const RoleSwitcher = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { isMobile } = useSidebar();
    const { roles, activeRole, setActiveRole } = useAuthStore();

    // Available roles — merge store roles with defined config
    const availableRoles = useMemo(() => {
        const configRoles = keys(ROLE_CONFIG);
        if (!isArray(roles) || roles.length === 0) {
            return ["USER"];
        }

        const userRoles = uniq([...roles, "USER"]);
        return filter(configRoles, (role) => includes(userRoles, role));
    }, [roles]);

    const currentPath = location.pathname;
    const currentRole = useMemo(() => {
        if (
            activeRole &&
            includes(availableRoles, activeRole) &&
            currentPath.startsWith(ROLE_CONFIG[activeRole].path)
        ) {
            return activeRole;
        }

        return (
            find(availableRoles, (role) =>
                currentPath.startsWith(ROLE_CONFIG[role].path),
            ) ||
            activeRole ||
            availableRoles[0] ||
            "USER"
        );
    }, [activeRole, availableRoles, currentPath]);

    const currentConfig = ROLE_CONFIG[currentRole] || ROLE_CONFIG.USER;
    const CurrentIcon = currentConfig.icon;

    const handleRoleSwitch = (role) => {
        setActiveRole(role);
        navigate(ROLE_CONFIG[role].path);
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                <CurrentIcon className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{t(`common.roles.${currentRole}.label`)}</span>
                                <span className="truncate text-xs">{t(`common.roles.${currentRole}.description`)}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        {map(availableRoles, (role) => {
                            const config = ROLE_CONFIG[role];
                            if (!config) return null;
                            const Icon = config.icon;
                            return (
                                <DropdownMenuItem
                                    key={role}
                                    className="gap-2 p-2"
                                    onClick={() => handleRoleSwitch(role)}
                                >
                                    <div className="flex size-6 items-center justify-center rounded-sm border">
                                        <Icon className="size-4 shrink-0" />
                                    </div>
                                    <span>{t(`common.roles.${role}.label`)}</span>
                                    {currentRole === role && (
                                        <CheckIcon className="ml-auto size-4" />
                                    )}
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
};

export default RoleSwitcher;
