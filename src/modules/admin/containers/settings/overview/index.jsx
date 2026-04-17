import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useBreadcrumbStore } from "@/store";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import {
  SettingsIcon,
  SaveIcon,
  ShieldIcon,
  AlertTriangleIcon,
  GlobeIcon,
  PercentIcon,
} from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/page-transition";

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const queryClient = useQueryClient();

  const { data: settingsData } = useGetQuery({
    url: "/admin/settings",
    queryProps: {
      queryKey: ["admin", "settings"],
    },
  });

  const settings = get(settingsData, "data.data", {
    maintenanceMode: false,
    globalCommissionRate: 20,
    registrationEnabled: true,
    minPayoutAmount: 50000,
    appName: "EduConnect",
  });

  const updateMutation = usePatchQuery({
    queryKey: ["admin", "settings"],
    mutationProps: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["admin", "dashboard"],
        });
      },
    },
  });

  const isUpdating = updateMutation.isPending;

  const [formData, setFormData] = React.useState(settings);

  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/settings", title: "Sozlamalar" },
    ]);
  }, [setBreadcrumbs]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        url: "/admin/settings",
        attributes: formData,
      });
      toast.success("Sozlamalar saqlandi");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <SettingsIcon className="h-6 w-6 text-primary" />
              Tizim sozlamalari
            </h1>
            <p className="text-sm text-muted-foreground">
              Platformaning global parametrlari va boshqaruv bayroqlarini shu
              yerdan o'zgartiring.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            className="gap-2 font-bold px-6"
          >
            <SaveIcon className="h-4 w-4" />
            Saqlash
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* General Settings */}
            <Card className="border-border/50 shadow-sm overflow-hidden group">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <div className="flex items-center gap-2">
                  <GlobeIcon className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Asosiy sozlamalar</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Ilova nomi (App Name)</Label>
                  <Input
                    value={formData.appName}
                    onChange={(e) => handleChange("appName", e.target.value)}
                    placeholder="Masalan: EduConnect"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/20 border rounded-xl">
                  <div className="space-y-0.5">
                    <Label className="text-base">Ro'yxatdan o'tish</Label>
                    <p className="text-xs text-muted-foreground">
                      Yangi foydalanuvchilar kirishini boshqarish
                    </p>
                  </div>
                  <Switch
                    checked={formData.registrationEnabled}
                    onCheckedChange={(val) =>
                      handleChange("registrationEnabled", val)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financial Settings */}
            <Card className="border-border/50 shadow-sm overflow-hidden group">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <div className="flex items-center gap-2">
                  <PercentIcon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    Moliyaviy parametrlar
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Global komissiya stavkasi (%)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formData.globalCommissionRate}
                      onChange={(e) =>
                        handleChange(
                          "globalCommissionRate",
                          Number(e.target.value),
                        )
                      }
                      className="pr-10"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <span className="text-sm font-bold text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Minimal yechib olish miqdori (UZS)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formData.minPayoutAmount}
                      onChange={(e) =>
                        handleChange("minPayoutAmount", Number(e.target.value))
                      }
                      className="pl-12"
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none border-r pr-3">
                      <span className="text-xs font-bold text-muted-foreground">
                        SUM
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Maintenance Card */}
            <Card className="border-red-200/50 bg-red-50/10 dark:bg-red-950/5 shadow-sm overflow-hidden">
              <CardHeader className="bg-red-500/10 border-b border-red-200/50 pb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangleIcon className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-lg text-red-700 dark:text-red-400">
                    Xavfsizlik va Texnik ishlar
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between p-4 border border-red-200/50 rounded-xl bg-white dark:bg-background">
                  <div className="space-y-0.5">
                    <Label className="text-base text-red-600">
                      Tekshiruv rejimi (Maintenance)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Ilovani vaqtincha yopish (faqat adminlar kiradi)
                    </p>
                  </div>
                  <Switch
                    checked={formData.maintenanceMode}
                    onCheckedChange={(val) =>
                      handleChange("maintenanceMode", val)
                    }
                    className="data-[state=checked]:bg-red-500"
                  />
                </div>

                <div className="p-4 bg-amber-500/5 border border-amber-200/50 rounded-xl flex gap-3">
                  <ShieldIcon className="h-8 w-8 text-amber-500 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      Diqqat!
                    </p>
                    <p className="text-xs text-amber-600/80 leading-relaxed italic">
                      Ushbu o'zgarishlar platformaning barcha
                      foydalanuvchilariga darhol ta'sir qiladi. Iltimos,
                      o'zgartirishdan oldin qayta tekshiring.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="bg-muted/30 pb-4 border-b">
                <CardTitle className="text-base">Tizim ma'lumotlari</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Frontend versiya:
                  </span>
                  <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                    v1.2.4-stable
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Oxirgi yangilanish:
                  </span>
                  <span className="text-xs">
                    {new Date().toLocaleDateString("uz-UZ")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Server status:</span>
                  <Badge className="bg-green-500 hover:bg-green-500 h-2 w-2 rounded-full p-0" />
                  <span className="text-green-600 font-bold text-xs uppercase ml-1">
                    Normal
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Index;
