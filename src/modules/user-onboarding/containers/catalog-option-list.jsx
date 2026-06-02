import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

import filter from "lodash/filter";
import map from "lodash/map";
import toNumber from "lodash/toNumber";
import take from "lodash/take";

const INITIAL_VISIBLE_OPTION_COUNT = 8;

const getOptionId = (item) => toNumber(item?.id);

const CatalogOptionList = ({ children, options, selectedIdSet }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const visibleOptions = React.useMemo(() => {
    if (isExpanded || options.length <= INITIAL_VISIBLE_OPTION_COUNT) {
      return options;
    }

    const initialOptions = take(options, INITIAL_VISIBLE_OPTION_COUNT);
    const initialIds = new Set(map(initialOptions, getOptionId));
    const selectedHiddenOptions = filter(options, (item) => {
      const id = getOptionId(item);
      return selectedIdSet?.has(id) && !initialIds.has(id);
    });

    return [...initialOptions, ...selectedHiddenOptions];
  }, [isExpanded, options, selectedIdSet]);
  const canToggle = options.length > INITIAL_VISIBLE_OPTION_COUNT;
  const hiddenCount = Math.max(options.length - visibleOptions.length, 0);

  return (
    <>
      {map(visibleOptions, children)}
      {canToggle ? (
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-2xl border-dashed bg-background/80 text-sm font-semibold"
          onClick={() => setIsExpanded((value) => !value)}
        >
          {isExpanded
            ? t("onboarding.chipSelect.showLess")
            : t("onboarding.chipSelect.showMore", { count: hiddenCount })}
        </Button>
      ) : null}
    </>
  );
};

export { CatalogOptionList, INITIAL_VISIBLE_OPTION_COUNT };
