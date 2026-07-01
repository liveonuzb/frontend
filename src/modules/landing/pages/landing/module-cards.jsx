import { m, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import find from "lodash/find";
import map from "lodash/map";

const EMPTY_MODULE_COPY = {};

const accentIconClassName =
  "bg-[rgb(var(--accent-rgb)/0.12)] text-[rgb(var(--accent-strong-rgb))] dark:bg-[rgb(var(--accent-rgb)/0.14)] dark:text-[rgb(var(--accent-rgb))]";

const accentTextClassName =
  "text-[rgb(var(--accent-strong-rgb))] dark:text-[rgb(var(--accent-rgb))]";

const accentHoverBorderClassName =
  "hover:border-[rgb(var(--accent-rgb)/0.34)] dark:hover:border-[rgb(var(--accent-rgb)/0.42)]";

const SectionHeader = ({ copy = EMPTY_MODULE_COPY }) => (
  <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
    {copy.eyebrow ? (
      <span className="w-fit max-w-full break-words rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium leading-5 text-muted-foreground">
        {copy.eyebrow}
      </span>
    ) : null}
    <div className="flex flex-col gap-3">
      {copy?.title ? (
        <h2 className="text-2xl font-semibold leading-tight tracking-normal text-foreground md:text-3xl">
          {copy.title}
        </h2>
      ) : null}
      {copy?.body ? (
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          {copy.body}
        </p>
      ) : null}
    </div>
  </div>
);

const ModuleCard = ({ item, className, size }) => {
  const Icon = item?.icon;

  return (
    <m.article
      className="min-w-0"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card
        size={size}
        className={cn(
          "group h-full border-border/80 bg-card text-center shadow-[0_16px_46px_rgba(15,23,42,0.04)] transition-colors",
          accentHoverBorderClassName,
          className,
        )}
      >
        <CardHeader className="items-center">
          <div className="flex min-w-0 flex-col items-center gap-3">
            {Icon ? (
              <span
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-xl transition-colors",
                  accentIconClassName,
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
            ) : null}
            <div className="flex min-w-0 flex-col gap-2">
              <CardTitle className="text-sm font-semibold leading-tight">
                {item?.title}
              </CardTitle>
              <CardDescription className="text-xs leading-5">
                {item?.body}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </m.article>
  );
};

const progressPreview = [
  ["D", 86],
  ["S", 82],
  ["Ch", 78],
  ["P", 74],
  ["Ju", 70],
  ["Sh", 66],
  ["Ya", 65],
];

const ModuleProgressPreview = ({ item }) => (
  <Card className="border-border/80 bg-card shadow-[0_18px_54px_rgba(15,23,42,0.06)] lg:sticky lg:top-28">
    <CardHeader>
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardDescription>{item?.title}</CardDescription>
          <CardTitle className="mt-2 text-3xl font-semibold leading-none">
            78.6 kg{" "}
            <span className={cn("text-sm", accentTextClassName)}>-2.4 kg</span>
          </CardTitle>
          <p className="mt-2 text-xs text-muted-foreground">{item?.body}</p>
        </div>
        <Badge variant="outline" className="shrink-0">
          kg
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="flex flex-col gap-5">
      <div className="grid h-32 grid-cols-7 items-end gap-2 rounded-2xl border border-border/70 bg-background p-4">
        {map(progressPreview, ([label, value]) => (
          <div
            key={label}
            className="flex h-full min-w-0 flex-col items-center justify-end gap-2"
          >
            <div className="flex h-full w-full items-end rounded-full bg-muted">
              <div
                className="w-full rounded-full bg-[rgb(var(--accent-strong-rgb))] dark:bg-[rgb(var(--accent-rgb))]"
                style={{ height: `${value}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-background p-3">
          <p className="text-xs text-muted-foreground">Boshlang'ich</p>
          <p className="mt-1 font-semibold text-foreground">81.0 kg</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-background p-3">
          <p className="text-xs text-muted-foreground">Maqsad</p>
          <p className="mt-1 font-semibold text-foreground">68.0 kg</p>
        </div>
      </div>
      <Progress
        value={72}
        className="h-2 bg-[rgb(var(--accent-rgb)/0.12)] [&>div]:bg-[rgb(var(--accent-strong-rgb))] dark:bg-[rgb(var(--accent-rgb)/0.14)] dark:[&>div]:bg-[rgb(var(--accent-rgb))]"
      />
    </CardContent>
  </Card>
);

export const ProductModulesSection = ({ copy = EMPTY_MODULE_COPY }) => {
  const shouldReduceMotion = useReducedMotion();
  const items = copy?.items || [];
  const progressItem = find(items, { id: "progress" }) || items[0];

  return (
    <m.section
      id="nutrition"
      className="scroll-mt-24 bg-background py-16 md:py-24"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={shouldReduceMotion ? void 0 : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div id="workouts" className="sr-only scroll-mt-24" aria-hidden="true" />
      <div id="progress" className="sr-only scroll-mt-24" aria-hidden="true" />
      <div
        id="local-market"
        className="sr-only scroll-mt-24"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <SectionHeader copy={copy} />
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.92fr] lg:items-start">
          <div className="grid gap-3 sm:grid-cols-2">
            {map(items, (item) => (
              <ModuleCard
                key={item?.id || item?.title}
                item={item}
                size="sm"
              />
            ))}
          </div>
          <ModuleProgressPreview item={progressItem} />
        </div>
      </div>
    </m.section>
  );
};

export default ProductModulesSection;
