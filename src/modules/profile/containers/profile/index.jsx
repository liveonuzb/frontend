import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  filter,
  find,
  get,
  includes,
  isArray,
  join,
  keys,
  map,
  split,
  take,
  toUpper,
  trim,
  values as lodashValues,
} from "lodash";
import {
  CheckIcon,
  ChevronRightIcon,
  MoonIcon,
  PaletteIcon,
  SparklesIcon,
  SunIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  PROFILE_OVERVIEW_TAB,
  useProfileOverlay,
} from "@/modules/profile/hooks/use-profile-overlay";
import {
  normalizeProfileContentTab,
  normalizeProfileOverlayTab,
  isProfileNestedDrawerTab,
} from "@/modules/profile/lib/profile-tab-registry";
import useAppLanguages from "@/hooks/app/use-app-languages";
import { useLanguageStore } from "@/store";
import { ROLE_CONFIG } from "@/components/role-switcher";
import useProfileSettings, {
  getRequestErrorMessage,
} from "@/hooks/app/use-profile-settings";
import {
  getUserCardClassName,
  getUserInteractiveCardClassName,
  userCardScopeClassName,
} from "@/modules/user/lib/card-styles";
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
  ["friends", "referral"],
];
const EMPTY_PROFILE_SETTINGS = {};

const getProfileIdentity = (user) => {
  const firstName = get(user, "firstName", "");
  const lastName = get(user, "lastName", "");
  const username = get(user, "username", "");

  const displayName =
    trim(`${firstName} ${lastName || ""}`) || username || "User";

  const initials = toUpper(
    join(
      take(map(split(displayName, " "), (part) => get(part, "[0]", "")), 2),
      "",
    ),
  );

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

const getGlassEffectLabel = (enabled, t) =>
  enabled
    ? t("profile.appearance.glass.enabled", "Yoqilgan")
    : t("profile.appearance.glass.disabled", "O'chiq");

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
  const { activeProfileDrawer, openProfileDrawer, closeProfileDrawer } =
    useProfileOverlay();
  const open = activeProfileDrawer === "notifications";
  const handleOpenChange = React.useCallback(
    (nextOpen) => {
      if (nextOpen) {
        openProfileDrawer("notifications", PROFILE_OVERVIEW_TAB);
        return;
      }

      closeProfileDrawer();
    },
    [closeProfileDrawer, openProfileDrawer],
  );

  return (
    <>
      <SettingsItem
        icon={tab.icon}
        label={tab.label}
        value={value}
        onClick={() => openProfileDrawer("notifications", PROFILE_OVERVIEW_TAB)}
      />
      {open ? (
        <NotificationSettingsDrawer
          open={open}
          onOpenChange={handleOpenChange}
        />
      ) : null}
    </>
  );
};

