"use client";

import { ArrowDown, ArrowRight, ArrowUp, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Ad } from "@/api/types";
import { useCategories } from "@/hooks/useCategories";
import { useToggleSaveAd } from "@/hooks/useSavedAds";
import { useAuthStore } from "@/store/authStore";
import AdCard, { getAdCategoryName } from "./AdCard";

interface AdsListProps {
  ads: Ad[];
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

type SortOption =
  | "newest"
  | "oldest"
  | "price-low"
  | "price-high"
  | "views"
  | "title";

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "views", label: "Most Viewed" },
  { value: "title", label: "Title A-Z" },
];

// Sort function for backend Ad format
const sortAds = (ads: Ad[], sortBy: SortOption): Ad[] => {
  const sorted = [...ads];

  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
    case "oldest":
      return sorted.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateA - dateB;
      });
    case "price-low":
      return sorted.sort((a, b) => {
        if (!a.price || a.price === "") return 1;
        if (!b.price || b.price === "") return -1;
        const priceA = parseFloat(String(a.price)) || 0;
        const priceB = parseFloat(String(b.price)) || 0;
        return priceA - priceB;
      });
    case "price-high":
      return sorted.sort((a, b) => {
        if (!a.price || a.price === "") return 1;
        if (!b.price || b.price === "") return -1;
        const priceA = parseFloat(String(a.price)) || 0;
        const priceB = parseFloat(String(b.price)) || 0;
        return priceB - priceA;
      });
    case "views":
      return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
    case "title":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
};

export default function AdsList({
  ads,
  columns = 4,
  className = "",
}: AdsListProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { categoryTree } = useCategories();
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const { mutate: toggleSaveAd } = useToggleSaveAd();
  const [responsiveColumns, setResponsiveColumns] = useState<1 | 2 | 3 | 4 | 5>(
    columns,
  );

  // Helper function to get category name from category tree
  const getCategoryName = (categorySlugOrId: string | undefined): string => {
    return getAdCategoryName(categoryTree, categorySlugOrId);
  };

  // Handle favorite toggle using API
  const handleToggleFavorite = (adId: string) => {
    if (isAuthenticated) {
      toggleSaveAd(adId);
    } else {
      toast.error("Please login to save ads");
      router.push("/login");
    }
  };

  // Check if ad is saved (from API response)
  const isFavorite = (adId: string) => {
    const ad = sortedAds.find((a) => a.id === adId);
    return ad?.is_saved === true;
  };

  // Calculate responsive columns based on screen size (Pinterest-style)
  useEffect(() => {
    const updateColumns = () => {
      if (typeof window !== "undefined") {
        // For 4 columns: 2 on mobile/min-420, 3 on 700px+, 4 on 1024px+
        if (columns === 4) {
          if (window.innerWidth >= 1024) {
            setResponsiveColumns(4);
          } else if (window.innerWidth >= 700) {
            setResponsiveColumns(3);
          } else {
            setResponsiveColumns(2);
          }
        }
        // For 3 columns: 2 on mobile, 3 on 700px+
        else if (columns === 3) {
          if (window.innerWidth >= 700) {
            setResponsiveColumns(3);
          } else {
            setResponsiveColumns(2);
          }
        }
        // For 2 columns: always 2
        else if (columns === 2) {
          setResponsiveColumns(2);
        }
        // For 5 columns: use same as 4 but add xl breakpoint
        else if (columns === 5) {
          if (window.innerWidth >= 1280) {
            setResponsiveColumns(5);
          } else if (window.innerWidth >= 1024) {
            setResponsiveColumns(4);
          } else if (window.innerWidth >= 700) {
            setResponsiveColumns(3);
          } else {
            setResponsiveColumns(2);
          }
        }
      }
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, [columns]);

  const getColumnClasses = () => {
    switch (columns) {
      case 2:
        return "grid-cols-2 min-[420px]:grid-cols-2";
      case 3:
        return "grid-cols-2 min-[700px]:grid-cols-3";
      case 4:
        return "grid-cols-2 min-[700px]:grid-cols-3 lg:grid-cols-4";
      case 5:
        return "grid-cols-2 min-[700px]:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5";
      default:
        return "grid-cols-1 min-[420px]:grid-cols-2 min-[700px]:grid-cols-3";
    }
  };

  // Sort ads
  const sortedAds = useMemo(() => sortAds(ads, sortBy), [ads, sortBy]);

  // Distribute sorted ads across columns for Pinterest-style masonry layout
  const columnArrays: { id: string; ads: Ad[] }[] = useMemo(() => {
    const arrays = Array.from({ length: responsiveColumns }, (_, index) => ({
      id: `ads-column-${index}`,
      ads: [] as Ad[],
    }));
    sortedAds.forEach((ad, index) => {
      const columnIndex = index % responsiveColumns;
      arrays[columnIndex].ads.push(ad);
    });
    return arrays;
  }, [sortedAds, responsiveColumns]);

  const renderAdCard = (ad: Ad) => {
    const categoryName =
      ad.category_details?.name ||
      (ad.category ? getCategoryName(ad.category) : "Uncategorized");

    return (
      <AdCard
        key={ad.id}
        ad={ad}
        categoryName={categoryName}
        isFavorite={isFavorite(ad.id)}
        onToggleFavorite={handleToggleFavorite}
      />
    );
  };

  // Empty state
  if (ads.length === 0) {
    return (
      <div
        className={`${className} py-16 flex flex-col items-center gap-4 text-center`}
      >
        <ShoppingBag className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
        <div>
          <p className="text-base font-medium text-gray-700">No ads yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Be the first to post something!
          </p>
        </div>
        <a
          href="/create-ad"
          className="mt-2 text-sm font-semibold text-primary hover:underline flex items-center gap-1"
        >
          Post an Ad <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:border-secondary rounded-full transition-colors text-sm whitespace-nowrap"
            >
              {sortOptions.find((option) => option.value === sortBy)?.label}
              {isSortOpen ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
            </button>

            {isSortOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl z-10 overflow-hidden">
                {sortOptions.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value as SortOption);
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      sortBy === option.value
                        ? "bg-secondary/10 text-secondary font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pinterest-style masonry grid */}
      <div className={`grid ${getColumnClasses()} gap-2.5`}>
        {columnArrays.map((column) => (
          <div key={column.id} className="flex flex-col">
            {column.ads.map(renderAdCard)}
          </div>
        ))}
      </div>
    </div>
  );
}
