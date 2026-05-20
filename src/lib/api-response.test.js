import { describe, expect, it } from "vitest";
import {
  getApiErrorMessage,
  getApiResponseData,
  getApiRetryAfterSeconds,
} from "./api-response.js";

describe("getApiResponseData", () => {
  it("unwraps standard API response data", () => {
    expect(getApiResponseData({ data: { data: { id: "item-1" } } })).toEqual({
      id: "item-1",
    });
  });

  it("keeps direct axios data support", () => {
    expect(getApiResponseData({ data: { id: "item-1" } })).toEqual({
      id: "item-1",
    });
  });
});

describe("getApiErrorMessage", () => {
  it("prefers validation details from backend error envelopes", () => {
    expect(
      getApiErrorMessage(
        {
          response: {
            data: {
              error: {
                message: "Validation failed",
                details: [{ message: "Phone is invalid." }],
              },
            },
          },
        },
        "Fallback",
      ),
    ).toBe("Phone is invalid.");
  });

  it("reads nested backend error messages", () => {
    expect(
      getApiErrorMessage(
        {
          response: {
            data: {
              error: { message: "Current password is incorrect." },
            },
          },
        },
        "Fallback",
      ),
    ).toBe("Current password is incorrect.");
  });

  it("supports legacy top-level message arrays", () => {
    expect(
      getApiErrorMessage(
        {
          response: {
            data: {
              message: ["Phone is required.", "Password is required."],
            },
          },
        },
        "Fallback",
      ),
    ).toBe("Phone is required., Password is required.");
  });

  it("returns the fallback when no usable message exists", () => {
    expect(getApiErrorMessage({}, "Fallback")).toBe("Fallback");
  });
});

describe("getApiRetryAfterSeconds", () => {
  it("reads retry metadata from backend error envelopes", () => {
    expect(
      getApiRetryAfterSeconds({
        response: {
          data: {
            error: {
              retryAfterSeconds: 45,
            },
          },
        },
      }),
    ).toBe(45);
  });

  it("falls back to Retry-After headers", () => {
    expect(
      getApiRetryAfterSeconds({
        response: {
          headers: {
            "retry-after": "1.2",
          },
        },
      }),
    ).toBe(2);
  });

  it("returns null for missing retry metadata", () => {
    expect(getApiRetryAfterSeconds({})).toBeNull();
  });
});
