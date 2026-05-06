"use client";

import { ArrowUp, Eye, Heart, MapPin } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import type { Ad } from "@/api/types";
import { getMediaUrl } from "@/lib/utils";
import { useTranslations } from "next-intl";

type CategoryNode = {
  id?: string | number;
  slug?: string;
  name?: string;
  children?: unknown;
  subcategories?: unknown;
};

interface AdCardProps {
  ad: Ad;
  categoryName: string;
  isFavorite: boolean;
  onToggleFavorite: (adId: string) => void;
  className?: string;
  imageVariant?: "auto" | "fixed";
}

const isCategoryNode = (value: unknown): value is CategoryNode =>
  typeof value === "object" && value !== null;

const findCategory = (
  categories: unknown,
  slugOrId: string,
): CategoryNode | null => {
  if (!Array.isArray(categories)) return null;

  for (const category of categories) {
    if (!isCategoryNode(category)) continue;

    if (
      category.slug === slugOrId ||
      (category.id !== undefined && String(category.id) === slugOrId)
    ) {
      return category;
    }

    const children = category.children ?? category.subcategories;
    const found = findCategory(children, slugOrId);
    if (found) return found;
  }

  return null;
};

export const getAdCategoryName = (
  categoryTree: unknown,
  categorySlugOrId: string | undefined,
  fallback: string = "Uncategorized"
) => {
  if (!categorySlugOrId) return fallback;

  const category = findCategory(categoryTree, categorySlugOrId);
  return category?.name || fallback;
};

export default function AdCard({
  ad,
  categoryName,
  isFavorite,
  onToggleFavorite,
  className = "",
  imageVariant = "auto",
}: AdCardProps) {
  const t = useTranslations("common");
  const imageUrl = getMediaUrl(ad.images?.[0]);
  const formattedPrice = ad.price
    ? `${ad.currency || "XOF"} ${parseFloat(String(ad.price)).toLocaleString()}`
    : t("contact_for_price");
  const location = ad.seller?.location || t("location_not_specified");
  const displayCategoryName =
    ad.category_details?.name || categoryName || t("uncategorized");
  const isFeatured = ad.is_featured;
  const isBoosted = ad.promotion_rank === 50;

  return (
    <Link href={`/ads/${ad.slug}`} className={`block ${className}`}>
      <div
        className={`
          w-full bg-white rounded-xl overflow-hidden transition-all duration-300 cursor-pointer group mb-2.5 break-inside-avoid shadow-none relative border-2
          ${
            isFeatured
              ? "border-primary shadow-[0_0_15px_-3px_rgba(214,175,55,0.2)] ring-1 ring-primary/10"
              : isBoosted
                ? "border-secondary shadow-sm shadow-secondary/5"
                : "border-gray-100 hover:border-gray-200 hover:shadow-md"
          }
        `}
      >
        <div className="relative w-full overflow-hidden">
          <div
            className={`relative w-full ${
              imageVariant === "fixed" ? "aspect-[4/3] bg-gray-50" : "h-auto"
            }`}
          >
            <Image
              src={imageUrl}
              alt={ad.title}
              fill={imageVariant === "fixed"}
              width={imageVariant === "auto" ? 400 : undefined}
              height={imageVariant === "auto" ? 400 : undefined}
              className={`w-full transition-transform duration-200 group-hover:scale-105 ${
                imageVariant === "fixed"
                  ? "object-cover"
                  : "h-auto object-cover"
              }`}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            />
          </div>

          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {isFeatured && (
              <div className="bg-primary text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider shadow-sm flex items-center gap-1">
                <ArrowUp className="w-2.5 h-2.5" /> {t('featured')}
              </div>
            )}
            {isBoosted && !isFeatured && (
              <div className="bg-secondary text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider shadow-sm flex items-center gap-1">
                <ArrowUp className="w-2.5 h-2.5" /> {t('boosted')}
              </div>
            )}
            {displayCategoryName && (
              <div className="bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-medium max-w-[60%] truncate">
                {displayCategoryName}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleFavorite(ad.id);
            }}
            className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
            title={isFavorite ? t("remove_favorite") : t("add_favorite")}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
              }`}
            />
          </button>
        </div>

        <div className="p-3">
          <div className="mb-1.5">
            <div className="text-lg text-primary">{formattedPrice}</div>
          </div>

          <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-2 text-sm group-hover:text-secondary transition-colors duration-200 leading-tight">
            {ad.title}
          </h3>

          {ad.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2 leading-relaxed">
              {ad.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{location}</span>
            </div>

            {ad.views > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{ad.views}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
