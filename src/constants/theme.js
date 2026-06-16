/**
 * DeltexAI Design System
 * Enterprise-grade theme with security-focused colors and typography
 */

// @ts-ignore - Global CSS import for Expo web
import '@/global.css';

import { Platform } from 'react-native';

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const Colors = {
  light: {
    // Neutrals
    text: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    background: '#FFFFFF',
    backgroundAlt: '#F8FAFC',
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#E2E8F0',
    border: '#E2E8F0',
    
    // Primary - Security Blue
    primary: '#2563EB',
    primaryLight: '#3B82F6',
    primaryDark: '#1D4ED8',
    primaryBackground: '#EFF6FF',
    
    // Secondary - Cyber Green
    success: '#10B981',
    successLight: '#6EE7B7',
    successDark: '#059669',
    successBackground: '#ECFDF5',
    
    // Warning - Orange
    warning: '#F59E0B',
    warningLight: '#FBBF24',
    warningDark: '#D97706',
    warningBackground: '#FFFBEB',
    
    // Danger - Red
    danger: '#EF4444',
    dangerLight: '#F87171',
    dangerDark: '#DC2626',
    dangerBackground: '#FEE2E2',
    
    // Status
    info: '#3B82F6',
    infoBackground: '#EFF6FF',
  },
  dark: {
    // Neutrals
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    background: '#0F172A',
    backgroundAlt: '#1E293B',
    backgroundElement: '#1E293B',
    backgroundSelected: '#334155',
    border: '#334155',
    
    // Primary - Security Blue
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#1E40AF',
    primaryBackground: '#1E3A8A',
    
    // Secondary - Cyber Green
    success: '#10B981',
    successLight: '#6EE7B7',
    successDark: '#047857',
    successBackground: '#064E3B',
    
    // Warning - Orange
    warning: '#F59E0B',
    warningLight: '#FBBF24',
    warningDark: '#B45309',
    warningBackground: '#78350F',
    
    // Danger - Red
    danger: '#EF4444',
    dangerLight: '#F87171',
    dangerDark: '#991B1B',
    dangerBackground: '#7F1D1D',
    
    // Status
    info: '#60A5FA',
    infoBackground: '#1E3A8A',
  },
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const Typography = {
  display: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700',
  },
  heading1: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700',
  },
  heading2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
  },
  heading3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  captionBold: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  code: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

// ============================================================================
// SPACING
// ============================================================================

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  seven: 80,
  eight: 96,
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// ============================================================================
// SHADOWS
// ============================================================================

export const Shadows = Platform.select({
  web: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    elevation: {
      card: '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
      dropdown: '0 10px 25px 0 rgba(0, 0, 0, 0.12)',
    },
  },
  default: {},
}) ?? {};

// ============================================================================
// LAYOUT
// ============================================================================

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 900;
export const CardBorderRadius = BorderRadius.lg;
export const ButtonBorderRadius = BorderRadius.md;

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================

export const ResponsiveSpacing = {
  // Adaptive padding based on screen size
  contentPadding: {
    small: Spacing.two,    // Small phones
    medium: Spacing.three, // Medium phones
    large: Spacing.four,   // Large phones and tablets
  },
  // Adaptive heading sizing
  headingScalar: {
    small: 0.85,  // Small phones: reduce by 15%
    medium: 0.95, // Medium phones: reduce by 5%
    large: 1.0,   // Full size for tablets/large screens
  },
  // Adaptive font scaling
  bodyScalar: {
    small: 0.9,   // Small phones: reduce by 10%
    medium: 0.95, // Medium phones: reduce by 5%
    large: 1.0,   // Full size
  },
};

export const ResponsiveLayout = {
  // Grid columns based on screen width
  columnCount: {
    small: 1,  // < 768px
    medium: 2, // 768px - 1024px
    large: 3,  // > 1024px
  },
  // Card sizing
  cardWidth: {
    small: '100%',
    medium: 'calc(50% - 12px)',
    large: 'calc(33.33% - 16px)',
  },
};

// Minimum touch target size (accessibility)
export const MinTouchTarget = 48;

