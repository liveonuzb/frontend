/* eslint-disable react-hooks/set-state-in-effect */
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
import get from "lodash/get";
import filter from "lodash/filter";
import find from "lodash/find";
import includes from "lodash/includes";
import isArray from "lodash/isArray";
import map from "lodash/map";
import take from "lodash/take";
import { useBreadcrumbStore } from "@/store";
import {
  DownloadIcon,
  FileSpreadsheetIcon,
  ClipboardCheckIcon,
  ReceiptTextIcon,
  UsersIcon,
  UtensilsIcon,
  LanguagesIcon,
  Loader2Icon,
  RotateCcwIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";

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
    capability: "support.read",
  },
  {
    id: "premium-users",
    title: "Premium foydalanuvchilar",
    description: "Faqat faol premium foydalanuvchilarni Excel formatda oling.",
    icon: UsersIcon,
    capability: "support.read",
  },
  {
    id: "foods",
    title: "Ovqatlar bazasi",
    description: "Ovqatlar, kategoriya va tarjimalarni Excel formatda eksport qiling.",
    icon: UtensilsIcon,
    capability: "content.read",
  },
  {
    id: "missing-translations",
    title: "Tarjimasi yetishmayotganlar",
    description:
      "Admin kataloglardagi yetishmayotgan tarjimalarni alohida hisobotda oling.",
    icon: LanguagesIcon,
    capability: "content.manage",
  },
  {
    id: "content-quality",
    title: "Content Quality",
    description:
      "Tarjima, rasm, nutrition va budget muammolarini bitta Excel reportda oling.",
    icon: ClipboardCheckIcon,
    capability: "content.read",
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
  const { canReadFinance, hasCapability } = useAdminPermissions();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { request } = useApi();
  const visibleReports = React.useMemo(
    () => filter(reports, (report) => hasCapability(report.capability)),
    [hasCapability],
  );

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

  const exportMissingTranslationsReport = React.useCallback(
    async () =>
      getDownloadPayload("/admin/reports/missing-translations/export"),
    [getDownloadPayload],
  );

  const exportContentQualityReport = React.useCallback(
    async () => getDownloadPayload("/admin/content-quality/export"),
    [getDownloadPayload],
  );

  const exportRevenueReport = React.useCallback(
    async (params = {}) =>
      getDownloadPayload("/admin/reports/revenue/export", params),
    [getDownloadPayload],
  );
  const [revenueRange, setRevenueRange] = React.useState("month");
  const [loadingId, setLoadingId] = React.useState(null);
  const [jobs, setJobs] = React.useState([]);
  const [isJobsLoading, setIsJobsLoading] = React.useState(false);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/reports", title: "Hisobotlar" },
    ]);
  }, [setBreadcrumbs]);

  const fetchJobs = React.useCallback(async () => {
    try {
      setIsJobsLoading(true);
      const response = await request.get("/admin/jobs");
      setJobs(get(response, "data.data", get(response, "data", [])) || []);
    } catch {
      toast.error("Joblar ro'yxatini olib bo'lmadi");
    } finally {
      setIsJobsLoading(false);
    }
  }, [request]);

  React.useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  const startExportJob = React.useCallback(
    async (url, params = {}) => {
      const response = await request.post(url, null, { params });
      await fetchJobs();
      return get(response, "data.data", get(response, "data"));
    },
    [fetchJobs, request],
  );

  const downloadJob = React.useCallback(
    async (job) => {
      try {
        setLoadingId(job.id);
        downloadBlob(
          await getDownloadPayload(`/admin/jobs/${job.id}/download`),
        );
        toast.success("Job natijasi yuklab olindi");
      } catch (error) {
        const message = error?.response?.data?.message;
        toast.error(
          isArray(message)
            ? message.join(", ")
            : message || "Job natijasini yuklab bo'lmadi",
        );
      } finally {
        setLoadingId(null);
      }
    },
    [getDownloadPayload],
  );

  const handleExport = React.useCallback(async (id) => {
    const report = find(reports, (item) => item.id === id);
    if (!report || !hasCapability(report.capability)) return;

    try {
      setLoadingId(id);

      if (id === "users") {
        await startExportJob("/admin/reports/users/export/jobs");
      } else if (id === "premium-users") {
        await startExportJob("/admin/reports/users/export/jobs", {
          premium: "active",
        });
      } else if (id === "foods") {
        await startExportJob("/admin/foods/export/jobs");
      } else if (id === "missing-translations") {
        downloadBlob(await exportMissingTranslationsReport());
      } else if (id === "content-quality") {
        downloadBlob(await exportContentQualityReport());
      }

      toast.success(
        includes(["users", "premium-users", "foods"], id)
          ? "Hisobot job sifatida boshlandi"
          : "Hisobot yuklab olindi",
      );
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Hisobotni yuklab bo'lmadi",
      );
    } finally {
      setLoadingId(null);
    }
  }, [
    exportContentQualityReport,
    exportMissingTranslationsReport,
    hasCapability,
    startExportJob,
  ]);

  const handleRevenueExport = React.useCallback(async () => {
    if (!canReadFinance) return;

    try {
      setLoadingId("revenue");
      downloadBlob(await exportRevenueReport({ range: revenueRange }));
      toast.success("Revenue hisobot yuklab olindi");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Revenue hisobotni yuklab bo'lmadi",
      );
    } finally {
      setLoadingId(null);
    }
  }, [canReadFinance, exportRevenueReport, revenueRange]);

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
        {map(visibleReports, (report) => (
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

        {canReadFinance ? (
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
              {map(revenueRanges, (range) => (
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
        ) : null}
      </div>
      <Card>
        <CardHeader className="py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheetIcon className="size-5 text-primary" />
                Import/export joblar
              </CardTitle>
              <CardDescription className="mt-2">
                Katta eksport va importlar background job sifatida bajariladi.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => void fetchJobs()}
              disabled={isJobsLoading}
              className="gap-2"
            >
              {isJobsLoading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <RotateCcwIcon className="size-4" />
              )}
              Yangilash
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-6">
          {jobs.length ? (
            map(take(jobs, 8), (job) => {
              const canDownload =
                job?.result?.hasDownload || job?.result?.hasFailedRows;
              return (
                <div
                  key={job.id}
                  className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{job.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.status} · {job.progress}% ·{" "}
                      {job.result?.summary
                        ? JSON.stringify(job.result.summary)
                        : "natija tayyorlanmoqda"}
                    </p>
                    {job.error ? (
                      <p className="text-sm text-destructive">{job.error}</p>
                    ) : null}
                  </div>
                  <Button
                    variant="outline"
                    disabled={!canDownload || loadingId === job.id}
                    onClick={() => void downloadJob(job)}
                    className="gap-2"
                  >
                    <DownloadIcon className="size-4" />
                    Yuklab olish
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Hali joblar yo'q.
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
};

export default Index;
