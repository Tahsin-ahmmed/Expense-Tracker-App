import { toMinor, type MinorAmount } from '@/domain/money';

/** Rounds up to a clean axis maximum: 1, 2, 2.5 or 5 × 10ⁿ units, split in two. */
export function niceAxisMax(maxMinor: number): MinorAmount {
  if (maxMinor <= 0) {
    return toMinor(0);
  }
  const units = maxMinor / 100;
  const half = units / 2;
  const magnitude = 10 ** Math.floor(Math.log10(half));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= half) ?? half;
  return toMinor(Math.round(step * 2 * 100));
}
