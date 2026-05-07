import React from "react";
import { Link } from "react-router";
import { ShieldAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageLoader from "@/components/page-loader/index.jsx";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";

const AdminForbidden = ({ capability, roles }) => (
  <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-4 py-10">
    <Card className="w-full max-w-md border-border/70 shadow-sm">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlertIcon className="size-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">
            Ruxsat yo'q
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Bu sahifani ko'rish uchun kerakli admin permission mavjud emas.
          </p>
        </div>
        <div className="w-full rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-left text-xs text-muted-foreground">
          {capability ? (
            <p>
              Yetishmayotgan capability:{" "}
              <span className="font-mono font-medium text-foreground">
                {capability}
              </span>
            </p>
          ) : null}
          {roles?.length ? (
            <p className="mt-1">
              Kerakli role:{" "}
              <span className="font-mono font-medium text-foreground">
                {roles.join(" / ")}
              </span>
            </p>
          ) : null}
        </div>
        <Button asChild variant="outline">
          <Link to="/admin/dashboard">Dashboardga qaytish</Link>
        </Button>
      </CardContent>
    </Card>
  </div>
);

const AdminCapabilityRoute = ({ capability, roles, children }) => {
  const permissions = useAdminPermissions();

  if (permissions.isLoading) {
    return <PageLoader />;
  }

  const hasCapability = capability
    ? permissions.hasCapability(capability)
    : true;
  const hasRole = roles?.length
    ? roles.some((role) => permissions.roles.includes(role))
    : true;

  if (!hasCapability || !hasRole) {
    return (
      <AdminForbidden
        capability={!hasCapability ? capability : undefined}
        roles={!hasRole ? roles : undefined}
      />
    );
  }

  return children;
};

export default AdminCapabilityRoute;
