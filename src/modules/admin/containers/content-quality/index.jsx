import React from "react";
import get from "lodash/get";
import filter from "lodash/filter";
import find from "lodash/find";
import includes from "lodash/includes";
import isArray from "lodash/isArray";
import map from "lodash/map";
import reduce from "lodash/reduce";
import toLower from "lodash/toLower";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import take from "lodash/take";
import { Link } from "react-router";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ClipboardCheckIcon,
  DownloadIcon,
  ImageIcon,
  LanguagesIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  SoupIcon,
  WalletCardsIcon,
  XIcon,
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetQuery } from "@/hooks/api";
import useApi from "@/hooks/api/use-api.js";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/store";
import { toast } from "sonner";
import { getIssueActionPath } from "./content-quality-utils.js";

const ADMIN_NUTRITION_CONTENT_QUALITY_API_ROOT =
  "/admin/nutrition/content-quality";

const sectionIcons = {
  translations: LanguagesIcon,
  images: ImageIcon,
  nutrition: SoupIcon,
  prices: WalletCardsIcon,
  safety: ShieldCheckIcon,
};

const summaryCards = [
  {
    key: "missingTranslations",
    title: "Tarjimalar",
    description: "Faol tillarda yetishmayotgan fieldlar",
    icon: LanguagesIcon,
  },
  {
    key: "missingImages",
    title: "Rasmlar",
    description: "Kataloglarda rasm yetishmayotgan itemlar",
    icon: ImageIcon,
  },
  {
    key: "nutrition",
    title: "Nutrition",
    description: "Kaloriya va recipe hisobidagi kamchiliklar",
    icon: SoupIcon,
  },
  {
    key: "prices",
    title: "Budget",
    description: "Ingredient narxi to'ldirilmagan joylar",
    icon: WalletCardsIcon,
  },
  {
    key: "safety",
    title: "Safety",
    description: "Workout safety va kaloriya estimate muammolari",
    icon: ShieldCheckIcon,
  },
];

const sectionFilterOptions = [
  { label: "Hammasi", value: "all" },
  { label: "Tarjimalar", value: "translations" },
  { label: "Rasmlar", value: "images" },
  { label: "Nutrition", value: "nutrition" },
  { label: "Budget", value: "prices" },
  { label: "Safety", value: "safety" },
];

const summarySectionByKey = {
  missingTranslations: "translations",
  missingImages: "images",
  nutrition: "nutrition",
  prices: "prices",
  safety: "safety",
};

const QualitySkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      <Skeleton className="h-10 w-28 rounded-full" />
    </div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {map(Array.from({ length: 5 }), (_, index) => (
        <Skeleton key={index} className="h-32 rounded-lg" />
      ))}
    </div>
    <div className="grid gap-4 xl:grid-cols-2">
      {map(Array.from({ length: 4 }), (_, index) => (
        <Skeleton key={index} className="h-80 rounded-lg" />
      ))}
    </div>
  </div>
);

