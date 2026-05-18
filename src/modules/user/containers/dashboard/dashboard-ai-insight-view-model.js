import { get, filter, isArray, toNumber } from "lodash";
import { getUserAiReportPeriodLabel } from "@/hooks/app/use-user-ai-reports";

const getReportBody = (report) => report?.report ?? report?.body ?? {};

const getReportSummary = (report) => {
  const body = getReportBody(report);
  const summary = body.summary ?? report?.summary ?? {};

  if (typeof summary === "string") {
    return {
      title: report?.title ?? "AI Health Report",
      summary,
    };
  }

  return {
    title: summary?.title ?? report?.title ?? "AI Health Report",
    summary: summary?.summary ?? report?.description ?? "",
  };
};

const getNextAction = (report) => {
  const body = getReportBody(report);
  const nextActions = isArray(body.nextActions) ? body.nextActions : [];

  return nextActions[0] ?? "";
};

const resolveQuota = (limits = {}) => ({
  used: toNumber(limits?.quota?.used ?? 0) || 0,
  monthly: toNumber(limits?.quota?.monthly ?? 0) || 0,
  remaining: toNumber(limits?.quota?.remaining ?? 0) || 0,
});

const hasDailyTrackingData = (dailyReport) => {
  if (!dailyReport) {
    return false;
  }

  if (dailyReport.hasData !== undefined) {
    return Boolean(dailyReport.hasData);
  }

  return Boolean(dailyReport.summary || toNumber(dailyReport.score ?? 0) > 0);
};

export const getDashboardAiInsightViewModel = (
  insights = {},
  dateKey = "",
  user = null,
) => {
  const limits = insights.limits ?? {};
  const quota = resolveQuota(limits);
  const latestReport = insights.latestReport ?? null;
  const dailyReport = insights.dailyReport ?? null;
  const isPremium = Boolean(
    limits?.isPremium ?? get(user, "premium.status") === "active",
  );
  const lockedPeriods = isArray(limits?.periods)
    ? filter(limits.periods, (period) => Boolean(period?.locked))
    : [];
  const dailyHasData = hasDailyTrackingData(dailyReport);
  const dailyScore = toNumber(dailyReport?.score ?? 0) || 0;
  const latestSummary = latestReport ? getReportSummary(latestReport) : null;
  const latestNextAction = latestReport ? getNextAction(latestReport) : "";
  const hasTodayCachedReport = Boolean(
    latestReport?.createdAt && String(latestReport.createdAt).startsWith(dateKey),
  );
  const noQuota =
    !hasTodayCachedReport && quota.monthly > 0 && quota.remaining <= 0;
  const empty = !dailyHasData && !latestReport;
  const quotaLabel =
    quota.monthly > 0
      ? `${quota.remaining}/${quota.monthly} report qoldi`
      : "Report limiti yangilanmoqda";

  if (empty) {
    return {
      state: "empty",
      isPremium,
      badgeLabel: isPremium ? "Premium" : "Free",
      title: "Trackingni boshlang",
      description:
        "AI tahlil uchun bugungi ovqat, suv yoki faollikni kiriting. Yetarli data yig'ilganda snapshot tayyor bo'ladi.",
      quotaLabel,
      lockedLabel: lockedPeriods.length
        ? `${lockedPeriods.length} ta uzun davr Premiumda`
        : "",
      dailyScoreLabel: "",
      primaryActionLabel: "AI reportni ochish",
      showPremiumCta: !isPremium,
      noQuota,
      hasTodayCachedReport,
    };
  }

  const title = isPremium && latestSummary ? latestSummary.title : "Bugungi AI preview";
  const description =
    isPremium && latestSummary
      ? latestSummary.summary
      : dailyReport?.summary ||
        latestSummary?.summary ||
        "Bugungi trackingdan qisqa signal tayyor.";
  const statusLabel = noQuota ? "Limit tugagan" : dailyReport?.status ?? "";
  const primaryActionLabel = hasTodayCachedReport
    ? "Bugungi reportni ochish"
    : "AI reportni ochish";

  return {
    state: noQuota ? "no-quota" : "ready",
    isPremium,
    badgeLabel: isPremium ? "Premium" : "Free",
    title,
    description: noQuota
      ? "Bu oy yangi report limiti tugagan. Premium bilan uzun davrlar va ko'proq AI reportlar ochiladi."
      : description,
    statusLabel,
    quotaLabel,
    lockedLabel: lockedPeriods.length
      ? `${lockedPeriods.length} ta uzun davr Premiumda`
      : "",
    dailyScoreLabel: dailyHasData ? `${dailyScore}/100` : "",
    latestPeriodLabel: latestReport?.period
      ? getUserAiReportPeriodLabel(latestReport.period)
      : "",
    nextAction: latestNextAction,
    primaryActionLabel,
    showPremiumCta: !isPremium,
    noQuota,
    hasTodayCachedReport,
  };
};
