import React from "react";
import { Link, useParams } from "react-router";
import { get } from "lodash";
import {
  ArrowLeftIcon,
  BriefcaseBusinessIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  StarIcon,
  UsersIcon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetQuery } from "@/hooks/api";
import { useBreadcrumbStore } from "@/store";
import {
  coachStatusConfig,
  marketplaceStatusConfig,
} from "../list/columns.jsx";

const formatNumber = (value) =>
  new Intl.NumberFormat("uz-UZ").format(Number(value ?? 0));

const formatCurrency = (value = 0) => `${formatNumber(value)} so'm`;

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("uz-UZ") : "-";

const Metric = ({ icon: Icon, label, value, hint }) => (
  <Card size="sm">
    <CardContent className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon />
      </div>
    </CardContent>
  </Card>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2 last:border-b-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="max-w-[65%] text-right text-sm font-medium">
      {value || "-"}
    </span>
  </div>
);

const Index = () => {
  const { id } = useParams();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const detailQuery = useGetQuery({
    url: `/admin/coaches/${id}`,
    queryProps: {
      queryKey: ["admin-coach-detail", id],
      enabled: Boolean(id),
    },
  });

  const detail = get(detailQuery.data, "data.data", {});
  const coach = get(detail, "coach", {});
  const metrics = get(detail, "metrics", {});
  const displayName =
    get(coach, "displayName") ||
    [get(coach, "firstName"), get(coach, "lastName")]
      .filter(Boolean)
      .join(" ") ||
    get(coach, "email") ||
    "Murabbiy";
  const coachStatus = get(coachStatusConfig, get(coach, "status"));
  const marketplaceStatus = get(
    marketplaceStatusConfig,
    get(coach, "marketplaceStatus"),
  );

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/coaches/list", title: "Murabbiylar" },
      { url: `/admin/coaches/${id}`, title: displayName },
    ]);
  }, [displayName, id, setBreadcrumbs]);

  if (detailQuery.isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Spinner className="text-muted-foreground" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-3">
            <Button variant="ghost" asChild className="w-fit">
              <Link to="/admin/coaches/list">
                <ArrowLeftIcon data-icon="inline-start" />
                Listga qaytish
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {displayName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {get(coach, "email") || get(coach, "phone") || id}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {coachStatus ? (
                <Badge variant="outline" className={coachStatus.className}>
                  {coachStatus.label}
                </Badge>
              ) : null}
              {marketplaceStatus ? (
                <Badge variant="outline" className={marketplaceStatus.className}>
                  {marketplaceStatus.label}
                </Badge>
              ) : null}
            </div>
          </div>
          <Button asChild>
            <Link to={`/admin/coaches/list/detail/${id}`}>Action drawer</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={UsersIcon}
            label="Clients"
            value={formatNumber(metrics.clientCount)}
            hint={`${formatNumber(metrics.activeClientCount)} active`}
          />
          <Metric
            icon={CreditCardIcon}
            label="Revenue"
            value={formatCurrency(metrics.totalPaymentAmount)}
            hint={`${formatNumber(metrics.paymentCount)} payments`}
          />
          <Metric
            icon={StarIcon}
            label="Rating"
            value={formatNumber(get(metrics, "avgRating", 0))}
            hint={`${formatNumber(metrics.reviewCount)} reviews`}
          />
          <Metric
            icon={BriefcaseBusinessIcon}
            label="Content"
            value={formatNumber(metrics.contentCount)}
            hint="Plans, courses, programs"
          />
        </div>

        <Tabs defaultValue="application" className="flex flex-col gap-5">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="application">Application</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="audit">Reminders/Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="application" className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Application</CardTitle>
                <CardDescription>Coach onboarding and approval data.</CardDescription>
              </CardHeader>
              <CardContent>
                <InfoRow label="Status" value={get(coach, "application.status")} />
                <InfoRow label="Submitted" value={formatDate(get(coach, "application.submittedAt"))} />
                <InfoRow label="Specializations" value={get(coach, "specializations", []).join(", ")} />
                <InfoRow label="Bio" value={get(coach, "bio")} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Payment profile</CardTitle>
                <CardDescription>Coach payout information.</CardDescription>
              </CardHeader>
              <CardContent>
                <InfoRow label="Bank" value={get(coach, "paymentProfile.bankName")} />
                <InfoRow label="Card" value={get(coach, "paymentProfile.maskedCard")} />
                <InfoRow label="Holder" value={get(coach, "paymentProfile.cardHolder")} />
                <InfoRow label="Updated" value={formatDate(get(coach, "paymentProfile.updatedAt"))} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketplace">
            <Card>
              <CardHeader>
                <CardTitle>Marketplace</CardTitle>
                <CardDescription>Visibility and review status.</CardDescription>
              </CardHeader>
              <CardContent>
                <InfoRow label="Marketplace status" value={get(coach, "marketplaceStatus")} />
                <InfoRow label="Change status" value={get(coach, "application.marketplaceChangeStatus")} />
                <InfoRow label="Review note" value={get(coach, "application.marketplaceChangeReviewNote")} />
              </CardContent>
            </Card>
          </TabsContent>

          {[
            ["clients", "Recent clients", get(detail, "clients", [])],
            ["payments", "Recent payments", get(detail, "payments", [])],
            ["sessions", "Sessions", get(detail, "sessions", [])],
            ["content", "Coach content", get(detail, "content", [])],
            ["referrals", "Referral events", get(detail, "referrals.events", [])],
            ["audit", "Audit and reminders", get(detail, "audit", [])],
          ].map(([tab, title, rows]) => (
            <TabsContent key={tab} value={tab}>
              <Card>
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>Operational workspace snapshot.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(rows) ? rows : []).map((row, index) => (
                        <TableRow key={row.id ?? index}>
                          <TableCell>
                            {row.name ||
                              row.title ||
                              row.clientName ||
                              row.userName ||
                              row.summary ||
                              row.id ||
                              "-"}
                          </TableCell>
                          <TableCell>
                            {row.status ? (
                              <Badge variant="outline">{row.status}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {formatDate(row.createdAt ?? row.paidAt ?? row.startedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {(!Array.isArray(rows) || rows.length === 0) ? (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                      <ShieldCheckIcon />
                      Hali ma'lumot yo'q.
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </PageTransition>
  );
};

export default Index;
