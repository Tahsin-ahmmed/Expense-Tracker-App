import { create } from 'zustand';

import { DEFAULT_CURRENCY, type CurrencyCode } from '@/domain/currency';
import { setActiveCurrency } from '@/domain/money';

/**
 * The currency all amounts are shown in. `formatMoney` reads the active
 * currency directly; this store lets screens re-render (remount their
 * content) when it changes, so every amount on screen updates together.
 */
export const useDisplayCurrency = create<{ currency: CurrencyCode }>()(() => ({
  currency: DEFAULT_CURRENCY,
}));

export function applyDisplayCurrency(code: CurrencyCode): void {
  // Update the formatter before notifying React, so re-renders see the new currency.
  setActiveCurrency(code);
  if (useDisplayCurrency.getState().currency !== code) {
    useDisplayCurrency.setState({ currency: code });
  }
}
