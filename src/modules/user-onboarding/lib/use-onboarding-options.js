import React from "react";
import isEmpty from "lodash/isEmpty";
import pickBy from "lodash/pickBy";
import { useGetQuery } from "@/hooks/api";
import {
  getOnboardingOptionsPath,
  getOnboardingOptionsQueryKey,
  normalizeOnboardingOptionsResponse,
} from "./onboarding-options";

const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_PARAMS = Object.freeze({});

const normalizeParams = (params) =>
  pickBy(
    params ?? EMPTY_PARAMS,
    (value) => value !== undefined && value !== null && value !== "",
  );

export const useOnboardingOptions = ({
  enabled = true,
  params,
  queryParts = EMPTY_ARRAY,
  resource,
  staleTime = 60000,
  step,
}) => {
  const normalizedParams = React.useMemo(
    () => normalizeParams(params),
    [params],
  );
  const hasParams = !isEmpty(normalizedParams);
  const queryKey = React.useMemo(
    () =>
      getOnboardingOptionsQueryKey(
        resource,
        step,
        ...queryParts,
        hasParams ? normalizedParams : undefined,
      ),
    [hasParams, normalizedParams, queryParts, resource, step],
  );
  const query = useGetQuery({
    url: getOnboardingOptionsPath(resource),
    params: hasParams ? normalizedParams : undefined,
    queryProps: {
      enabled,
      queryKey,
      staleTime,
    },
  });
  const options = React.useMemo(
    () => normalizeOnboardingOptionsResponse(query.data, resource),
    [query.data, resource],
  );

  return {
    ...query,
    options,
  };
};

export default useOnboardingOptions;
