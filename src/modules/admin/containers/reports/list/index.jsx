import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PageTransition from "@/components/page-transition";
import useApi from "@/hooks/api/use-api.js";
import { get } from "lodash";
import { useBreadcrumbStore } from "@/store";
import {
  DownloadIcon,
  FileSpreadsheetIcon,
  ReceiptTextIcon,
  UsersIcon,
  UtensilsIcon,
  LanguagesIcon,
} from "lucide-react";
import { toast } from "sonner";

const revenueRanges = [
  { label: "Hafta", value: "week" },
  { label: "Oy", value: "month" },
  { label: "Yil", value: "year" },
];

const reports = [
  {
    id: "users",
    title: "Foydalanuvchilar",
    description: "Barcha foydalanuvchilar ro'yxatini Excel ko'rinishida yuklab olish.",
    icon: UsersIcon,
  },
  {
    id: "premium-users",
    title: "Premium foydalanuvchilar",
    description: "Faqat faol premium foydalanuvchilarni Excel formatda oling.",
    icon: UsersIcon,
  },
  {
    id: "foods",
    title: "Ovqatlar bazasi",
    description: "Ovqatlar, kategoriya va tarjimalarni Excel formatda eksport qiling.",
    icon: UtensilsIcon,
  },
  {
    id: "missing-translations",
    title: "Tarjimasi yetishmayotganlar",
    description:
      "Food va category ichidagi yetishmayotgan tarjimalarni alohida hisobotda oling.",
    icon: LanguagesIcon,
  },
];

const downloadBlob = ({ blob, fileName }) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName || "report.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { request } = useApi();

  const getDownloadPayload = React.useCallback(
    async (url, params = {}) => {
      const response = await request.get(url, {
        params,
        responseType: "blob",
      });

      return {
        blob: get(response, "data"),
        fileName:
          response.headers?.["content-disposition"]?.match(
            /filename="?([^"]+)"?/,
          )?.[1] || "report.xlsx",
      };
    },
    [request],
  );

  const exportUsersReport = React.useCallback(
    async (params = {}) =>
      getDownloadPayload("/admin/reports/users/export", params),
    [getDownloadPayload],
  );

  const exportFoodsReport = React.useCallback(
    async (params = {}) =>
      getDownloadPayload("/admin/foods/export", params),
    [getDownloadPayload],
  );

  const exportMissingTranslationsReport = React.useCallback(
    async () =>
      getDownloadPayload("/admin/reports/missing-translations/export"),
    [getDownloadPayload],
  );

  const exportRevenueReport = React.useCallback(
    async (params = {}) =>
      getDownloadPayload("/admin/reports/revenue/export", params),
    [getDownloadPayload],
  );
  const [revenueRange, setRevenueRange] = React.useState("month");
  const [loadingId, setLoadingId] = React.useState(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/reports", title: "Hisobotlar" },
    ]);
  }, [setBreadcrumbs]);

  const handleExport = React.useCallback(async (id) => {
    try {
      setLoadingId(id);

      if (id === "users") {
        downloadBlob(await exportUsersReport());
      } else if (id === "premium-users") {
        downloadBlob(await exportUsersReport({ premium: "active" }));
      } else if (id === "foods") {
        downloadBlob(await exportFoodsReport());
      } else if (id === "missing-translations") {
        downloadBlob(await exportMissingTranslationsReport());
      }

      toast.success("Hisobot yuklab olindi");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        Array.isArray(message)
          ? message.join(", ")
          : message || "Hisobotni yuklab bo'lmadi",
      );
    } finally {
      setLoadingId(null);
    }
  }, [
    exportFoodsReport,
    exportMissingTranslationsReport,
    exportUsersReport,
  ]);

  const handleRevenueExport = React.useCallback(async () => {
    try {
      setLoadingId("revenue");
      downloadBlob(await exportRevenueReport({ range: revenueRange }));
      toast.success("Revenue hisobot yuklab olindi");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        Array.isArray(message)
          ? message.join(", ")
          : message || "Revenue hisobotni yuklab bo'lmadi",
      );
    } finally {
      setLoadingId(null);
    }
  }, [exportRevenueReport, revenueRange]);

  return (
    <PageTransition className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileSpreadsheetIcon className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hisobotlar</h1>
          <p className="text-muted-foreground">
            Admin uchun tayyor Excel eksportlar va xizmat hisobotlari.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader className="py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <report.icon className="size-5 text-primary" />
                    {report.title}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {report.description}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => void handleExport(report.id)}
                  disabled={loadingId === report.id}
                  className="gap-2"
                >
                  <DownloadIcon className="size-4" />
                  {loadingId === report.id ? "Yuklanmoqda..." : "Excel yuklash"}
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}

        <Card>
          <CardHeader className="py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ReceiptTextIcon className="size-5 text-primary" />
                  Revenue hisobot
                </CardTitle>
                <CardDescription className="mt-2">
                  Overview, chart bucketlar, expense va oxirgi transactionlar
                  bilan Excel eksport.
                </CardDescription>
              </div>
              <Button
                onClick={() => void handleRevenueExport()}
                disabled={loadingId === "revenue"}
                className="gap-2"
              >
                <DownloadIcon className="size-4" />
                {loadingId === "revenue" ? "Yuklanmoqda..." : "Excel yuklash"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pb-6">
            {revenueRanges.map((range) => (
              <Button
                key={range.value}
                variant={revenueRange === range.value ? "default" : "outline"}
                size="sm"
                onClick={() => setRevenueRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default Index;
