import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  get,
  map,
  split,
  join,
  find,
  toUpper,
  filter,
  values as lodashValues,
  includes,
  isArray,
  keys,
  trim,
} from "lodash";
import {
  CheckIcon,
  ChevronRightIcon,
  MoonIcon,
  PaletteIcon,
  SunIcon,
  XIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GamificationBadges from "@/modules/user/components/gamification-badges";
import { Progress } from "@/components/ui/progress";
import {
  useBreadcrumbStore,
  useAuthStore,
  useAppModeStore,
  APP_MODES,
} from "@/store";
import ModeDrawer from "@/components/mode-drawer";
import ThemeDrawer from "@/components/theme-drawer";
import { useTheme } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import OnboardingHealthReportCard from "@/components/onboarding-health-report-card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DEFAULT_PROFILE_TAB,
  PROFILE_OVERVIEW_TAB,
  useProfileOverlay,
} from "@/modules/profile/hooks/use-profile-overlay";
import {
  normalizeProfileContentTab,
  normalizeProfileOverlayTab,
  isProfileNestedDrawerTab,
} from "@/modules/profile/lib/profile-tab-registry";
import { getStandaloneProfileTabPath } from "@/modules/profile/lib/profile-tab-navigation";
import { getUserOnboardingReportPath } from "@/lib/app-paths";
import useAppLanguages from "@/hooks/app/use-app-languages";
import { useLanguageStore } from "@/store";
import { ROLE_CONFIG } from "@/components/role-switcher";
import useProfileSettings, {
  getRequestErrorMessage,
} from "@/hooks/app/use-profile-settings";
import AccountDangerZone from "./account-danger-zone";
import { NotificationSettingsDrawer } from "./tabs/notifications-tab";
import { getProfileTabs } from "./profile-tabs";
import ProfileVitalsCard from "./profile-vitals-card";

const FALLBACK_LANGUAGES = [
  { code: "uz", name: "O'zbek tili", flag: "🇺🇿" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "en", name: "English", flag: "🇺🇸" },
];

const SETTINGS_GROUPS = [
  ["general", "health", "notifications"],
  ["privacy", "security"],
  ["premium", "referral"],
];
const EMPTY_PROFILE_SETTINGS = {};

const getProfileIdentity = (user) => {
  const firstName = get(user, "firstName", "");
  const lastName = get(user, "lastName", "");
  const username = get(user, "username", "");

  const displayName = trim(`${firstName} ${lastName}`) || username || "User";

  const initials = toUpper(join(
    map(split(displayName, " "), (part) => get(part, "[0]", "")),
    "",
  )
    .slice(0, 2));

  return { displayName, initials };
};

const getLanguageLabel = (languageCode) => {
  if (languageCode === "ru") {
    return "Русский";
  }

  if (languageCode === "en") {
    return "English";
  }

  return "O'zbek";
};

const getNotificationSettingsCount = (settings) => {
  const source = settings ?? {};

  return filter(
    lodashValues({
      emailMarketing: source.emailMarketing ?? true,
      emailWorkout: source.emailWorkout ?? true,
      pushMeal: source.pushMeal ?? true,
      pushWater: source.pushWater ?? false,
      pushProgress: source.pushProgress ?? true,
    }),
    Boolean,
  ).length;
};

const SettingsItem = ({
  icon: Icon,
  label,
  value,
  onClick,
  active = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex w-full items-center gap-3.5 px-6 py-4 text-left transition-colors sm:px-7",
      active ? "text-foreground" : "hover:bg-muted/40",
    )}
  >
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-4.5" />
    </div>
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span className="text-sm font-medium sm:text-[15px]">{label}</span>
      {value ? (
        <span className="ml-auto truncate text-xs text-muted-foreground sm:text-sm">
          {value}
        </span>
      ) : null}
    </div>
    <ChevronRightIcon
      className={cn(
        "size-4 shrink-0",
        active ? "text-primary" : "text-muted-foreground",
      )}
    />
  </button>
);

const getTabConfig = (tabId, user, t) => {
  const tabs = getProfileTabs(t);
  const tab = find(tabs, (tab) => tab.id === tabId) ?? null;
  if (!tab) return null;

  return tab;
};

