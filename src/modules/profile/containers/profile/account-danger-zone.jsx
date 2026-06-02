import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRightIcon, LogOutIcon, UserXIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import useApi from "@/hooks/api/use-api";
import { usePostQuery } from "@/hooks/api";
import {
  getRequestErrorMessage,
} from "@/hooks/app/use-profile-settings";
import { useProfileOverlay } from "@/modules/profile/hooks/use-profile-overlay";
import { useAuthStore } from "@/store";
import { cn } from "@/lib/utils";

import includes from "lodash/includes";
import isArray from "lodash/isArray";

const DELETE_CONFIRMATION_TEXT = "DELETE";

export const AccountDangerZone = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { request } = useApi();
  const { closeProfile } = useProfileOverlay();
  const logout = useAuthStore((state) => state.logout);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const roles = useAuthStore((state) => state.roles);
  const { mutateAsync: logoutRequest, isPending: isLoggingOut } = usePostQuery();
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [confirmationText, setConfirmationText] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const isSuperAdmin =
    isArray(roles) && includes(roles, "SUPER_ADMIN");
  const canConfirm = confirmationText === DELETE_CONFIRMATION_TEXT;

  const handleOpenChange = React.useCallback(
    (nextOpen) => {
      if (isDeleting) {
        return;
      }

      setIsDeleteOpen(nextOpen);

      if (!nextOpen) {
        setConfirmationText("");
      }
    },
    [isDeleting],
  );

  const handleLogout = React.useCallback(async () => {
    try {
      if (refreshToken) {
        await logoutRequest({
          url: "/auth/logout",
          attributes: { refreshToken },
        });
      }
    } catch {
      // Local logout still needs to complete if the server session is already gone.
    } finally {
      closeProfile?.();
      logout();
      queryClient.clear();
      navigate("/auth/sign-in", { replace: true });
    }
  }, [closeProfile, logout, logoutRequest, navigate, queryClient, refreshToken]);

  const handleDelete = React.useCallback(async () => {
    if (!canConfirm || isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);

      await request.delete("/users/me", {
        data: {
          confirmationText: DELETE_CONFIRMATION_TEXT,
        },
      });

      toast.success(
        t("profile.security.account.deleteSuccess", {
          defaultValue: "Hisob muvaffaqiyatli o'chirildi.",
        }),
      );
      setIsDeleteOpen(false);
      setConfirmationText("");
      closeProfile?.();
      logout();
      queryClient.clear();
      navigate("/auth/sign-in", { replace: true });
    } catch (error) {
      toast.error(
        getRequestErrorMessage(
          error,
          t("profile.security.account.deleteError", {
            defaultValue: "Hisobni o'chirishda xatolik yuz berdi.",
          }),
        ),
      );
    } finally {
      setIsDeleting(false);
    }
  }, [canConfirm, closeProfile, isDeleting, logout, navigate, queryClient, request, t]);

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <AccountActionRow
            icon={LogOutIcon}
            label={t("profile.security.session.button", {
              defaultValue: "Tizimdan chiqish",
            })}
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
          />
          {!isSuperAdmin ? (
            <>
              <div className="mx-6 border-t border-border/50 sm:mx-7" />
              <AccountActionRow
                icon={UserXIcon}
                label={t("profile.security.account.delete", {
                  defaultValue: "Hisobni o'chirish",
                })}
                onClick={() => setIsDeleteOpen(true)}
                destructive
              />
            </>
          ) : null}
        </CardContent>
      </Card>

      <Drawer
        direction="bottom"
        open={isDeleteOpen}
        onOpenChange={handleOpenChange}
      >
        <DrawerContent
          data-testid="delete-account-drawer"
          className="data-[vaul-drawer-direction=bottom]:md:max-w-sm"
        >
          <DrawerHeader>
            <DrawerTitle>
              {t("profile.security.account.deleteConfirmTitle", {
                defaultValue: "Hisobni butunlay o'chirish",
              })}
            </DrawerTitle>
            <DrawerDescription>
              {t("profile.security.account.deleteConfirmDesc", {
                defaultValue:
                  "Tasdiqlash uchun DELETE yozing. Shundan keyin hisob, progress va saqlangan ma'lumotlar qayta tiklanmaydi.",
              })}
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="space-y-4 pb-3">
            <div className="space-y-2">
              <label
                htmlFor="account-delete-confirmation"
                className="text-sm font-medium"
              >
                {t("profile.security.account.deleteConfirmInputLabel", {
                  defaultValue: "Tasdiqlash matni",
                })}
              </label>
              <Input
                id="account-delete-confirmation"
                value={confirmationText}
                autoComplete="off"
                placeholder={DELETE_CONFIRMATION_TEXT}
                onChange={(event) =>
                  setConfirmationText(event.target.value)
                }
              />
              <p className="text-xs leading-5 text-muted-foreground">
                {t("profile.security.account.deleteConfirmHint", {
                  defaultValue:
                    "Tugma faollashishi uchun DELETE so'zini aynan shu ko'rinishda yozing.",
                })}
              </p>
            </div>
          </DrawerBody>

          <DrawerFooter className="px-4 pb-5 pt-2">
            <Button
              type="button"
              variant="destructive"
              className="h-11"
              disabled={!canConfirm || isDeleting}
              onClick={() => void handleDelete()}
            >
              <UserXIcon className="size-4" />
              {isDeleting
                ? t("profile.security.account.deleteLoading", {
                    defaultValue: "O'chirilmoqda...",
                  })
                : t("profile.security.account.deleteConfirmAction", {
                    defaultValue: "Hisobni butunlay o'chirish",
              })}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

const AccountActionRow = ({
  icon: Icon,
  label,
  value,
  onClick,
  destructive = false,
  disabled = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex w-full items-center gap-3.5 px-6 py-4 text-left transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-60 sm:px-7",
      destructive && "hover:bg-destructive/5",
    )}
  >
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        destructive
          ? "bg-destructive/10 text-destructive"
          : "text-muted-foreground",
      )}
    >
      <Icon className="size-4.5" />
    </div>
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span
        className={cn(
          "truncate text-sm font-medium sm:text-[15px]",
          destructive && "text-destructive",
        )}
      >
        {label}
      </span>
      {value ? (
        <span className="ml-auto max-w-[48%] truncate text-right text-xs text-muted-foreground sm:text-sm">
          {value}
        </span>
      ) : null}
    </div>
    <ChevronRightIcon
      className={cn(
        "size-4 shrink-0",
        destructive ? "text-destructive/80" : "text-muted-foreground",
      )}
    />
  </button>
);

export default AccountDangerZone;
