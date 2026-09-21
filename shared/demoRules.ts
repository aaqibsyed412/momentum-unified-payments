export const DAILY_TRANSFER_LIMIT_CENTS = 250_000;

export function canSendWithinDailyLimit(alreadySentCents: number, amountCents: number) {
  return amountCents > 0 && alreadySentCents + amountCents <= DAILY_TRANSFER_LIMIT_CENTS;
}

export function isWithinBillGuardrail(params: { autoSwitchEnabled: boolean; savingsCents: number; maxMonthlySavingsCents: number; priceIncreaseCents: number; maxPriceIncreaseCents: number; }) {
  return params.autoSwitchEnabled && params.savingsCents <= params.maxMonthlySavingsCents && params.priceIncreaseCents <= params.maxPriceIncreaseCents;
}

export function authEventFor(method: "pin" | "biometric") {
  return method === "biometric" ? "biometric_unlock_recorded_as_pin_equivalent" : "pin_verified_server_side";
}
