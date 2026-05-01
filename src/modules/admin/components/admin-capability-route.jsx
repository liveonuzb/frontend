import React from "react";
import { Link } from "react-router";
import { ShieldAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";

const AdminForbidden = () => (
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
        <Button asChild variant="outline">
          <Link to="/admin/dashboard">Dashboardga qaytish</Link>
        </Button>
      </CardContent>
    </Card>
  </div>
);

const AdminCapabilityRoute = ({ capability, roles, children }) => {
  const permissions = useAdminPermissions();

  const hasCapability = capability
    ? permissions.hasCapability(capability)
    : true;
  const hasRole = roles?.length
    ? roles.some((role) => permissions.roles.includes(role))
    : true;

  if (!hasCapability || !hasRole) {
    return <AdminForbidden />;
  }

  return children;
};

export default AdminCapabilityRoute;
