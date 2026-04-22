import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { UserXIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import useApi from "@/hooks/api/use-api";
import {
  getRequestErrorMessage,
} from "@/hooks/app/use-profile-settings";
import { useProfileOverlay } from "@/modules/profile/hooks/use-profile-overlay";
import { useAuthStore } from "@/store";

const DELETE_CONFIRMATION_TEXT = "DELETE";

export const AccountDangerZone = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { request } = useApi();
  const { closeProfile } = useProfileOverlay();
  const logout = useAuthStore((state) => state.logout);
  const roles = useAuthStore((state) => state.roles);
  const [isOpen, setIsOpen] = React.useState(false);
  const [confirmationText, setConfirmationText] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const isSuperAdmin =
    Array.isArray(roles) && roles.includes("SUPER_ADMIN");
  const canConfirm = confirmationText === DELETE_CONFIRMATION_TEXT;

  const handleOpenChange = React.useCallback(
    (nextOpen) => {
      if (isDeleting) {
        return;
      }

      setIsOpen(nextOpen);

      if (!nextOpen) {
        setConfirmationText("");
      }
    },
    [isDeleting],
  );

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
      setIsOpen(false);
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

  if (isSuperAdmin) {
    return null;
  }

  return (
    <Card className="mt-1 border-destructive/25 py-6 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-destructive">
          {t("profile.security.account.dangerTitle", {
            defaultValue: "Danger zone",
          })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <UserXIcon className="size-4" />
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-destructive">
                {t("profile.security.account.delete", {
                  defaultValue: "Hisobni o'chirish",
                })}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("profile.security.account.dangerDesc", {
                  defaultValue:
                    "Hisob va barcha foydalanuvchi ma'lumotlari butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.",
                })}
              </p>

              <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    <UserXIcon className="size-4" />
                    {t("profile.security.account.deleteButton", {
                      defaultValue: "Hisobni o'chirish",
                    })}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("profile.security.account.deleteConfirmTitle", {
                        defaultValue: "Hisobni butunlay o'chirish",
                      })}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("profile.security.account.deleteConfirmDesc", {
                        defaultValue:
                          "Tasdiqlash uchun DELETE yozing. Shundan keyin hisob, progress va saqlangan ma'lumotlar qayta tiklanmaydi.",
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>

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
                    <p className="text-xs text-muted-foreground">
                      {t("profile.security.account.deleteConfirmHint", {
                        defaultValue:
                          "Tugma faollashishi uchun DELETE so'zini aynan shu ko'rinishda yozing.",
                      })}
                    </p>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      {t("profile.general.cancel", {
                        defaultValue: "Bekor qilish",
                      })}
                    </AlertDialogCancel>
                    <Button
                      type="button"
                      variant="destructive"
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
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountDangerZone;
