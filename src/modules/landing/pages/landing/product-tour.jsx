import { m, useReducedMotion } from "framer-motion";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import map from "lodash/map";

const SectionHeader = ({ copy }) => (
  <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
    {copy?.eyebrow ? (
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
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          {copy.body}
        </p>
      ) : null}
    </div>
  </div>
);

const StepCopyCard = ({ step, className }) => {
  const Icon = step?.icon;

  return (
    <m.article
      className={cn("min-w-0", className)}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="group h-full border-border/80 bg-card shadow-[0_16px_46px_rgba(15,23,42,0.04)] transition-colors hover:border-[#bfe8c8] dark:hover:border-primary/35">
        <CardHeader>
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#2f9e44] text-sm font-semibold text-white dark:bg-primary dark:text-primary-foreground">
                {step?.kicker}
              </span>
              {Icon ? (
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eaf8ee] text-[#2f9e44] transition-colors dark:bg-primary/10 dark:text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-base font-semibold leading-tight">
                {step?.title}
              </CardTitle>
              <CardDescription className="leading-6">{step?.body}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </m.article>
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
      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <SectionHeader copy={copy} />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {map(steps, (step, index) => (
            <StepCopyCard
              key={step?.id || step?.title}
              className={cn(index > 0 && "sm:mt-0")}
              step={step}
            />
          ))}
        </div>
      </div>
    </m.section>
  );
};

export default ProductTour;
