/** Shared, hand-picked catalogs for onboarding + directory filters. */

export const TRADE_CATEGORIES = [
  "Електротехник",
  "Осветление",
  "Водопроводчик",
  "Бояджия",
  "Мазилки",
  "Дърводелец",
  "Мебели",
  "Климатици",
  "Плочкаджия",
] as const;

export const CITIES = ["София", "Пловдив", "Варна"] as const;

export const PRICE_BANDS = [
  { value: "30", label: "До 30 лв" },
  { value: "60", label: "До 60 лв" },
  { value: "100", label: "До 100 лв" },
] as const;
