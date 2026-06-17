import React from "react";
import get from "lodash/get";
import map from "lodash/map";
import size from "lodash/size";
import slice from "lodash/slice";
import { AlertTriangleIcon, LanguagesIcon, ListOrderedIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetQuery } from "@/hooks/api";
import { getTaxonomyGovernanceCounts } from "./taxonomy-governance-summary-utils.js";

const getResponsePayload = (response) =>
  get(response, "data.data", get(response, "data", null));

const TaxonomyGovernanceSummary = ({ groupKey }) => {
  const { data, isLoading, isFetching } = useGetQuery({
    url: "/admin/nutrition/taxonomy/governance",
    queryProps: {
      queryKey: ["admin", "nutrition-taxonomy-governance"],
    },
  });
  const payload = getResponsePayload(data);
  const counts = getTaxonomyGovernanceCounts(payload);
  const group = groupKey ? get(payload, `groups.${groupKey}`) : null;
  const groupIssues = slice(get(group, "issues", []), 0, 3);

  if (isLoading) {
    return (
      <div className="grid gap-2 rounded-lg border border-dashed p-3 sm:grid-cols-4">
        {map([1, 2, 3, 4], (item) => (
          <Skeleton key={item} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!payload) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">Taxonomy QA</p>
          {group ? (
            <p className="text-xs text-muted-foreground">{get(group, "label")}</p>
          ) : null}
        </div>
        <Badge variant={counts.issueCount ? "destructive" : "outline"}>
          {counts.issueCount} issue
        </Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <LanguagesIcon className="size-4 text-muted-foreground" />
          <span>{counts.missingTranslationItems} translation</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <AlertTriangleIcon className="size-4 text-muted-foreground" />
          <span>{counts.duplicateNameGroups} duplicate</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <ListOrderedIcon className="size-4 text-muted-foreground" />
          <span>{counts.orderKeyIssueItems} order</span>
        </div>
      </div>

      {group && size(groupIssues) ? (
        <div className="flex flex-wrap gap-2">
          {map(groupIssues, (issue) => (
            <Badge
              key={`${get(issue, "code")}-${get(issue, "itemIds.0", "group")}`}
              variant="outline"
            >
              {get(issue, "code")}
            </Badge>
          ))}
          {isFetching ? (
            <span className="text-xs text-muted-foreground">Updating...</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default TaxonomyGovernanceSummary;
