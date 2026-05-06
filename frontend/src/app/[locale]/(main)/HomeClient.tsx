"use client";

import React from "react";
import AdsList from "@/components/Home/AdsList";
import CategoriesSection from "@/components/Home/CategoriesSection";
import CategoryGrid from "@/components/Home/CategoryGrid";
import Hero from "@/components/Home/Hero";
import PromoStrip from "@/components/Home/PromoStrip";
import SuggestedAdsSection from "@/components/Home/SuggestedAdsSection";
import AdsListSkeleton from "@/components/ui/AdsListSkeleton";
import { useAdsInfiniteList } from "@/hooks/useAds";

export default function HomeClient() {
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const {
    data: adsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdsInfiniteList();

  const ads = React.useMemo(() => {
    return adsData?.pages.flatMap((page) => page.results) || [];
  }, [adsData]);

  React.useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "500px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="bg-gray-50/50 min-h-screen">
      <div className="container py-4 sm:py-8">
        <div className="flex flex-col-reverse lg:flex-row gap-6 lg:gap-8 mb-6 sm:mb-8">
          {/* Categories Section - Desktop Sidebar */}
          <div className="hidden lg:block relative lg:min-w-[260px] lg:max-w-[320px] w-1/4">
            <div className="absolute inset-0">
              <CategoriesSection />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* E-commerce Hero Carousel Banner */}
            <Hero />
            {/* Promotional Strip */}
            <PromoStrip />
          </div>
        </div>

        {/* Category Grid - Mobile Only */}
        <div className="block lg:hidden mb-8">
          <CategoryGrid />
        </div>

        {/* Suggested Ads for the User - Now outside the hero column */}
        <SuggestedAdsSection className="mb-12" />

        {/* Trending Ads Header */}
        <div className="flex items-center justify-between mt-2 mb-6">
          <h2 className="text-2xl font-medium text-gray-900 line-clamp-1">
            Trending Ads
          </h2>
        </div>

        {/* Main Ads List */}
        <div>
          {isLoading ? (
            <div className="py-4">
              <AdsListSkeleton columns={4} count={8} />
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>No connection</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Connection
              </h3>
              <p className="text-gray-600 mb-4">
                Unable to connect to server. Displaying cached results.
              </p>
              <AdsList ads={ads} columns={4} className="py-4" />
            </div>
          ) : ads.length === 0 ? (
            <AdsList ads={[]} columns={5} className="py-0" />
          ) : (
            <>
              <AdsList ads={ads} columns={5} className="py-0" />
              {hasNextPage && (
                <div ref={loadMoreRef} className="py-6 text-center">
                  {isFetchingNextPage ? (
                    <span className="text-sm text-gray-500">
                      Loading more ads...
                    </span>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
