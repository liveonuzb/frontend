import { filter, get, includes, isArray, map, trim } from "lodash";
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { CheckIcon, ChevronRightIcon, Loader2Icon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGetQuery } from "@/hooks/api";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import PageAura from "../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../lib/tones.js";

const tone = ONBOARDING_ACCENTS.green;

const normalizeIds = (values = []) =>
  isArray(values) ? values.map((value) => Number(value)).filter(Boolean) : [];

const normalizeKeys = (values = []) =>
  isArray(values) ? values.map(String).filter(Boolean) : [];

const NutritionSelectStep = ({
  step,
  question,
  summary,
  field,
  otherField,
  nextPath,
  url,
  params,
  valueType = "id",
  placeholder = "Others",
}) => {
  const navigate = useNavigate();
  const selected = useOnboardingStore((state) => state[field]);
  const otherText = useOnboardingStore((state) => state[otherField]);
  const setFields = useOnboardingStore((state) => state.setFields);
  const [search, setSearch] = React.useState("");
  const selectedValues =
    valueType === "id" ? normalizeIds(selected) : normalizeKeys(selected);

  useOnboardingAutoSave("user", step);

  const { data, isLoading } = useGetQuery({
    url,
    params,
    queryProps: { queryKey: ["onboarding", step, "options", params] },
  });
  const { data: suggestionsData } = useGetQuery({
    url,
    params: { ...params, q: trim(search) },
    queryProps: {
      queryKey: ["onboarding", step, "suggestions", params, trim(search)],
      enabled: trim(search).length >= 2,
    },
  });
  const options = React.useMemo(
    () => get(data, "data.data", get(data, "data", [])).slice(0, 6),
    [data],
  );
  const suggestions = React.useMemo(
    () => get(suggestionsData, "data.data", get(suggestionsData, "data", [])),
    [suggestionsData],
  );

  const getValue = (item) => (valueType === "id" ? Number(item.id) : item.key);
  const isSelected = (item) => includes(selectedValues, getValue(item));
  const toggle = (item) => {
    const value = getValue(item);
    setFields({
      [field]: isSelected(item)
        ? filter(selectedValues, (itemValue) => itemValue !== value)
        : [...selectedValues, value],
    });
  };

  useOnboardingFooter(
    <Button
      type="button"
      className={cn("h-12 w-full border-transparent bg-gradient-to-r", tone.buttonTone)}
      size="lg"
      onClick={() => navigate(nextPath)}
    >
      Keyingi
      <ChevronRightIcon />
    </Button>,
  );

  return (
    <div className="relative flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />
      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question={question} />

        <motion.div
          className={cn(
            "mx-auto mb-3 w-full max-w-[420px] rounded-[24px] border bg-background/85 px-4 py-3 text-center backdrop-blur",
            tone.border,
          )}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm font-semibold">{summary}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {selectedValues.length} ta tanlandi
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3">
          {isLoading ? (
            <div className="col-span-full flex min-h-44 items-center justify-center">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            map(options, (item) => {
              const active = isSelected(item);
              return (
                <button
                  key={getValue(item)}
                  type="button"
                  onClick={() => toggle(item)}
                  className={cn(
                    "relative flex min-h-[120px] flex-col justify-between rounded-[24px] border p-3 text-left transition-all",
                    active
                      ? `bg-gradient-to-br ${tone.cardTone} ${tone.border}`
                      : "border-border/70 bg-background/90",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="size-10 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className={cn("size-10 rounded-2xl", tone.badgeTone)} />
                    )}
                    <span className="line-clamp-2 text-sm font-semibold">
                      {item.name}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "ml-auto flex size-6 items-center justify-center rounded-full border",
                      active ? "bg-background/70" : "bg-background",
                    )}
                  >
                    <CheckIcon
                      className={cn(
                        "size-4",
                        active ? tone.textTone : "text-transparent",
                      )}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="mt-4 rounded-[24px] border bg-background/90 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <SearchIcon className="size-4 text-muted-foreground" />
            Others
          </div>
          <Textarea
            value={otherText ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              setFields({ [otherField]: value });
              setSearch(value);
            }}
            placeholder={placeholder}
            className="min-h-20 resize-none"
          />
          {trim(search).length >= 2 && suggestions.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {map(suggestions, (item) => (
                <button
                  key={getValue(item)}
                  type="button"
                  onClick={() => toggle(item)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs",
                    isSelected(item)
                      ? "border-primary bg-primary/10 text-primary"
                      : "bg-background",
                  )}
                >
                  {item.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default NutritionSelectStep;
