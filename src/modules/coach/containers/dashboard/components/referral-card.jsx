import React from "react";
import { CopyIcon, CheckIcon, UsersIcon, MousePointerClickIcon, TrendingUpIcon } from "lucide-react";
import { toast } from "sonner";
import { useCoachReferralDashboard } from "@/hooks/app/use-coach-referrals";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const StatItem = ({ icon: Icon, label, value, color = "primary" }) => {
  const colors = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
  };
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-muted/30">
      <div className={`flex size-8 items-center justify-center rounded-xl ${colors[color]}`}>
        <Icon className="size-4" />
      </div>
      <p className="text-xl font-black tabular-nums">{value}</p>
      <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider text-center">
        {label}
      </p>
    </div>
  );
};

export function ReferralCard() {
  const [copied, setCopied] = React.useState(false);
  const { data, isLoading } = useCoachReferralDashboard();

  const referral = data?.data ?? data;

  const referralLink = referral?.referralLink ?? "";
  const stats = referral?.stats ?? { clicks: 0, signups: 0, paidConversions: 0 };

  const handleCopy = React.useCallback(() => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success("Havola nusxalandi!");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [referralLink]);

  return (
    <Card className="overflow-hidden border-none bg-card/50 backdrop-blur-sm shadow-xl">
      <CardHeader className="px-6 py-5">
        <CardTitle className="text-base font-black tracking-tight">
          Referral Dasturi
        </CardTitle>
        <CardDescription className="text-xs font-medium text-muted-foreground/70">
          Do&apos;stlaringizni taklif qiling va mukofot oling
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0 flex flex-col gap-4">
        {/* Referral Link */}
        <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-muted/30 px-4 py-3">
          {isLoading ? (
            <Skeleton className="h-4 flex-1 rounded" />
          ) : (
            <p className="flex-1 truncate text-sm font-medium text-muted-foreground">
              {referralLink || "Yuklanmoqda..."}
            </p>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 shrink-0 rounded-xl p-0"
            onClick={handleCopy}
            disabled={isLoading || !referralLink}
          >
            {copied ? (
              <CheckIcon className="size-4 text-emerald-600" />
            ) : (
              <CopyIcon className="size-4" />
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {isLoading ? (
            <>
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </>
          ) : (
            <>
              <StatItem
                icon={MousePointerClickIcon}
                label="Bosilish"
                value={stats.clicks}
                color="primary"
              />
              <StatItem
                icon={UsersIcon}
                label="Ro'yxat"
                value={stats.signups}
                color="emerald"
              />
              <StatItem
                icon={TrendingUpIcon}
                label="To'lov"
                value={stats.paidConversions}
                color="amber"
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
