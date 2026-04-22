import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeftIcon } from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useBreadcrumbStore } from "@/store";
import { HealthTab } from "@/modules/profile/containers/profile/tabs/health-tab";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setBreadcrumbs);

  React.useEffect(() => {
    setBreadcrumbs([
      {
        label: t("breadcrumbs.dashboard", "Dashboard"),
        href: "/user/dashboard",
      },
      {
        label: t("profile.tabs.health", "Salomatlik"),
      },
    ]);

    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, t]);

  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => navigate(-1)}
            aria-label={t("common.back", "Orqaga")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">
              {t("profile.tabs.health", "Salomatlik")}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {t("profile.health.description", {
                defaultValue:
                  "Maqsad, suv, qadam va progress ko'rsatkichlarini bitta joyda boshqaring.",
              })}
            </p>
          </div>
        </div>

        <HealthTab />
      </div>
    </PageTransition>
  );
};

export default Index;
