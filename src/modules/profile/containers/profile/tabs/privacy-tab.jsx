import React from "react";
import { useTranslation } from "react-i18next";
import { isEqual } from "lodash";
import {
  BellOffIcon,
  DownloadIcon,
  EyeIcon,
  MessageSquareIcon,
  ShieldCheckIcon,
  UserRoundCheckIcon,
  UserXIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DrawerFooter } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useGetQuery } from "@/hooks/api";
import useApi from "@/hooks/api/use-api";
import useProfileSettings, {
  getRequestErrorMessage,
} from "@/hooks/app/use-profile-settings";

const getPrivacyOptions = (t) => [
  {
    key: "profilePublic",
    title: t("profile.privacy.profilePublic"),
    description: t("profile.privacy.profilePublicDesc"),
    icon: EyeIcon,
  },
  {
    key: "showActivity",
    title: t("profile.privacy.showActivity"),
    description: t("profile.privacy.showActivityDesc"),
    icon: UserRoundCheckIcon,
  },
  {
    key: "allowMessages",
    title: t("profile.privacy.allowMessages"),
    description: t("profile.privacy.allowMessagesDesc"),
    icon: MessageSquareIcon,
  },
  {
    key: "dataSharing",
    title: t("profile.privacy.dataSharing"),
    description: t("profile.privacy.dataSharingDesc"),
    icon: ShieldCheckIcon,
  },
];

const createInitialForm = (settings) => ({
  profilePublic: settings.profilePublic ?? true,
  showActivity: settings.showActivity ?? false,
  allowMessages: settings.allowMessages ?? true,
  dataSharing: settings.dataSharing ?? false,
});

