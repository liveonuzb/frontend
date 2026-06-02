import filter from "lodash/filter";
import get from "lodash/get";
import isArray from "lodash/isArray";
import join from "lodash/join";
import map from "lodash/map";
import trim from "lodash/trim";

export const getApiResponseData = (response, fallback = null) => {
  const wrappedData = get(response, "data.data");

  if (wrappedData !== undefined) {
    return wrappedData;
  }

  const directData = get(response, "data");
  return directData !== undefined ? directData : fallback;
};

const normalizeApiErrorMessage = (message) => {
  if (isArray(message)) {
    const messages = filter(
      map(message, (item) =>
        typeof item === "string" ? item : get(item, "message"),
      ),
      (item) => typeof item === "string" && trim(item),
    );

    return messages.length > 0 ? join(messages, ", ") : null;
  }

  if (typeof message === "string" && trim(message)) {
    return message;
  }

  return null;
};

export const getApiErrorMessage = (error, fallbackMessage) => {
  const message =
    normalizeApiErrorMessage(get(error, "response.data.error.details")) ??
    normalizeApiErrorMessage(get(error, "response.data.error.message")) ??
    normalizeApiErrorMessage(get(error, "response.data.message")) ??
    normalizeApiErrorMessage(get(error, "message"));

  return message ?? fallbackMessage;
};

const toPositiveSeconds = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return Math.ceil(numericValue);
};

export const getApiRetryAfterSeconds = (error) => {
  const errorRetryAfter = toPositiveSeconds(
    get(error, "response.data.error.retryAfterSeconds"),
  );
  if (errorRetryAfter !== null) {
    return errorRetryAfter;
  }

  return toPositiveSeconds(
    get(error, "response.headers.retry-after") ??
      get(error, "response.headers.Retry-After"),
  );
};
