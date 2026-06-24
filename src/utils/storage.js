import { useEffect, useState } from 'react';

export const TRANSACTIONS_KEY = 'controle-financeiro:transactions:v1';
export const GOALS_KEY = 'controle-financeiro:profit-goals:v1';
export const THEME_KEY = 'controle-financeiro:theme:v1';
export const CARD_BILLING_DAY_KEY = 'controle-financeiro:card-billing-day:v1';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