const InlineNotificationsItem = ({ tab, value }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <SettingsItem
        icon={tab.icon}
        label={tab.label}
        value={value}
        onClick={() => setOpen(true)}
      />
      {open ? (
        <NotificationSettingsDrawer
          open={open}
          onOpenChange={setOpen}
        />
      ) : null}
    </>
  );
};

const getOverviewValue = (tabId, user, completion, t) => {
  switch (tabId) {
    case "general":
      return getLanguageLabel(user?.settings?.language);
    case "premium":
      return user?.premium?.status === "active"
        ? t("profile.premium.status.active")
        : t("profile.premium.status.free");
    case "referral":
      return `${completion}%`;
    default:
      return undefined;
  }
};

const MODE_LABELS = {
  [APP_MODES.FOCUS]: "Focus",
  [APP_MODES.ZEN]: "Zen",
  [APP_MODES.MADAGASCAR]: "Madagascar",
};

const SettingsDivider = () => (
  <div className="mx-6 border-t border-border/50 sm:mx-7" />
);

const InlineModeItem = ({ wrap = true }) => {
  const [modeOpen, setModeOpen] = React.useState(false);
  const [themeOpen, setThemeOpen] = React.useState(false);
  const mode = useAppModeStore((state) => state.mode);
  const { theme } = useTheme();
  const Icon = theme === "dark" ? MoonIcon : SunIcon;
  const rows = (
    <>
      <SettingsItem
        icon={PaletteIcon}
        label={"Mode"}
        value={MODE_LABELS[mode] ?? "Madagascar"}
        onClick={() => setModeOpen(true)}
      />
      <SettingsDivider />
      <SettingsItem
        icon={Icon}
        label="Theme"
        value={theme === "dark" ? "Qorong'u" : "Yorug'"}
        onClick={() => setThemeOpen(true)}
      />
    </>
  );

  return (
    <>
      {wrap ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">{rows}</CardContent>
        </Card>
      ) : (
        rows
      )}
      <ModeDrawer open={modeOpen} onOpenChange={setModeOpen} />
      <ThemeDrawer open={themeOpen} onOpenChange={setThemeOpen} />
    </>
  );
};

