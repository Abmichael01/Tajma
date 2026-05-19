import { useEffect, useState } from "react";
import { Image as RNImage } from "react-native";

/**
 * Resolves an image's natural dimensions BEFORE the image is rendered, so the
 * containing component can lay out at the correct size from the start.
 *
 * Without this, an Image whose dimensions are only known via `onLoad` causes a
 * layout shift after the image arrives — what looks like "shaking" or "jumping"
 * in lists and chat bubbles. Pre-resolving and gating the render eliminates it.
 *
 * Returns null while loading; consumers should render a fixed-size skeleton
 * during that window.
 */
export function useImageDimensions(uri: string | undefined | null): {
  width: number;
  height: number;
} | null {
  const [dims, setDims] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    if (!uri) {
      setDims(null);
      return;
    }
    let alive = true;
    setDims(null);
    RNImage.getSize(
      uri,
      (width, height) => {
        if (alive && width > 0 && height > 0) {
          setDims({ width, height });
        }
      },
      () => {
        // Fallback to a sane 4:3 so consumers can still render something.
        if (alive) setDims({ width: 4, height: 3 });
      },
    );
    return () => {
      alive = false;
    };
  }, [uri]);

  return dims;
}