const IssueList = ({ items = [], sectionKey, groupKey }) => {
  if (!items.length) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        Muammo topilmadi
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {map(items, (example) => {
        const actionPath = getIssueActionPath({
          sectionKey,
          groupKey,
          issueId: example.id,
          action: example.action,
        });

        return (
          <div
            key={`${example.id}-${example.name}`}
            className="rounded-md border bg-muted/25 px-3 py-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {example.name || example.title || example.id}
                </p>
                <p className="text-xs text-muted-foreground">
                  {example.sheet ? `${example.sheet} · ` : null}
                  {example.lineNumber ? `Row ${example.lineNumber} · ` : null}
                  ID: {example.id}
                </p>
                {example.error ? (
                  <p className="mt-1 line-clamp-2 text-xs text-destructive">
                    {example.error}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                {example.severity ? (
                  <Badge
                    variant={
                      includes(["blocker", "error", "fail"], example.severity)
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {example.severity}
                  </Badge>
                ) : null}
                {example.missingLanguages?.length
                  ? map(example.missingLanguages, (language) => (
                      <Badge key={language} variant="secondary">
                        {language}
                      </Badge>
                    ))
                  : null}
                {example.missingModes?.length
                  ? map(example.missingModes, (mode) => (
                      <Badge key={mode} variant="outline">
                        {mode}
                      </Badge>
                    ))
                  : null}
                {example.trackingType ? (
                  <Badge variant="outline">{example.trackingType}</Badge>
                ) : null}
                {example.issue ? (
                  <Badge variant="secondary">{example.issue}</Badge>
                ) : null}
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-xs"
                >
                  <Link to={actionPath}>
                    Ochish
                    <ArrowRightIcon className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const QualityGroup = ({ section, group, isExpanded, onToggle }) => {
  const issueCount = toNumber(group.issueCount || 0);
  const issues = isArray(group.issues) ? group.issues : [];
  const examples = isArray(group.examples) ? group.examples : [];
  const visibleItems = isExpanded ? issues : examples;
  const canToggle = issues.length > examples.length;

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{group.title}</p>
          <p className="text-xs text-muted-foreground">
            {group.total} ta itemdan {issueCount} tasida muammo bor
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {group.severity ? (
            <Badge
              variant={
                includes(["blocker", "error", "fail"], group.severity)
                  ? "destructive"
                  : "secondary"
              }
            >
              {group.severity}
            </Badge>
          ) : null}
          <Badge variant={issueCount > 0 ? "destructive" : "secondary"}>
            {issueCount}
          </Badge>
        </div>
      </div>
      {get(group, "action.path") ? (
        <Button
          asChild
          type="button"
          variant="outline"
          size="sm"
          className="mb-3 h-8 gap-1 text-xs"
        >
          <Link to={get(group, "action.path")}>
            {get(group, "action.label", "Ochish")}
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </Button>
      ) : null}
      <IssueList
        items={visibleItems}
        sectionKey={section.key}
        groupKey={group.key}
      />
      {canToggle ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 h-8 w-full gap-1 text-xs"
          onClick={onToggle}
        >
          {isExpanded
            ? "Kamroq ko'rsatish"
            : `Hammasini ko'rsatish (${issues.length})`}
          <ChevronDownIcon
            className={cn(
              "size-3.5 transition-transform",
              isExpanded && "rotate-180",
            )}
          />
        </Button>
      ) : null}
    </div>
  );
};

const matchesIssueSearch = (issue, search) => {
  if (!search) return true;

  const haystack = toLower(
    filter(
      [
        issue.id,
        issue.name,
        issue.title,
        ...(isArray(issue.missingLanguages) ? issue.missingLanguages : []),
        ...(isArray(issue.missingModes) ? issue.missingModes : []),
        issue.budgetTier,
        issue.trackingType,
        issue.issue,
        issue.error,
        issue.sheet,
        issue.severity,
        issue.sourceTitle,
      ],
      (item) => item !== null && item !== undefined,
    ).join(" "),
  );

  return includes(haystack, search);
};

const filterQualitySections = ({
  sections,
  sectionFilter,
  search,
  onlyIssues,
}) => {
  const normalizedSearch = toLower(trim(search));

  return filter(
    map(
      filter(
        sections,
        (section) => sectionFilter === "all" || section.key === sectionFilter,
      ),
      (section) => {
        const groups = filter(
          map(section.groups, (group) => {
            const issues = isArray(group.issues) ? group.issues : [];
            const filteredIssues = filter(issues, (issue) =>
              matchesIssueSearch(issue, normalizedSearch),
            );
            const filteredExamples = take(filteredIssues, 6);
            const nextIssueCount = normalizedSearch
              ? filteredIssues.length
              : toNumber(group.issueCount || 0);

            return {
              ...group,
              issueCount: nextIssueCount,
              issues: normalizedSearch ? filteredIssues : issues,
              examples: normalizedSearch ? filteredExamples : group.examples,
            };
          }),
          (group) => {
            if (onlyIssues && toNumber(group.issueCount || 0) === 0) {
              return false;
            }

            if (normalizedSearch && toNumber(group.issueCount || 0) === 0) {
              return false;
            }

            return true;
          },
        );

        return { ...section, groups };
      },
    ),
    (section) => section.groups.length > 0,
  );
};

const getContentQualityPayload = (response) => {
  const candidates = [
    response,
    get(response, "data"),
    get(response, "data.data"),
    get(response, "data.data.data"),
  ];
  const payload = find(
    candidates,
    (candidate) => candidate?.summary || candidate?.sections,
  );

  return payload || {};
};

const getSummaryValue = (summary, key, sections) => {
  const directValue = toNumber(summary?.[key]);
  if (Number.isFinite(directValue) && directValue > 0) return directValue;

  const sectionKey = summarySectionByKey[key] || key;
  const section = find(sections, (item) => item.key === sectionKey);
  if (!section) return Number.isFinite(directValue) ? directValue : 0;

  return reduce(
    section.groups,
    (total, group) => total + toNumber(group.issueCount || 0),
    0,
  );
};

const downloadBlob = ({ blob, fileName }) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName || "content_quality.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { request } = useApi();
  const [isExporting, setIsExporting] = React.useState(false);
  const [isRecalculatingRecipes, setIsRecalculatingRecipes] =
    React.useState(false);
  const [recalculationReport, setRecalculationReport] = React.useState(null);
  const [expandedGroups, setExpandedGroups] = React.useState({});
  const [search, setSearch] = React.useState("");
  const [sectionFilter, setSectionFilter] = React.useState("all");
  const [onlyIssues, setOnlyIssues] = React.useState(false);
  const { data, isLoading, isFetching, refetch } = useGetQuery({
    url: ADMIN_NUTRITION_CONTENT_QUALITY_API_ROOT,
    queryProps: {
      queryKey: ["admin", "content-quality"],
    },
  });

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/content-quality", title: "Content Quality" },
    ]);
  }, [setBreadcrumbs]);

  const payload = React.useMemo(() => getContentQualityPayload(data), [data]);
  const summary = React.useMemo(() => get(payload, "summary", {}), [payload]);
  const sections = React.useMemo(() => {
    const value = get(payload, "sections");
    return isArray(value) ? value : [];
  }, [payload]);
  const activeLanguages = React.useMemo(() => {
    const value = get(payload, "activeLanguages");
    return isArray(value) ? value : [];
  }, [payload]);
  const visibleSections = React.useMemo(
    () =>
      filterQualitySections({ sections, sectionFilter, search, onlyIssues }),
    [sections, sectionFilter, search, onlyIssues],
  );
  const visibleIssueCount = React.useMemo(
    () =>
      reduce(
        visibleSections,
        (sectionTotal, section) =>
          sectionTotal +
          reduce(
            section.groups,
            (groupTotal, group) => groupTotal + toNumber(group.issueCount || 0),
            0,
          ),
        0,
      ),
    [visibleSections],
  );
  const toggleGroup = React.useCallback((key) => {
    setExpandedGroups((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }, []);

  const handleExport = React.useCallback(async () => {
    try {
      setIsExporting(true);
      const response = await request.get(
        `${ADMIN_NUTRITION_CONTENT_QUALITY_API_ROOT}/export`,
        {
          responseType: "blob",
        },
      );
      const fileName =
        response.headers?.["content-disposition"]?.match(
          /filename="?([^"]+)"?/,
        )?.[1] || "content_quality.xlsx";

      downloadBlob({ blob: get(response, "data"), fileName });
      toast.success("Content quality report yuklab olindi");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Reportni yuklab bo'lmadi",
      );
    } finally {
      setIsExporting(false);
    }
  }, [request]);

  const handleRecipeRecalculation = React.useCallback(async () => {
    try {
      setIsRecalculatingRecipes(true);
      const response = await request.post(
        `${ADMIN_NUTRITION_CONTENT_QUALITY_API_ROOT}/actions/recalculate-recipes`,
        {},
      );
      const result = get(response, "data.data", get(response, "data", {}));

      setRecalculationReport({
        status: "completed",
        recalculated: toNumber(result.recalculated),
        skipped: toNumber(result.skipped),
        foods: isArray(result.foods) ? result.foods : [],
        skippedFoods: isArray(result.skippedFoods) ? result.skippedFoods : [],
      });
      toast.success(
        `Recipe nutrition qayta hisoblandi: ${toNumber(
          result.recalculated,
        )} ta`,
      );
      await refetch();
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Recipe nutrition qayta hisoblanmadi",
      );
      setRecalculationReport({
        status: "failed",
        error: isArray(message)
          ? message.join(", ")
          : message || "Recipe nutrition qayta hisoblanmadi",
      });
    } finally {
      setIsRecalculatingRecipes(false);
    }
  }, [refetch, request]);

  if (isLoading) {
    return (
      <PageTransition>
        <QualitySkeleton />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardCheckIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Content Quality
            </h1>
            <p className="text-muted-foreground">
              Tarjima, rasm, nutrition, budget va safety datalaridagi
              kamchiliklar.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {map(activeLanguages, (language) => (
                <Badge key={language.code} variant="secondary">
                  {language.flag} {language.code}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-full"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            <RefreshCwIcon
              className={cn("size-4", isFetching && "animate-spin")}
            />
            Yangilash
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-full"
            disabled={isRecalculatingRecipes}
            onClick={() => void handleRecipeRecalculation()}
          >
            <RefreshCwIcon
              className={cn(
                "size-4",
                isRecalculatingRecipes && "animate-spin",
              )}
            />
            {isRecalculatingRecipes
              ? "Hisoblanmoqda..."
              : "Recipe qayta hisoblash"}
          </Button>
          <Button
            type="button"
            className="gap-2 rounded-full"
            disabled={isExporting}
            onClick={() => void handleExport()}
          >
            <DownloadIcon className="size-4" />
            {isExporting ? "Yuklanmoqda..." : "Excel"}
          </Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {map(summaryCards, (card) => {
          const value = getSummaryValue(summary, card.key, sections);

          return (
            <Card key={card.key} className="border-border/60 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <card.icon className="size-5" />
                  </div>
                  {value > 0 ? (
                    <Badge variant="destructive">Muammo bor</Badge>
                  ) : (
                    <Badge className="bg-emerald-600">OK</Badge>
                  )}
                </div>
                <div>
                  <p className="text-3xl font-bold">{value}</p>
                  <p className="font-medium">{card.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
        <CardContent className="flex items-start gap-3 p-4 text-amber-900">
          <AlertTriangleIcon className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">
              Jami muammo:{" "}
              {toNumber(summary.totalIssues || 0) ||
                reduce(
                  sections,
                  (total, section) =>
                    total +
                    reduce(
                      section.groups,
                      (groupTotal, group) =>
                        groupTotal + toNumber(group.issueCount || 0),
                      0,
                    ),
                  0,
                )}
            </p>
            <p className="text-sm text-amber-800">
              Bu sahifa data sifatini ko'rsatadi; tuzatishlar tegishli katalog
              sahifalaridagi edit, translation, image, price yoki safety
              actionlaridan qilinadi.
            </p>
          </div>
        </CardContent>
      </Card>
      {recalculationReport ? (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">
                Recipe recalculation: {recalculationReport.status}
              </p>
              {recalculationReport.status === "completed" ? (
                <p className="text-sm text-muted-foreground">
                  {toNumber(recalculationReport.recalculated)} ta recipe qayta
                  hisoblandi, {toNumber(recalculationReport.skipped)} ta
                  o'tkazildi.
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  {recalculationReport.error}
                </p>
              )}
            </div>
            {recalculationReport.status === "completed" ? (
              <Badge variant="secondary">
                {toNumber(get(recalculationReport, "foods.length", 0))} updated
              </Badge>
            ) : (
              <Badge variant="destructive">failed</Badge>
            )}
          </CardContent>
        </Card>
      ) : null}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nomi, ID, til yoki mode bo'yicha qidirish..."
              className="h-10 pl-9 pr-9"
            />
            {search ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1 top-1/2 size-8 -translate-y-1/2 rounded-full"
                onClick={() => setSearch("")}
              >
                <XIcon className="size-4" />
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {map(sectionFilterOptions, (option) => (
              <Button
                key={option.value}
                type="button"
                variant={sectionFilter === option.value ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setSectionFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
            <Button
              type="button"
              variant={onlyIssues ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setOnlyIssues((value) => !value)}
            >
              Faqat muammolar
            </Button>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {visibleIssueCount} ta issue
            </Badge>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {visibleSections.length ? (
          map(visibleSections, (section) => {
            const Icon = sectionIcons[section.key] || ClipboardCheckIcon;

            return (
              <Card key={section.key} className="border-border/60 shadow-sm">
                <CardHeader className="border-b bg-muted/25">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="size-5 text-primary" />
                    {section.title}
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  {map(section.groups, (group) => {
                    const groupKey = `${section.key}:${group.key}`;

                    return (
                      <QualityGroup
                        key={group.key}
                        section={section}
                        group={group}
                        isExpanded={Boolean(expandedGroups[groupKey])}
                        onToggle={() => toggleGroup(groupKey)}
                      />
                    );
                  })}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="border-border/60 shadow-sm xl:col-span-2">
            <CardContent className="p-8 text-center">
              <p className="font-medium">Natija topilmadi</p>
              <p className="text-sm text-muted-foreground">
                Joriy filterlar bo'yicha issue topilmadi.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
};

export default Index;
