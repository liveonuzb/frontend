import { m, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import map from "lodash/map";
import take from "lodash/take";

const EMPTY_MODULE_COPY = {};

const SectionHeader = ({ copy = EMPTY_MODULE_COPY }) => (
  <div className="flex max-w-3xl flex-col gap-4">
    {copy.eyebrow ? (
      <span className="w-fit max-w-full break-words rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium leading-5 text-muted-foreground">
        {copy.eyebrow}
      </span>
    ) : null}
    <div className="flex flex-col gap-3">
      {copy?.title ? (
        <h2 className="text-3xl font-semibold leading-tight tracking-normal text-foreground md:text-5xl">
          {copy.title}
        </h2>
      ) : null}
      {copy?.body ? (
        <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
          {copy.body}
        </p>
      ) : null}
    </div>
  </div>
);

const ModuleBullets = ({ bullets, className }) => (
  <div className={cn("grid gap-2", className)}>
    {map(take(bullets, 3), (bullet) => (
      <span
        key={bullet}
        className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium leading-5 text-foreground"
      >
        {bullet}
      </span>
    ))}
  </div>
);

const ModuleCard = ({ item, className, size, testId }) => {
  const Icon = item?.icon;

  return (
    <m.article
      className="min-w-0"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card
        data-testid={testId}
        size={size}
        className={cn(
          "group h-full border-border bg-card transition-colors hover:border-primary/40",
          className,
        )}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <CardTitle className="text-lg leading-tight">
                {item?.title}
              </CardTitle>
              <CardDescription className="leading-6">{item?.body}</CardDescription>
            </div>
            {Icon ? (
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </span>
            ) : null}
          </div>
        </CardHeader>
        {item?.bullets?.length ? (
          <CardContent>
            <ModuleBullets bullets={item.bullets} />
          </CardContent>
        ) : null}
      </Card>
    </m.article>
  );
};

const ModuleDetail = ({ item }) => {
  const Icon = item?.icon;

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-3">
            {item?.id ? (
              <Badge variant="secondary" className="w-fit">
                {item.id}
              </Badge>
            ) : null}
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl leading-tight">
                {item?.title}
              </CardTitle>
              <CardDescription className="leading-6">{item?.body}</CardDescription>
            </div>
          </div>
          {Icon ? (
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
              <Icon className="size-5" aria-hidden="true" />
            </span>
          ) : null}
        </div>
      </CardHeader>
      {item?.bullets?.length ? (
        <CardContent className="flex flex-col gap-5">
          <Separator />
          <ModuleBullets
            bullets={item.bullets}
            className="sm:grid-cols-3 [&>span]:bg-muted/45"
          />
        </CardContent>
      ) : null}
    </Card>
  );
};

export const ProductModulesSection = ({ copy = EMPTY_MODULE_COPY }) => {
  const shouldReduceMotion = useReducedMotion();
  const items = copy?.items || [];
  const defaultTab = items[0]?.id || "onboarding";

  return (
    <m.section
      id="nutrition"
      data-testid="product-modules"
      className="scroll-mt-24 bg-muted/35 py-16 md:py-24"
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

      <div className="mx-auto grid max-w-5xl gap-10 px-5 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="flex flex-col gap-8">
          <SectionHeader copy={copy} />
          <div className="grid gap-3 sm:grid-cols-2">
            {map(items, (item) => (
              <ModuleCard
                key={item?.id || item?.title}
                item={item}
                size="sm"
                testId={item?.id ? `product-module-${item.id}` : undefined}
              />
            ))}
          </div>
        </div>

        <Tabs
          defaultValue={defaultTab}
          className="min-w-0 rounded-2xl border bg-background/65 p-3 shadow-sm backdrop-blur lg:sticky lg:top-28"
        >
          <TabsList
            aria-label={copy.tabsLabel}
            className="w-full justify-start overflow-x-auto"
          >
            {map(items, (item) => (
              <TabsTrigger
                key={item?.id || item?.title}
                value={item?.id}
                className="min-w-fit px-3"
              >
                {item?.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {map(items, (item) => (
            <TabsContent
              key={item?.id || item?.title}
              value={item?.id}
              className="mt-5"
            >
              <ModuleDetail item={item} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </m.section>
  );
};

export default ProductModulesSection;
