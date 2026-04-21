import React from "react";
import { FileDownIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbStore } from "@/store";
import {
  useCoachClients,
  useCoachReportGenerator,
  useCoachReports,
} from "@/modules/coach/lib/hooks";
import GenerateReportDrawer from "./components/GenerateReportDrawer.jsx";
import {
  formatReportDate,
  REPORT_TYPE_LABELS,
  resolveHistoryItems,
  resolveHistoryMeta,
} from "./components/report-utils.js";

const resolveClients = (data) => {
  const nested = data?.data?.data;
  if (Array.isArray(nested)) return nested;
  const direct = data?.data;
  return Array.isArray(direct) ? direct : [];
};

const ReportsContainer = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [type, setType] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const queryParams = React.useMemo(
    () => ({
      ...(type !== "all" ? { type } : {}),
      sortBy: "createdAt",
      sortDir: "desc",
      page,
      pageSize: 10,
    }),
    [type, page],
  );

  const { data, isLoading, refetch } = useCoachReports(queryParams);
  const { data: clientsData } = useCoachClients(
    { status: "active", pageSize: 100 },
    { staleTime: 30000 },
  );
  const { generateReport, isGenerating } = useCoachReportGenerator();
  const reports = resolveHistoryItems(data);
  const meta = resolveHistoryMeta(data);
  const clients = resolveClients(clientsData);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/reports", title: "Reports" },
    ]);
  }, [setBreadcrumbs]);

  const handleGenerate = async (params) => {
    try {
      await generateReport(params);
      toast.success("Report generatsiya qilindi");
      setDrawerOpen(false);
      void refetch();
    } catch {
      toast.error("Report generatsiya qilib bo'lmadi");
    }
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <FileDownIcon className="size-3.5" />
            Reports
          </p>
          <h1 className="text-3xl font-black tracking-tight">Reportlar</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Generated report history va yangi PDF/CSV exportlar.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RotateCcwIcon className="mr-2 size-4" />
            Yangilash
          </Button>
          <Button onClick={() => setDrawerOpen(true)}>Generate report</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "business_report_pdf", "client_progress_pdf", "clients_csv", "sessions_csv"].map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={type === item ? "default" : "outline"}
            onClick={() => {
              setType(item);
              setPage(1);
            }}
          >
            {item === "all" ? "Barchasi" : REPORT_TYPE_LABELS[item]}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map((item) => (
            <Card key={item} className="rounded-3xl">
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-4 w-72" />
              </CardContent>
            </Card>
          ))
        ) : reports.length === 0 ? (
          <Card className="rounded-3xl border-dashed">
            <CardContent className="py-14 text-center">
              <p className="text-sm font-medium">Hali reportlar yo&apos;q</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Birinchi reportni generate qiling.
              </p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="rounded-3xl">
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {REPORT_TYPE_LABELS[report.type] || report.type}
                    </p>
                    <Badge variant="outline">{report.metadata?.period || "export"}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {report.entityLabel || report.entityId || "Coach report"} •{" "}
                    {formatReportDate(report.createdAt)}
                  </p>
                </div>
                <Badge variant="secondary">Generated</Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {meta.totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            {meta.page} / {meta.totalPages} sahifa • {meta.total} ta
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Oldingi
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Keyingi
            </Button>
          </div>
        </div>
      ) : null}

      <GenerateReportDrawer
        open={drawerOpen}
        clients={clients}
        onOpenChange={setDrawerOpen}
        onSubmit={handleGenerate}
        isGenerating={isGenerating}
      />
    </PageTransition>
  );
};

export default ReportsContainer;
