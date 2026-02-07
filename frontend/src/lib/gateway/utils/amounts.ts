export function parseUsdcToBigInt(input: string): bigint {
  const trimmed = input.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid USDC amount: ${input}`);
  }
  const [whole, fraction = ""] = trimmed.split(".");
  const fractionPadded = (fraction + "000000").slice(0, 6);
  const value = BigInt(whole) * 1_000_000n + BigInt(fractionPadded);
  if (value <= 0n) {
    throw new Error("Amount must be greater than 0");
  }
  return value;
}

export function formatUsdc(value: bigint | number): string {
  const bigValue = typeof value === "number" ? BigInt(value) : value;
  const whole = bigValue / 1_000_000n;
  const fraction = (bigValue % 1_000_000n).toString().padStart(6, "0");
  return `${whole}.${fraction}`.replace(/\.0+$/, "");
}
