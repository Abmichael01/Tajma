"use client";

import React from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe, Check } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth";
import { ProfileUpdateRequest } from "@/api/types";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "ha", name: "Hausa", flag: "🇳🇬" },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const currentLanguage = languages.find((lang) => lang.code === locale) || languages[0];

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === locale) return;

    // 1. Set cookie for persistence (next-intl middleware uses this)
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // 2. If user is logged in, persist to backend
    if (isAuthenticated) {
      try {
        await authApi.updateProfile({ preferred_language: newLocale as 'en' | 'fr' | 'ha' });
        updateUser({ preferred_language: newLocale as 'en' | 'fr' | 'ha' });
      } catch (error) {
        console.error("Failed to update preferred language:", error);
      }
    }

    // 3. Construct new URL and force full reload
    // We use window.location to force a complete re-render of all server/client components
    const newPathname = pathname === "/" ? `/${newLocale}` : `/${newLocale}${pathname}`;
    
    // If it's the default locale and localePrefix is 'as-needed', it might not need the prefix
    // but for simplicity and robustness, redirecting to the explicit locale path is safer
    // next-intl middleware will handle the redirect to the unprefixed version if necessary.
    window.location.href = newPathname;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 px-2 hover:bg-gray-100 transition-colors rounded-full"
        >
          <Globe className="w-5 h-5 text-gray-600" />
          <span className="text-xs font-bold text-gray-700 hidden lg:inline">
            {currentLanguage.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 bg-white shadow-xl border-gray-100 rounded-xl p-1 z-[100]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`flex items-center justify-between cursor-pointer py-2 px-3 rounded-lg transition-colors ${
              locale === lang.code ? "bg-primary/5 text-primary font-semibold" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm">{lang.name}</span>
            </div>
            {locale === lang.code && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
