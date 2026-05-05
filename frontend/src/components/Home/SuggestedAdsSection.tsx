"use client";

import { animate, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSuggestedAds } from "@/hooks/useAds";
import { useCategories } from "@/hooks/useCategories";
import { useToggleSaveAd } from "@/hooks/useSavedAds";
import { useAuthStore } from "@/store/authStore";
import AdCard, { getAdCategoryName } from "./AdCard";
import { useTranslations } from "next-intl";

interface SuggestedAdsSectionProps {
  className?: string;
}

export default function SuggestedAdsSection({
  className = "",
}: SuggestedAdsSectionProps) {
  const t = useTranslations('common');
  const { data: ads, isLoading, isError } = useSuggestedAds();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { categoryTree } = useCategories();
  const { mutate: toggleSaveAd } = useToggleSaveAd();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    // Use a small threshold (1px) to account for subpixel rendering
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScrollButtons, { passive: true });
    checkScrollButtons();
    return () => el.removeEventListener("scroll", checkScrollButtons);
  }, [checkScrollButtons]);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const amount = container.clientWidth * 0.48; // Slightly more for better "fluid" feel
    const target = container.scrollLeft + (dir === "left" ? -amount : amount);

    // Custom "fast and fluid" animation using framer-motion
    animate(container.scrollLeft, target, {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1], // Ultra-fluid "out-expo" easing
      onUpdate: (val) => {
        container.scrollLeft = val;
      },
      onComplete: checkScrollButtons,
    });

    // Fallback manual check in case animation is interrupted
    setTimeout(checkScrollButtons, 600);
  };

  const handleToggleFavorite = (adId: string) => {
    if (isAuthenticated) {
      toggleSaveAd(adId);
    } else {
      toast.error(t("login_to_save"));
      router.push("/login");
    }
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center justify-center min-h-[160px]">
          <Loader2 className="w-7 h-7 text-secondary animate-spin mb-3" />
          <p className="text-gray-400 text-sm animate-pulse">
            {t('finding_love')}
          </p>
        </div>
      </div>
    );
  }

  if (isError || !ads || ads.length === 0) return null;

  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        {/* Header */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-2xl font-medium text-gray-900 mb-1">
              {t('suggested_for_you')}
            </h2>
            <p className="text-gray-500 text-sm">
              {t('based_on_activity')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Scroll Buttons */}
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className={`p-2 rounded-full border transition-all ${
                canScrollLeft
                  ? "border-gray-200 bg-white hover:bg-gray-50 hover:shadow-sm text-gray-700"
                  : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className={`p-2 rounded-full border transition-all ${
                canScrollRight
                  ? "border-gray-200 bg-white hover:bg-gray-50 hover:shadow-sm text-gray-700"
                  : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* See More */}
            <Link
              href="/search"
              className="hidden sm:inline-flex items-center gap-1.5 ml-2 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors group"
            >
              {t('see_more')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Horizontal Scroll Row */}
        <div
          ref={scrollRef}
          className="flex gap-2.5 overflow-x-auto pb-3 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {ads.map((ad, index) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="snap-start flex-none w-[calc(50%_-_5px)] min-[700px]:w-[calc(33.333%_-_6.667px)] xl:w-[calc(20%_-_8px)]"
            >
              <AdCard
                ad={ad}
                categoryName={
                  ad.category_details?.name ||
                  getAdCategoryName(categoryTree, ad.category)
                }
                isFavorite={ad.is_saved === true}
                onToggleFavorite={handleToggleFavorite}
                imageVariant="fixed"
                className="w-full"
              />
            </motion.div>
          ))}
        </div>

        {/* Mobile See More */}
        <div className="mt-4 flex sm:hidden">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors group"
          >
            {t('see_more')}{" "}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
