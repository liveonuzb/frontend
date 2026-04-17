import { isArray, join, map, take } from "lodash";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const contactMethodLabels = {
  phone: "Telefon",
  email: "Email",
  telegram: "Telegram",
};

const formatShortDate = (value) => {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u2014";
  return date.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" });
};

const formatPaymentDay = (value) => {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getDate()}-kun`;
};

export default function CoachInvitationsSection({
  invitations,
  isPending,
  onAccept,
  onDecline,
}) {
  if (!invitations.length) return null;

  return (
    <div className="rounded-2xl border px-4 py-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Murabbiy takliflari</h2>
        <p className="text-sm text-muted-foreground">
          Sizga murabbiylar tomonidan yuborilgan takliflar.
        </p>
      </div>
      <div className="mt-4 grid gap-3">
        {map(invitations, (invitation) => {
          const busy = isPending(invitation.id);
          const schedulePreview =
            isArray(invitation.trainingSchedule) &&
            invitation.trainingSchedule.length > 0
              ? join(map(take(invitation.trainingSchedule, 2), (slot) => `${slot.day} ${slot.time}`), " \u2022 ")
              : null;

          return (
            <div
              key={invitation.id}
              className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] to-background p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <Avatar className="size-12 border">
                    <AvatarImage
                      src={invitation.coach?.avatar}
                      alt={invitation.coach?.name}
                    />
                    <AvatarFallback>
                      {join(take(map(String(invitation.coach?.name || "C").split(" "), (part) => part[0]), 2), "").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1.5">
                    <div className="font-semibold">
                      {invitation.coach?.name || "Murabbiy"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {invitation.coach?.specializations?.length > 0
                        ? join(invitation.coach.specializations, ", ")
                        : "Shaxsiy murabbiylik taklifi"}
                    </div>
                    {invitation.notes ? (
                      <p className="text-sm text-muted-foreground">
                        {invitation.notes}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border bg-background px-2.5 py-1 text-muted-foreground">
                        Yuborilgan: {formatShortDate(invitation.createdAt)}
                      </span>
                      {invitation.agreedAmount ? (
                        <span className="rounded-full border bg-background px-2.5 py-1 text-muted-foreground">
                          {new Intl.NumberFormat("uz-UZ").format(
                            invitation.agreedAmount,
                          )}{" "}
                          so&apos;m
                        </span>
                      ) : null}
                      {invitation.paymentDate ? (
                        <span className="rounded-full border bg-background px-2.5 py-1 text-muted-foreground">
                          To&apos;lov: {formatPaymentDay(invitation.paymentDate)}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {invitation.contactMethod ? (
                        <span>
                          {contactMethodLabels[invitation.contactMethod] ??
                            invitation.contactMethod}
                        </span>
                      ) : null}
                      {invitation.identifierValue ? (
                        <span>{invitation.identifierValue}</span>
                      ) : null}
                      {schedulePreview ? (
                        <span>{schedulePreview}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => onDecline(invitation)}
                    disabled={busy}
                  >
                    {busy ? "Kutilmoqda..." : "Rad etish"}
                  </Button>
                  <Button
                    onClick={() => onAccept(invitation.id)}
                    disabled={busy}
                  >
                    {busy ? "Kutilmoqda..." : "Qabul qilish"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
