import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeftIcon } from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useBreadcrumbStore } from "@/store";
import { ReferralDashboard } from "@/modules/profile/components/referral";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setBreadcrumbs = useBreadcrumbStore((s) => s.setBreadcrumbs);

  React.useEffect(() => {
    setBreadcrumbs([
      { label: t("breadcrumbs.dashboard", "Dashboard"), href: "/user/dashboard" },
      { label: t("profile.referral.pageTitle", "Referallar") },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, t]);

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-6 space-y-5">
        {/* Header with back button + title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => navigate(-1)}
            aria-label={t("common.back", "Orqaga")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold truncate">
              {t("profile.referral.pageTitle", "Referallar")}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {t(
                "profile.referral.pageSubtitle",
                "Do'stlaringizni taklif qiling va XP oling",
              )}
            </p>
          </div>
        </div>

        <ReferralDashboard variant="page" />
      </div>
    </PageTransition>
  );
};

export default Index;