const InlineLangItem = ({
  tab,
  languages,
  currentLang,
  resolvedLang,
  setCurrentLanguage,
}) => {
  const { t } = useTranslation();
  const { saveGeneralSettings } = useProfileSettings();
  const [open, setOpen] = React.useState(false);

  const handleLanguageSelect = React.useCallback(
    async (languageCode) => {
      try {
        setCurrentLanguage(languageCode);
        await saveGeneralSettings({ language: languageCode });
        toast.success(t("profile.language.success"));
        setOpen(false);
      } catch (error) {
        toast.error(getRequestErrorMessage(error, t("profile.language.error")));
      }
    },
    [saveGeneralSettings, setCurrentLanguage, t],
  );
  return (
    <>
      <SettingsItem
        icon={tab.icon}
        label={tab.label}
        value={
          resolvedLang
            ? `${resolvedLang.flag} ${resolvedLang.name}`
            : toUpper(currentLang)
        }
        onClick={() => setOpen(true)}
      />
      {open ? (
        <Drawer open={open} onOpenChange={setOpen} direction="bottom">
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>{t("profile.language.drawerTitle")}</DrawerTitle>
              <DrawerDescription>
                {t("profile.language.drawerDescription")}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerBody className="space-y-2">
              {map(languages, (language) => {
                const languageCode = get(language, "code");
                const isSelected = languageCode === currentLang;
                return (
                  <button
                    key={get(language, "id") || languageCode}
                    type="button"
                    className="block w-full text-left"
                    onClick={() => void handleLanguageSelect(languageCode)}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-2xl border p-4",
                        isSelected && "border-primary bg-primary/5",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="text-base leading-none">
                          {get(language, "flag", "🌐")}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium">{get(language, "name")}</p>
                          <p className="text-sm text-muted-foreground">
                            {toUpper(languageCode)}
                          </p>
                        </div>
                      </div>
                      {isSelected ? (
                        <CheckIcon className="size-4 text-primary" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      ) : null}
    </>
  );
};

const SettingsGroupCard = ({
  items,
  activeTab,
  onTabChange,
  valueResolver,
  customRenderer,
  user,
  t,
}) => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      {map(items, (tabId, index) => {
        const tab = getTabConfig(tabId, user, t);

        if (!tab) {
          return null;
        }

        const custom = customRenderer?.(tabId);

        return (
          <React.Fragment key={tabId}>
            {index > 0 ? <div className="mx-6 border-t sm:mx-7" /> : null}
            {custom ?? (
              <SettingsItem
                icon={get(tab, "icon")}
                label={get(tab, "label")}
                value={valueResolver?.(tabId)}
                active={tabId === activeTab}
                onClick={() => onTabChange(tabId)}
              />
            )}
          </React.Fragment>
        );
      })}
    </CardContent>
  </Card>
);

const ProfileOverviewSettingsCard = ({
  activeLanguages,
  currentLang,
  resolvedLang,
  setCurrentLanguage,
  settings,
  t,
}) => {
  const tabs = React.useMemo(() => getProfileTabs(t), [t]);
  const generalTab = find(tabs, (item) => item.id === "general");
  const notificationsTab = find(tabs, (item) => item.id === "notifications");

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <InlineModeItem wrap={false} />
        {generalTab ? (
          <>
            <SettingsDivider />
            <InlineLangItem
              tab={generalTab}
              languages={activeLanguages}
              currentLang={currentLang}
              resolvedLang={resolvedLang}
              setCurrentLanguage={setCurrentLanguage}
            />
          </>
        ) : null}
        {notificationsTab ? (
          <>
            <SettingsDivider />
            <InlineNotificationsItem
              tab={notificationsTab}
              value={`${getNotificationSettingsCount(settings)} yoqilgan`}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
};

const ProfileSectionDrawer = ({ open, tabId, tabs, onOpenChange }) => {
  const tab = React.useMemo(
    () => find(tabs, (item) => item.id === tabId) ?? null,
    [tabId, tabs],
  );
  const ActiveTab = tab?.component ?? null;

  if (!tab || !ActiveTab) {
    return null;
  }

  const isSecurity = tabId === "security";

  return (
    <Drawer direction="bottom" open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        data-profile-section-drawer={tabId}
        className="data-[vaul-drawer-direction=bottom]:!mx-auto data-[vaul-drawer-direction=bottom]:!max-w-md"
      >
        <DrawerHeader className="border-b border-border/50 px-5 pb-3 pt-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DrawerTitle className="truncate text-base font-semibold">
                {tab.label}
              </DrawerTitle>
              <DrawerDescription className="mt-0.5 line-clamp-2 text-xs">
                {tab.description}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 rounded-full"
                aria-label="Profil bo‘limini yopish"
              >
                <XIcon className="size-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        {isSecurity ? (
          <ActiveTab embedded />
        ) : (
          <DrawerBody className="px-3 pb-5 pt-3">
            <ActiveTab embedded />
          </DrawerBody>
        )}
      </DrawerContent>
    </Drawer>
  );
};

const EmbeddedSettingsOverview = ({ user, completion, onTabChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { closeProfile } = useProfileOverlay();
  const { displayName, initials } = getProfileIdentity(user);
  const setCurrentLanguage = useLanguageStore(
    (state) => state.setCurrentLanguage,
  );

  const { languages } = useAppLanguages();
  const settings = useAuthStore(
    (state) => state.user?.settings ?? EMPTY_PROFILE_SETTINGS,
  );
  const roles = useAuthStore((state) => state.roles);
  const activeRole = useAuthStore((state) => state.activeRole);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);
  const activeLanguages = React.useMemo(() => {
    const source = languages.length ? languages : FALLBACK_LANGUAGES;
    return filter(source, (l) => l.isActive !== false);
  }, [languages]);
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "uz";
  const availableRoles = React.useMemo(() => {
    const configuredRoles = keys(ROLE_CONFIG);
    const nextRoles = new Set(isArray(roles) ? roles : []);
    nextRoles.add("USER");
    return filter(configuredRoles, (role) => nextRoles.has(role));
  }, [roles]);
  const currentRole = React.useMemo(() => {
    if (activeRole && includes(availableRoles, activeRole)) {
      return activeRole;
    }

    return availableRoles[0] ?? "USER";
  }, [activeRole, availableRoles]);
  const handleRoleSwitch = React.useCallback(
    (role) => {
      const nextConfig = ROLE_CONFIG[role];
      if (!nextConfig) {
        return;
      }

      setActiveRole(role);
      closeProfile();
      navigate(nextConfig.path);
    },
    [closeProfile, navigate, setActiveRole],
  );
  const openHealthReport = React.useCallback(() => {
    closeProfile?.();
    navigate(getUserOnboardingReportPath());
  }, [closeProfile, navigate]);

  return (
    <div className="space-y-3">
      <ProfileVitalsCard
        user={user}
        displayName={displayName}
        initials={initials}
        completion={completion}
        onEditProfile={() => onTabChange("profile")}
        onOpenPremium={() => onTabChange("premium")}
        onOpenGoals={() => {
          closeProfile?.();
          navigate(getStandaloneProfileTabPath("health") ?? "/user/health");
        }}
      />
      {availableRoles.length > 1 ? (
        <Card className={"gap-0"}>
          <CardHeader className={"py-3"}>
            <CardTitle>{t("common.navUser.accounts")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {map(availableRoles, (role, index) => {
              const config = get(ROLE_CONFIG, role);
              if (!config) return null;

              const isActive = role === currentRole;
              const RoleIcon = config.icon;

              return (
                <React.Fragment key={role}>
                  {index > 0 ? (
                    <div className="mx-6 border-t border-border/40 sm:mx-7" />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch(role)}
                    className="flex w-full items-center gap-3.5 px-6 py-3.5 text-left transition-colors hover:bg-muted/40 cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="size-10 border border-border/50">
                        <AvatarImage
                          src={get(user, "avatar")}
                          alt={get(config, "label")}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <RoleIcon className="size-5" />
                        </AvatarFallback>
                      </Avatar>
                      {isActive && (
                        <div className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-background bg-emerald-500">
                          <CheckIcon
                            className="size-2.5 text-white"
                            strokeWidth={3}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-0.5">
                      <span className="truncate text-[15px] font-medium leading-none">
                        {t(`common.roles.${role}.label`)}
                      </span>
                      <span className="truncate text-xs text-muted-foreground mt-0.5">
                        {t(`common.roles.${role}.description`)}
                      </span>
                    </div>
                    {!isActive ? (
                      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                    ) : null}
                  </button>
                </React.Fragment>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      <ProfileOverviewSettingsCard
        activeLanguages={activeLanguages}
        currentLang={currentLang}
        resolvedLang={find(activeLanguages, (l) => l.code === currentLang)}
        setCurrentLanguage={setCurrentLanguage}
        settings={settings}
        t={t}
      />
      {map([["privacy", "security"], ["referral"]], (group, index) => (
        <SettingsGroupCard
          key={index}
          items={group}
          onTabChange={(tabId) => {
            onTabChange(tabId);
          }}
          user={user}
          t={t}
          valueResolver={(tabId) =>
            getOverviewValue(tabId, user, completion, t)
          }
        />
      ))}

      <AccountDangerZone />

      <OnboardingHealthReportCard
        compact
        title={t("profile.healthReport.title")}
        description={t("profile.healthReport.description")}
        badge={t("profile.healthReport.badge")}
        actionLabel={t("profile.healthReport.action")}
        onAction={openHealthReport}
      />
    </div>
  );
};

const getProfileCompletion = (user) => {
  const fields = [
    get(user, "firstName"),
    get(user, "lastName"),
    get(user, "username"),
    get(user, "email") || get(user, "phone"),
    get(user, "bio"),
  ];
  const completedCount = filter(fields, Boolean).length;
  return Math.round((completedCount / fields.length) * 100);
};

const getCompletionTone = (completion) => {
  if (completion >= 80) {
    return "text-emerald-600 dark:text-emerald-400";
  }

  if (completion >= 50) {
    return "text-primary";
  }

  return "text-amber-600 dark:text-amber-400";
};

const SettingsSidebar = ({ activeTab, completion, onTabChange, user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleTabChange = React.useCallback(
    (tabId) => {
      if (tabId === "referral") {
        navigate("/user/referrals");
        return;
      }
      onTabChange(tabId);
    },
    [navigate, onTabChange],
  );
  const openHealthReport = React.useCallback(() => {
    navigate(getUserOnboardingReportPath());
  }, [navigate]);

  return (
    <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
      <Card className="border-border/60 py-6 shadow-none">
        <CardContent className="p-6">
          <GamificationBadges />
        </CardContent>
      </Card>
      {map(SETTINGS_GROUPS, (group, index) => (
        <SettingsGroupCard
          key={index}
          items={group}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          user={user}
          t={t}
        />
      ))}
      <InlineModeItem />
      <Card className="border-border/60 py-6 shadow-none">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t("profile.completion")}</p>
              <p
                className={cn(
                  "text-sm font-semibold",
                  getCompletionTone(completion),
                )}
              >
                {completion}%
              </p>
            </div>
            <Progress value={completion} className="h-1.5 rounded-full" />
          </div>

          <div className="text-sm leading-6 text-muted-foreground">
            {t("profile.completionDesc")}
          </div>
        </CardContent>
      </Card>
      <OnboardingHealthReportCard
        compact
        title={t("profile.healthReport.title")}
        description={t("profile.healthReport.description")}
        badge={t("profile.healthReport.badge")}
        actionLabel={t("profile.healthReport.action")}
        onAction={openHealthReport}
      />
    </aside>
  );
};

const Index = ({ embedded = false }) => {
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProfileTab, setProfileTab } = useProfileOverlay();
  const tabs = React.useMemo(() => getProfileTabs(t), [t]);
  const rawRequestedTab = searchParams.get("tab");
  const requestedProfileTab = normalizeProfileContentTab(rawRequestedTab);
  const requestedTab = embedded ? activeProfileTab : requestedProfileTab;
  const isEmbeddedSectionDrawer =
    embedded && isProfileNestedDrawerTab(requestedTab);
  const activeConfig = find(tabs, (tab) => tab.id === requestedTab) ?? null;
  const ActiveTab = activeConfig?.component ?? null;
  const completion = getProfileCompletion(user);

  React.useEffect(() => {
    if (embedded || rawRequestedTab === requestedProfileTab) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", requestedProfileTab);
    setSearchParams(nextParams, { replace: true });
  }, [
    embedded,
    rawRequestedTab,
    requestedProfileTab,
    searchParams,
    setSearchParams,
  ]);

  React.useEffect(() => {
    if (embedded) {
      return undefined;
    }

    setBreadcrumbs([
      { url: "/user", title: t("common.navUser.home") },
      { url: "/user/profile", title: t("common.navUser.profileAndSettings") },
    ]);
  }, [embedded, setBreadcrumbs, t]);

  const handleTabChange = React.useCallback(
    (tabId) => {
      if (embedded) {
        setProfileTab(normalizeProfileOverlayTab(tabId));
        return;
      }

      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("tab", normalizeProfileContentTab(tabId));
      setSearchParams(nextParams, { replace: true });
    },
    [embedded, searchParams, setProfileTab, setSearchParams],
  );
  const handleSectionDrawerOpenChange = React.useCallback(
    (open) => {
      if (!open) {
        setProfileTab(PROFILE_OVERVIEW_TAB);
      }
    },
    [setProfileTab],
  );

  if (
    embedded &&
    (requestedTab === PROFILE_OVERVIEW_TAB || isEmbeddedSectionDrawer)
  )
    return (
      <div className="p-3 pb-6">
        <EmbeddedSettingsOverview
          user={user}
          completion={completion}
          onTabChange={handleTabChange}
        />
        <ProfileSectionDrawer
          open={isEmbeddedSectionDrawer}
          tabId={requestedTab}
          tabs={tabs}
          onOpenChange={handleSectionDrawerOpenChange}
        />
      </div>
    );
  else {
    return embedded &&
      requestedTab === PROFILE_OVERVIEW_TAB ? null : embedded ? (
      ActiveTab ? (
        <ActiveTab embedded />
      ) : null
    ) : (
      <>
        {embedded ? null : (
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("profile.title")}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("profile.subtitle")}
            </p>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <SettingsSidebar
            activeTab={requestedTab}
            completion={completion}
            onTabChange={handleTabChange}
            user={user}
          />
          <main className="min-w-0">{ActiveTab ? <ActiveTab /> : null}</main>
        </div>
      </>
    );
  }
};

export default Index;
