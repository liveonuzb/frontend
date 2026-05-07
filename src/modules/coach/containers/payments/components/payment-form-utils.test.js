import { describe, expect, it } from "vitest";
import {
  buildAmountRisk,
  buildDuplicatePaymentWarning,
  formatCurrencyInput,
  parseCurrencyAmount,
  unwrapMutationPayload,
} from "./payment-form-utils";

describe("payment form safety utils", () => {
  it("formats and parses UZS currency input without decimals", () => {
    expect(parseCurrencyAmount("1 250 000 so'm")).toBe("1250000");
    expect(formatCurrencyInput("1250000").replace(/\s/g, " ")).toBe(
      "1 250 000",
    );
    expect(formatCurrencyInput("abc")).toBe("");
  });

  it("detects duplicate payments for the same client, amount and method", () => {
    const warning = buildDuplicatePaymentWarning({
      payments: [
        {
          id: "pay_1",
          client: { id: "client_1", name: "Ali Valiyev" },
          amount: 500000,
          method: "cash",
        },
      ],
      selectedClientId: "client_1",
      paymentAmount: "500000",
      paymentMethod: "CASH",
    });

    expect(warning).toMatchObject({ title: "Dublikat ehtimoli bor" });
  });

  it("requires confirmation for large or suspicious amounts", () => {
    expect(
      buildAmountRisk({ amount: 6000000 }),
    ).toMatchObject({
      requiresConfirmation: true,
      severity: "danger",
    });
    expect(
      buildAmountRisk({ amount: 1000000, expectedAmount: 300000 }),
    ).toMatchObject({
      requiresConfirmation: true,
      severity: "warning",
    });
  });

  it("unwraps axios and direct mutation payloads", () => {
    expect(unwrapMutationPayload({ data: { data: { duplicate: true } } })).toEqual({
      duplicate: true,
    });
    expect(unwrapMutationPayload({ idempotent: true })).toEqual({
      idempotent: true,
    });
  });
});
