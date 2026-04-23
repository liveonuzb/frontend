import { get, isArray, join, map, take } from "lodash";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import useGetQuery from "@/hooks/api/use-get-query";
import usePostQuery from "@/hooks/api/use-post-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import DeclineInvitationDrawer from "./decline-invitation-drawer.jsx";
import {
  DASHBOARD_COACH_FEEDBACK_QUERY_KEY,
  DASHBOARD_COACH_INVITATIONS_QUERY_KEY,
  DASHBOARD_COACH_TASKS_QUERY_KEY,
  DASHBOARD_ME_QUERY_KEY,
  DASHBOARD_WEEKLY_CHECK_INS_QUERY_KEY,
} from "./query-helpers.js";

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

export default function CoachInvitationsSection() {
  const queryClient = useQueryClient();
  const [coachInvitationPendingById, setCoachInvitationPendingById] =
    React.useState({});
  const [declineInvitationTarget, setDeclineInvitationTarget] =
    React.useState(null);
  const [declineReason, setDeclineReason] = React.useState("");
  const { data } = useGetQuery({
    url: "/users/me/coach-invitations",
    queryProps: {
      queryKey: DASHBOARD_COACH_INVITATIONS_QUERY_KEY,
    },
  });
  const invitations = get(data, "data.data.items", []);
  const invalidateCoachData = React.useCallback(
    async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: DASHBOARD_ME_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: DASHBOARD_COACH_INVITATIONS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: DASHBOARD_WEEKLY_CHECK_INS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: DASHBOARD_COACH_FEEDBACK_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: DASHBOARD_COACH_TASKS_QUERY_KEY,
        }),
      ]);
    },
    [queryClient],
  );
  const acceptMutation = usePostQuery({
    queryKey: DASHBOARD_COACH_INVITATIONS_QUERY_KEY,
    mutationProps: {
      onSuccess: invalidateCoachData,
    },
  });
  const declineMutation = usePostQuery({
    queryKey: DASHBOARD_COACH_INVITATIONS_QUERY_KEY,
    mutationProps: {
      onSuccess: invalidateCoachData,
    },
  });

  const isPending = React.useCallback(
    (invitationId) => Boolean(coachInvitationPendingById[invitationId]),
    [coachInvitationPendingById],
  );

  const handleAccept = async (invitationId) => {
    if (!invitationId || isPending(invitationId)) {
      return;
    }

    setCoachInvitationPendingById((current) => ({
      ...current,
      [invitationId]: true,
    }));
    try {
      await acceptMutation.mutateAsync({
        url: `/users/me/coach-invitations/${invitationId}/accept`,
        attributes: {},
      });
      toast.success("Murabbiy taklifi qabul qilindi");
    } catch {
      toast.error("Taklifni qabul qilib bo'lmadi");
    } finally {
      setCoachInvitationPendingById((current) => {
        const next = { ...current };
        delete next[invitationId];
        return next;
      });
    }
  };

  const handleDecline = async (invitationId) => {
    if (!invitationId || isPending(invitationId)) {
      return;
    }

    setCoachInvitationPendingById((current) => ({
      ...current,
      [invitationId]: true,
    }));
    try {
      await declineMutation.mutateAsync({
        url: `/users/me/coach-invitations/${invitationId}/decline`,
        attributes: {
          reason: declineReason.trim() || undefined,
        },
      });
      toast.success("Taklif rad etildi");
      setDeclineInvitationTarget(null);
      setDeclineReason("");
    } catch {
      toast.error("Taklifni rad etib bo'lmadi");
    } finally {
      setCoachInvitationPendingById((current) => {
        const next = { ...current };
        delete next[invitationId];
        return next;
      });
    }
  };

  if (!invitations.length) return null;

  return (
    <>
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
                ? join(
                    map(
                      take(invitation.trainingSchedule, 2),
                      (slot) => `${slot.day} ${slot.time}`,
                    ),
                    " • ",
                  )
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
                        {join(
                          take(
                            map(
                              String(invitation.coach?.name || "C").split(" "),
                              (part) => part[0],
                            ),
                            2,
                          ),
                          "",
                        ).toUpperCase()}
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
                        {schedulePreview ? <span>{schedulePreview}</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeclineInvitationTarget(invitation);
                        setDeclineReason("");
                      }}
                      disabled={busy}
                    >
                      {busy ? "Kutilmoqda..." : "Rad etish"}
                    </Button>
                    <Button
                      onClick={() => handleAccept(invitation.id)}
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
      <DeclineInvitationDrawer
        target={declineInvitationTarget}
        reason={declineReason}
        setReason={setDeclineReason}
        isDeclining={declineMutation.isPending}
        onDecline={handleDecline}
        onClose={() => {
          setDeclineInvitationTarget(null);
          setDeclineReason("");
        }}
      />
    </>
  );
}
