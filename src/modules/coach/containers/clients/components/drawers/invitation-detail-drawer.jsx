import {
  find,
  get,
  includes,
  isArray,
  isNil,
  map,
  size,
} from "lodash";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RotateCcwIcon } from "lucide-react";
import { 
  getInviteMethodOptions, 
  getWeekdayOptions, 
  getStatusConfig, 
  getInitials, 
  formatDate, 
  formatPaymentDay 
} from "../../utils";

export const InvitationDetailDrawer = ({ 
  invitation, 
  onClose, 
  onResend, 
  onCancel, 
  isInviting, 
  isCancelling 
}) => {
  const { t, i18n } = useTranslation();
  const statusConfig = getStatusConfig(t);
  const inviteMethodOptions = getInviteMethodOptions(t);
  const weekdayOptions = getWeekdayOptions(t);
  const currentLocale = i18n.language === "uz" ? "uz-UZ" : i18n.language === "ru" ? "ru-RU" : "en-US";

  return (
    <Drawer
      open={!isNil(invitation)}
      onOpenChange={(open) => !open && onClose()}
      direction="right"
    >
      <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-xl p-0">
        {invitation ? (
          <div className="flex h-[100dvh] flex-col">
            <DrawerHeader className="border-b px-6 py-5 text-left">
              <DrawerTitle>{t("coach.clients.drawers.invitationDetail.title")}</DrawerTitle>
              <DrawerDescription>
                {t("coach.clients.drawers.invitationDetail.description")}
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4 rounded-3xl border px-5 py-5">
                  <Avatar className="size-14 border">
                    <AvatarImage src={get(invitation, "avatar")} alt={get(invitation, "name")} />
                    <AvatarFallback>{getInitials(get(invitation, "name"))}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold">{get(invitation, "name")}</h2>
                      <Badge variant="outline" className={get(statusConfig, [get(invitation, "status"), "className"])}>
                        {get(statusConfig, [get(invitation, "status"), "label"], get(invitation, "status"))}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{get(invitation, "email") || t("coach.clients.drawers.invitationDetail.noEmail")}</p>
                      <p>{get(invitation, "phone") || t("coach.clients.drawers.invitationDetail.noPhone")}</p>
                    </div>
                  </div>
                </div>

                <Card className="py-6">
                  <CardHeader>
                    <CardTitle>{t("coach.clients.drawers.invitationDetail.agreementTitle")}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("coach.clients.drawers.invitationDetail.contactMethodLabel")}
                      </p>
                      <p className="font-medium">
                        {get(find(inviteMethodOptions, (o) => o.value === get(invitation, "contactMethod")), "label", "—")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("coach.clients.drawers.invitationDetail.valueLabel")}
                      </p>
                      <p className="font-medium">{get(invitation, "identifierValue") || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("coach.clients.drawers.invitationDetail.agreedAmountLabel")}
                      </p>
                      <p className="font-medium">
                        {get(invitation, "agreedAmount") 
                          ? `${new Intl.NumberFormat(currentLocale).format(get(invitation, "agreedAmount"))} ${t("coach.dashboard.revenue.currency", { defaultValue: "so'm" })}` 
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("coach.clients.drawers.invitationDetail.paymentDayLabel")}
                      </p>
                      <p className="font-medium">{formatPaymentDay(get(invitation, "paymentDate"))}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="py-6">
                  <CardHeader>
                    <CardTitle>{t("coach.clients.drawers.invitationDetail.trainingTitle")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isArray(get(invitation, "trainingSchedule")) && size(get(invitation, "trainingSchedule")) > 0 ? (
                      map(get(invitation, "trainingSchedule"), (slot, index) => (
                        <div key={index} className="rounded-2xl border px-4 py-3 text-sm">
                          <span className="font-medium">
                            {get(find(weekdayOptions, (o) => o.value === get(slot, "day")), "label", get(slot, "day"))}
                          </span>
                          <span className="text-muted-foreground"> · {get(slot, "time")}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t("coach.clients.drawers.invitationDetail.noTrainingSchedule")}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="py-6">
                  <CardHeader>
                    <CardTitle>{t("coach.clients.drawers.invitationDetail.notesTitle")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("coach.clients.drawers.invitationDetail.coachNotesLabel")}
                      </p>
                      <p className="font-medium">{get(invitation, "notes") || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("coach.clients.drawers.invitationDetail.clientResponseLabel")}
                      </p>
                      <p className="font-medium">
                        {get(invitation, "declineReason") || t("coach.clients.drawers.invitationDetail.noClientResponse")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <DrawerFooter className="border-t px-6 py-4">
              {includes(["declined", "inactive"], get(invitation, "status")) && (
                <Button
                  disabled={isInviting}
                  onClick={() => onResend(invitation)}
                >
                  <RotateCcwIcon data-icon="inline-start" />{" "}
                  {t("coach.clients.drawers.invitationDetail.resend")}
                </Button>
              )}
              {get(invitation, "status") === "pending" && (
                <Button variant="destructive" disabled={isCancelling} onClick={() => onCancel(get(invitation, "invitationId"))}>
                  {t("coach.clients.drawers.invitationDetail.cancel")}
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>{t("coach.clients.drawers.invitationDetail.close")}</Button>
            </DrawerFooter>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
};
