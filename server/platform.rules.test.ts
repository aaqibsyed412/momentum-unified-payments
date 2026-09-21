import { describe, expect, it } from "vitest";
import { authEventFor, canSendWithinDailyLimit, DAILY_TRANSFER_LIMIT_CENTS, isWithinBillGuardrail } from "../shared/demoRules";

describe("demo platform rules", () => {
  it("hard-blocks transfers above the daily limit without an override", () => {
    expect(DAILY_TRANSFER_LIMIT_CENTS).toBe(250_000);
    expect(canSendWithinDailyLimit(249_999, 1)).toBe(true);
    expect(canSendWithinDailyLimit(250_000, 1)).toBe(false);
    expect(canSendWithinDailyLimit(0, 250_001)).toBe(false);
  });

  it("requires explicit autonomy and thresholds before bill auto-switching", () => {
    expect(isWithinBillGuardrail({ autoSwitchEnabled: false, savingsCents: 1_500, maxMonthlySavingsCents: 2_000, priceIncreaseCents: 0, maxPriceIncreaseCents: 0 })).toBe(false);
    expect(isWithinBillGuardrail({ autoSwitchEnabled: true, savingsCents: 1_500, maxMonthlySavingsCents: 2_000, priceIncreaseCents: 0, maxPriceIncreaseCents: 0 })).toBe(true);
    expect(isWithinBillGuardrail({ autoSwitchEnabled: true, savingsCents: 2_500, maxMonthlySavingsCents: 2_000, priceIncreaseCents: 0, maxPriceIncreaseCents: 0 })).toBe(false);
    expect(isWithinBillGuardrail({ autoSwitchEnabled: true, savingsCents: 1_500, maxMonthlySavingsCents: 2_000, priceIncreaseCents: 100, maxPriceIncreaseCents: 0 })).toBe(false);
  });

  it("records biometric as a PIN-equivalent server event", () => {
    expect(authEventFor("biometric")).toBe("biometric_unlock_recorded_as_pin_equivalent");
    expect(authEventFor("pin")).toBe("pin_verified_server_side");
  });
});
