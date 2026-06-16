import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { ResponsiveSpacing, ResponsiveLayout } from '@/constants/theme';

/**
 * Hook to provide responsive sizing based on screen dimensions
 * Returns scaling factors and layout information for responsive UI
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const responsiveData = useMemo(() => {
    // Determine screen size category
    let sizeCategory = 'small';
    let columnCount = 1;
    let spacing = ResponsiveSpacing.contentPadding.small;
    let headingScale = ResponsiveSpacing.headingScalar.small;
    let bodyScale = ResponsiveSpacing.bodyScalar.small;

    // Classify screen size based on width
    if (width >= 1024) {
      sizeCategory = 'large';
      columnCount = ResponsiveLayout.columnCount.large;
      spacing = ResponsiveSpacing.contentPadding.large;
      headingScale = ResponsiveSpacing.headingScalar.large;
      bodyScale = ResponsiveSpacing.bodyScalar.large;
    } else if (width >= 768) {
      sizeCategory = 'medium';
      columnCount = ResponsiveLayout.columnCount.medium;
      spacing = ResponsiveSpacing.contentPadding.medium;
      headingScale = ResponsiveSpacing.headingScalar.medium;
      bodyScale = ResponsiveSpacing.bodyScalar.medium;
    }

    const isLandscape = width > height;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isLargeScreen = width >= 1024;

    return {
      width,
      height,
      sizeCategory,
      columnCount,
      spacing,
      headingScale,
      bodyScale,
      isLandscape,
      isMobile,
      isTablet,
      isLargeScreen,
      // Safe area consideration
      isSmallDevice: width < 375,
      isFoldable: width > 1000 && height > 1000,
    };
  }, [width, height]);

  return responsiveData;
}

/**
 * Hook to get font sizes based on responsive scale
 */
export function useResponsiveFontSize(baseSize) {
  const { headingScale } = useResponsive();
  return baseSize * headingScale;
}

/**
 * Hook to get responsive margins/padding
 */
export function useResponsiveSpacing(baseSpacing) {
  const { spacing } = useResponsive();
  return spacing;
}
