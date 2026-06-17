import React from "react";
import get from "lodash/get";
import map from "lodash/map";
import take from "lodash/take";
import { AnimatePresence, motion } from "framer-motion";
import { BellIcon, TrophyIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getUserAccentCardClassName,
  getUserInteractiveCardClassName,
} from "@/modules/user/lib/card-styles";

const InvitationsBanner = ({
  invitations = [],
  respondingById = {},
  onRespond,
  onViewAll,
}) => (
  <AnimatePresence>
    {invitations.length > 0 ? (
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={getUserAccentCardClassName(
          "relative overflow-hidden border border-primary/15 bg-primary/5 p-1",
        )}
      >
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <BellIcon className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                Challenge takliflari
              </h2>
              <p className="text-sm font-medium text-muted-foreground">
                Do'stlaringiz sizni musobaqaga chorlamoqda
              </p>
            </div>
          </div>
          <div className="flex -space-x-3 overflow-hidden">
            {map(take(invitations, 3), (inv) => (
              <div
                key={inv.id}
                className="flex size-10 cursor-help items-center justify-center rounded-full border-2 border-background bg-muted transition-transform hover:z-10 hover:-translate-y-1"
                title={inv.inviter?.name}
              >
                <UserIcon className="size-5 text-muted-foreground" />
              </div>
            ))}
            {invitations.length > 3 ? (
              <div className="flex size-10 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-[10px] font-bold text-primary">
                +{invitations.length - 3}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 p-3 pt-0 sm:p-5 sm:pt-0">
          {map(take(invitations, 2), (inv) => (
            <motion.div
              key={inv.id}
              layout
              className={getUserInteractiveCardClassName(
                "group relative overflow-hidden p-4",
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 transition-colors group-hover:bg-primary/10">
                    <TrophyIcon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-bold">
                      {inv.challenge?.title || "Challenge"}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                      {inv.inviter?.name || "Foydalanuvchi"} dan
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-xl px-4 font-semibold hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onRespond?.(inv.id, "DECLINE")}
                    disabled={Boolean(get(respondingById, inv.id))}
                  >
                    {get(respondingById, inv.id) ? "..." : "Rad etish"}
                  </Button>
                  <Button
                    size="sm"
                    className="h-9 rounded-xl px-5 font-bold"
                    onClick={() => onRespond?.(inv.id, "ACCEPT")}
                    disabled={Boolean(get(respondingById, inv.id))}
                  >
                    {get(respondingById, inv.id) ? "..." : "Qabul qilish"}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
          {invitations.length > 2 ? (
            <button
              type="button"
              onClick={onViewAll}
              className="py-1 text-xs font-bold text-primary/70 transition-colors hover:text-primary"
            >
              Barcha {invitations.length} ta taklifni ko'rish
            </button>
          ) : null}
        </div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

export default InvitationsBanner;
