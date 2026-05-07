export type LanguageCode = "en" | "fr" | "ha";

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  prompt: string;
}

export const LANGUAGE_STORAGE_KEY = "@tajma_language";
export const LANGUAGE_SELECTED_STORAGE_KEY = "@tajma_language_selected";

export const languages: LanguageOption[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    prompt: "Continue in English",
  },
  {
    code: "ha",
    name: "Hausa",
    nativeName: "Harshen Hausa",
    flag: "🇳🇪",
    prompt: "Ci gaba da Hausa",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    prompt: "Continuer en français",
  },
];

export const isLanguageCode = (value?: string | null): value is LanguageCode =>
  value === "en" || value === "fr" || value === "ha";

export const getSuggestedLanguageForCountry = (
  countryCode?: string | null,
): LanguageCode | null => {
  const normalizedCountry = countryCode?.trim().toUpperCase();

  if (!normalizedCountry) return null;
  if (normalizedCountry === "NE" || normalizedCountry === "NG") return "ha";
  if (normalizedCountry === "ML" || normalizedCountry === "BF") return "fr";

  return null;
};
