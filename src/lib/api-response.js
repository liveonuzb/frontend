import { get } from "lodash";

export const getApiResponseData = (response, fallback = null) => {
  const wrappedData = get(response, "data.data");

  if (wrappedData !== undefined) {
    return wrappedData;
  }

  const directData = get(response, "data");
  return directData !== undefined ? directData : fallback;
};