const BlockedUsersSection = () => {
  const { request } = useApi();
  const queryClient = useQueryClient();
  const [unblocking, setUnblocking] = React.useState(null);

  const { data, isLoading } = useGetQuery({
    url: "/users/me/blocked",
    queryProps: { queryKey: ["blocked-users"] },
  });

  const blocked = data?.data ?? [];

  const handleUnblock = async (userId) => {
    setUnblocking(userId);
    try {
      await request.delete(`/users/me/blocked/${userId}`);
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setUnblocking(null);
    }
  };

  return (
    <Card className="py-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">
          Bloklangan foydalanuvchilar
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : blocked.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <UserXIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Bloklangan foydalanuvchilar yo&apos;q
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blocked.map((entry) => {
              const fullName = [entry.firstName, entry.lastName]
                .filter(Boolean)
                .join(" ");
              const initials = [entry.firstName?.[0], entry.lastName?.[0]]
                .filter(Boolean)
                .join("")
                .toUpperCase();
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-10 shrink-0">
                      <AvatarImage src={entry.avatar} />
                      <AvatarFallback>{initials || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {fullName || "Foydalanuvchi"}
                      </p>
                      {entry.username ? (
                        <p className="text-xs text-muted-foreground">
                          @{entry.username}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={unblocking === entry.userId}
                    onClick={() => handleUnblock(entry.userId)}
                  >
                    <UserXIcon className="mr-1.5 size-3.5" />
                    Blokdan chiqarish
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};


const MutedUsersSection = () => {
  const { request } = useApi();
  const queryClient = useQueryClient();
  const [unmuting, setUnmuting] = React.useState(null);

  const { data, isLoading } = useGetQuery({
    url: "/users/me/muted",
    queryProps: { queryKey: ["muted-users"] },
  });

  const muted = data?.data ?? [];

  const handleUnmute = async (userId) => {
    setUnmuting(userId);
    try {
      await request.delete(`/users/me/muted/${userId}`);
      queryClient.invalidateQueries({ queryKey: ["muted-users"] });
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setUnmuting(null);
    }
  };

  return (
    <Card className="py-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">
          Ovozi o&apos;chirilgan foydalanuvchilar
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : muted.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <BellOffIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Ovozi o&apos;chirilgan foydalanuvchilar yo&apos;q
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {muted.map((entry) => {
              const fullName = [entry.firstName, entry.lastName]
                .filter(Boolean)
                .join(" ");
              const initials = [entry.firstName?.[0], entry.lastName?.[0]]
                .filter(Boolean)
                .join("")
                .toUpperCase();
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-10 shrink-0">
                      <AvatarImage src={entry.avatar} />
                      <AvatarFallback>{initials || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {fullName || "Foydalanuvchi"}
                      </p>
                      {entry.username ? (
                        <p className="text-xs text-muted-foreground">
                          @{entry.username}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={unmuting === entry.userId}
                    onClick={() => handleUnmute(entry.userId)}
                  >
                    <BellOffIcon className="mr-1.5 size-3.5" />
                    Ovozni yoqish
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DataExportSection = () => {
  const { request } = useApi();
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await request.get("/users/me/export");
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Ma'lumotlar yuklab olindi.");
    } catch {
      toast.error("Ma'lumotlarni yuklab olishda xatolik yuz berdi.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="py-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">Ma&apos;lumotlarni eksport qilish</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">
          Barcha shaxsiy ma&apos;lumotlaringizni JSON formatida yuklab oling. Bu faylda profil, mashg&apos;ulotlar, ovqatlanish va boshqa ma&apos;lumotlar mavjud bo&apos;ladi.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 rounded-xl"
          disabled={isExporting}
          onClick={handleExport}
        >
          <DownloadIcon className="mr-2 size-4" />
          {isExporting ? "Yuklanmoqda..." : "Ma'lumotlarni yuklab olish"}
        </Button>
      </CardContent>
    </Card>
  );
};

const PrivacyTabContent = ({
  embedded,
  form,
  handleSave,
  initialForm,
  isDirty,
  isSavingPrivacy,
  setForm,
  t,
}) => (
  <Card className="py-6">
    <CardHeader className="pb-2">
      <CardTitle className="text-xl font-semibold">{t("profile.tabs.privacy")}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 p-6">
      {getPrivacyOptions(t).map((option) => {
        const Icon = option.icon;

        return (
          <div
            key={option.key}
            className="flex items-center justify-between gap-4 rounded-2xl border p-4"
          >
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold">{option.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
            <Switch
              checked={form[option.key]}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, [option.key]: checked }))
              }
            />
          </div>
        );
      })}

      {!embedded ? (
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            disabled={!isDirty || isSavingPrivacy}
            onClick={handleSave}
          >
            {isSavingPrivacy ? t("profile.general.saving") : t("profile.general.save")}
          </Button>
        </div>
      ) : null}
    </CardContent>
  </Card>
);

export const PrivacyTab = ({ embedded = false }) => {
  const { t } = useTranslation();
  const { settings, savePrivacySettings, isSavingPrivacy } =
    useProfileSettings();
  const initialForm = React.useMemo(
    () => createInitialForm(settings),
    [settings],
  );
  const [form, setForm] = React.useState(initialForm);

  React.useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const isDirty = !isEqual(form, initialForm);

  const handleSave = React.useCallback(async () => {
    try {
      await savePrivacySettings(form);
      toast.success(t("profile.privacy.saveSuccess"));
    } catch (error) {
      toast.error(
        getRequestErrorMessage(
          error,
          t("profile.privacy.saveError"),
        ),
      );
    }
  }, [form, savePrivacySettings, t]);

  const content = (
    <PrivacyTabContent
      embedded={embedded}
      form={form}
      handleSave={handleSave}
      initialForm={initialForm}
      isDirty={isDirty}
      isSavingPrivacy={isSavingPrivacy}
      setForm={setForm}
      t={t}
    />
  );

  if (embedded) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto px-5 pb-6 pt-8 sm:px-6">
          {content}
          <MutedUsersSection />
          <BlockedUsersSection />
          <DataExportSection />
        </div>
        <DrawerFooter>
          <Button
            type="button"
            disabled={!isDirty || isSavingPrivacy}
            onClick={handleSave}
          >
            {isSavingPrivacy ? t("profile.general.saving") : t("profile.general.save")}
          </Button>
        </DrawerFooter>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {content}
      <MutedUsersSection />
      <BlockedUsersSection />
      <DataExportSection />
    </div>
  );
};
