import get from "lodash/get";

export const getTaxonomyGovernanceCounts = (payload = {}) => ({
  issueCount: get(payload, "summary.issueCount", 0),
  missingTranslationItems: get(payload, "summary.missingTranslationItems", 0),
  duplicateNameGroups: get(payload, "summary.duplicateNameGroups", 0),
  orderKeyIssueItems: get(payload, "summary.orderKeyIssueItems", 0),
});