const getOverviewValue = (tabId, user, completion, t) => {
  switch (tabId) {
    case "general":
      return getLanguageLabel(user?.settings?.language);
    case "friends":
      return t("profile.friends.value", "Do'stlar");
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

const GLASS_EFFECT_OPTIONS = [
  {
    value: false,
    labelKey: "profile.appearance.glass.disabled",
    label: "O'chiq",
    descriptionKey: "profile.appearance.glass.disabledDesc",
    description: "Odatiy aniq kartalar va drawerlar.",
  },
  {
    value: true,
    labelKey: "profile.appearance.glass.enabled",
    label: "Yoqilgan",
    descriptionKey: "profile.appearance.glass.enabledDesc",
    description: "iOS uslubidagi yumshoq shaffof surface.",
  },
];

const GlassEffectDrawer = ({ open, onOpenChange, enabled }) => {
  const { t } = useTranslation();
  const { saveGeneralSettings, isSavingGeneral } = useProfileSettings();
  const [selected, setSelected] = React.useState(Boolean(enabled));

  const handleApply = React.useCallback(async () => {
    try {
      await saveGeneralSettings({ glassEffectEnabled: selected });
      toast.success(t("profile.appearance.saveSuccess"));
      onOpenChange(false);
    } catch (error) {
      toast.error(
        getRequestErrorMessage(error, t("profile.appearance.saveError")),
      );
    }
  }, [onOpenChange, saveGeneralSettings, selected, t]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent
        data-glass-effect-drawer="true"
        className={cn(
          "data-[vaul-drawer-direction=bottom]:md:max-w-sm",
          userCardScopeClassName,
        )}
      >
        <DrawerHeader className="px-5 pb-3 text-left">
          <DrawerTitle>
            {t("profile.appearance.glass.drawerTitle", "Glass Effect")}
          </DrawerTitle>
          <DrawerDescription>
            {t(
              "profile.appearance.glass.drawerDescription",
              "Kartalar va drawerlar uchun iOS uslubidagi shaffof effekt.",
            )}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-4 px-4 pb-4">
          <div
            data-glass-preview-shell="true"
            className="glass-effect-preview overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/70 p-3"
          >
            <div className="relative min-h-[168px] overflow-hidden rounded-[1.4rem] border border-border/50 bg-gradient-to-br from-primary/12 via-card/65 to-muted/60 p-3">
              <div className="absolute -top-10 left-6 h-28 w-28 rounded-full bg-[rgb(var(--accent-rgb)/0.16)] blur-2xl" />
              <div className="absolute right-3 top-0 h-24 w-24 rounded-full bg-card/70 blur-2xl" />
              <div className="relative flex min-h-[142px] flex-col justify-between gap-3">
                <div
                  data-liquid-glass-preview-surface="true"
                  className="flex items-center justify-between rounded-2xl border border-border/45 bg-card/55 px-3 py-2 shadow-sm backdrop-blur-xl"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                      <SparklesIcon className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold leading-tight">
                        Balanced Liquid Glass
                      </p>
                      <p className="truncate text-[10px] leading-tight text-muted-foreground">
                        {t("profile.appearance.glass.previewEyebrow", "Preview")}
                      </p>
                    </div>
                  </div>
                  <div className="size-7 rounded-full border border-border/50 bg-card/70" />
                </div>

                <div
                  data-liquid-glass-preview-surface="true"
                  className="rounded-2xl border border-border/45 bg-card/55 p-3 shadow-sm backdrop-blur-xl"
                >
                  <div className="mb-2 h-2 w-16 rounded-full bg-primary/30" />
                  <p className="text-sm font-semibold leading-5">
                    {t(
                      "profile.appearance.glass.previewTitle",
                      "Bugungi ko'rinish",
                    )}
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                    {t(
                      "profile.appearance.glass.previewDescription",
                      "Yumshoq blur, shaffof surface va yaxshi o'qiladigan matn.",
                    )}
                  </p>
                </div>

                <div
                  data-liquid-glass-preview-surface="true"
                  className="mx-auto flex w-[78%] items-center justify-between rounded-full border border-border/45 bg-card/55 px-3 py-2 shadow-sm backdrop-blur-xl"
                >
                  <div className="size-3 rounded-full bg-primary" />
                  <div className="size-3 rounded-full bg-muted-foreground/35" />
                  <div className="size-3 rounded-full bg-muted-foreground/35" />
                  <div className="size-3 rounded-full bg-muted-foreground/35" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            {map(GLASS_EFFECT_OPTIONS, (option) => {
              const isSelected = selected === option.value;

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  aria-pressed={isSelected}
                  className={cn(
                    getUserInteractiveCardClassName(
                      "flex items-center justify-between gap-3 p-4 text-left",
                    ),
                    isSelected && "border border-primary bg-primary/5",
                  )}
                  onClick={() => setSelected(option.value)}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {t(option.labelKey, option.label)}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {t(option.descriptionKey, option.description)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-transparent",
                    )}
                  >
                    <CheckIcon className="size-3.5" strokeWidth={3} />
                  </span>
                </button>
              );
            })}
          </div>
        </DrawerBody>
        <DrawerFooter className="px-4 pb-4 pt-0">
          <button
            type="button"
            className="flex h-12 w-full items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
            disabled={isSavingGeneral}
            onClick={() => void handleApply()}
          >
            {t("profile.general.save", "Saqlash")}
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const InlineModeItem = ({ wrap = true }) => {
  const { activeProfileDrawer, openProfileDrawer, closeProfileDrawer } =
    useProfileOverlay();
  const modeOpen = activeProfileDrawer === "mode";
  const themeOpen = activeProfileDrawer === "theme";
  const glassOpen = activeProfileDrawer === "glass-effect";
  const mode = useAppModeStore((state) => state.mode);
  const settings = useAuthStore(
    (state) => state.user?.settings ?? EMPTY_PROFILE_SETTINGS,
  );
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Icon = theme === "dark" ? MoonIcon : SunIcon;
  const glassEffectEnabled = get(settings, "glassEffectEnabled", false) === true;
  const handleDrawerOpenChange = React.useCallback(
    (drawerId) => (nextOpen) => {
      if (nextOpen) {
        openProfileDrawer(drawerId, PROFILE_OVERVIEW_TAB);
        return;
      }

      closeProfileDrawer();
    },
    [closeProfileDrawer, openProfileDrawer],
  );
  const rows = (
    <>
      <SettingsItem
        icon={PaletteIcon}
        label={"Mode"}
        value={MODE_LABELS[mode] ?? "Madagascar"}
        onClick={() => openProfileDrawer("mode", PROFILE_OVERVIEW_TAB)}
      />
      <SettingsDivider />
      <SettingsItem
        icon={Icon}
        label="Theme"
        value={theme === "dark" ? "Qorong'u" : "Yorug'"}
        onClick={() => openProfileDrawer("theme", PROFILE_OVERVIEW_TAB)}
      />
      <SettingsDivider />
      <SettingsItem
        icon={SparklesIcon}
        label="Glass Effect"
        value={getGlassEffectLabel(glassEffectEnabled, t)}
        onClick={() => openProfileDrawer("glass-effect", PROFILE_OVERVIEW_TAB)}
      />
    </>
  );

  return (
    <>
      {wrap ? (
        <Card className={getUserCardClassName("gap-0 overflow-hidden py-0")}>
          <CardContent className="p-0">{rows}</CardContent>
        </Card>
      ) : (
        rows
      )}
      <ModeDrawer
        open={modeOpen}
        onOpenChange={handleDrawerOpenChange("mode")}
      />
      <ThemeDrawer
        open={themeOpen}
        onOpenChange={handleDrawerOpenChange("theme")}
      />
      {glassOpen ? (
        <GlassEffectDrawer
          open={glassOpen}
          enabled={glassEffectEnabled}
          onOpenChange={handleDrawerOpenChange("glass-effect")}
        />
      ) : null}
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
  const { activeProfileDrawer, openProfileDrawer, closeProfileDrawer } =
    useProfileOverlay();
  const open = activeProfileDrawer === "language";
  const handleOpenChange = React.useCallback(
    (nextOpen) => {
      if (nextOpen) {
        openProfileDrawer("language", PROFILE_OVERVIEW_TAB);
        return;
      }

      closeProfileDrawer();
    },
    [closeProfileDrawer, openProfileDrawer],
  );

  const handleLanguageSelect = React.useCallback(
    async (languageCode) => {
      try {
        setCurrentLanguage(languageCode);
        await saveGeneralSettings({ language: languageCode });
        toast.success(t("profile.language.success"));
        closeProfileDrawer();
      } catch (error) {
        toast.error(getRequestErrorMessage(error, t("profile.language.error")));
      }
    },
    [closeProfileDrawer, saveGeneralSettings, setCurrentLanguage, t],
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
        onClick={() => openProfileDrawer("language", PROFILE_OVERVIEW_TAB)}
      />
      {open ? (
        <Drawer open={open} onOpenChange={handleOpenChange} direction="bottom">
          <DrawerContent
            className={cn(
              "data-[vaul-drawer-direction=bottom]:md:max-w-sm",
              userCardScopeClassName,
            )}
          >
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
                        getUserInteractiveCardClassName(
                          "flex items-center justify-between gap-3 p-4",
                        ),
                        isSelected && "border border-primary bg-primary/5",
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
  <Card className={getUserCardClassName("gap-0 overflow-hidden py-0")}>
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
    <Card className={getUserCardClassName("gap-0 overflow-hidden py-0")}>
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

const ProfilePrivacyBillingCard = ({ completion, onTabChange, user }) => {
  const { t } = useTranslation();
  const rows = React.useMemo(
    () =>
      filter(
        map(["privacy", "security"], (tabId) => {
          const tab = getTabConfig(tabId, user, t);
          if (!tab) return null;

          return {
            icon: get(tab, "icon"),
            id: tabId,
            label: get(tab, "label"),
            onClick: () => onTabChange(tabId),
            value: getOverviewValue(tabId, user, completion, t),
          };
        }),
        Boolean,
      ),
    [completion, onTabChange, t, user],
  );

  return (
    <Card
      className={getUserCardClassName("gap-0 overflow-hidden py-0")}
    >
      <CardContent className="p-0">
        {map(rows, (row, index) => (
          <React.Fragment key={row.id}>
            {index > 0 ? <SettingsDivider /> : null}
            <SettingsItem
              icon={row.icon}
              label={row.label}
              value={row.value}
              onClick={row.onClick}
            />
          </React.Fragment>
        ))}
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
        className={cn(
          "data-[vaul-drawer-direction=bottom]:md:max-w-sm",
          userCardScopeClassName,
        )}
      >
        <DrawerHeader className="border-b border-border/50 px-5 pb-3 pt-4 text-left">
          <div className="min-w-0">
            <DrawerTitle className="truncate text-base font-semibold">
              {tab.label}
            </DrawerTitle>
            <DrawerDescription className="mt-0.5 line-clamp-2 text-xs">
              {tab.description}
            </DrawerDescription>
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
  return (
    <div className="space-y-3">
      <ProfileVitalsCard
        user={user}
        displayName={displayName}
        initials={initials}
        completion={completion}
        onEditProfile={() => onTabChange("profile")}
      />
      {availableRoles.length > 1 ? (
        <Card className={getUserCardClassName("gap-0 py-0")}>
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
      <ProfilePrivacyBillingCard
        completion={completion}
        onTabChange={onTabChange}
        user={user}
      />
      <SettingsGroupCard
        items={["friends", "referral"]}
        onTabChange={(tabId) => {
          onTabChange(tabId);
        }}
        user={user}
        t={t}
        valueResolver={(tabId) => getOverviewValue(tabId, user, completion, t)}
      />

      <AccountDangerZone />
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
      if (tabId === "friends") {
        navigate("/user/friends");
        return;
      }

      if (tabId === "referral") {
        navigate("/user/referrals");
        return;
      }
      onTabChange(tabId);
    },
    [navigate, onTabChange],
  );
  return (
    <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
      <Card className={getUserCardClassName("py-0")}>
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
      <Card className={getUserCardClassName("py-0")}>
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
