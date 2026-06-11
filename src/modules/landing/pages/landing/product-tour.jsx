import { m, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import map from "lodash/map";
import { StepMockup } from "./product-mockups.jsx";

const SectionHeader = ({ copy }) => (
  <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
    {copy?.eyebrow ? (
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
        <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
          {copy.body}
        </p>
      ) : null}
    </div>
  </div>
);

const StepCopyCard = ({ step, className }) => {
  const Icon = step?.icon;
  const highlights = step?.highlights || [];

  return (
    <Card className={cn("h-full border-border bg-card", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-3">
            {step?.kicker ? (
              <Badge variant="secondary" className="w-fit">
                {step.kicker}
              </Badge>
            ) : null}
            <div className="flex flex-col gap-2">
              <CardTitle className="text-xl leading-tight md:text-2xl">
                {step?.title}
              </CardTitle>
              <CardDescription className="leading-6">
                {step?.body}
              </CardDescription>
            </div>
          </div>
          {Icon ? (
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
              <Icon className="size-5" aria-hidden="true" />
            </span>
          ) : null}
        </div>
      </CardHeader>
      {highlights.length ? (
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {map(highlights, (highlight) => (
              <span
                key={highlight}
                className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium leading-5 text-foreground"
              >
                {highlight}
              </span>
            ))}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
};

export const ProductTour = ({ copy }) => {
  const shouldReduceMotion = useReducedMotion();
  const steps = copy?.steps || [];

  return (
    <m.section
      id="how"
      data-testid="product-tour"
      className="scroll-mt-24 bg-background py-16 md:py-24"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={shouldReduceMotion ? void 0 : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader copy={copy} />

        <div className="mt-10 grid gap-5 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          {map(steps, (step, index) => (
            <div key={step?.id || step?.title} className="contents">
              <StepCopyCard className="lg:col-start-1" step={step} />
              {index < 4 ? (
                <div className="min-w-0 lg:sticky lg:top-28 lg:col-start-2 lg:self-start">
                  <StepMockup step={step} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </m.section>
  );
};

export default ProductTour;
